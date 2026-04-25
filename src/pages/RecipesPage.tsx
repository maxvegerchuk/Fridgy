import { useState } from 'react';
import { BookOpen, Globe } from 'phosphor-react';
import { EmptyState, SegmentControl, FilterTabs } from '../components/ui';
import type { RecipeFilter } from '../types';

type Segment = 'mine' | 'explore';

export default function RecipesPage() {
  const [segment, setSegment] = useState<Segment>('mine');
  const [filter, setFilter] = useState<RecipeFilter>('all');

  const filterTabs = [
    { value: 'ready' as RecipeFilter,    label: 'Can cook', count: 0 },
    { value: 'need_few' as RecipeFilter, label: 'Need 1–3', count: 0 },
    { value: 'all' as RecipeFilter,      label: 'All',      count: 0 },
  ];

  return (
    <div className="flex flex-col h-full pt-safe">
      <div className="px-4 pt-3 pb-2 border-b border-neutral-100 flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-neutral-900">Recipes</h1>
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
      </div>

      {segment === 'mine' ? (
        <EmptyState
          icon={<BookOpen size={56} weight="light" />}
          title="No recipes yet"
          description="Create your first recipe or save one from Explore"
        />
      ) : (
        <EmptyState
          icon={<Globe size={56} weight="light" />}
          title="Explore recipes"
          description="Public recipes from the community will appear here"
        />
      )}
    </div>
  );
}
