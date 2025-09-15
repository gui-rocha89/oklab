import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
import logoWhite from "@/assets/logo-white-bg.png";

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

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`relative bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
      isCollapsed ? "w-16" : "w-64"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <img 
            src={logoWhite} 
            alt="OkLab"
            className="h-8 w-auto"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
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
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent group ${
              isActive(item.href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground"
            }`}
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

      {/* User Section */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-sidebar-accent rounded-lg">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                Usuário Admin
              </p>
              <p className="text-xs text-muted-foreground truncate">
                admin@oklab.com
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}