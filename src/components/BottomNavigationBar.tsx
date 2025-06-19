
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Droplet, Pill, Camera, CalendarDays, BarChart3, User, Settings, BellRing, MoreHorizontal } from 'lucide-react';
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

  // Itens principais diretamente visíveis
  const mainNavItems: NavItemDef[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/log/glucose', label: 'Glicemia', icon: Droplet },
    { href: '/meal-analysis', label: 'Refeição', icon: Camera },
    { href: '/calendar', label: 'Calendário', icon: CalendarDays },
    // Perfil será o último item visível ou o primeiro no "Mais" se houver muitos itens principais.
    // Por ora, deixaremos 4 itens principais + "Mais" para testar. Se preferir 5 + Mais, podemos ajustar.
  ];

  // Itens que irão para o Popover "Mais"
  const secondaryNavItems: NavItemDef[] = [
    { href: '/profile', label: 'Perfil', icon: User }, // Movido para cá para testar 4+1
    { href: '/log/insulin', label: 'Insulina', icon: Pill },
    { href: '/reminders', label: 'Lembretes', icon: BellRing },
    { href: '/insights', label: 'Insights IA', icon: BarChart3 },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ];

  const allNavItemsForPopover = [...mainNavItems, ...secondaryNavItems];
  const visibleMainItemsCount = 4; // Quantos itens principais mostrar antes do "Mais"
  const directVisibleItems = allNavItemsForPopover.slice(0, visibleMainItemsCount);
  const popoverItems = allNavItemsForPopover.slice(visibleMainItemsCount);


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

        {/* Botão "Mais" com Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col items-center justify-center text-center p-1 rounded-md w-1/5 group h-full',
                 // Lógica de ativo para o botão "Mais" se algum item dentro dele estiver ativo
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
      </div>
    </nav>
  );
}
