import { NavLink } from 'react-router-dom';
import { ShoppingCart, ShoppingBagOpen, BookOpen, User } from 'phosphor-react';

const tabs = [
  { to: '/',        icon: ShoppingCart,    label: 'Lists',   end: true  },
  { to: '/pantry',  icon: ShoppingBagOpen, label: 'Pantry',  end: false },
  { to: '/recipes', icon: BookOpen,        label: 'Recipes', end: false },
  { to: '/profile', icon: User,            label: 'Profile', end: false },
] as const;

export default function TabBar() {
  return (
    <nav className="flex-shrink-0 bg-neutral-50 pb-safe border-t border-neutral-100">
      <div className="mx-3 my-2 flex bg-neutral-0 rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 py-3',
                'active:scale-95 transition-all duration-150',
                isActive ? 'text-green-600' : 'text-neutral-400',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-x-1.5 inset-y-1 rounded-xl bg-green-50" />
                )}
                <Icon size={22} weight={isActive ? 'fill' : 'regular'} className="relative z-10" />
                <span className="relative z-10 text-[11px] font-medium font-sans">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
