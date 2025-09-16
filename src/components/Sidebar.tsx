import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import {
  BarChart3,
  FileVideo,
  Settings,
  Users,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    title: "Projetos",
    href: "/projetos",
    icon: FileVideo,
  },
  {
    title: "Feedbacks",
    href: "/feedbacks",
    icon: MessageSquare,
  },
  {
    title: "Equipe",
    href: "/equipe",
    icon: Users,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useUser();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`relative bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
      isCollapsed ? "w-20" : "w-64"
    }`}>
      {/* Header */}
      <div className="relative p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-full mb-2">
          {!isCollapsed ? (
            <Logo 
              className="h-20 w-auto transition-all duration-300 hover:scale-105" 
              alt="MANUS I.A"
            />
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Logo 
                className="h-8 w-auto transition-all duration-300 hover:scale-105" 
                alt="MANUS I.A"
              />
              <div className="w-8 h-0.5 bg-primary rounded-full opacity-60"></div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-sidebar-accent transition-colors"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={`flex items-center ${isCollapsed ? 'justify-center px-3 py-3' : 'gap-3 px-3 py-2'} rounded-lg transition-all duration-200 hover:bg-sidebar-accent group ${
              isActive(item.href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground"
            }`}
            title={isCollapsed ? item.title : undefined}
          >
            <item.icon className={`h-5 w-5 ${
              isActive(item.href) ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
            }`} />
            {!isCollapsed && (
              <span className="font-medium">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section - Collapsed Version */}
      {isCollapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
            <span className="text-sm font-medium text-primary-foreground">
              {(user?.user_metadata?.full_name || user?.email)?.charAt(0)?.toUpperCase() || 'G'}
            </span>
          </div>
        </div>
      )}

      {/* User Section */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-sidebar-accent rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {(user?.user_metadata?.full_name || user?.email)?.charAt(0)?.toUpperCase() || 'G'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Gui'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'gui@streamlab.com.br'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}