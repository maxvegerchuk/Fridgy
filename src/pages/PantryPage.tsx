import { EmptyState, Button } from '../components/ui';

export default function PantryPage() {
  return (
    <div className="flex flex-col h-full pt-safe">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <h1 className="text-xl font-semibold text-neutral-900">Pantry</h1>
        <Button size="sm" variant="primary" onClick={() => {}}>+ Add</Button>
      </div>
      <EmptyState
        emoji="🥫"
        title="Pantry is empty"
        description="Items move here automatically when you check them off your list"
      />
    </div>
  );
}
