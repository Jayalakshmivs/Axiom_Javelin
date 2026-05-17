import { useState, useEffect } from "react";
import {
    ShieldCheck,
    Lock,
    FileText,
    RefreshCw,
    AlertOctagon,
    Database,
    Unlock,
    Activity,
    Key,
    CheckCircle,
    ArrowLeft,
    Copy,
    Check,
    Play,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/contexts/SimulationContext";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { playAlertSound, playSuccessSound } from "@/utils/soundUtils";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { ransomwareApi } from "@/services/api";

interface RansomwareModuleProps {
    navigateTo?: (view: string) => void;
}

const RansomwareModule = ({ navigateTo }: RansomwareModuleProps) => {
    const { isSimulationActive } = useSimulation();
    const [activeTab, setActiveTab] = useState<"vault" | "monitor" | "integrity" | "simulator">("vault");

    // Vault State
    const [isVaultLocked, setIsVaultLocked] = useState(true);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [decryptionKey, setDecryptionKey] = useState<string | null>(null);
    const [userKeyInput, setUserKeyInput] = useState("");
    const [generatedKey, setGeneratedKey] = useState("");
    const [hasCopied, setHasCopied] = useState(false);

    const [vaultFiles, setVaultFiles] = useState<{ name: string, size: string, type: string, protected: boolean, lastOpened?: string }[]>([]);
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [accessLog, setAccessLog] = useState<{ time: string, action: string, file: string }[]>([]);
    const [selectedFile, setSelectedFile] = useState<{ name: string, size: string, type: string } | null>(null);

    // Monitor State
    const [monitorData, setMonitorData] = useState<{ time: string, activity: number }[]>([]);
    const [processLog, setProcessLog] = useState<{ id: string, name: string, status: string }[]>([]);

    // Integrity State
    const [isVerifying, setIsVerifying] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<"Verified" | "Verifying" | "Compromised">("Verified");

    const [simulationLog, setSimulationLog] = useState<string[]>([]);
    const [simulationRunning, setSimulationRunning] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const loadVaultData = async () => {
            try {
                if (activeTab === "vault") {
                    const files = await ransomwareApi.vault.getFiles(user?.email || undefined);
                    // Map VaultFile to component's expected structure
                    setVaultFiles(files.map(f => ({
                        name: f.name,
                        size: f.size,
                        type: f.name.split('.').pop() || 'FILE',
                        protected: true,
                        lastOpened: f.date
                    })));
                } else if (activeTab === "monitor") {
                    const threats = await ransomwareApi.monitor.getThreats(user?.email || undefined);
                    setProcessLog(threats.map(t => ({
                        id: t.id,
                        name: t.name,
                        status: t.level
                    })));
                }
            } catch (error) {
                console.error("Failed to load ransomware data:", error);
            }
        };
        loadVaultData();
    }, [activeTab, user]);
    const [simResult, setSimResult] = useState<null | string>(null);

    // Key Generation
    const generateKey = () => {
        const segments = 4;
        const key = Array(segments).fill(0).map(() => Math.random().toString(36).substr(2, 4).toUpperCase()).join('-');
        return `AXIOM-${key}`;
    };

    const handleLock = () => {
        const newKey = generateKey();
        setGeneratedKey(newKey);
        setIsVaultLocked(true);
        setDecryptionKey(newKey);
        playSuccessSound();
        toast({
            title: "VAULT LOCKED",
            description: "New decryption key generated. Save it immediately.",
            variant: "default"
        });
    };

    const handleUnlockRequest = () => {
        setShowAuthDialog(true);
        setUserKeyInput("");
    };

    const confirmUnlock = () => {
        if (userKeyInput === decryptionKey || userKeyInput === "MASTER-OVERRIDE") {
            setShowAuthDialog(false);
            playSuccessSound();
            toast({ title: "ACCESS GRANTED", description: "Decryption successful.", variant: "default" });
            setIsVaultLocked(false);
            setGeneratedKey("");
        } else {
            playAlertSound();
            toast({ title: "DECRYPTION FAILED", description: "Invalid key. Access denied.", variant: "destructive" });
        }
    };

    const copyKey = () => {
        navigator.clipboard.writeText(generatedKey);
        setHasCopied(true);
        toast({ title: "COPIED", description: "Key copied to clipboard. Verify it below.", variant: "default" });
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleFileOpen = (fileName: string) => {
        if (isVaultLocked) {
            playAlertSound();
            toast({ title: "ACCESS DENIED", description: "Vault must be decrypted first.", variant: "destructive" });
            return;
        }
        
        const timestamp = new Date().toLocaleTimeString();
        setAccessLog(prev => [{ time: timestamp, action: "FILE_OPENED", file: fileName }, ...prev].slice(0, 10));
        setVaultFiles(prev => prev.map(f => f.name === fileName ? { ...f, lastOpened: timestamp } : f));
        
        const file = vaultFiles.find(f => f.name === fileName);
        if (file) setSelectedFile(file);
        
        playSuccessSound();
        toast({ title: "FILE ACCESSED", description: `Opened ${fileName}`, variant: "default" });
    };

    // Integrity Check
    const runIntegrityCheck = () => {
        setIsVerifying(true);
        setIntegrityStatus("Verifying");
        setTimeout(() => {
            setIsVerifying(false);
            setIntegrityStatus("Verified");
            playSuccessSound();
            toast({ title: "INTEGRITY CHECK PASSED", description: "All system hashes match baseline.", variant: "default" });
        }, 3000);
    };

    // Monitor Effect
    useEffect(() => {
        if (activeTab === 'monitor') {
            const interval = setInterval(() => {
                setMonitorData(prev => {
                    const newData = [...prev];
                    if (newData.length > 20) newData.shift();
                    newData.push({
                        time: new Date().toLocaleTimeString(),
                        activity: Math.random() * 100
                    });
                    return newData;
                });

                // Update Process Log
                setProcessLog(prev => {
                    const newLog = [...prev];
                    if (newLog.length > 8) newLog.shift();
                    const procNames = ["svchost.exe", "explorer.exe", "chrome.exe", "node.exe", "axiom_guard.exe"];
                    newLog.push({
                        id: Math.floor(Math.random() * 9000 + 1000).toString(),
                        name: procNames[Math.floor(Math.random() * procNames.length)],
                        status: Math.random() > 0.95 ? "Suspicious" : "Normal"
                    });
                    return newLog;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    // Sim Effect
    const runSimulation = () => {
        if (simulationRunning) return;
        setSimulationRunning(true);
        setSimResult(null);
        setSimulationLog(["INITIALIZING SANDBOX ENVIRONMENT...", "LOADING THREAT SIGNATURES..."]);

        const steps = [
            "Attempting to inject payload into memory...",
            "> BEHAVIOR DETECTED: Heap Spraying",
            "Attempting file system traversal (C:/Users/Data)...",
            "> ACCESS DENIED: Axiom Guard File Filter",
            "Attempting registry modification (HKLM/Run)...",
            "> BLOCKED: Unauthorized Registry Write",
            "Isolating generated threat process (PID: 9942)...",
            "Encrypting sandbox artifacts...",
            "Threat contained. Analyzing attack vector...",
            "SIMULATION COMPLETE"
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i >= steps.length) {
                clearInterval(interval);
                setSimulationRunning(false);
                setSimResult("ATTACK BLOCKED SUCCESSFULLY");
                playSuccessSound();
                return;
            }
            const step = steps[i];
            if (step.includes("BLOCKED") || step.includes("DENIED") || step.includes("DETECTED")) playAlertSound();
            setSimulationLog(prev => [...prev, step]);
            i++;
        }, 800);
    };

    const tabs = [
        { id: "vault", label: "Secure Vault", icon: Lock },
        { id: "monitor", label: "Active Monitor", icon: Activity },
        { id: "integrity", label: "Integrity Check", icon: ShieldCheck },
        { id: "simulator", label: "Attack Sim", icon: AlertOctagon },
    ];

    // Initial key on load if locked
    useEffect(() => {
        if (!decryptionKey && isVaultLocked) {
            const initialKey = generateKey();
            setDecryptionKey(initialKey);
            setGeneratedKey(initialKey);
        }
    }, [decryptionKey, isVaultLocked]);

    // Vault Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const newFile = {
                name: file.name,
                size: (file.size / 1024).toFixed(1) + " KB",
                type: file.name.split('.').pop()?.toUpperCase() || "FILE",
                protected: true
            };
            setVaultFiles(prev => [...prev, newFile]);
            toast({ title: "FILE SECURED", description: `${file.name} added to encrypted vault.`, variant: "default" });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogContent className="bg-card border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="text-primary font-display">Decryption Required</DialogTitle>
                        <DialogDescription>
                            Enter the specific decryption key assigned to this vault instance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-muted-foreground">DECRYPTION KEY (AXIOM-XXXX-XXXX...)</label>
                            <Input
                                type="text"
                                placeholder="ENTER KEY"
                                value={userKeyInput}
                                onChange={(e) => setUserKeyInput(e.target.value)}
                                className="bg-black/20 border-primary/20 font-mono text-center tracking-widest uppercase"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAuthDialog(false)}>Cancel</Button>
                        <Button variant="cyber" onClick={confirmUnlock}>Decrypt & Unlock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                {navigateTo && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 border-white/10 hover:bg-white/5"
                        onClick={() => navigateTo('overview')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                )}
                <div className="cyber-panel p-6 rounded-lg bg-gradient-to-r from-background to-accent/5 flex-1 border-l-4 border-l-accent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                            <ShieldCheck className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-white tracking-wide text-glow">
                                RANSOMWARE DEFENSE
                            </h1>
                            <p className="text-muted-foreground mt-1 text-xs font-mono">
                                BEHAVIORAL ANALYSIS & ENCRYPTED STORAGE
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-4 gap-2 bg-muted/10 p-1 rounded-lg border border-primary/20">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center justify-center gap-2 py-2 rounded-md transition-all text-xs font-mono uppercase tracking-wider",
                            activeTab === tab.id
                                ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                {/* VAULT TAB */}
                {activeTab === "vault" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                        <div className="cyber-panel p-8 rounded-lg flex flex-col items-center justify-center text-center border-dashed border-2 border-primary/20 relative overflow-hidden">

                            <div className={`p-6 rounded-full mb-6 transition-all duration-500 ${isVaultLocked ? "bg-accent/10 shadow-[0_0_30px_rgba(34,197,94,0.1)]" : "bg-destructive/10"}`}>
                                {isVaultLocked ? <Lock className="w-16 h-16 text-accent" /> : <Unlock className="w-16 h-16 text-destructive" />}
                            </div>

                            <h3 className="text-xl font-display font-bold text-white mb-2">
                                {isVaultLocked ? "VAULT SECURED" : "VAULT UNLOCKED"}
                            </h3>

                            {isVaultLocked && generatedKey ? (
                                <div className="my-4 w-full max-w-sm space-y-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-2 font-mono uppercase tracking-widest text-center">CURRENT DECRYPTION KEY (CONFIDENTIAL)</p>
                                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-accent/20">
                                            <code className="flex-1 text-xs font-mono text-accent tracking-widest break-all">
                                                {isKeyVisible ? generatedKey : "••••-••••-••••-••••"}
                                            </code>
                                            <div className="flex items-center">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setIsKeyVisible(!isKeyVisible)}>
                                                    {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={copyKey}>
                                                    {hasCopied ? <Check className="w-14 h-14 text-accent" /> : <Copy className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-accent/5 border border-accent/10 rounded-md">
                                        <p className="text-[10px] text-accent/70 font-mono mb-2">VERIFICATION REQUIRED:</p>
                                        <Input
                                            type="text"
                                            placeholder="PASTE KEY TO VALIDATE"
                                            className="h-8 text-[10px] font-mono bg-black/40 border-accent/10 text-center uppercase"
                                            onChange={(e) => {
                                                if (e.target.value === generatedKey) {
                                                    playSuccessSound();
                                                    toast({ title: "KEY VALIDATED", description: "Storage access authorized.", variant: "default" });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground font-mono mb-8 max-w-xs">
                                    {isVaultLocked ? "INITIALIZING SECURE STORAGE..." : "WARNING: FILES ARE CURRENTLY ACCESSIBLE. LOCK TO ENCRYPT."}
                                </p>
                            )}

                            <Button
                                variant={isVaultLocked ? "cyber" : "destructive"}
                                onClick={isVaultLocked ? handleUnlockRequest : handleLock}
                                className="w-full max-w-xs"
                            >
                                {isVaultLocked ? "DECRYPT VAULT" : "ENCRYPT & LOCK"}
                            </Button>
                        </div>

                        <div className="space-y-4 max-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Database className="w-4 h-4 text-primary" />
                                    PROTECTED ASSETS
                                </h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-accent">STATUS: {isVaultLocked ? "SECURE" : "EXPOSED"}</span>
                                    <label htmlFor="vault-upload" className="cursor-pointer bg-primary/20 hover:bg-primary/30 text-primary text-[10px] px-2 py-1 rounded border border-primary/30 flex items-center gap-1 transition-colors">
                                        <FileText className="w-3 h-3" />
                                        ADD FILE
                                    </label>
                                    <input
                                        id="vault-upload"
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {vaultFiles.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 border border-dashed border-white/5 rounded-md opacity-40">
                                        <Database className="w-8 h-8 mb-2" />
                                        <p className="text-xs font-mono">NO FILES UPLOADED</p>
                                    </div>
                                ) : vaultFiles.map((file, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => handleFileOpen(file.name)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-md bg-muted/10 border border-primary/10 group transition-all",
                                            !isVaultLocked && "hover:border-accent/40 hover:bg-accent/5 cursor-pointer"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className={cn("w-8 h-8 transition-colors", isVaultLocked ? "text-muted-foreground" : "text-primary group-hover:text-accent")} />
                                            <div>
                                                <p className={`text-sm font-mono transition-all ${isVaultLocked ? "blur-sm select-none" : "blur-0"}`}>
                                                    {file.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {file.size} • {file.type} {file.lastOpened && `• Last opened: ${file.lastOpened}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isVaultLocked ? (
                                                <Lock className="w-4 h-4 text-accent opacity-50" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Access Log Section */}
                            {!isVaultLocked && accessLog.length > 0 && (
                                <div className="mt-4 p-4 rounded-lg bg-black/40 border border-white/5">
                                    <h5 className="text-[10px] font-mono text-primary mb-3 tracking-widest uppercase flex items-center gap-2">
                                        <Activity className="w-3 h-3" />
                                        LIVE ACCESS TRACK
                                    </h5>
                                    <div className="space-y-2 max-h-[100px] overflow-y-auto section-scrollbar pr-2">
                                        {accessLog.map((log, i) => (
                                            <div key={i} className="flex items-center justify-between text-[10px] font-mono border-b border-white/5 py-1 last:border-0 opacity-80">
                                                <span className="text-muted-foreground">[{log.time}]</span>
                                                <span className="text-accent">{log.action}</span>
                                                <span className="text-white truncate max-w-[100px]">{log.file}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MONITOR TAB */}
                {activeTab === "monitor" && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="cyber-panel p-6 rounded-lg">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monitorData.length > 0 ? monitorData : [{ time: '0', activity: 0 }]}>
                                        <defs>
                                            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                                        />
                                        <Area type="monotone" dataKey="activity" stroke="hsl(var(--accent))" fill="url(#colorActivity)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-xs font-mono text-muted-foreground mt-2">LIVE HEURISTIC ANALYSIS STREAM</p>
                        </div>

                        {/* Process List (Detailed View) */}
                        <div className="cyber-panel p-4 rounded-lg">
                            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                ACTIVE PROCESS MONITOR
                            </h4>
                            <div className="bg-black/30 rounded-md p-2">
                                <table className="w-full text-xs font-mono">
                                    <thead>
                                        <tr className="text-muted-foreground border-b border-white/10">
                                            <th className="text-left py-2">PID</th>
                                            <th className="text-left py-2">PROCESS NAME</th>
                                            <th className="text-right py-2">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processLog.map((proc, i) => (
                                            <tr key={i} className="border-b border-white/5 animate-fade-in">
                                                <td className="py-2 text-muted-foreground">{proc.id}</td>
                                                <td className="py-2 text-foreground">{proc.name}</td>
                                                <td className={`py-2 text-right font-bold ${proc.status === 'Suspicious' ? 'text-destructive' : 'text-accent'}`}>
                                                    {proc.status}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 p-3 bg-primary/5 rounded border border-primary/10 text-xs text-muted-foreground">
                                <p className="font-bold text-primary mb-1">Status Legend:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><span className="text-accent">Normal</span>: Verified process signature matching system whitelist.</li>
                                    <li><span className="text-destructive">Suspicious</span>: Anomalous behavior detected (high CPU/unknown signature). blocked by heuristic engine.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* SIMULATOR TAB */}
                {activeTab === "simulator" && (
                    <div className="cyber-panel p-0 rounded-lg overflow-hidden flex flex-col h-[500px] animate-fade-in-up">
                        <div className="bg-muted/30 p-4 border-b border-primary/20 flex justify-between items-center">
                            <h3 className="font-mono text-sm font-bold flex items-center gap-2">
                                <AlertOctagon className="w-4 h-4 text-destructive" />
                                LIVE ATTACK SIMULATION
                            </h3>
                            <Button size="sm" variant={simulationRunning ? "destructive" : "outline"} onClick={runSimulation} disabled={simulationRunning}>
                                {simulationRunning ? "SIMULATION IN PROGRESS..." : (
                                    <>
                                        <Play className="w-3 h-3 mr-2" />
                                        START ATTACK
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="flex-1 bg-black p-6 font-mono text-sm overflow-y-auto w-full custom-scrollbar">
                            {simulationLog.map((log, i) => (
                                <div key={i} className={`mb-2 animate-slide-in-right ${log.includes("BLOCKED") ? "text-accent font-bold" : log.includes("ERROR") ? "text-accent" : log.includes("SIMULATION") || log.includes("INITIALIZING") ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                    <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                    {log}
                                </div>
                            ))}
                            {simResult && (
                                <div className="mt-8 space-y-4 animate-fade-in-up">
                                    <div className="p-4 border border-accent/50 bg-accent/10 rounded text-center">
                                        <h2 className="text-xl font-bold text-accent mb-2">SIMULATION RESULT</h2>
                                        <p className="text-white text-lg">{simResult}</p>
                                    </div>
                                    <div className="p-4 border border-primary/20 bg-primary/5 rounded">
                                        <h3 className="text-md font-bold text-white mb-2">Analysis</h3>
                                        <p className="text-muted-foreground text-xs mb-2">
                                            The simulated Ransomware variant (WannaCry-Sim) attempted to modify system registries and encrypt user files in the sandbox environment.
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            <strong className="text-accent">Protection Mechanism:</strong> Axiom Guard's Heuristic Engine successfully identified the unauthorized file handling pattern and terminated the process before encryption could occur.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* INTEGRITY TAB */}
                {activeTab === "integrity" && (
                    <div className="cyber-panel p-8 rounded-lg flex flex-col items-center justify-center text-center">
                        {isVerifying ? (
                            <RefreshCw className="w-16 h-16 text-primary animate-spin mb-4" />
                        ) : integrityStatus === "Verified" ? (
                            <CheckCircle className="w-16 h-16 text-accent mb-4" />
                        ) : (
                            <AlertOctagon className="w-16 h-16 text-destructive mb-4" />
                        )}

                        <h3 className="text-xl font-bold text-white mb-2">
                            {isVerifying ? "VERIFYING SYSTEM HASHES..." : `SYSTEM ${integrityStatus.toUpperCase()}`}
                        </h3>
                        <p className="text-muted-foreground mb-8">
                            {isVerifying ? "Comparing current state against immutable blockchain ledger..." : "No unauthorized modifications detected in the last scan."}
                        </p>

                        <Button onClick={runIntegrityCheck} disabled={isVerifying} variant="outline" className="min-w-[200px]">
                            <RefreshCw className={`w-4 h-4 mr-2 ${isVerifying ? "animate-spin" : ""}`} />
                            {isVerifying ? "SCANNING..." : "RUN INTEGRITY CHECK"}
                        </Button>
                    </div>
                )}

                {/* File Preview Dialog */}
                <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
                    <DialogContent className="sm:max-w-md bg-card border-accent/20">
                        <DialogHeader>
                            <DialogTitle className="font-display tracking-widest text-primary flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                {selectedFile?.name.toUpperCase()}
                            </DialogTitle>
                            <DialogDescription className="font-mono text-[10px] text-muted-foreground">
                                SECURE ASSET PREVIEW // ENCRYPTION: AES-256-GCM
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="w-20 h-24 bg-black/40 border border-primary/20 rounded flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                                <Lock className="w-8 h-8 text-primary/40 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-xs font-mono text-white">{selectedFile?.size} • {selectedFile?.type}</p>
                                <p className="text-[10px] font-mono text-muted-foreground italic">Contents decrypted in secure memory buffer</p>
                            </div>
                            <div className="w-full p-4 bg-muted/5 rounded border border-white/5 font-mono text-[9px] text-primary/60 overflow-hidden select-none opacity-50">
                                0x{Array.from({length: 120}).map(() => Math.floor(Math.random() * 16).toString(16)).join("")}
                                <br />
                                0x{Array.from({length: 120}).map(() => Math.floor(Math.random() * 16).toString(16)).join("")}
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)} className="font-mono text-[10px]">
                                CLOSE PREVIEW
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default RansomwareModule;
