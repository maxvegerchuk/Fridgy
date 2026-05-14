import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, Trash, UserPlus, Check } from 'phosphor-react';
import { BottomSheet, Skeleton, Button, Badge } from '../components/ui';
import { useToast } from '../components/ui';
import { supabase } from '../lib/supabase';
import { usePantryMembers } from '../hooks/usePantryMembers';
import { useFriendsStore } from '../store/friendsStore';
import { useAuthStore } from '../store/authStore';

export default function PantryMembersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore(s => s.user);
  const { friends, initialized, fetchFriends } = useFriendsStore();

  const [pantryId, setPantryId] = useState<string | undefined>(undefined);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!initialized) fetchFriends();
  }, [initialized]);

  useEffect(() => {
    supabase.rpc('my_pantry_id').then(({ data }) => {
      setPantryId((data as string) ?? undefined);
      setResolving(false);
    });
  }, []);

  const { members, loading, fetchMembers, addMemberByUserId, removeMember } = usePantryMembers(pantryId);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
  const [addingMembers, setAddingMembers] = useState(false);

  const memberUserIds = new Set(members.map(m => m.user_id));
  const isOwner = members.find(m => m.user_id === user?.id)?.role === 'owner';
  const availableFriends = friends.filter(f => !memberUserIds.has(f.id));

  const closeAddSheet = () => {
    setAddOpen(false);
    setSelectedFriendIds(new Set());
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds(prev => {
      const next = new Set(prev);
      next.has(friendId) ? next.delete(friendId) : next.add(friendId);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (!pantryId || selectedFriendIds.size === 0) return;
    setAddingMembers(true);

    let errorMsg: string | null = null;
    for (const uid of [...selectedFriendIds]) {
      const err = await addMemberByUserId(uid);
      if (err) { errorMsg = err; break; }
    }

    setAddingMembers(false);
    if (errorMsg) {
      toast(errorMsg, 'error');
    } else {
      await fetchMembers();
      toast(`${selectedFriendIds.size} member${selectedFriendIds.size !== 1 ? 's' : ''} added`, 'success');
      closeAddSheet();
    }
  };

  const handleRemove = async (userId: string, name: string | null) => {
    const err = await removeMember(userId);
    if (err) toast(err, 'error');
    else toast(`${name ?? 'Member'} removed`, 'success');
  };

  if (resolving) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-100" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center h-[56px] px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-neutral-800 active:scale-95 transition-transform flex-shrink-0"
            aria-label="Back"
          >
            <CaretLeft size={24} />
          </button>
          <h1 className="ml-3 flex-1 min-w-0 text-h3 font-heading text-neutral-900">Pantry Members</h1>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-600 active:scale-95 active:bg-neutral-100 transition-all"
            aria-label="Add member"
          >
            <UserPlus size={22} weight="regular" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="scroll-area">
        {loading && (
          <div className="flex flex-col gap-3 px-4 py-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[64px] rounded-md" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="py-2">
            {members.map(member => (
              <MemberRow
                key={member.user_id}
                member={member}
                canRemove={isOwner && member.role !== 'owner' && member.user_id !== user?.id}
                onRemove={() => handleRemove(member.user_id, member.display_name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add member sheet */}
      <BottomSheet isOpen={addOpen} onClose={closeAddSheet} title="Add Member">
        <div className="flex flex-col gap-3">
          {!initialized ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : availableFriends.length === 0 ? (
            <p className="text-body-sm text-neutral-400 text-center py-8 font-sans">
              {friends.length === 0
                ? 'No friends yet — add them in Profile'
                : 'All friends are already members'}
            </p>
          ) : (
            availableFriends.map(f => {
              const selected = selectedFriendIds.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFriend(f.id)}
                  className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-md active:bg-neutral-50 active:scale-[0.99] transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-body-sm font-bold text-green-700 font-sans">
                      {f.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <p className="flex-1 text-body-sm font-semibold text-neutral-900 font-sans text-left truncate">
                    {f.display_name}
                  </p>
                  <div className={[
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    selected ? 'bg-green-500 border-green-500' : 'bg-white border-neutral-200',
                  ].join(' ')}>
                    {selected && <Check size={12} weight="bold" className="text-white" />}
                  </div>
                </button>
              );
            })
          )}
          <div className="flex gap-3 pt-1 mt-1 border-t border-neutral-100">
            <Button variant="secondary" size="md" fullWidth onClick={closeAddSheet}>Cancel</Button>
            <Button
              size="md"
              fullWidth
              disabled={selectedFriendIds.size === 0}
              loading={addingMembers}
              onClick={handleAddSelected}
            >
              {selectedFriendIds.size > 0 ? `Add (${selectedFriendIds.size})` : 'Add'}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

type MemberRowProps = {
  member: { user_id: string; display_name: string | null; role: 'owner' | 'editor' };
  canRemove: boolean;
  onRemove: () => void;
};

function MemberRow({ member, canRemove, onRemove }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <span className="text-body-sm font-bold text-green-700 font-sans">
          {member.display_name?.charAt(0).toUpperCase() ?? '?'}
        </span>
      </div>
      <p className="flex-1 text-body-sm font-semibold text-neutral-900 font-sans truncate">
        {member.display_name ?? 'Unknown'}
      </p>
      {member.role === 'owner' && (
        <Badge variant="green">Owner</Badge>
      )}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-red-700 active:bg-red-50 transition-all flex-shrink-0"
          aria-label="Remove member"
        >
          <Trash size={20} weight="regular" />
        </button>
      )}
    </div>
  );
}
