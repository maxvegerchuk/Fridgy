import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Globe, Plus, Bookmark, BookmarkSimple } from 'phosphor-react';
import { EmptyState, SegmentControl, FilterTabs, Skeleton, BottomSheet, Button } from '../components/ui';
import { useToast } from '../components/ui';
import { useRecipes, fetchRecipeById } from '../hooks/useRecipes';
import { usePantry } from '../hooks/usePantry';
import { useShoppingLists } from '../hooks/useShoppingList';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { getFilteredRecipes, getFilterCounts } from '../lib/recipeEngine';
import type { RecipeFilter, RecipeWithAvailability, Recipe, RecipeIngredient } from '../types';

type Segment = 'mine' | 'explore';
type SheetStep = 'ingredients' | 'select-list';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ready:        { label: 'Available',  cls: 'bg-green-100 text-green-700' },
  need_few:     { label: 'Need 1–3',   cls: 'bg-amber-100 text-amber-700' },
  missing_many: { label: 'Missing',    cls: 'bg-neutral-100 text-neutral-500' },
};

type PendingAdd = {
  recipeName: string;
  ingredients: RecipeIngredient[];
  mode: 'all' | 'missing';
};

function RecipeCard({
  recipe,
  onClick,
  onAddAll,
  onAddMissing,
  loadingMode,
  showMissing,
  action,
}: {
  recipe: RecipeWithAvailability | Recipe;
  onClick: () => void;
  onAddAll: () => void;
  onAddMissing?: () => void;
  loadingMode: 'all' | 'missing' | null;
  showMissing: boolean;
  action?: React.ReactNode;
}) {
  const withAvail = 'status' in recipe ? recipe as RecipeWithAvailability : null;
  const badge = withAvail ? STATUS_BADGE[withAvail.status] : null;
  const totalTime = recipe.cook_time_minutes ?? 0;

  return (
    <div className="bg-white border border-neutral-100 rounded-md overflow-hidden">
      {/* Cover image */}
      <div
        className="w-full h-[200px] cursor-pointer active:opacity-80 transition-opacity"
        onClick={onClick}
      >
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <BookOpen size={40} weight="light" className="text-neutral-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-base font-semibold text-neutral-900 font-sans leading-snug flex-1 cursor-pointer"
            onClick={onClick}
          >
            {recipe.title}
          </p>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {badge && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-sans">
            {withAvail && (
              <span>{withAvail.available_count}/{withAvail.total_count} ingredients</span>
            )}
            {totalTime > 0 && <span>{totalTime} min</span>}
            {recipe.servings > 1 && <span>{recipe.servings} srv</span>}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onAddAll}
            disabled={loadingMode !== null}
            className="flex-1 h-[40px] border border-neutral-200 rounded-md text-sm font-medium font-sans text-neutral-700 active:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            {loadingMode === 'all' ? '…' : 'Add All'}
          </button>
          {showMissing && onAddMissing && (
            <button
              type="button"
              onClick={onAddMissing}
              disabled={loadingMode !== null}
              className="flex-1 h-[40px] bg-green-500 text-white rounded-md text-sm font-medium font-sans active:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loadingMode === 'missing' ? '…' : 'Add Missing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  const [segment, setSegment] = useState<Segment>('mine');
  const [filter, setFilter]   = useState<RecipeFilter>('all');
  const [search, setSearch]   = useState('');
  const navigate  = useNavigate();
  const toast     = useToast();
  const exploreFetched = useRef(false);

  const { myRecipes, publicRecipes, savedIds, loading, publicLoading, fetchPublicRecipes, saveRecipe } = useRecipes();
  const { items: pantryItems } = usePantry();
  const { myLists } = useShoppingLists();
  const user = useAuthStore(s => s.user);

  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const [loadingMode, setLoadingMode]         = useState<'all' | 'missing' | null>(null);
  const [pendingAdd, setPendingAdd]           = useState<PendingAdd | null>(null);
  const [sheetStep, setSheetStep]             = useState<SheetStep>('ingredients');
  const [addingToListId, setAddingToListId]   = useState<string | null>(null);

  useEffect(() => {
    if (segment === 'explore' && !exploreFetched.current) {
      exploreFetched.current = true;
      fetchPublicRecipes();
    }
  }, [segment, fetchPublicRecipes]);

  const counts   = getFilterCounts(myRecipes, pantryItems);
  const filtered = getFilteredRecipes(myRecipes, pantryItems, filter);

  const filterTabs = [
    { value: 'all' as RecipeFilter,       label: 'All',       count: counts.all },
    { value: 'available' as RecipeFilter, label: 'Available', count: counts.available },
    { value: 'missing' as RecipeFilter,   label: 'Missing',   count: counts.missing },
  ];

  const searchedPublic = publicRecipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSave = async (recipe: Recipe) => {
    const err = await saveRecipe(recipe);
    if (err) toast(err, 'error');
    else toast('Saved to your recipes', 'success');
  };

  const handleAddClick = async (recipe: Recipe | RecipeWithAvailability, mode: 'all' | 'missing') => {
    setLoadingRecipeId(recipe.id);
    setLoadingMode(mode);

    const full = await fetchRecipeById(recipe.id);
    setLoadingRecipeId(null);
    setLoadingMode(null);

    if (!full) { toast('Could not load recipe', 'error'); return; }

    let ingredients = full.ingredients ?? [];
    if (mode === 'missing') {
      const pantryNames = new Set(pantryItems.map(p => p.name.toLowerCase()));
      ingredients = ingredients.filter(ing => !pantryNames.has(ing.name.toLowerCase()));
      if (ingredients.length === 0) {
        toast('All ingredients are already in your pantry', 'info');
        return;
      }
    }

    setPendingAdd({ recipeName: full.title, ingredients, mode });
    setSheetStep('ingredients');
  };

  const handleAddToList = async (listId: string) => {
    if (!pendingAdd || !user) return;
    setAddingToListId(listId);

    const rows = pendingAdd.ingredients.map(ing => ({
      id: randomUUID(),
      list_id: listId,
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
      category: 'other' as const,
      is_checked: false,
      added_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('list_items').insert(rows);
    setAddingToListId(null);

    if (error) {
      toast('Failed to add items', 'error');
    } else {
      toast(`${rows.length} item${rows.length !== 1 ? 's' : ''} added`, 'success');
      setPendingAdd(null);
    }
  };

  const closeSheet = () => { setPendingAdd(null); setSheetStep('ingredients'); };

  return (
    <div className="flex flex-col h-full pt-safe relative">
      {/* Header */}
      <div className="px-4 pb-2 border-b border-neutral-100 flex flex-col gap-2 bg-white flex-shrink-0">
        <div className="flex items-center h-[56px]">
          <h1 className="text-2xl font-semibold text-neutral-900 font-display">Recipes</h1>
        </div>
        <SegmentControl
          options={[
            { value: 'mine',    label: 'My Recipes' },
            { value: 'explore', label: 'Explore' },
          ]}
          value={segment}
          onChange={(v) => setSegment(v as Segment)}
        />
        {segment === 'mine' && (
          <FilterTabs
            tabs={filterTabs}
            value={filter}
            onChange={(v) => setFilter(v as RecipeFilter)}
          />
        )}
        {segment === 'explore' && (
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes…"
            style={{ fontSize: '16px' }}
            className="w-full h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
          />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {segment === 'mine' && (
          <>
            {loading && (
              <div className="flex flex-col gap-2 px-4 pt-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-[300px] rounded-md" />)}
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <EmptyState
                icon={<BookOpen size={56} weight="light" />}
                title="No recipes yet"
                description="Create your first recipe or save one from Explore"
              />
            )}
            {!loading && filtered.length > 0 && (
              <div className="flex flex-col gap-2 px-4 pt-3 pb-24">
                {filtered.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    onAddAll={() => handleAddClick(recipe, 'all')}
                    onAddMissing={() => handleAddClick(recipe, 'missing')}
                    loadingMode={loadingRecipeId === recipe.id ? loadingMode : null}
                    showMissing={recipe.status !== 'ready'}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {segment === 'explore' && (
          <>
            {publicLoading && (
              <div className="flex flex-col gap-2 px-4 pt-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-[300px] rounded-md" />)}
              </div>
            )}
            {!publicLoading && searchedPublic.length === 0 && (
              <EmptyState
                icon={<Globe size={56} weight="light" />}
                title={search ? 'No results' : 'No public recipes yet'}
                description={search ? 'Try a different search' : 'Be the first to share a recipe'}
              />
            )}
            {!publicLoading && searchedPublic.length > 0 && (
              <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
                {searchedPublic.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    onAddAll={() => handleAddClick(recipe, 'all')}
                    loadingMode={loadingRecipeId === recipe.id ? loadingMode : null}
                    showMissing={false}
                    action={
                      <button
                        type="button"
                        onClick={() => handleSave(recipe)}
                        className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:text-green-500 active:bg-green-50 transition-colors"
                        aria-label={savedIds.has(recipe.id) ? 'Saved' : 'Save recipe'}
                      >
                        {savedIds.has(recipe.id)
                          ? <Bookmark size={20} weight="fill" className="text-green-500" />
                          : <BookmarkSimple size={20} weight="regular" />
                        }
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {segment === 'mine' && (
        <button
          type="button"
          onClick={() => navigate('/recipe/new')}
          className="absolute bottom-6 right-4 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Create recipe"
        >
          <Plus size={24} weight="bold" />
        </button>
      )}

      {/* Add ingredients sheet */}
      <BottomSheet
        isOpen={pendingAdd !== null}
        onClose={closeSheet}
        title={
          sheetStep === 'ingredients'
            ? `${pendingAdd?.mode === 'missing' ? 'Missing' : 'All'} ingredients`
            : 'Add to list'
        }
      >
        {pendingAdd && sheetStep === 'ingredients' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-500 font-sans -mt-1">
              {pendingAdd.ingredients.length} ingredient{pendingAdd.ingredients.length !== 1 ? 's' : ''} from "{pendingAdd.recipeName}"
            </p>

            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
              {pendingAdd.ingredients.map(ing => (
                <div key={ing.id} className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-md">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 font-sans truncate">{ing.name}</p>
                    {(ing.quantity || ing.unit) && (
                      <p className="text-xs text-neutral-400 font-sans mt-0.5">
                        {[ing.quantity, ing.unit].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="md" fullWidth onClick={closeSheet}>
                Cancel
              </Button>
              <Button size="md" fullWidth onClick={() => setSheetStep('select-list')}>
                Add to List
              </Button>
            </div>
          </div>
        )}

        {pendingAdd && sheetStep === 'select-list' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-neutral-500 font-sans -mt-1">Choose a shopping list:</p>

            {myLists.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-4 font-sans">
                No lists yet. Create one first.
              </p>
            )}

            {myLists.map(list => (
              <button
                key={list.id}
                type="button"
                onClick={() => handleAddToList(list.id)}
                disabled={addingToListId !== null}
                className="flex items-center justify-between h-[52px] px-4 bg-white border border-neutral-100 rounded-md active:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                <span className="text-sm font-semibold text-neutral-900 font-sans">{list.name}</span>
                <span className="text-xs text-neutral-400 font-sans">
                  {addingToListId === list.id ? 'Adding…' : `${list.item_count} items`}
                </span>
              </button>
            ))}

            <Button variant="secondary" size="md" fullWidth onClick={() => setSheetStep('ingredients')}>
              Back
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
