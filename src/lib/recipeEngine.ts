import type { Recipe, PantryItem, RecipeStatus, RecipeFilter, RecipeWithAvailability } from '../types';

function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, '').replace(/\s+/g, ' ');
}

export function matchRecipeToPantry(
  recipe: Recipe,
  pantryItems: PantryItem[]
): RecipeWithAvailability {
  const pantrySet = new Set(pantryItems.map(p => normalize(p.name)));
  const required = recipe.ingredients.filter(i => !i.optional);
  const missing = required.filter(i => !pantrySet.has(normalize(i.name)));

  let status: RecipeStatus;
  if (missing.length === 0) status = 'ready';
  else if (missing.length <= 3) status = 'need_few';
  else status = 'missing_many';

  return {
    ...recipe,
    status,
    missing_ingredients: missing,
    available_count: required.length - missing.length,
    total_count: required.length,
  };
}

export function getFilteredRecipes(
  recipes: Recipe[],
  pantryItems: PantryItem[],
  filter: RecipeFilter
): RecipeWithAvailability[] {
  const enriched = recipes.map(r => matchRecipeToPantry(r, pantryItems));
  if (filter === 'all') return enriched;
  if (filter === 'ready') return enriched.filter(r => r.status === 'ready');
  return enriched.filter(r => r.status === 'need_few');
}

export function getFilterCounts(
  recipes: Recipe[],
  pantryItems: PantryItem[]
): Record<RecipeFilter, number> {
  const enriched = recipes.map(r => matchRecipeToPantry(r, pantryItems));
  return {
    ready:    enriched.filter(r => r.status === 'ready').length,
    need_few: enriched.filter(r => r.status === 'need_few').length,
    all:      enriched.length,
  };
}
