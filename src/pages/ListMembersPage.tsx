import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash, UserPlus } from 'phosphor-react';
import { BottomSheet, Skeleton } from '../components/ui';
import { useToast } from '../components/ui';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import { useFriends } from '../hooks/useFriends';
import { useAuthStore } from '../store/authStore';

type Member = {
  user_id: string;
  display_name: string | null;
  role: 'owner' | 'editor';
};

type RawProfile = { display_name: string | null };
type RawMember = { user_id: string; role: string; profile: RawProfile | RawProfile[] };

export default function ListMembersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuthStore(s => s.user);
  const { friends } = useFriends();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const memberUserIds = new Set(members.map(m => m.user_id));
  const isOwner = members.find(m => m.user_id === user?.id)?.role === 'owner';
  const availableFriends = friends.filter(f => !memberUserIds.has(f.id));

  const fetchMembers = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('list_members')
        .select('user_id, role, profile:profiles!user_id(display_name)')
        .eq('list_id', id);

      const raw = (data ?? []) as unknown as RawMember[];
      setMembers(raw.map(m => {
        const p = Array.isArray(m.profile) ? m.profile[0] : m.profile;
        return {
          user_id: m.user_id,
          display_name: p?.display_name ?? null,
          role: m.role as 'owner' | 'editor',
        };
      }));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRemove = async (userId: string) => {
    if (!id) return;
    const prev = [...members];
    setMembers(m => m.filter(x => x.user_id !== userId));
    const { error } = await supabase
      .from('list_members')
      .delete()
      .eq('list_id', id)
      .eq('user_id', userId);
    if (error) {
      toast(error.message, 'error');
      setMembers(prev);
    }
  };

  const handleAddFriend = async (friendId: string, friendName: string | null) => {
    if (!id) return;
    setAdding(friendId);
    const { error } = await supabase.from('list_members').insert({
      id: randomUUID(),
      list_id: id,
      user_id: friendId,
      role: 'editor',
    });
    setAdding(null);
    if (error) {
      toast(error.message, 'error');
    } else {
      setMembers(prev => [...prev, { user_id: friendId, display_name: friendName, role: 'editor' }]);
      toast(`${friendName ?? 'User'} added`, 'success');
    }
  };

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
        <h1 className="ml-3 flex-1 min-w-0 text-h3 font-heading text-neutral-900">Members</h1>
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
                canRemove={isOwner && member.role !== 'owner'}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add member sheet */}
      <BottomSheet isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Member">
        <div className="flex flex-col gap-2">
          {availableFriends.length === 0 ? (
            <p className="text-body-sm text-neutral-400 text-center py-8 font-sans">
              {friends.length === 0
                ? 'Add friends in your Profile first'
                : 'All friends are already members'}
            </p>
          ) : (
            availableFriends.map(f => (
              <button
                key={f.id}
                type="button"
                disabled={adding === f.id}
                onClick={() => handleAddFriend(f.id, f.display_name)}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-md active:bg-neutral-50 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-body-sm font-bold text-green-700 font-sans">
                    {f.display_name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <p className="flex-1 text-body-sm font-semibold text-neutral-900 font-sans text-left truncate">
                  {f.display_name}
                </p>
                {adding === f.id && (
                  <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      </BottomSheet>
    </div>
  );
}

type MemberRowProps = {
  member: Member;
  canRemove: boolean;
  onRemove: (userId: string) => void;
};

function MemberRow({ member, canRemove, onRemove }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 px-4">
      <div className="flex-1 min-w-0 py-4">
        <p className="text-body-sm font-semibold text-neutral-900 font-sans truncate">
          {member.display_name ?? 'Unknown'}
        </p>
        <p className="text-badge text-neutral-400 font-sans mt-0.5">
          {member.role === 'owner' ? 'Owner' : 'Editor'}
        </p>
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(member.user_id)}
          className="w-10 h-10 flex items-center justify-center rounded-md text-neutral-400 active:scale-95 active:text-red-700 active:bg-red-50 transition-all flex-shrink-0"
          aria-label="Remove member"
        >
          <Trash size={20} weight="regular" />
        </button>
      )}
    </div>
  );
}
