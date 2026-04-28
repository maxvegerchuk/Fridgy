import { NavLink, useMatch } from 'react-router-dom';
import { ShoppingCart, ShoppingBagOpen, BookOpen, User } from 'phosphor-react';
import type { Icon as PhosphorIcon } from 'phosphor-react';

const tabs: { to: string; icon: PhosphorIcon; label: string; end: boolean }[] = [
  { to: '/',        icon: ShoppingCart,    label: 'List',    end: true  },
  { to: '/pantry',  icon: ShoppingBagOpen, label: 'Pantry',  end: false },
  { to: '/recipes', icon: BookOpen,        label: 'Recipes', end: false },
  { to: '/profile', icon: User,            label: 'Profile', end: false },
];

function TabItem({ to, icon: Icon, label, end }: { to: string; icon: PhosphorIcon; label: string; end: boolean }) {
  const match = useMatch({ path: to, end });
  const isActive = !!match;

  return (
    <NavLink
      to={to}
      end={end}
      className={[
        'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px]',
        'active:scale-95 transition-transform',
        isActive ? 'text-green-500' : 'text-neutral-400',
      ].join(' ')}
    >
      <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
      <span className="text-xs font-medium">{label}</span>
    </NavLink>
  );
}

export default function TabBar() {
  return (
    <nav className="flex border-t border-neutral-200 bg-neutral-0 pb-safe flex-shrink-0">
      {tabs.map(tab => <TabItem key={tab.to} {...tab} />)}
    </nav>
  );
}
