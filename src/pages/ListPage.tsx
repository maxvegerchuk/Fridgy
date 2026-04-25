import { EmptyState, Button } from '../components/ui';

export default function ListPage() {
  return (
    <div className="flex flex-col h-full pt-safe">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <h1 className="text-xl font-semibold text-neutral-900">Shopping List</h1>
        <Button size="sm" variant="primary" onClick={() => {}}>+ Add</Button>
      </div>
      <EmptyState
        emoji="🛒"
        title="Your list is empty"
        description="Tap + Add to start building your shopping list"
      />
    </div>
  );
}
