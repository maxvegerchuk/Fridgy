import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Trash } from 'phosphor-react';
import { Button, BottomSheet, Skeleton } from '../components/ui';
import { useShoppingLists } from '../hooks/useShoppingList';
import type { ListSummary } from '../hooks/useShoppingList';

function memberColor(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) - h + uid.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360}, 60%, 55%)`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ListPage() {
  const navigate = useNavigate();
  const { myLists, sharedLists, loading, createList, deleteList } = useShoppingLists();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('Shopping List');
  const [creating, setCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = (id: string) => {
    pressTimerRef.current = setTimeout(() => setConfirmDeleteId(id), 500);
  };

  const cancelPress = () => {
    if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const id = await createList(newName.trim());
    setCreating(false);
    setCreateOpen(false);
    setNewName('Shopping List');
    if (id) navigate(`/list/${id}`);
  };

  const isEmpty = !loading && myLists.length === 0 && sharedLists.length === 0;

  return (
    <div className="flex flex-col h-full pt-safe">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 flex-shrink-0">
        <h1 className="text-xl font-semibold text-neutral-900 font-display">Shopping Lists</h1>
        <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} weight="bold" className="mr-1" />
          New List
        </Button>
      </div>

      <div className="scroll-area">
        {loading && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[76px] rounded-xl" />)}
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
            <ShoppingCart size={56} weight="light" className="text-neutral-300" />
            <p className="text-base font-semibold text-neutral-900 font-sans">No lists yet</p>
            <p className="text-sm text-neutral-400 font-sans leading-relaxed">
              Create your first shopping list to get started.
            </p>
            <Button size="md" onClick={() => setCreateOpen(true)}>New List</Button>
          </div>
        )}

        {!loading && !isEmpty && (
          <div className="pb-4">
            {myLists.length > 0 && (
              <ListSection title="My Lists">
                {myLists.map(list => (
                  <ListCard
                    key={list.id}
                    list={list}
                    isDeleteMode={confirmDeleteId === list.id}
                    onTap={() => {
                      if (confirmDeleteId === list.id) { setConfirmDeleteId(null); return; }
                      navigate(`/list/${list.id}`);
                    }}
                    onPressStart={() => startPress(list.id)}
                    onPressEnd={cancelPress}
                    onDelete={() => { deleteList(list.id); setConfirmDeleteId(null); }}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                  />
                ))}
              </ListSection>
            )}

            {sharedLists.length > 0 && (
              <ListSection title="Shared with Me">
                {sharedLists.map(list => (
                  <ListCard
                    key={list.id}
                    list={list}
                    isDeleteMode={false}
                    onTap={() => navigate(`/list/${list.id}`)}
                    onPressStart={() => {}}
                    onPressEnd={() => {}}
                    onDelete={() => {}}
                    onCancelDelete={() => {}}
                  />
                ))}
              </ListSection>
            )}
          </div>
        )}
      </div>

      {/* New List sheet */}
      <BottomSheet
        isOpen={createOpen}
        onClose={() => { setCreateOpen(false); setNewName('Shopping List'); }}
        title="New Shopping List"
      >
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onFocus={e => e.target.select()}
            placeholder="List name"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            className="w-full h-[44px] px-4 border border-neutral-200 rounded-lg bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
          />
          <Button size="lg" fullWidth loading={creating} onClick={handleCreate}>
            Create List
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function ListSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 pt-5 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">
          {title}
        </span>
      </div>
      <div className="flex flex-col gap-2 px-4">
        {children}
      </div>
    </div>
  );
}

type CardProps = {
  list: ListSummary;
  isDeleteMode: boolean;
  onTap: () => void;
  onPressStart: () => void;
  onPressEnd: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
};

function ListCard({ list, isDeleteMode, onTap, onPressStart, onPressEnd, onDelete, onCancelDelete }: CardProps) {
  const ownerMember = list.members.find(m => m.role === 'owner');

  if (isDeleteMode) {
    return (
      <div className="flex items-center justify-between h-[72px] px-4 bg-red-50 rounded-xl border border-red-200">
        <p className="text-sm font-medium text-red-700 font-sans flex-1 truncate pr-3">
          Delete "{list.name}"?
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onCancelDelete}
            className="h-[36px] px-3 text-sm font-medium text-neutral-600 font-sans rounded-lg active:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-[36px] px-3 text-sm font-medium text-white font-sans bg-red-500 rounded-lg active:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerDown={onPressStart}
      onPointerUp={onPressEnd}
      onPointerLeave={onPressEnd}
      onPointerCancel={onPressEnd}
    >
      <button
        type="button"
        onClick={onTap}
        className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-0 rounded-xl border border-neutral-100 active:scale-95 active:bg-neutral-50 transition-all text-left"
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <ShoppingCart size={20} weight="regular" className="text-green-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 font-sans truncate">{list.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-neutral-400 font-sans">
              {list.item_count} item{list.item_count !== 1 ? 's' : ''}
            </span>
            {list.role === 'editor' && ownerMember && (
              <>
                <span className="text-neutral-300 text-xs">·</span>
                <span className="text-xs text-neutral-400 font-sans">
                  by {ownerMember.display_name ?? 'Unknown'}
                </span>
              </>
            )}
            <span className="text-neutral-300 text-xs">·</span>
            <span className="text-xs text-neutral-400 font-sans">{formatDate(list.created_at)}</span>
          </div>
        </div>

        {/* Member avatars (only when >1 member) */}
        {list.members.length > 1 && (
          <div className="flex items-center flex-shrink-0">
            {list.members.slice(0, 3).map((m, i) => (
              <div
                key={m.user_id}
                style={{ backgroundColor: memberColor(m.user_id), zIndex: 3 - i }}
                className="relative -ml-2 first:ml-0 w-7 h-7 rounded-full border-2 border-neutral-0 flex items-center justify-center text-white text-[10px] font-semibold font-sans flex-shrink-0"
              >
                {m.display_name ? m.display_name[0].toUpperCase() : '?'}
              </div>
            ))}
            {list.members.length > 3 && (
              <div className="relative -ml-2 w-7 h-7 rounded-full border-2 border-neutral-0 bg-neutral-200 flex items-center justify-center text-neutral-500 text-[10px] font-semibold font-sans flex-shrink-0">
                +{list.members.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Long-press hint for owners */}
        {list.role === 'owner' && (
          <Trash size={15} className="text-neutral-200 flex-shrink-0 ml-1" />
        )}
      </button>
    </div>
  );
}
