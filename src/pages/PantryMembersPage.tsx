import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash, UserPlus, Check } from 'phosphor-react';
import { BottomSheet, Skeleton, Button, Badge } from '../components/ui';
import { useToast } from '../components/ui';
import { supabase } from '../lib/supabase';
import { usePantryMembers } from '../hooks/usePantryMembers';
import { useFriendsStore } from '../store/friendsStore';
import { useAuthStore } from '../store/authStore';
import type { Profile } from '../types';

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
  const [codeInput, setCodeInput] = useState('');
  const [foundProfile, setFoundProfile] = useState<Profile | null>(null);
  const [codeNotFound, setCodeNotFound] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const memberUserIds = new Set(members.map(m => m.user_id));
  const isOwner = members.find(m => m.user_id === user?.id)?.role === 'owner';

  const closeAddSheet = () => {
    setAddOpen(false);
    setSelectedFriendIds(new Set());
    setCodeInput('');
    setFoundProfile(null);
    setCodeNotFound(false);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriendIds(prev => {
      const next = new Set(prev);
      next.has(friendId) ? next.delete(friendId) : next.add(friendId);
      return next;
    });
  };

  const handleLookupCode = async () => {
    const raw = codeInput.trim();
    if (!raw) return;
    setLookingUp(true);
    setFoundProfile(null);
    setCodeNotFound(false);
    const { data } = await supabase.rpc('find_user_by_short_id', { p_prefix: raw });
    const profile = (Array.isArray(data) ? data[0] : data) as Profile | null;
    setLookingUp(false);
    if (!profile || profile.id === user?.id) { setCodeNotFound(true); return; }
    setFoundProfile(profile);
  };

  const foundIsExtra =
    foundProfile !== null &&
    !memberUserIds.has(foundProfile.id) &&
    !selectedFriendIds.has(foundProfile.id);

  const totalSelected = selectedFriendIds.size + (foundIsExtra ? 1 : 0);

  const handleAddSelected = async () => {
    if (!pantryId || totalSelected === 0) return;
    setAddingMembers(true);

    const toAdd = [...selectedFriendIds];
    if (foundIsExtra) toAdd.push(foundProfile!.id);

    let errorMsg: string | null = null;
    for (const uid of toAdd) {
      const err = await addMemberByUserId(uid);
      if (err) { errorMsg = err; break; }
    }

    setAddingMembers(false);
    if (errorMsg) {
      toast(errorMsg, 'error');
    } else {
      await fetchMembers();
      toast(`${toAdd.length} member${toAdd.length !== 1 ? 's' : ''} added`, 'success');
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
    <div className="flex flex-col h-full pt-safe">
      {/* Header */}
      <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 flex-shrink-0 bg-white">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-neutral-800 active:scale-95 transition-transform flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
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
          ) : friends.length === 0 ? (
            <p className="text-body-sm text-neutral-400 text-center py-4 font-sans">
              No friends yet — add them in Profile
            </p>
          ) : (
            friends.map(f => {
              const isMember = memberUserIds.has(f.id);
              const selected = selectedFriendIds.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={isMember}
                  onClick={() => !isMember && toggleFriend(f.id)}
                  className={[
                    'flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-md transition-all',
                    isMember ? 'opacity-50' : 'active:bg-neutral-50 active:scale-[0.99]',
                  ].join(' ')}
                >
                  <div className={[
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    isMember || selected ? 'bg-green-500 border-green-500' : 'bg-white border-neutral-200',
                  ].join(' ')}>
                    {(isMember || selected) && <Check size={12} weight="bold" className="text-white" />}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-body-sm font-bold text-green-700 font-sans">
                      {f.display_name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <p className="flex-1 text-body-sm font-semibold text-neutral-900 font-sans text-left truncate">
                    {f.display_name}
                  </p>
                  {isMember && (
                    <span className="text-badge text-neutral-400 font-sans">Added</span>
                  )}
                </button>
              );
            })
          )}

          {/* Manual code input */}
          <div className="flex gap-2 pt-2 mt-1 border-t border-neutral-100">
            <input
              type="text"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value); setFoundProfile(null); setCodeNotFound(false); }}
              onKeyDown={e => { if (e.key === 'Enter') handleLookupCode(); }}
              placeholder="Enter 6-character code"
              style={{ fontSize: '16px' }}
              className="flex-1 h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-body font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
            />
            <Button
              size="md"
              variant={codeInput.trim() ? 'primary' : 'secondary'}
              disabled={!codeInput.trim()}
              loading={lookingUp}
              onClick={handleLookupCode}
            >
              Find
            </Button>
          </div>

          {codeNotFound && (
            <p className="text-body-sm text-red-500 font-sans">User not found</p>
          )}

          {foundProfile && (() => {
            const isMember = memberUserIds.has(foundProfile.id);
            const alreadySelected = selectedFriendIds.has(foundProfile.id);
            return (
              <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-md">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-body-sm font-bold text-green-700 font-sans">
                    {foundProfile.display_name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <p className="flex-1 text-body-sm font-semibold text-neutral-900 font-sans">{foundProfile.display_name}</p>
                {isMember && <span className="text-badge text-neutral-400 font-sans">Already a member</span>}
                {alreadySelected && !isMember && <span className="text-badge text-neutral-400 font-sans">Selected above</span>}
              </div>
            );
          })()}

          <div className="flex gap-3 pt-1 mt-1 border-t border-neutral-100">
            <Button variant="secondary" size="md" fullWidth onClick={closeAddSheet}>Cancel</Button>
            <Button
              size="md"
              fullWidth
              disabled={totalSelected === 0}
              loading={addingMembers}
              onClick={handleAddSelected}
            >
              {totalSelected > 0 ? `Add (${totalSelected})` : 'Add'}
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
