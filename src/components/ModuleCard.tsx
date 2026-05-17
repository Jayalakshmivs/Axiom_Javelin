import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  status: "active" | "warning" | "danger" | "inactive";
  statusText: string;
  route: string;
  stats?: { label: string; value: string | number }[];
  delay?: number;
}

const ModuleCard = ({
  title,
  description,
  icon,
  status,
  statusText,
  route,
  stats,
  delay = 0,
}: ModuleCardProps) => {
  const navigate = useNavigate();

  const statusStyles = {
    active: "status-active",
    warning: "status-warning",
    danger: "status-danger",
    inactive: "bg-muted/20 text-muted-foreground border border-muted/30",
  };

  const glowStyles = {
    active: "hover:shadow-[0_0_30px_hsl(var(--accent)/0.3)]",
    warning: "hover:shadow-[0_0_30px_hsl(var(--warning)/0.3)]",
    danger: "hover:shadow-[0_0_30px_hsl(var(--destructive)/0.3)]",
    inactive: "hover:shadow-[0_0_30px_hsl(var(--muted)/0.3)]",
  };

  return (
    <div
      className={`glass-card p-6 cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:border-primary/50 ${glowStyles[status]} animate-fade-in-up opacity-0`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
      onClick={() => navigate(route)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
          <div className="flex items-center gap-2">
            {status === "active" && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {statusText}
          </div>
        </div>
      </div>

      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-secondary/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold text-primary">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center text-primary text-sm font-medium group">
        <span>Access Module</span>
        <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};

export default ModuleCard;
