import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui';

export default function ProfilePage() {
  const { user, email, signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const initial = user?.display_name?.charAt(0).toUpperCase() ?? 'U';

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    // ProtectedRoute will redirect to /login once user becomes null
  };

  return (
    <div className="flex flex-col h-full pt-safe">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex-shrink-0">
        <h1 className="text-2xl font-bold text-neutral-900 font-display">Profile</h1>
      </div>

      <div className="scroll-area">
        <div className="px-4 py-6 flex flex-col gap-6">

          {/* Avatar + name + email */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-3xl font-bold italic text-green-600 font-display">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-neutral-900 truncate">
                {user?.display_name}
              </p>
              <p className="text-sm text-neutral-500 truncate">{email}</p>
            </div>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Sign out */}
          <Button
            variant="secondary"
            fullWidth
            loading={signingOut}
            onClick={handleSignOut}
          >
            Sign Out
          </Button>

        </div>
      </div>
    </div>
  );
}
