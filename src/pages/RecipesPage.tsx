import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Globe, Plus, Bookmark, BookmarkSimple } from 'phosphor-react';
import { EmptyState, SegmentControl, FilterTabs, Skeleton } from '../components/ui';
import { useToast } from '../components/ui';
import { useRecipes } from '../hooks/useRecipes';
import { usePantry } from '../hooks/usePantry';
import { getFilteredRecipes, getFilterCounts } from '../lib/recipeEngine';
import type { RecipeFilter, RecipeWithAvailability, Recipe } from '../types';

type Segment = 'mine' | 'explore';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ready:        { label: 'Can cook',  cls: 'bg-green-100 text-green-700' },
  need_few:     { label: 'Need 1–3',  cls: 'bg-amber-100 text-amber-700' },
  missing_many: { label: 'Missing',   cls: 'bg-neutral-100 text-neutral-500' },
};

function RecipeCard({
  recipe,
  onClick,
  action,
}: {
  recipe: RecipeWithAvailability | Recipe;
  onClick: () => void;
  action?: React.ReactNode;
}) {
  const withAvail = 'status' in recipe ? recipe as RecipeWithAvailability : null;
  const badge = withAvail ? STATUS_BADGE[withAvail.status] : null;
  const totalTime = recipe.cook_time_minutes ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col border border-neutral-200 rounded-xl bg-neutral-0 overflow-hidden text-left active:scale-95 transition-transform"
    >
      {/* Cover photo / placeholder */}
      <div className="w-full h-[100px] flex-shrink-0">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <BookOpen size={28} weight="light" className="text-neutral-300" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-1">
          <span className="text-sm font-semibold text-neutral-900 font-display leading-snug flex-1">
            {recipe.title}
          </span>
          {action && (
            <div onClick={e => e.stopPropagation()}>
              {action}
            </div>
          )}
        </div>

        {badge && (
          <span className={`self-start text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        <div className="flex items-center gap-3 text-xs text-neutral-400 font-sans">
          {withAvail && (
            <span>{withAvail.available_count}/{withAvail.total_count} ingredients</span>
          )}
          {totalTime > 0 && <span>{totalTime} min</span>}
          {recipe.servings > 1 && <span>{recipe.servings} srv</span>}
        </div>
      </div>
    </button>
  );
}

export default function RecipesPage() {
  const [segment, setSegment] = useState<Segment>('mine');
  const [filter, setFilter] = useState<RecipeFilter>('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const exploreFetched = useRef(false);

  const { myRecipes, publicRecipes, savedIds, loading, publicLoading, fetchPublicRecipes, saveRecipe } = useRecipes();
  const { items: pantryItems } = usePantry();

  useEffect(() => {
    if (segment === 'explore' && !exploreFetched.current) {
      exploreFetched.current = true;
      fetchPublicRecipes();
    }
  }, [segment, fetchPublicRecipes]);

  const counts = getFilterCounts(myRecipes, pantryItems);
  const filtered = getFilteredRecipes(myRecipes, pantryItems, filter);

  const filterTabs = [
    { value: 'ready' as RecipeFilter,    label: 'Can cook', count: counts.ready },
    { value: 'need_few' as RecipeFilter, label: 'Need 1–3', count: counts.need_few },
    { value: 'all' as RecipeFilter,      label: 'All',      count: counts.all },
  ];

  const searchedPublic = publicRecipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSave = async (recipe: Recipe) => {
    const err = await saveRecipe(recipe);
    if (err) toast(err, 'error');
    else toast('Saved to your recipes', 'success');
  };

  return (
    <div className="flex flex-col h-full pt-safe relative">
      <div className="px-4 pb-2 border-b border-neutral-100 flex flex-col gap-2 bg-white">
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
            className="w-full h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {segment === 'mine' && (
          <>
            {loading && (
              <div className="grid grid-cols-2 gap-3 p-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
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
              <div className="grid grid-cols-2 gap-3 p-4">
                {filtered.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {segment === 'explore' && (
          <>
            {publicLoading && (
              <div className="grid grid-cols-2 gap-3 p-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
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
              <div className="grid grid-cols-2 gap-3 p-4">
                {searchedPublic.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    action={
                      <button
                        type="button"
                        onClick={() => handleSave(recipe)}
                        className="p-1 text-neutral-400 active:text-green-500 transition-colors"
                        aria-label={savedIds.has(recipe.id) ? 'Saved' : 'Save recipe'}
                      >
                        {savedIds.has(recipe.id)
                          ? <Bookmark size={18} weight="fill" className="text-green-500" />
                          : <BookmarkSimple size={18} weight="regular" />
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
    </div>
  );
}
