import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Trash, Globe, GlobeSimple } from 'phosphor-react';
import { Button } from '../components/ui';
import { useToast } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { matchRecipeToPantry } from '../lib/recipeEngine';
import type { Recipe, PantryItem, RecipeIngredient } from '../types';

async function loadRecipe(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients:recipe_ingredients(*), author:profiles!user_id(id, display_name, avatar_url)')
    .eq('id', id)
    .single();
  if (error) {
    console.error('[RecipeDetail] load recipe:', error);
    return null;
  }
  return data as Recipe;
}

async function loadPantryItems(): Promise<PantryItem[]> {
  const { data: pantryId } = await supabase.rpc('my_pantry_id');
  if (!pantryId) return [];
  const { data } = await supabase.from('pantry_items').select('*').eq('pantry_id', pantryId);
  return (data as PantryItem[]) ?? [];
}

async function checkIfSaved(userId: string, recipeId: string): Promise<boolean> {
  const { data } = await supabase
    .from('saved_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('original_recipe_id', recipeId)
    .maybeSingle();
  return !!data;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore(state => state.user);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingOrDeleting, setSavingOrDeleting] = useState(false);
  const [addingToList, setAddingToList] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const [r, pantry] = await Promise.all([loadRecipe(id!), loadPantryItems()]);
        if (cancelled) return;
        setRecipe(r);
        setPantryItems(pantry);
        if (r && user && r.user_id !== user.id) {
          const saved = await checkIfSaved(user.id, r.id);
          if (!cancelled) setIsSaved(saved);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [id, user?.id]);

  const handleDelete = useCallback(async () => {
    if (!recipe || !user) return;
    setSavingOrDeleting(true);
    const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
    if (error) {
      toast(error.message, 'error');
      setSavingOrDeleting(false);
      return;
    }
    toast('Recipe deleted', 'success');
    navigate(-1);
  }, [recipe, user, toast, navigate]);

  const handleTogglePublic = useCallback(async () => {
    if (!recipe) return;
    const next = !recipe.is_public;
    setRecipe(prev => prev ? { ...prev, is_public: next } : prev);
    const { error } = await supabase.from('recipes').update({ is_public: next }).eq('id', recipe.id);
    if (error) {
      setRecipe(prev => prev ? { ...prev, is_public: !next } : prev);
      toast(error.message, 'error');
    } else {
      toast(next ? 'Recipe is now public' : 'Recipe is now private', 'success');
    }
  }, [recipe, toast]);

  const handleSave = useCallback(async () => {
    if (!recipe || !user || isSaved) return;
    setSavingOrDeleting(true);
    const savedId = randomUUID();
    const { error } = await supabase.from('saved_recipes').insert({
      id: savedId,
      user_id: user.id,
      original_recipe_id: recipe.id,
      title: recipe.title,
      description: recipe.description ?? null,
      prep_time_minutes: recipe.prep_time_minutes ?? null,
      cook_time_minutes: recipe.cook_time_minutes ?? null,
      servings: recipe.servings,
      is_public: false,
    });
    if (error) {
      toast(error.message, 'error');
      setSavingOrDeleting(false);
      return;
    }
    if (recipe.ingredients.length > 0) {
      await supabase.from('saved_recipe_ingredients').insert(
        recipe.ingredients.map((ing, idx) => ({
          id: randomUUID(),
          saved_recipe_id: savedId,
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          optional: ing.optional,
          sort_order: idx,
        }))
      );
    }
    setIsSaved(true);
    setSavingOrDeleting(false);
    toast('Saved to your recipes', 'success');
  }, [recipe, user, isSaved, toast]);

  const handleAddMissingToList = useCallback(async (missing: RecipeIngredient[]) => {
    if (!user || missing.length === 0) return;
    setAddingToList(true);
    try {
      const { data: lists, error: listErr } = await supabase
        .from('shopping_lists')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1);
      if (listErr || !lists?.length) {
        toast('No shopping list found', 'error');
        return;
      }
      const listId = lists[0].id;
      const rows = missing.map(ing => ({
        id: randomUUID(),
        list_id: listId,
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        category: 'other',
        added_by: user.id,
      }));
      const { error } = await supabase.from('list_items').insert(rows);
      if (error) {
        toast(error.message, 'error');
        return;
      }
      toast(`Added ${missing.length} item${missing.length > 1 ? 's' : ''} to list`, 'success');
    } finally {
      setAddingToList(false);
    }
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-neutral-0 pt-safe">
        <div className="flex items-center h-[56px] px-4 border-b border-neutral-100">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-700">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col h-full bg-neutral-0 pt-safe">
        <div className="flex items-center h-[56px] px-4 border-b border-neutral-100">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-700">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6">
          <p className="text-base font-semibold text-neutral-900 text-center">Recipe not found</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-green-500 font-semibold text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === recipe.user_id;
  const withAvail = matchRecipeToPantry(recipe, pantryItems);
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const pantrySet = new Set(pantryItems.map(p => p.name.toLowerCase().trim().replace(/s$/, '').replace(/\s+/g, ' ')));

  return (
    <div className="flex flex-col h-full bg-neutral-0 pt-safe">
      {/* Header */}
      <div className="flex items-center justify-between h-[56px] px-4 border-b border-neutral-100 sticky top-0 bg-neutral-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-neutral-700">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                type="button"
                onClick={handleTogglePublic}
                className={`p-2 rounded-full transition-colors ${recipe.is_public ? 'text-green-500' : 'text-neutral-400'}`}
                aria-label={recipe.is_public ? 'Make private' : 'Make public'}
              >
                {recipe.is_public ? <Globe size={22} weight="fill" /> : <GlobeSimple size={22} />}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={savingOrDeleting}
                className="p-2 text-danger-600 rounded-full active:bg-red-50 disabled:opacity-50"
                aria-label="Delete recipe"
              >
                <Trash size={22} />
              </button>
            </>
          )}
          {!isOwner && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaved || savingOrDeleting}
              className="flex items-center gap-1.5 px-3 h-[36px] rounded-full bg-neutral-100 text-sm font-medium text-neutral-700 active:bg-neutral-200 disabled:opacity-50 transition-colors"
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-6 flex flex-col gap-5">
          {/* Title & meta */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold text-neutral-900 font-sans leading-snug">
              {recipe.title}
            </h1>
            {recipe.author && (
              <p className="text-sm text-neutral-400 font-sans">by {recipe.author.display_name}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-neutral-500 font-sans mt-1">
              {totalTime > 0 && <span>{totalTime} min</span>}
              {recipe.servings > 0 && <span>{recipe.servings} servings</span>}
              {recipe.prep_time_minutes && <span>Prep {recipe.prep_time_minutes} min</span>}
              {recipe.cook_time_minutes && <span>Cook {recipe.cook_time_minutes} min</span>}
            </div>
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="text-sm text-neutral-600 font-sans leading-relaxed">{recipe.description}</p>
          )}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-neutral-900 font-sans">Ingredients</h2>
              <div className="flex flex-col border border-neutral-200 rounded-xl overflow-hidden">
                {[...recipe.ingredients]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((ing, idx) => {
                    const normalized = ing.name.toLowerCase().trim().replace(/s$/, '').replace(/\s+/g, ' ');
                    const inPantry = pantrySet.has(normalized);
                    return (
                      <div
                        key={ing.id}
                        className={`flex items-center gap-3 px-4 py-3 ${idx < recipe.ingredients.length - 1 ? 'border-b border-neutral-100' : ''} ${ing.optional ? 'opacity-60' : ''}`}
                      >
                        {inPantry
                          ? <CheckCircle size={20} weight="fill" className="text-green-500 flex-shrink-0" />
                          : <XCircle size={20} weight="fill" className="text-red-400 flex-shrink-0" />
                        }
                        <span className="flex-1 text-sm text-neutral-900 font-sans">{ing.name}</span>
                        <span className="text-sm text-neutral-400 font-sans">
                          {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                          {ing.optional ? ' (opt)' : ''}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Availability summary */}
              <p className="text-xs text-neutral-400 font-sans px-1">
                {withAvail.available_count} of {withAvail.total_count} required ingredients in pantry
              </p>

              {/* Add missing */}
              {withAvail.missing_ingredients.length > 0 && (
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  loading={addingToList}
                  onClick={() => handleAddMissingToList(withAvail.missing_ingredients)}
                  className="mt-1"
                >
                  Add {withAvail.missing_ingredients.length} missing to list
                </Button>
              )}
            </div>
          )}

          {recipe.ingredients.length === 0 && (
            <p className="text-sm text-neutral-400 font-sans italic">No ingredients listed</p>
          )}
        </div>
      </div>
    </div>
  );
}
