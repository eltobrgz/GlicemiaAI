
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { Home, Droplet, Pill, Camera, CalendarDays, BarChart3, User, Settings, BellRing, MoreHorizontal, Bike, FileText, ClipboardPlus, Calculator, Mic, MessageSquare, Menu } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogDialog } from '@/contexts/LogDialogsContext';

interface NavItemDef {
  href?: string;
  type?: 'glucose' | 'insulin' | 'medication' | 'activity' | 'voice' | 'manual_reg' | 'more';
  label: string;
  icon: LucideIcon;
}

export default function BottomNavigationBar() {
  const pathname = usePathname();
  const { openDialog } = useLogDialog();

  const allNavItems: NavItemDef[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/chat', label: 'Assistente', icon: MessageSquare },
    { type: 'voice', label: 'Voz', icon: Mic },
    { type: 'manual_reg', label: 'Registros', icon: Menu },
    { type: 'more', label: 'Mais', icon: MoreHorizontal },
  ];

  const manualRegItems: NavItemDef[] = [
    { type: 'glucose', label: 'Glicemia', icon: Droplet },
    { type: 'insulin', label: 'Insulina', icon: Pill },
    { type: 'medication', label: 'Medicamento', icon: ClipboardPlus },
    { type: 'activity', label: 'Atividade', icon: Bike },
  ];
  
  const popoverItems: NavItemDef[] = [
    { href: '/meal-analysis', label: 'Refeição', icon: Camera },
    { href: 'bolus-calculator', label: 'Calculadora', icon: Calculator },
    { href: '/calendar', label: 'Calendário', icon: CalendarDays },
    { href: '/reports', label: 'Relatórios', icon: FileText },
    { href: '/insights', label: 'Insights IA', icon: BarChart3 },
    { href: '/profile', label: 'Perfil', icon: User },
    { href: '/reminders', label: 'Lembretes', icon: BellRing },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ];

  const NavItem = ({ item }: { item: NavItemDef }) => {
    const isActive = item.href ? (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))) : false;
    
    const sharedClasses = (active: boolean) => cn(
      'flex flex-col items-center justify-center text-center p-1 rounded-md w-full group',
      active ? 'text-primary' : 'text-muted-foreground hover:text-primary/90',
      'transition-colors duration-150'
    );

    // Special styling for the central Voice button
    if (item.type === 'voice') {
      return (
         <button onClick={() => openDialog('voice')} className="flex flex-col items-center justify-center text-center -mt-6">
            <div className={cn(
                "flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg border-4 border-background transform transition-transform hover:scale-110"
            )}>
              <item.icon className='h-7 w-7' />
            </div>
            <span className="text-[11px] font-medium text-primary mt-1">{item.label}</span>
        </button>
      )
    }

    if (item.href) {
      return (
        <Link href={item.href} key={item.href} className={sharedClasses(isActive)}>
          <item.icon className={cn('h-5 w-5 mb-0.5 transition-transform group-hover:scale-110', isActive ? 'text-primary' : '')} />
          <span className="text-[11px] font-medium truncate">{item.label}</span>
        </Link>
      );
    }
    
    // For Popover Triggers
    if (item.type === 'manual_reg' || item.type === 'more') {
      const itemsToDisplay = item.type === 'manual_reg' ? manualRegItems : popoverItems;
      return (
        <Popover>
          <PopoverTrigger asChild>
             <button className={sharedClasses(false)}>
                <item.icon className='h-5 w-5 mb-0.5 transition-transform group-hover:scale-110' />
                <span className="text-[11px] font-medium truncate">{item.label}</span>
              </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 mb-2">
            <div className="grid gap-1">
              {itemsToDisplay.map(popoverItem => (
                <PopoverNavItem key={popoverItem.label} item={popoverItem} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return null; // Should not happen
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
        <button onClick={() => openDialog(item.type! as any)} className={sharedClasses}>
          <item.icon className='h-5 w-5 text-muted-foreground group-hover:text-foreground' />
          <span>{item.label}</span>
        </button>
      )
  }

  // The 5 main items to display directly
  const directVisibleItems = [
    allNavItems.find(i => i.label === 'Dashboard')!,
    allNavItems.find(i => i.label === 'Assistente')!,
    allNavItems.find(i => i.label === 'Voz')!,
    allNavItems.find(i => i.label === 'Registros')!,
    allNavItems.find(i => i.label === 'Mais')!,
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="flex justify-around items-center h-16 px-1">
        
        {directVisibleItems.map((item) => (
          <div key={item.label} className="w-1/5 flex justify-center">
            <NavItem item={item} />
          </div>
        ))}

      </div>
    </nav>
  );
}
