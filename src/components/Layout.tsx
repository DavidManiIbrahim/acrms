import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationCenter } from "./NotificationCenter";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  const { user } = useAuth();

  if (!showSidebar || !user) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-mesh">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 bg-card/50 backdrop-blur-sm border-b border-border/40">
            <SidebarTrigger className="hover:bg-muted/60 rounded-lg p-2 transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1" />
            <NotificationCenter />
            <ProfileDropdown />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default Layout;