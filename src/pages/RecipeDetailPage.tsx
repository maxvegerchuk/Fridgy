import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash, Eye, EyeSlash, PencilSimple } from 'phosphor-react';
import { Button } from '../components/ui';
import { useToast } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { matchRecipeToPantry } from '../lib/recipeEngine';
import { fetchRecipeById } from '../hooks/useRecipes';
import type { Recipe, PantryItem, RecipeIngredient } from '../types';

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
        const [r, pantry] = await Promise.all([fetchRecipeById(id!), loadPantryItems()]);
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
    if (!recipe || !user) return;
    setSavingOrDeleting(true);
    const savedId = randomUUID();
    const { error } = await supabase.from('saved_recipes').insert({
      id: savedId,
      user_id: user.id,
      original_recipe_id: recipe.id,
      title: recipe.title,
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
  }, [recipe, user, toast]);

  const handleUnsave = useCallback(async () => {
    if (!recipe || !user) return;
    setSavingOrDeleting(true);
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', user.id)
      .eq('original_recipe_id', recipe.id);
    if (error) {
      toast(error.message, 'error');
      setSavingOrDeleting(false);
      return;
    }
    setIsSaved(false);
    setSavingOrDeleting(false);
    toast('Removed from your recipes', 'success');
  }, [recipe, user, toast]);

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
      const { error } = await supabase.from('list_items').insert(
        missing.map(ing => ({
          id: randomUUID(),
          list_id: listId,
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          category: 'other',
          added_by: user.id,
        }))
      );
      if (error) { toast(error.message, 'error'); return; }
      toast(`Added ${missing.length} item${missing.length > 1 ? 's' : ''} to list`, 'success');
    } finally {
      setAddingToList(false);
    }
  }, [user, toast]);

  if (loading) {
    return (
      <div className="flex flex-col h-full pt-safe">
        <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 bg-white">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-neutral-800 active:scale-95 transition-transform"
          >
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
      <div className="flex flex-col h-full pt-safe">
        <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 bg-white">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-neutral-800 active:scale-95 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6">
          <p className="text-body font-semibold text-neutral-900 font-heading text-center">Recipe not found</p>
          <button type="button" onClick={() => navigate(-1)} className="text-green-500 font-semibold text-body-sm font-sans">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === recipe.user_id;
  const withAvail = matchRecipeToPantry(recipe, pantryItems);
  const pantrySet = new Set(pantryItems.map(p => p.name.toLowerCase().trim().replace(/s$/, '').replace(/\s+/g, ' ')));

  return (
    <div className="flex flex-col h-full pt-safe">
      {/* Header */}
      <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-neutral-800 active:scale-95 transition-transform flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-3 flex-1 min-w-0 text-h3 font-heading text-neutral-900 truncate">
          Recipe
        </h1>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isOwner && (
            <>
              <button
                type="button"
                onClick={handleTogglePublic}
                className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors ${recipe.is_public ? 'text-green-500' : 'text-neutral-400'} active:bg-neutral-100`}
                aria-label={recipe.is_public ? 'Make private' : 'Make public'}
              >
                {recipe.is_public ? <Eye size={22} weight="fill" /> : <EyeSlash size={22} />}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/recipe/${recipe.id}/edit`)}
                className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-600 active:bg-neutral-100 transition-colors"
                aria-label="Edit recipe"
              >
                <PencilSimple size={22} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={savingOrDeleting}
                className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:text-red-700 active:bg-red-50 transition-colors disabled:opacity-50"
                aria-label="Delete recipe"
              >
                <Trash size={22} />
              </button>
            </>
          )}
          {!isOwner && (
            <button
              type="button"
              onClick={isSaved ? handleUnsave : handleSave}
              disabled={savingOrDeleting}
              className={[
                'flex items-center gap-1.5 px-3 h-[36px] rounded-full text-body-sm font-medium font-sans transition-colors disabled:opacity-50',
                isSaved
                  ? 'bg-green-500 text-white active:bg-green-700'
                  : 'bg-neutral-100 text-neutral-800 active:bg-neutral-200',
              ].join(' ')}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Cover photo */}
        {recipe.image_url && (
          <div className="relative w-full h-[200px] flex-shrink-0">
            <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="px-4 pt-4 pb-6 flex flex-col gap-5">
          {/* Title & meta */}
          <div className="flex flex-col gap-1">
            <h1 className="text-h2 font-heading text-neutral-900 leading-snug">
              {recipe.title}
            </h1>
            {recipe.author && (
              <p className="text-body-sm text-neutral-400 font-sans">by {recipe.author.display_name}</p>
            )}
            {(recipe.cook_time_minutes || recipe.servings > 0) && (
              <div className="flex items-center gap-4 text-body-sm text-neutral-600 font-sans mt-0.5">
                {recipe.cook_time_minutes && <span>{recipe.cook_time_minutes} min</span>}
                {recipe.servings > 0 && <span>{recipe.servings} servings</span>}
              </div>
            )}
          </div>

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-h3 font-heading text-neutral-900 px-0">Ingredients</h2>
              <div className="flex flex-col gap-3">
                {[...recipe.ingredients]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map(ing => {
                    const normalized = ing.name.toLowerCase().trim().replace(/s$/, '').replace(/\s+/g, ' ');
                    const inPantry = pantrySet.has(normalized);
                    return (
                      <div
                        key={ing.id}
                        className={`flex items-center gap-3 ${ing.optional ? 'opacity-60' : ''}`}
                      >
                        <div className={`w-16 h-16 rounded-md flex-shrink-0 ${inPantry ? 'bg-green-50 border border-green-100' : 'bg-white border border-neutral-100'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-semibold text-neutral-900 font-sans truncate">
                            {ing.name}{ing.optional ? ' (optional)' : ''}
                          </p>
                          {(ing.quantity || ing.unit) && (
                            <p className="text-badge text-neutral-400 font-sans mt-0.5">
                              {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                            </p>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${inPantry ? 'bg-green-500' : 'bg-neutral-200'}`} />
                      </div>
                    );
                  })}
              </div>
              <p className="text-badge text-neutral-400 font-sans">
                {withAvail.available_count} of {withAvail.total_count} required ingredients in pantry
              </p>
              {withAvail.missing_ingredients.length > 0 && (
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  loading={addingToList}
                  onClick={() => handleAddMissingToList(withAvail.missing_ingredients)}
                >
                  Add {withAvail.missing_ingredients.length} missing to list
                </Button>
              )}
            </div>
          )}

          {/* Steps */}
          {recipe.steps.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-h3 font-heading text-neutral-900">Instructions</h2>
              {recipe.steps.map(step => (
                <div key={step.id} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500 text-white text-body-sm font-semibold flex items-center justify-center font-sans">
                      {step.step_number}
                    </span>
                    <p className="flex-1 text-body-sm text-neutral-800 font-sans leading-relaxed pt-0.5">
                      {step.instruction}
                    </p>
                  </div>
                  {step.image_url && (
                    <img
                      src={step.image_url}
                      alt={`Step ${step.step_number}`}
                      className="w-full rounded-xl object-cover max-h-[240px]"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
