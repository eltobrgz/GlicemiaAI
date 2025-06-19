'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Droplet, Pill, Camera, CalendarDays, BellRing, BarChart3, Settings, Info, LogOut } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/log/glucose', label: 'Registrar Glicemia', icon: Droplet },
  { href: '/log/insulin', label: 'Registrar Insulina', icon: Pill },
  { href: '/meal-analysis', label: 'Analisar Refeição', icon: Camera },
  { href: '/calendar', label: 'Calendário Glicêmico', icon: CalendarDays },
  { href: '/reminders', label: 'Lembretes', icon: BellRing },
  { href: '/insights', label: 'Insights IA', icon: BarChart3 },
];

const bottomNavItems = [
  // { href: '/settings', label: 'Configurações', icon: Settings },
  // { href: '/education', label: 'Educação', icon: Info },
];

export function SideNavigation() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader className="p-4 items-center gap-2">
        <AppLogo className="w-8 h-8" />
        <h2 className="text-xl font-semibold text-primary font-headline group-data-[collapsible=icon]:hidden">
          GlicemiaAI
        </h2>
        <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:hidden" />
      </SidebarHeader>
      
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  className={cn(
                    "justify-start w-full",
                    (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) 
                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                      : "hover:bg-accent/10 hover:text-accent-foreground"
                  )}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {bottomNavItems.length > 0 && (
          <>
            <SidebarMenu>
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="justify-start w-full"
                      tooltip={{ children: item.label, side: 'right', align: 'center' }}
                    >
                      <a>
                        <item.icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <Separator className="my-2" />
          </>
        )}
        {/* Example Logout or Settings button */}
        {/* <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:aspect-square">
          <LogOut className="h-5 w-5" />
          <span className="group-data-[collapsible=icon]:hidden ml-2">Sair</span>
        </Button> */}
      </SidebarFooter>
    </Sidebar>
  );
}
