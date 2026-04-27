import { useState } from 'react';
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 flex-shrink-0 bg-white">
        <h1 className="text-2xl font-semibold text-neutral-900 font-display">Shopping Lists</h1>
        <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} weight="bold" className="mr-1" />
          New List
        </Button>
      </div>

      <div className="scroll-area">
        {loading && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[88px] rounded-md" />)}
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
                    onTap={() => navigate(`/list/${list.id}`)}
                    onDeleteClick={() => setConfirmDeleteId(list.id)}
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
                    onDeleteClick={() => {}}
                    onDelete={() => {}}
                    onCancelDelete={() => {}}
                  />
                ))}
              </ListSection>
            )}
          </div>
        )}
      </div>

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
            className="w-full h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-base font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
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
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

type CardProps = {
  list: ListSummary;
  isDeleteMode: boolean;
  onTap: () => void;
  onDeleteClick: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
};

function ListCard({ list, isDeleteMode, onTap, onDeleteClick, onDelete, onCancelDelete }: CardProps) {
  const ownerMember = list.members.find(m => m.role === 'owner');

  if (isDeleteMode) {
    return (
      <div className="flex items-center min-h-[88px] px-4 bg-danger-50 border border-danger-400">
        <p className="text-sm font-medium text-danger-600 font-sans flex-1 truncate pr-3">
          Delete "{list.name}"?
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onCancelDelete}
            className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-600 font-sans text-sm active:bg-neutral-100 transition-colors"
            aria-label="Cancel"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-10 h-10 flex items-center justify-center rounded-md bg-danger-600 text-white active:opacity-80 transition-opacity"
            aria-label="Confirm delete"
          >
            <Trash size={18} weight="regular" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center min-h-[88px] px-4 gap-3">
      {/* Tap area */}
      <button
        type="button"
        onClick={onTap}
        className="flex-1 min-w-0 text-left py-3 active:opacity-70 transition-opacity"
      >
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
      </button>

      {/* Member avatars */}
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

      {/* Delete button — owners only */}
      {list.role === 'owner' && (
        <button
          type="button"
          onClick={onDeleteClick}
          className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-danger-600 active:bg-danger-50 transition-all flex-shrink-0"
          aria-label="Delete list"
        >
          <Trash size={20} weight="regular" />
        </button>
      )}
    </div>
  );
}
