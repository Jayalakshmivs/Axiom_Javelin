import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight, Lock, Scan, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const features = [
    {
      icon: ShieldAlert,
      title: "Anti-Phishing Shield",
      description: "Real-time protection against fraudulent websites and phishing attacks",
    },
    {
      icon: Scan,
      title: "Deepfake Scanner",
      description: "AI-powered detection for manipulated and synthetic media",
    },
    {
      icon: Lock,
      title: "Anti-Ransomware",
      description: "Secure vault and real-time threat monitoring for your files",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:50px_50px] opacity-20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[150px]" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Logo */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <Shield className="w-24 h-24 text-primary" />
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
            </div>
          </div>
          <h1 className="font-display font-bold text-4xl md:text-6xl text-gradient mb-4">
            AXIOM JAVELIN
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground tracking-[0.3em] uppercase mb-8">
            Proactive • Precise • Protected
          </p>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Advanced security platform powered by AI. Protect yourself from phishing attacks,
            deepfake manipulation, and ransomware threats.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="cyber"
              size="xl"
              onClick={() => navigate("/login")}
              className="animate-fade-in-up animation-delay-100"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button
              variant="glass"
              size="xl"
              onClick={() => navigate("/login")}
              className="animate-fade-in-up animation-delay-200"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mt-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover p-6 text-center animate-fade-in-up"
              style={{ animationDelay: `${300 + index * 100}ms`, animationFillMode: "forwards", opacity: 0 }}
            >
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground relative z-10">
        <p>© 2024 Axiom Javelin. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
