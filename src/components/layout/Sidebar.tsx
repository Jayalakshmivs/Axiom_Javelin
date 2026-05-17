import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
    LayoutDashboard,
    ShieldAlert,
    Scan,
    Lock,
    Activity,
    ChevronRight,
    Menu,
    X,
    LogOut,
    User as UserIcon,
    ChevronsLeft,
    ChevronsRight
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    isMobileOpen: boolean;
    setIsMobileOpen: (value: boolean) => void;
}

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const currentView = searchParams.get("view") || "overview";

    const { user, logout } = useAuth();

    const menuItems = [
        {
            title: "Mission Control",
            icon: LayoutDashboard,
            path: "/dashboard",
            view: "overview"
        },
        {
            title: "Anti-Phishing",
            icon: ShieldAlert,
            path: "/dashboard?view=phishing",
            view: "phishing"
        },
        {
            title: "Deepfake Scanner",
            icon: Scan,
            path: "/dashboard?view=deepfake",
            view: "deepfake"
        },
        {
            title: "Ransomware Defense",
            icon: Lock,
            path: "/dashboard?view=ransomware",
            view: "ransomware"
        },
        {
            title: "Threat Monitor",
            icon: Activity,
            path: "/threat-monitor",
            view: "monitor"
        },
    ];

    const isActive = (item: any) => {
        if (item.path === "/threat-monitor") {
            return location.pathname === "/threat-monitor";
        }
        return location.pathname === "/dashboard" && currentView === item.view;
    };

    return (
        <>
            {/* Mobile Menu Button - Controlled by Parent now, but we can keep a local trigger if needed, 
          but usually the trigger is in the header or floating. 
          For now, keeping the floating button logic in the layout or here? 
          The floating button was here. Let's keep it here for mobile convenience. */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-md text-primary shadow-lg"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X /> : <Menu />}
            </button>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 bg-card/95 backdrop-blur-xl border-r border-border transition-all duration-300 flex flex-col shadow-2xl",
                isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                isCollapsed ? "w-20" : "w-72"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between h-20">
                    {!isCollapsed && (
                        <div className="animate-fade-in">
                            <h1 className="text-2xl font-display font-bold text-white tracking-wider flex items-center gap-2">
                                <span className="text-primary">AXIOM</span>
                                GUARD
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">
                                Enterprise Security
                            </p>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="w-full flex justify-center animate-fade-in">
                            <ShieldAlert className="w-8 h-8 text-primary" />
                        </div>
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:flex text-muted-foreground hover:text-white transition-colors"
                    >
                        {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto section-scrollbar">
                    {menuItems.map((item) => (
                        <Link
                            key={item.title}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                isActive(item)
                                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive(item) && "text-primary animate-pulse")} />

                            {!isCollapsed && (
                                <span className="font-medium tracking-wide flex-1">{item.title}</span>
                            )}

                            {!isCollapsed && isActive(item) && (
                                <ChevronRight className="w-4 h-4 opacity-50" />
                            )}

                            {isActive(item) && (
                                <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    {user ? (
                        <div className={cn("flex items-center gap-3", isCollapsed ? "flex-col justify-center gap-4" : "")}>
                            <Avatar className="w-10 h-10 border-2 border-primary/20 cursor-pointer hover:border-primary transition-colors">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            {!isCollapsed && (
                                <div className="flex-1 overflow-hidden animate-fade-in">
                                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                                </div>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={logout}
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            {!isCollapsed ? (
                                <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10">
                                    LOGIN
                                </Button>
                            ) : (
                                <UserIcon className="w-5 h-5 text-muted-foreground mx-auto" />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
