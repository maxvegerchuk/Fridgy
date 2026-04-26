// ─── Users ──────────────────────────────────────────────

export type Profile = {
  id: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
};

// ─── Shopping List ──────────────────────────────────────

export type ShoppingList = {
  id: string;
  owner_id: string;
  name: string;
  invite_token: string;
  created_at: string;
  updated_at: string;
};

export type ListMember = {
  id: string;
  list_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  joined_at: string;
  profile?: Profile;
};

export type ListItem = {
  id: string;
  list_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
  is_checked: boolean;
  checked_at?: string;
  added_by: string;
  created_at: string;
  updated_at: string;
};

// ─── Categories ─────────────────────────────────────────

export type ItemCategory =
  | 'vegetables' | 'fruits' | 'dairy' | 'meat'
  | 'fish' | 'bakery' | 'frozen' | 'canned'
  | 'drinks' | 'snacks' | 'household' | 'other';

export const CATEGORIES: Record<ItemCategory, { label: string; emoji: string }> = {
  vegetables: { label: 'Vegetables',   emoji: '🥦' },
  fruits:     { label: 'Fruits',       emoji: '🍎' },
  dairy:      { label: 'Dairy & Eggs', emoji: '🥛' },
  meat:       { label: 'Meat',         emoji: '🥩' },
  fish:       { label: 'Fish',         emoji: '🐟' },
  bakery:     { label: 'Bakery',       emoji: '🍞' },
  frozen:     { label: 'Frozen',       emoji: '🧊' },
  canned:     { label: 'Canned',       emoji: '🥫' },
  drinks:     { label: 'Drinks',       emoji: '🧃' },
  snacks:     { label: 'Snacks',       emoji: '🍿' },
  household:  { label: 'Household',    emoji: '🧹' },
  other:      { label: 'Other',        emoji: '📦' },
};

// ─── Pantry ─────────────────────────────────────────────

export type Pantry = {
  id: string;
  owner_id: string;
  invite_token: string;
  created_at: string;
};

export type PantryMember = {
  id: string;
  pantry_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  joined_at: string;
  profile?: Profile;
};

export type PantryItem = {
  id: string;
  pantry_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
  source: 'shopping_list' | 'manual';
  added_by: string;
  created_at: string;
  updated_at: string;
};

// ─── Purchase History ───────────────────────────────────

export type PurchaseHistoryItem = {
  id: string;
  pantry_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category: ItemCategory;
  last_purchased_at: string;
  purchase_count: number;
};

// ─── Recipes ────────────────────────────────────────────

export type RecipeStep = {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  image_url?: string;
  created_at: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  title: string;
  image_url?: string;
  cook_time_minutes?: number;
  servings: number;
  is_public: boolean;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  created_at: string;
  author?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  optional: boolean;
  sort_order: number;
};

export type SavedRecipe = {
  id: string;
  user_id: string;
  original_recipe_id: string;
  recipe: Recipe;
  saved_at: string;
};

// ─── Recipe Engine ──────────────────────────────────────

export type RecipeStatus = 'ready' | 'need_few' | 'missing_many';
export type RecipeFilter = 'ready' | 'need_few' | 'all';

export type RecipeWithAvailability = Recipe & {
  status: RecipeStatus;
  missing_ingredients: RecipeIngredient[];
  available_count: number;
  total_count: number;
};
