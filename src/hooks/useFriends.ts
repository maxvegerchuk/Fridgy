export { useFriendsStore, type Friend } from '../store/friendsStore';

// Thin compatibility shim — consumers can also import useFriendsStore directly.
import { useFriendsStore } from '../store/friendsStore';

export function useFriends() {
  const { friends, loading, fetchFriends, addFriend, removeFriend } = useFriendsStore();
  return { friends, loading, addFriend, removeFriend, refetch: fetchFriends };
}
