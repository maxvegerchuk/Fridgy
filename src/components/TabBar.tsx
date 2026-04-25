import { NavLink } from 'react-router-dom';
import { ShoppingCart, ShoppingBagOpen, BookOpen, User } from 'phosphor-react';

const tabs = [
  { to: '/',        icon: ShoppingCart,   label: 'List',    end: true  },
  { to: '/pantry',  icon: ShoppingBagOpen, label: 'Pantry', end: false },
  { to: '/recipes', icon: BookOpen,        label: 'Recipes', end: false },
  { to: '/profile', icon: User,            label: 'Profile', end: false },
] as const;

export default function TabBar() {
  return (
    <nav className="flex border-t border-neutral-200 bg-neutral-0 pb-safe flex-shrink-0">
      {tabs.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px]',
              'active:scale-95 transition-transform',
              isActive ? 'text-green-500' : 'text-neutral-400',
            ].join(' ')
          }
        >
          <Icon size={24} weight="regular" />
          <span className="text-xs font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
