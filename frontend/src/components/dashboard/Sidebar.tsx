import { Droplets, LayoutDashboard, History, Settings, Waves } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Controls', path: '/controls' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <div className="mb-8 p-2 rounded-xl bg-primary/10">
        <Droplets className="w-6 h-6 text-primary" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'p-3 rounded-xl transition-all duration-200 group relative',
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Water animation indicator */}
      <div className="mt-auto">
        <Waves className="w-5 h-5 text-primary/50 animate-pulse-glow" />
      </div>
    </aside>
  );
};
