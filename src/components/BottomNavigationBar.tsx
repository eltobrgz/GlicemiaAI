
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Droplet, Pill, Camera, CalendarDays, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export default function BottomNavigationBar() {
  const pathname = usePathname();

  const bottomNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/log/glucose', label: 'Glicemia', icon: Droplet },
    { href: '/meal-analysis', label: 'Refeição', icon: Camera },
    { href: '/calendar', label: 'Calendário', icon: CalendarDays },
    { href: '/insights', label: 'Insights', icon: BarChart3 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex justify-around items-center h-16">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center text-center p-1 rounded-md w-1/5 group', // w-1/count_of_items
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary/90',
                'transition-colors duration-150'
              )}
            >
              <item.icon className={cn('h-5 w-5 mb-0.5 transition-transform group-hover:scale-110', isActive ? 'text-primary' : '')} />
              <span className="text-[11px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
