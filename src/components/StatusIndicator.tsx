import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "active" | "warning" | "danger" | "inactive";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const StatusIndicator = ({ 
  status, 
  size = "md", 
  pulse = true,
  className 
}: StatusIndicatorProps) => {
  const sizeStyles = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const colorStyles = {
    active: "bg-accent",
    warning: "bg-warning",
    danger: "bg-destructive",
    inactive: "bg-muted-foreground",
  };

  const glowStyles = {
    active: "shadow-[0_0_10px_hsl(var(--accent))]",
    warning: "shadow-[0_0_10px_hsl(var(--warning))]",
    danger: "shadow-[0_0_10px_hsl(var(--destructive))]",
    inactive: "",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <span
        className={cn(
          "rounded-full",
          sizeStyles[size],
          colorStyles[status],
          glowStyles[status],
          pulse && status !== "inactive" && "animate-pulse"
        )}
      />
      {pulse && status !== "inactive" && (
        <span
          className={cn(
            "absolute rounded-full opacity-50",
            sizeStyles[size],
            colorStyles[status],
            "animate-ping"
          )}
        />
      )}
    </div>
  );
};

export default StatusIndicator;
