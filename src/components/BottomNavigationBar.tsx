
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Droplet, Pill, Camera, CalendarDays, BarChart3, User, Settings, BellRing, MoreHorizontal, Bike, FileText, ClipboardPlus, Calculator, Mic, MessageSquare } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogDialog } from '@/contexts/LogDialogsContext';

interface NavItemDef {
  href?: string;
  type?: 'glucose' | 'insulin' | 'medication' | 'activity' | 'voice';
  label: string;
  icon: LucideIcon;
}

export default function BottomNavigationBar() {
  const pathname = usePathname();
  const { openDialog } = useLogDialog();

  const allNavItems: NavItemDef[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { type: 'glucose', label: 'Glicemia', icon: Droplet },
    { type: 'insulin', label: 'Insulina', icon: Pill },
    { type: 'voice', label: 'Voz', icon: Mic },
    { href: '/chat', label: 'Assistente', icon: MessageSquare },
    { href: '/meal-analysis', label: 'Refeição', icon: Camera },
    { type: 'medication', label: 'Medicamento', icon: ClipboardPlus },
    { type: 'activity', label: 'Atividade', icon: Bike },
    { href: '/calendar', label: 'Calendário', icon: CalendarDays },
    { href: '/reports', label: 'Relatórios', icon: FileText }, 
    { href: '/bolus-calculator', label: 'Calculadora', icon: Calculator },
    { href: '/profile', label: 'Perfil', icon: User },
    { href: '/reminders', label: 'Lembretes', icon: BellRing },
    { href: '/insights', label: 'Insights IA', icon: BarChart3 },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ];

  const directVisibleItems: NavItemDef[] = [
    allNavItems.find(item => item.href === '/dashboard')!,
    allNavItems.find(item => item.href === '/chat')!,
    allNavItems.find(item => item.type === 'voice')!,
    allNavItems.find(item => item.href === '/meal-analysis')!,
  ];
  
  const popoverItems = allNavItems.filter(
    item => !directVisibleItems.some(dItem => dItem.label === item.label)
  ).sort((a, b) => {
    const order = ['/calendar', '/reports', '/bolus-calculator', 'glucose', 'insulin', 'activity', 'medication', '/profile', '/reminders', '/insights', '/settings'];
    const aKey = a.href || a.type;
    const bKey = b.href || b.type;
    return order.indexOf(aKey!) - order.indexOf(bKey!);
  });

  const NavItem = ({ item }: { item: NavItemDef }) => {
    const isActive = item.href ? (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;
    
    const sharedClasses = cn(
      'flex flex-col items-center justify-center text-center p-1 rounded-md w-1/5 group',
      isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary/90',
      'transition-colors duration-150'
    );
    
    // Special styling for the central Voice button
    if (item.type === 'voice') {
      return (
         <button onClick={() => openDialog(item.type!)} className="flex flex-col items-center justify-center text-center -mt-6">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-background transform transition-transform hover:scale-110">
              <item.icon className='h-7 w-7' />
            </div>
            <span className="text-[11px] font-medium text-primary mt-1">{item.label}</span>
        </button>
      )
    }

    if (item.href) {
      return (
        <Link href={item.href} key={item.href} className={sharedClasses}>
          <item.icon className={cn('h-5 w-5 mb-0.5 transition-transform group-hover:scale-110', isActive ? 'text-primary' : '')} />
          <span className="text-[11px] font-medium truncate">{item.label}</span>
        </Link>
      );
    }
    
    return (
      <button onClick={() => openDialog(item.type!)} className={sharedClasses}>
        <item.icon className='h-5 w-5 mb-0.5 transition-transform group-hover:scale-110' />
        <span className="text-[11px] font-medium truncate">{item.label}</span>
      </button>
    );
  };

  const PopoverNavItem = ({ item }: { item: NavItemDef }) => {
     const isActive = item.href ? (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;

      const sharedClasses = cn(
        'flex items-center gap-3 p-2 rounded-md text-sm w-full',
        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-popover-foreground hover:bg-muted/80 hover:text-foreground'
      );

      if (item.href) {
        return (
           <Link href={item.href} key={item.label} className={sharedClasses}>
              <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              <span>{item.label}</span>
            </Link>
        );
      }
      return (
        <button onClick={() => openDialog(item.type!)} className={sharedClasses}>
          <item.icon className='h-5 w-5 text-muted-foreground group-hover:text-foreground' />
          <span>{item.label}</span>
        </button>
      )
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex justify-around items-center h-16">
        {directVisibleItems.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}

        {popoverItems.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'flex flex-col items-center justify-center text-center p-1 rounded-md w-1/5 group h-full',
                  popoverItems.some(pItem => pItem.href && (pathname === pItem.href || pathname.startsWith(pItem.href)))
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary/90',
                  'transition-colors duration-150'
                )}
              >
                <MoreHorizontal className={cn('h-5 w-5 mb-0.5 transition-transform group-hover:scale-110',
                  popoverItems.some(pItem => pItem.href && (pathname === pItem.href || pathname.startsWith(pItem.href))) ? 'text-primary' : ''
                )} />
                <span className="text-[11px] font-medium truncate">Mais</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-56 p-2 mb-2 rounded-xl shadow-xl">
              <div className="space-y-1">
                {popoverItems.map((item) => (
                   <PopoverNavItem key={item.label} item={item} />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </nav>
  );
}
