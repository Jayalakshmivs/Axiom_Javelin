import { useState } from "react";
import { Shield, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic client-side validation
        if (!email || !password) {
            toast({ title: "INPUT ERROR", description: "Email and password are required.", variant: "destructive" });
            return;
        }
        if (password.length < 6) {
            toast({ title: "INPUT ERROR", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }
        if (!isLogin && !name.trim()) {
            toast({ title: "INPUT ERROR", description: "Agent name (codename) is required.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        try {
            let error: string | null = null;

            if (isLogin) {
                error = await login(email, password);
                if (!error) {
                    toast({ title: "ACCESS GRANTED", description: "Welcome back, Commander.", variant: "default" });
                    navigate("/dashboard");
                } else {
                    toast({ title: "ACCESS DENIED", description: error, variant: "destructive" });
                }
            } else {
                error = await signup(email, password, name.trim());
                if (!error) {
                    toast({ title: "ACCOUNT CREATED", description: "Clearance Level 1 Granted.", variant: "default" });
                    navigate("/dashboard");
                } else {
                    toast({ title: "REGISTRATION FAILED", description: error, variant: "destructive" });
                }
            }
        } catch {
            toast({
                title: "CONNECTION ERROR",
                description: "Cannot reach the authentication server. Ensure the backend is running.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
            <div className="scanlines" />

            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[100px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                <div className="cyber-panel p-8 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-white tracking-widest mb-2">AXIOM GUARD</h1>
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                            {isLogin ? "Secure Access Portal" : "New Agent Registration"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground ml-1">CODENAME</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Agent Name"
                                        className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground ml-1">TERMINAL ID (EMAIL)</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="agent@axiom.sec"
                                    className="pl-10 bg-black/20 border-white/10 focus:border-primary/50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground ml-1">ENCRYPTION KEY (PASSWORD)</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 bg-black/20 border-white/10 focus:border-primary/50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-white"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                            disabled={isLoading}
                        >
                            {isLoading ? "AUTHENTICATING..." : (isLogin ? "INITIALIZE SESSION" : "REGISTER_AGENT")}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-muted-foreground">
                            {isLogin ? "New to the force?" : "Already possess clearance?"}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setEmail("");
                                    setPassword("");
                                    setName("");
                                }}
                                className="ml-2 text-primary hover:text-primary/80 font-bold underline decoration-primary/30 underline-offset-4"
                                disabled={isLoading}
                            >
                                {isLogin ? "Request Access" : "Login Here"}
                            </button>
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center opacity-40">
                    <p className="text-[10px] font-mono text-muted-foreground">
                        RESTRICTED ACCESS - UNAUTHORIZED ENTRY IS A FEDERAL OFFENSE
                        <br />
                        SYSTEM VERSION 3.0.1 // SECURE CONNECTION
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
