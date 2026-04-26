import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { randomUUID } from '../lib/uuid';
import type { Recipe } from '../types';

export type NewIngredientRow = {
  name: string;
  quantity?: number;
  unit?: string;
  optional: boolean;
};

export type NewRecipe = {
  title: string;
  description?: string;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings: number;
  is_public: boolean;
  ingredients: NewIngredientRow[];
};

export function useRecipes() {
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [publicRecipes, setPublicRecipes] = useState<Recipe[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [publicLoading, setPublicLoading] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function init() {
      if (!user) return;
      setLoading(true);
      try {
        const [recipesRes, savedRes] = await Promise.all([
          supabase
            .from('recipes')
            .select('*, ingredients:recipe_ingredients(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('saved_recipes')
            .select('original_recipe_id')
            .eq('user_id', user.id),
        ]);
        if (cancelled) return;
        if (recipesRes.error) console.error('[useRecipes]', recipesRes.error);
        setMyRecipes((recipesRes.data as Recipe[]) ?? []);
        if (savedRes.data) {
          setSavedIds(new Set(
            savedRes.data
              .map(r => r.original_recipe_id as string | null)
              .filter((id): id is string => id !== null)
          ));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user?.id]);

  const fetchPublicRecipes = useCallback(async () => {
    setPublicLoading(true);
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, ingredients:recipe_ingredients(*), author:profiles!user_id(id, display_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (error) console.error('[useRecipes] public:', error);
      setPublicRecipes((data as Recipe[]) ?? []);
    } finally {
      setPublicLoading(false);
    }
  }, []);

  const createRecipe = useCallback(async (recipe: NewRecipe): Promise<{ id: string } | null> => {
    if (!user) return null;
    const id = randomUUID();
    const { error } = await supabase.from('recipes').insert({
      id,
      user_id: user.id,
      title: recipe.title,
      description: recipe.description ?? null,
      prep_time_minutes: recipe.prep_time_minutes ?? null,
      cook_time_minutes: recipe.cook_time_minutes ?? null,
      servings: recipe.servings,
      is_public: recipe.is_public,
    });
    if (error) {
      console.error('[useRecipes] create:', error);
      return null;
    }
    if (recipe.ingredients.length > 0) {
      const rows = recipe.ingredients.map((ing, idx) => ({
        id: randomUUID(),
        recipe_id: id,
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        optional: ing.optional,
        sort_order: idx,
      }));
      const { error: ingErr } = await supabase.from('recipe_ingredients').insert(rows);
      if (ingErr) console.error('[useRecipes] ingredients:', ingErr);
    }
    const { data } = await supabase
      .from('recipes')
      .select('*, ingredients:recipe_ingredients(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyRecipes(data as Recipe[]);
    return { id };
  }, [user]);

  const togglePublic = useCallback(async (recipeId: string, isPublic: boolean) => {
    setMyRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, is_public: isPublic } : r));
    const { error } = await supabase.from('recipes').update({ is_public: isPublic }).eq('id', recipeId);
    if (error) {
      console.error('[useRecipes] togglePublic:', error);
      setMyRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, is_public: !isPublic } : r));
    }
  }, []);

  const saveRecipe = useCallback(async (recipe: Recipe): Promise<string | null> => {
    if (!user) return 'Not logged in';
    if (savedIds.has(recipe.id)) return null;
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
      console.error('[useRecipes] save:', error);
      return error.message;
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
    setSavedIds(prev => new Set([...prev, recipe.id]));
    return null;
  }, [user, savedIds]);

  const deleteRecipe = useCallback(async (recipeId: string) => {
    setMyRecipes(prev => prev.filter(r => r.id !== recipeId));
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
    if (error) console.error('[useRecipes] delete:', error);
  }, []);

  return {
    myRecipes,
    publicRecipes,
    savedIds,
    loading,
    publicLoading,
    fetchPublicRecipes,
    createRecipe,
    togglePublic,
    saveRecipe,
    deleteRecipe,
  };
}
