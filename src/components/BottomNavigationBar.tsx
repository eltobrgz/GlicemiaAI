
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Droplet, Pill, Camera, CalendarDays, BarChart3, User, Settings, BellRing, MoreHorizontal, Bike, FileText, ClipboardPlus, Calculator } from 'lucide-react'; // ClipboardPlus Adicionado
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

export default function BottomNavigationBar() {
  const pathname = usePathname();

  const allNavItems: NavItemDef[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/log/glucose', label: 'Glicemia', icon: Droplet },
    { href: '/log/insulin', label: 'Insulina', icon: Pill },
    { href: '/log/medication', label: 'Medicamento', icon: ClipboardPlus },
    { href: '/log/activity', label: 'Atividade', icon: Bike },
    { href: '/meal-analysis', label: 'Refeição', icon: Camera },
    { href: '/calendar', label: 'Calendário', icon: CalendarDays },
    { href: '/reports', label: 'Relatórios', icon: FileText }, 
    { href: '/profile', label: 'Perfil', icon: User },
    { href: '/reminders', label: 'Lembretes', icon: BellRing },
    { href: '/insights', label: 'Insights IA', icon: BarChart3 },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ];

  // Re-prioritizing items for mobile bottom bar
  const directVisibleItems: NavItemDef[] = [
    allNavItems.find(item => item.href === '/dashboard')!,
    allNavItems.find(item => item.href === '/log/glucose')!,
    allNavItems.find(item => item.href === '/log/insulin')!,
    allNavItems.find(item => item.href === '/meal-analysis')!,
  ];
  
  const popoverItems = allNavItems.filter(
    item => !directVisibleItems.some(dItem => dItem.href === item.href)
  ).sort((a, b) => { // Optional: sort popover items for consistency
    const order = ['/calendar', '/reports', '/log/activity', '/log/medication', '/profile', '/reminders', '/insights', '/settings'];
    return order.indexOf(a.href) - order.indexOf(b.href);
  });


  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex justify-around items-center h-16">
        {directVisibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center text-center p-1 rounded-md w-1/5 group',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary/90',
                'transition-colors duration-150'
              )}
            >
              <item.icon className={cn('h-5 w-5 mb-0.5 transition-transform group-hover:scale-110', isActive ? 'text-primary' : '')} />
              <span className="text-[11px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}

        {popoverItems.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'flex flex-col items-center justify-center text-center p-1 rounded-md w-1/5 group h-full',
                  popoverItems.some(pItem => pathname === pItem.href || (pItem.href !== '/dashboard' && pItem.href !== '/' && pathname.startsWith(pItem.href)))
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary/90',
                  'transition-colors duration-150'
                )}
              >
                <MoreHorizontal className={cn('h-5 w-5 mb-0.5 transition-transform group-hover:scale-110',
                  popoverItems.some(pItem => pathname === pItem.href || (pItem.href !== '/dashboard' && pItem.href !== '/' && pathname.startsWith(pItem.href))) ? 'text-primary' : ''
                )} />
                <span className="text-[11px] font-medium truncate">Mais</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-56 p-2 mb-2 rounded-xl shadow-xl">
              <div className="space-y-1">
                {popoverItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      href={item.href}
                      key={item.href}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-md text-sm',
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-popover-foreground hover:bg-muted/80 hover:text-foreground'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </nav>
  );
}
