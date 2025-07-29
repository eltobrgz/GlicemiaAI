
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Droplet, Pill, Camera, CalendarDays, BellRing, BarChart3, Settings, LogOut, User, Bike, FileText, ClipboardPlus, Calculator } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/log/glucose', label: 'Registrar Glicemia', icon: Droplet },
  { href: '/log/insulin', label: 'Registrar Insulina', icon: Pill },
  { href: '/log/medication', label: 'Registrar Medicamento', icon: ClipboardPlus },
  { href: '/log/activity', label: 'Registrar Atividade', icon: Bike },
  { href: '/meal-analysis', label: 'Analisar Refeição', icon: Camera },
  { href: '/bolus-calculator', label: 'Calculadora de Bolus', icon: Calculator },
  { href: '/calendar', label: 'Calendário', icon: CalendarDays },
  { href: '/reports', label: 'Relatórios', icon: FileText }, 
  { href: '/insights', label: 'Insights IA', icon: BarChart3 },
];

const userNavItems = [
  { href: '/profile', label: 'Meu Perfil', icon: User },
  { href: '/reminders', label: 'Lembretes', icon: BellRing },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function SideNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erro ao Sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout Realizado",
        description: "Você foi desconectado com sucesso.",
      });
      router.replace('/login'); // Use replace for better auth flow
      router.refresh(); 
    }
  };

  const renderMenuItems = (items: typeof navItems) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href))}
          className={cn(
            "justify-start w-full",
            (pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href))) 
              ? "bg-primary/10 text-primary hover:bg-primary/20" 
              : "hover:bg-accent/10 hover:text-accent-foreground"
          )}
          tooltip={{ children: item.label, side: 'right', align: 'center' }}
        >
          <Link href={item.href}>
            <item.icon className="h-5 w-5" />
            <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));
  };


  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader className="p-4 items-center gap-2">
        <AppLogo className="w-8 h-8" />
        <h2 className="text-xl font-semibold text-primary font-headline group-data-[collapsible=icon]:hidden">
          GlicemiaAI
        </h2>
      </SidebarHeader>
      
      <SidebarContent className="flex-grow p-2">
        <SidebarMenu>
          {renderMenuItems(navItems)}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
         <SidebarMenu>
          {renderMenuItems(userNavItems)}
        </SidebarMenu>
        <Separator className="my-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="justify-start w-full hover:bg-destructive/10 hover:text-destructive"
              tooltip={{ children: 'Sair', side: 'right', align: 'center' }}
            >
              <LogOut className="h-5 w-5" />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
