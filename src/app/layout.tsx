
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar"; // SidebarProvider includes TooltipProvider

export const metadata: Metadata = {
  title: 'GlicemiaAI',
  description: 'Aplicativo de Acompanhamento Glicêmico com Inteligência Artificial',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getInitialColorMode() {
                  const persistedColorPreference = window.localStorage.getItem('glicemiaai-theme');
                  const hasPersistedPreference = typeof persistedColorPreference === 'string';
                  if (hasPersistedPreference) {
                    return persistedColorPreference;
                  }
                  const mql = window.matchMedia('(prefers-color-scheme: dark)');
                  const hasMediaQueryPreference = typeof mql.matches === 'boolean';
                  if (hasMediaQueryPreference) {
                    return mql.matches ? 'dark' : 'light';
                  }
                  return 'light'; // default to light
                }
                const colorMode = getInitialColorMode();
                if (colorMode === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          {children}
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
