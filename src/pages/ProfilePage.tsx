import { User } from 'phosphor-react';
import { EmptyState } from '../components/ui';

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-full pt-safe">
      <div className="px-4 py-3 border-b border-neutral-100">
        <h1 className="text-xl font-semibold text-neutral-900">Profile</h1>
      </div>
      <EmptyState
        icon={<User size={56} weight="light" />}
        title="Sign in to Fridgy"
        description="Auth coming in Phase 1"
      />
    </div>
  );
}
