import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Settings,
  UserCheck,
  Calendar,
  BarChart3,
  FileText,
  LogOut,
  Home,
  Target,
  Zap,
  TrendingUp,
  Package,
  Mail,
  ClipboardList,
  Briefcase,
  HardHat,
  Shield,
  Activity,
  Bell
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

// CRM Navigation items for different roles
const getNavigationItems = (role: string | null) => {
  const crmItems = [
    { title: "Dashboard", url: "/user-dashboard", icon: LayoutDashboard },
    { title: "Contacts", url: "/contacts", icon: Users },
    // { title: "Sales Pipeline", url: "/sales-pipeline", icon: TrendingUp },
    { title: "Staff Management", url: "/staff-management", icon: Users },
    
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Calendar", url: "/calendar", icon: Calendar },
  ];

  const serviceItems = [
    { title: "My Assets", url: "/my-assets", icon: Package },
    { title: "My Requests", url: "/my-requests", icon: ClipboardList },
    { title: "Service Request", url: "/service-request", icon: Wrench },
    { title: "Job Requests", url: "/job-requests", icon: Briefcase },
  ];

  const inventoryItems = [
    { title: "Inventory", url: "/inventory", icon: Package },
  ];

  const adminItems = [
    { title: "User Management", url: "/user-management", icon: Users },
    { title: "Activity Log", url: "/activity", icon: Activity },
    { title: "Notifications", url: "/notifications", icon: Bell },
  ];

  switch (role) {
    case "admin":
      return [
        ...crmItems,
        ...inventoryItems,
        ...adminItems,
      ];
    case "ceo":
    case "manager":
      return [
        { title: "Executive Dashboard", url: "/executive-dashboard", icon: BarChart3 },
        ...crmItems.filter(item => item.title !== "Dashboard"),
        ...inventoryItems,
        { title: "Activity Log", url: "/activity", icon: Activity },
        { title: "Notifications", url: "/notifications", icon: Bell },
      ];
    case "technician":
      return [
        { title: "Technician Dashboard", url: "/technician-dashboard", icon: HardHat },
        { title: "Job Requests", url: "/job-requests", icon: Briefcase },
        { title: "Calendar", url: "/calendar", icon: Calendar },
        { title: "Activity Log", url: "/activity", icon: Activity },
      ];
    case "sales":
      return [
        ...crmItems.filter(item => item.title !== "Staff Management"),
        ...serviceItems.filter(item => item.title === "Service Request" || item.title === "My Requests"),
        ...inventoryItems,
        { title: "Activity Log", url: "/activity", icon: Activity },
      ];
    case "user":
    default:
      return [
        { title: "Dashboard", url: "/user-dashboard", icon: LayoutDashboard },
        { title: "My Assets", url: "/my-assets", icon: Package },
        { title: "My Requests", url: "/my-requests", icon: ClipboardList },
        { title: "Service Request", url: "/service-request", icon: Wrench },
        { title: "Notifications", url: "/notifications", icon: Bell },
      ];
  }
};

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const currentPath = location.pathname;

  const [navigationItems, setNavigationItems] = useState(getNavigationItems(null));

  useEffect(() => {
    if (!roleLoading && role) {
      setNavigationItems(getNavigationItems(role));
    }
  }, [role, roleLoading]);

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (roleLoading) {
    return (
      <Sidebar className="animate-fade-in">
        <SidebarContent>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar 
      className={`transition-all duration-300 bg-gradient-to-b from-card to-card/80 border-r border-border/40 ${
        state === "collapsed" ? "w-30" : "w-64"
      }`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border/40 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center space-x-3 px-3 py-4">
          <div className="flex-shrink-0">
            <Wrench className="h-8 w-8 text-primary animate-pulse-glow" />
          </div>
          {state !== "collapsed" && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-gradient">acrms</h2>
              <p className="text-xs text-muted-foreground">Abelov CRMS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={`py-4 ${state === "collapsed" ? "px-2" : "px-3"}`}>
        <SidebarGroup>
          {state !== "collapsed" && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-2">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={`
                      rounded-lg transition-all duration-200 group
                      ${isActive(item.url) 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                        : 'hover:bg-muted/60 hover:text-foreground border border-transparent'
                      }
                      ${state === "collapsed" ? 'justify-center p-2 mx-1' : 'px-3 py-2.5'}
                    `}
                  >
                    <Link to={item.url} className="flex items-center w-full">
                      <item.icon 
                        className={`
                          flex-shrink-0 transition-all duration-200
                          ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                          ${state === "collapsed" ? 'h-5 w-5' : 'h-4 w-4 mr-3'}
                        `} 
                      />
                      {state !== "collapsed" && (
                        <span className="text-sm font-medium truncate">{item.title}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-gradient-to-r from-muted/30 to-muted/10">
        {user && (
          <div className="p-3">
            {state !== "collapsed" ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSignOut}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}