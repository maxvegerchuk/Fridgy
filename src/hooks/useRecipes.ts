import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { randomUUID } from '../lib/uuid';
import type { Recipe, RecipeStep } from '../types';

export type NewIngredientRow = {
  name: string;
  quantity?: number;
  unit?: string;
  optional: boolean;
};

export type NewRecipeStep = {
  instruction: string;
  imageFile?: File;
  existingImageUrl?: string;
};

export type NewRecipe = {
  title: string;
  cook_time_minutes?: number;
  servings: number;
  is_public: boolean;
  ingredients: NewIngredientRow[];
  steps: NewRecipeStep[];
  coverImageFile?: File;
  existingCoverUrl?: string;
};

const RECIPE_SELECT = '*, ingredients:recipe_ingredients(*), steps:recipe_steps(*)';
const PUBLIC_RECIPE_SELECT = `${RECIPE_SELECT}, author:profiles!user_id(id, display_name, avatar_url)`;

async function uploadImage(
  bucket: string,
  path: string,
  file: File,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true });
  if (error) {
    console.error('[useRecipes] upload failed:', path, error);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(PUBLIC_RECIPE_SELECT)
    .eq('id', id)
    .single();
  if (error) {
    console.error('[useRecipes] fetchRecipeById:', error);
    return null;
  }
  const recipe = data as Recipe;
  recipe.steps = [...(recipe.steps ?? [])].sort((a, b) => a.step_number - b.step_number);
  return recipe;
}

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
            .select(RECIPE_SELECT)
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
        .select(PUBLIC_RECIPE_SELECT)
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

    // 1. Insert recipe record
    const { error } = await supabase.from('recipes').insert({
      id,
      user_id: user.id,
      title: recipe.title,
      cook_time_minutes: recipe.cook_time_minutes ?? null,
      servings: recipe.servings,
      is_public: recipe.is_public,
    });
    if (error) { console.error('[useRecipes] create:', error); return null; }

    // 2. Insert ingredients
    if (recipe.ingredients.length > 0) {
      const { error: ingErr } = await supabase.from('recipe_ingredients').insert(
        recipe.ingredients.map((ing, idx) => ({
          id: randomUUID(),
          recipe_id: id,
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          optional: ing.optional,
          sort_order: idx,
        }))
      );
      if (ingErr) console.error('[useRecipes] ingredients:', ingErr);
    }

    // 3. Insert steps — get IDs back for photo upload
    let stepRecords: RecipeStep[] = [];
    if (recipe.steps.length > 0) {
      const { data: stepsData, error: stepsErr } = await supabase
        .from('recipe_steps')
        .insert(
          recipe.steps.map((s, idx) => ({
            id: randomUUID(),
            recipe_id: id,
            step_number: idx + 1,
            instruction: s.instruction,
          }))
        )
        .select('*');
      if (stepsErr) console.error('[useRecipes] steps:', stepsErr);
      stepRecords = (stepsData as RecipeStep[]) ?? [];
    }

    // 4. Upload cover photo
    if (recipe.coverImageFile) {
      const url = await uploadImage('recipe-images', `${user.id}/${id}/cover.jpg`, recipe.coverImageFile);
      if (url) await supabase.from('recipes').update({ image_url: url }).eq('id', id);
    }

    // 5. Upload step photos
    for (let i = 0; i < recipe.steps.length; i++) {
      const step = recipe.steps[i];
      if (!step.imageFile) continue;
      const stepNum = i + 1;
      const record = stepRecords.find(r => r.step_number === stepNum);
      if (!record) continue;
      const url = await uploadImage('recipe-images', `${user.id}/${id}/step_${stepNum}.jpg`, step.imageFile);
      if (url) await supabase.from('recipe_steps').update({ image_url: url }).eq('id', record.id);
    }

    // 6. Refetch so the list reflects the new recipe + any uploaded URLs
    const { data } = await supabase
      .from('recipes')
      .select(RECIPE_SELECT)
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

    // Track as saved (bookmark indicator)
    const { error } = await supabase.from('saved_recipes').insert({
      id: randomUUID(),
      user_id: user.id,
      original_recipe_id: recipe.id,
      title: recipe.title,
      cook_time_minutes: recipe.cook_time_minutes ?? null,
      servings: recipe.servings,
      is_public: false,
    });
    if (error) { console.error('[useRecipes] save:', error); return error.message; }

    // Copy recipe into the user's own recipes so it appears in My Recipes
    const newId = randomUUID();
    await supabase.from('recipes').insert({
      id: newId,
      user_id: user.id,
      title: recipe.title,
      image_url: recipe.image_url ?? null,
      cook_time_minutes: recipe.cook_time_minutes ?? null,
      servings: recipe.servings,
      is_public: false,
    });
    if (recipe.ingredients.length > 0) {
      await supabase.from('recipe_ingredients').insert(
        recipe.ingredients.map((ing, idx) => ({
          id: randomUUID(),
          recipe_id: newId,
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          optional: ing.optional,
          sort_order: idx,
        }))
      );
    }

    setSavedIds(prev => new Set([...prev, recipe.id]));

    // Refetch so My Recipes list is updated immediately
    const { data } = await supabase
      .from('recipes')
      .select(RECIPE_SELECT)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyRecipes(data as Recipe[]);

    return null;
  }, [user, savedIds]);

  const deleteRecipe = useCallback(async (recipeId: string) => {
    setMyRecipes(prev => prev.filter(r => r.id !== recipeId));
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
    if (error) console.error('[useRecipes] delete:', error);
  }, []);

  const updateRecipe = useCallback(async (
    recipeId: string,
    recipe: NewRecipe,
  ): Promise<{ id: string } | null> => {
    if (!user) return null;

    // 1. Determine cover URL (upload new file, keep existing, or clear)
    let coverUrl: string | null = recipe.existingCoverUrl ?? null;
    if (recipe.coverImageFile) {
      const url = await uploadImage('recipe-images', `${user.id}/${recipeId}/cover.jpg`, recipe.coverImageFile);
      if (url) coverUrl = url;
    }

    // 2. Update recipe record
    const { error } = await supabase.from('recipes').update({
      title: recipe.title,
      cook_time_minutes: recipe.cook_time_minutes ?? null,
      servings: recipe.servings,
      is_public: recipe.is_public,
      image_url: coverUrl,
    }).eq('id', recipeId);
    if (error) { console.error('[useRecipes] update:', error); return null; }

    // 3. Replace ingredients
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
    if (recipe.ingredients.length > 0) {
      const { error: ingErr } = await supabase.from('recipe_ingredients').insert(
        recipe.ingredients.map((ing, idx) => ({
          id: randomUUID(),
          recipe_id: recipeId,
          name: ing.name,
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          optional: ing.optional,
          sort_order: idx,
        }))
      );
      if (ingErr) console.error('[useRecipes] update ingredients:', ingErr);
    }

    // 4. Replace steps (insert with any kept image_url, then upload new files)
    await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId);
    let stepRecords: RecipeStep[] = [];
    if (recipe.steps.length > 0) {
      const { data: stepsData, error: stepsErr } = await supabase
        .from('recipe_steps')
        .insert(
          recipe.steps.map((s, idx) => ({
            id: randomUUID(),
            recipe_id: recipeId,
            step_number: idx + 1,
            instruction: s.instruction,
            image_url: s.existingImageUrl ?? null,
          }))
        )
        .select('*');
      if (stepsErr) console.error('[useRecipes] update steps:', stepsErr);
      stepRecords = (stepsData as RecipeStep[]) ?? [];
    }

    // 5. Upload new step photos
    for (let i = 0; i < recipe.steps.length; i++) {
      const step = recipe.steps[i];
      if (!step.imageFile) continue;
      const stepNum = i + 1;
      const record = stepRecords.find(r => r.step_number === stepNum);
      if (!record) continue;
      const url = await uploadImage('recipe-images', `${user.id}/${recipeId}/step_${stepNum}.jpg`, step.imageFile);
      if (url) await supabase.from('recipe_steps').update({ image_url: url }).eq('id', record.id);
    }

    // 6. Refetch
    const { data } = await supabase
      .from('recipes')
      .select(RECIPE_SELECT)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyRecipes(data as Recipe[]);

    return { id: recipeId };
  }, [user]);

  return {
    myRecipes,
    publicRecipes,
    savedIds,
    loading,
    publicLoading,
    fetchPublicRecipes,
    createRecipe,
    updateRecipe,
    togglePublic,
    saveRecipe,
    deleteRecipe,
  };
}
