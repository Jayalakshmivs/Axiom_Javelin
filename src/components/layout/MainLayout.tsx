import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { Bell, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";

interface MainLayoutProps {
    children: ReactNode;
}

const Header = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { user } = useAuth();

    return (
        <header className={`h-20 border-b border-primary/20 bg-background/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-0 md:ml-72'}`}>
            <div className="flex items-center flex-1">
                {/* Search removed as per user request */}
                <div className="hidden md:block">
                    <h2 className="text-lg font-display font-bold text-muted-foreground/50 tracking-widest">
                        SECURE ENVIRONMENT // {new Date().toLocaleDateString()}
                    </h2>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="relative p-2 text-primary/70 hover:text-primary transition-colors focus:outline-none">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-card border-primary/20 p-0 mr-4">
                        <div className="p-4 border-b border-primary/10">
                            <h4 className="font-display font-bold text-md">System Notifications</h4>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-destructive">HIGH PRIORITY</span>
                                        <span className="text-[10px] text-muted-foreground">2m ago</span>
                                    </div>
                                    <p className="text-sm">Unauthorized access attempt blocked from IP 192.168.1.{100 + i}</p>
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex items-center space-x-3 pl-4 border-l border-primary/20">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-foreground uppercase">{user?.name || "COMMANDER"}</p>
                        <p className="text-xs text-primary font-mono">LEVEL 5 ACCESS</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary relative overflow-hidden group hover:border-primary/80 transition-all cursor-pointer">
                        <User size={20} />
                        <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-100 transition-transform rounded-full" />
                    </div>
                </div>
            </div>
        </header>
    );
};

const MainLayout = ({ children }: MainLayoutProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden">
            <div className="scanlines" />

            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            <Header isCollapsed={isCollapsed} />

            <main className={`transition-all duration-300 relative z-10 min-h-[calc(100vh-5rem)] p-6 ${isCollapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-72'}`}>
                <div className="max-w-7xl mx-auto animate-fade-in-up">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
