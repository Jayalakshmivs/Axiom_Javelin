import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Terminal, ArrowLeft, Globe, Lock, AlertOctagon, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanProgress from "@/components/ScanProgress";
import { toast } from "@/hooks/use-toast";
import { playAlertSound, playSuccessSound } from "@/utils/soundUtils";
import { phishingApi, PhishingScanResult } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface PhishingModuleProps {
    navigateTo?: (view: string) => void;
}

const PhishingModule = ({ navigateTo }: PhishingModuleProps) => {
    const [url, setUrl] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [result, setResult] = useState<PhishingScanResult | null>(null);
    const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
    const [history, setHistory] = useState<PhishingScanResult[]>([]);
    const [stats, setStats] = useState({ urlsScanned: 0, threatsBlocked: 0, warnings: 0 });
    const { user } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            if (user?.email) {
                const [hData, sData] = await Promise.all([
                    phishingApi.getScanHistory(user.email),
                    phishingApi.getStats(user.email)
                ]);
                setHistory(hData);
                setStats(sData as any);
            }
        };
        loadData();
    }, [user]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = url.trim();
        if (!trimmedUrl) {
            toast({ title: "INPUT ERROR", description: "Please enter a valid URL.", variant: "destructive" });
            return;
        }

        setIsScanning(true);
        setScanProgress(0);
        setResult(null);

        const progressInterval = setInterval(() => {
            setScanProgress((prev) => {
                if (prev >= 90) { clearInterval(progressInterval); return 90; }
                return prev + 3;
            });
        }, 60);

        // Safety timeout to force "Offline/Timeout" if the promise hangs indefinitely
        const safetyTimeout = setTimeout(() => {
            clearInterval(progressInterval);
            setIsScanning(false);
            setScanProgress(0);
            toast({ 
                title: "NETWORK DELAY", 
                description: "Backend is taking too long. Check if your PC and Phone are on the same WiFi.", 
                variant: "destructive" 
            });
        }, 12000); // 12 seconds (slightly more than axios 10s timeout)

        try {
            const apiResult = await phishingApi.scanUrl(trimmedUrl, user?.email);
            clearTimeout(safetyTimeout);
            setBackendOnline(true);
            clearInterval(progressInterval);
            setScanProgress(100);

            setTimeout(() => {
                setIsScanning(false);
                setResult(apiResult);

                if (apiResult.status === "malicious") {
                    playAlertSound();
                    toast({ title: "🚨 MALICIOUS LINK BLOCKED", description: `Threat confirmed at ${apiResult.confidence}% confidence. Do NOT proceed.`, variant: "destructive" });
                } else if (apiResult.status === "risk") {
                    playAlertSound();
                    toast({ title: "⚠️ SUSPICIOUS URL DETECTED", description: `Risk indicators found. Confidence: ${apiResult.confidence}%`, variant: "destructive" });
                } else {
                    playSuccessSound();
                    toast({ title: "✅ URL VERIFIED SAFE", description: `No phishing indicators detected. Confidence: ${apiResult.confidence}%` });
                }
            }, 300);
        } catch (err) {
            clearTimeout(safetyTimeout);
            clearInterval(progressInterval);
            setBackendOnline(false);
            setIsScanning(false);
            setScanProgress(0);
            toast({ title: "BACKEND OFFLINE", description: "Cannot reach scanning server. Ensure port 8000 is open on your PC.", variant: "destructive" });
        }
    };

    const getStatusColor = (s?: string) => s === "safe" ? "border-l-accent" : s === "risk" ? "border-l-yellow-500" : "border-l-destructive";
    const getStatusBadge = (s?: string) => s === "safe" ? "bg-accent/10 text-accent border-accent/20" : s === "risk" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-destructive/10 text-destructive border-destructive/20";
    const getStatusLabel = (s?: string) => s === "safe" ? "✅ SAFE TO ACCESS" : s === "risk" ? "⚠️ SUSPICIOUS LINK" : "🚨 MALICIOUS — BLOCKED";

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-2">
                {navigateTo && (
                    <Button variant="outline" size="icon" className="w-10 h-10 border-primary/20 hover:bg-primary/10" onClick={() => navigateTo('overview')}>
                        <ArrowLeft className="w-5 h-5 text-primary" />
                    </Button>
                )}
                <div className="cyber-panel p-6 rounded-lg bg-gradient-to-r from-background to-primary/5 flex-1 border-l-4 border-l-primary">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
                                <Shield className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="font-display text-2xl font-bold text-white tracking-wide text-glow">ANTI-PHISHING SHIELD</h1>
                                <p className="text-muted-foreground mt-1 text-xs font-mono">REAL-TIME HEURISTIC URL ANALYSIS ENGINE</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border ${backendOnline === null ? "border-muted/30 text-muted-foreground" : backendOnline ? "border-accent/30 text-accent bg-accent/10" : "border-destructive/30 text-destructive bg-destructive/10"}`}>
                            {backendOnline === null ? <Globe className="w-3 h-3" /> : backendOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {backendOnline === null ? "READY" : backendOnline ? "BACKEND LIVE" : "OFFLINE"}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="cyber-panel p-8 rounded-lg border-t border-primary/20">
                        <form onSubmit={handleScan} className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Terminal className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                </div>
                                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                                    placeholder="ENTER TARGET URL (e.g., https://suspicious-site.xyz)..."
                                    className="block w-full pl-12 pr-4 py-4 bg-background border border-primary/30 rounded-md text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono transition-all overflow-x-auto" />
                            </div>
                            <Button type="submit" disabled={isScanning}
                                className="w-full sm:w-auto sm:min-w-[220px] h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 tracking-wider shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {isScanning ? "🔍 SCANNING THREAT DATABASE..." : "⚡ ANALYZE & BLOCK THREATS"}
                            </Button>
                        </form>

                        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                            {[{ label: "Scanned Today", value: stats.urlsScanned || "0" }, { label: "Threats Blocked", value: stats.threatsBlocked || "0" }, { label: "Avg Analysis", value: "0.4s" }].map((stat, i) => (
                                <div key={i} className="p-4 bg-primary/5 rounded-md border border-primary/10">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                                    <p className="text-xl font-mono font-bold text-primary">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {isScanning && <ScanProgress progress={scanProgress} status="scanning" label="querying_threat_intelligence_database..." />}

                    {result && !isScanning && (
                        <div className={`cyber-panel p-6 rounded-lg border-l-4 ${getStatusColor(result.status)} animate-fade-in-up`}>
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold font-display text-white mb-1">SCAN RESULTS</h3>
                                    <p className="text-xs font-mono text-muted-foreground break-all">TARGET: {url}</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ml-4 ${getStatusBadge(result.status)}`}>
                                    {getStatusLabel(result.status)}
                                </div>
                            </div>

                            <div className="mb-5 p-4 bg-black/20 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">THREAT CONFIDENCE SCORE</span>
                                    <span className={`text-lg font-bold font-mono ${result.status === "safe" ? "text-accent" : result.status === "risk" ? "text-yellow-400" : "text-destructive"}`}>{result.confidence}%</span>
                                </div>
                                <div className="w-full bg-black/30 rounded-full h-2">
                                    <div className={`h-2 rounded-full transition-all duration-700 ${result.status === "safe" ? "bg-accent" : result.status === "risk" ? "bg-yellow-500" : "bg-destructive"}`}
                                        style={{ width: `${result.confidence}%` }} />
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                        {result.status === "safe" ? <CheckCircle className="w-4 h-4 text-accent" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                                        Detection Analysis
                                    </h4>
                                    <div className="space-y-2">
                                        {result.details.split(" | ").map((detail, i) => (
                                            <div key={i} className="flex items-start gap-3 text-sm text-foreground/80 bg-black/20 p-3 rounded">
                                                {result.status === "safe" ? <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                                                {detail}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-primary" />
                                        Prevention & Action Steps
                                    </h4>
                                    <div className="p-3 bg-primary/5 rounded border border-primary/10">
                                        <p className="text-sm text-foreground/80 flex items-start gap-2">
                                            <span className="text-primary mt-0.5">➜</span>
                                            {result.prevention}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="cyber-panel p-6 rounded-lg bg-destructive/5 border-destructive/20">
                        <h3 className="text-sm font-bold text-destructive mb-4 flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4" />
                            RECENTLY BLOCKED
                        </h3>
                        <ul className="space-y-3">
                            {history.filter(h => h.status !== 'safe').slice(0, 5).map((item, i) => (
                                <li key={i} className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0"></span>
                                    <span className="truncate">{item.url}</span>
                                </li>
                            ))}
                            {history.filter(h => h.status !== 'safe').length === 0 && (
                                <li className="text-xs font-mono text-muted-foreground/40 italic">No threats blocked yet.</li>
                            )}
                        </ul>
                    </div>
                    <div className="cyber-panel p-6 rounded-lg bg-primary/5 border-primary/20">
                        <h3 className="text-sm font-bold text-primary mb-3">HOW IT WORKS</h3>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                            {["🔍 Typosquatting detection", "🌐 High-risk TLD analysis", "🔒 HTTPS enforcement check", "🎯 Domain entropy scoring", "✅ Whitelist verification"].map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhishingModule;
