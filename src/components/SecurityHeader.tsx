import { Shield, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SecurityHeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
  onMenuClick?: () => void;
}

const SecurityHeader = ({ isLoggedIn = true, onLogout, onMenuClick }: SecurityHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}
          >
            <div className="relative">
              <Shield className="w-8 h-8 text-primary animate-glow-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-wider text-gradient">
                AXIOM JAVELI
              </span>
              <span className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">
                Proactive • Precise • Protected
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn && (
            <>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm text-accent">Systems Active</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default SecurityHeader;
