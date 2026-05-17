import { cn } from "@/lib/utils";

interface ScanProgressProps {
  progress: number;
  status?: "scanning" | "complete" | "error";
  label?: string;
  className?: string;
}

const ScanProgress = ({ 
  progress, 
  status = "scanning", 
  label,
  className 
}: ScanProgressProps) => {
  const progressColor = {
    scanning: "from-primary to-accent",
    complete: "from-accent to-accent",
    error: "from-destructive to-destructive",
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm font-medium text-primary">{progress}%</span>
        </div>
      )}
      <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-300",
            progressColor[status],
            status === "scanning" && "animate-shimmer bg-[length:200%_100%]"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ScanProgress;
