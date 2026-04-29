import { useState, useEffect } from 'react';
import { Copy, UserPlus } from 'phosphor-react';
import { Button, BottomSheet } from '../components/ui';
import { useToast } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { usePantry } from '../hooks/usePantry';
import { supabase } from '../lib/supabase';
import { randomUUID } from '../lib/uuid';
import type { Profile } from '../types';

type Friend = Profile & { pantry_member_id?: string };

export default function ProfilePage() {
  const { user, email, signOut } = useAuthStore();
  const { pantry } = usePantry();
  const toast = useToast();
  const [signingOut, setSigningOut] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);

  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [friendIdInput, setFriendIdInput] = useState('');
  const [foundProfile, setFoundProfile] = useState<Profile | null>(null);
  const [friendNotFound, setFriendNotFound] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);

  const initial = user?.display_name?.charAt(0).toUpperCase() ?? 'U';

  useEffect(() => {
    if (!pantry?.id || !user) return;
    supabase
      .from('pantry_members')
      .select('user_id, profile:profiles!user_id(id, display_name, avatar_url)')
      .eq('pantry_id', pantry.id)
      .neq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setFriends(
            (data as unknown as Array<{ profile: Profile | Profile[] }>)
              .map(row => Array.isArray(row.profile) ? row.profile[0] : row.profile)
              .filter((p): p is Profile => !!p)
          );
        }
      });
  }, [pantry?.id, user?.id]);

  const handleCopyId = async () => {
    if (!user) return;
    await navigator.clipboard.writeText(user.id);
    toast('ID copied to clipboard', 'success');
  };

  const handleLookupFriend = async () => {
    const raw = friendIdInput.trim();
    if (!raw) return;
    setLookingUp(true);
    setFoundProfile(null);
    setFriendNotFound(false);
    const isShort = /^ID-/i.test(raw);
    console.log('[ProfilePage] search input:', raw, '| isShort:', isShort);
    let profile: Profile | null = null;
    if (isShort) {
      const prefix = raw.slice(3).toLowerCase().slice(0, 6);
      console.log('[ProfilePage] calling find_user_by_short_id, p_prefix:', prefix);
      const { data, error } = await supabase.rpc('find_user_by_short_id', { p_prefix: prefix });
      console.log('[ProfilePage] find_user_by_short_id response:', data, error ?? 'ok');
      profile = (Array.isArray(data) ? data[0] : data) as Profile | null;
    } else {
      console.log('[ProfilePage] calling find_user_by_id, p_user_id:', raw);
      const { data, error } = await supabase.rpc('find_user_by_id', { p_user_id: raw });
      console.log('[ProfilePage] find_user_by_id response:', data, error ?? 'ok');
      profile = data as Profile | null;
    }
    setLookingUp(false);
    if (profile) setFoundProfile(profile);
    else setFriendNotFound(true);
  };

  const handleAddFriend = async () => {
    if (!foundProfile || !pantry) return;
    setAddingFriend(true);
    const { error } = await supabase.from('pantry_members').insert({
      id: randomUUID(),
      pantry_id: pantry.id,
      user_id: foundProfile.id,
      role: 'editor',
    });
    setAddingFriend(false);
    if (error) {
      toast(error.message, 'error');
    } else {
      toast(`${foundProfile.display_name} added`, 'success');
      setFriends(prev => [...prev, foundProfile]);
      closeAddFriend();
    }
  };

  const closeAddFriend = () => {
    setAddFriendOpen(false);
    setFriendIdInput('');
    setFoundProfile(null);
    setFriendNotFound(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="flex flex-col h-full pt-safe">
      {/* Header */}
      <div className="flex items-center h-[56px] px-4 border-b border-neutral-100 flex-shrink-0 bg-white">
        <h1 className="text-2xl font-semibold text-neutral-900 font-display">Profile</h1>
      </div>

      <div className="scroll-area">
        <div className="px-4 py-6 flex flex-col gap-6">

          {/* Avatar + name + email */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-green-600 font-display">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-neutral-900 truncate">{user?.display_name}</p>
              <p className="text-sm text-neutral-500 truncate">{email}</p>
            </div>
          </div>

          {/* My ID */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">My ID</p>
            <button
              type="button"
              onClick={handleCopyId}
              className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-md active:bg-neutral-50 transition-colors"
            >
              <span className="flex-1 text-base font-mono font-semibold text-neutral-900 text-left tracking-wider">
                ID-{user?.id.slice(0, 6).toUpperCase()}
              </span>
              <Copy size={18} weight="regular" className="text-neutral-400 flex-shrink-0" />
            </button>
            <p className="text-xs text-neutral-400 font-sans px-1">Share this ID · tap to copy full ID</p>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Friends */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 font-sans">Friends</p>
              <button
                type="button"
                onClick={() => setAddFriendOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-500 active:scale-95 active:bg-neutral-100 transition-all"
                aria-label="Add friend"
              >
                <UserPlus size={18} weight="regular" />
              </button>
            </div>

            {friends.length === 0 ? (
              <p className="text-sm text-neutral-400 font-sans text-center py-4">
                No friends yet. Share your ID to get started.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {friends.map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-neutral-100 rounded-md">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-green-600 font-sans">
                        {f.display_name?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <p className="flex-1 text-sm font-semibold text-neutral-900 font-sans truncate">{f.display_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-100" />

          {/* Sign out */}
          <Button variant="secondary" fullWidth loading={signingOut} onClick={handleSignOut}>
            Sign Out
          </Button>

        </div>
      </div>

      {/* Add friend sheet */}
      <BottomSheet isOpen={addFriendOpen} onClose={closeAddFriend} title="Add Friend">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={friendIdInput}
              onChange={e => { setFriendIdInput(e.target.value); setFoundProfile(null); setFriendNotFound(false); }}
              onKeyDown={e => { if (e.key === 'Enter') handleLookupFriend(); }}
              placeholder="Paste friend's ID"
              style={{ fontSize: '16px' }}
              className="flex-1 h-[44px] px-4 border border-neutral-200 rounded-md bg-neutral-0 text-sm font-sans text-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-neutral-400"
            />
            <Button size="md" variant="secondary" loading={lookingUp} onClick={handleLookupFriend}>
              Find
            </Button>
          </div>

          {friendNotFound && (
            <p className="text-sm text-red-500 font-sans">User not found</p>
          )}

          {foundProfile && (
            <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-md">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-green-600 font-sans">
                  {foundProfile.display_name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <p className="flex-1 text-sm font-semibold text-neutral-900 font-sans">{foundProfile.display_name}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" size="md" fullWidth onClick={closeAddFriend}>Cancel</Button>
            <Button size="md" fullWidth disabled={!foundProfile} loading={addingFriend} onClick={handleAddFriend}>
              Add Friend
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
