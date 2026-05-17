import { useState, useRef, useEffect } from "react";
import { Scan, Upload, RefreshCw, AlertTriangle, CheckCircle, Smartphone, ArrowLeft, Image as ImageIcon, BarChart4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanProgress from "@/components/ScanProgress";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { playAlertSound, playSuccessSound } from "@/utils/soundUtils";
import { deepfakeApi, DeepfakeResult } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface DeepfakeModuleProps {
    navigateTo?: (view: string) => void;
}

const DeepfakeModule = ({ navigateTo }: DeepfakeModuleProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [result, setResult] = useState<DeepfakeResult | null>(null);
    const [showPermissionDialog, setShowPermissionDialog] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);
    const [stats, setStats] = useState({ scansToday: 0, accuracy: 98.7 });
    const [history, setHistory] = useState<any[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const loadData = async () => {
            if (user?.email) {
                try {
                    const [sData, hData] = await Promise.all([
                        deepfakeApi.getStats(user.email),
                        deepfakeApi.getScanHistory(user.email)
                    ]);
                    setStats(sData as any);
                    setHistory(hData);
                } catch (e) {
                    console.error("Failed to load deepfake data:", e);
                }
            }
        };
        loadData();
    }, [user]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            handleFileSelection(droppedFile);
        } else {
            toast({
                title: "Invalid File",
                description: "Please upload a valid image (JPG, PNG).",
                variant: "destructive",
            });
        }
    };

    const handleFileSelection = (selectedFile: File) => {
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        setResult(null);
        setScanProgress(0);
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0]);
        }
    };

    const initiateScan = () => {
        setShowPermissionDialog(true);
    };

    const confirmScan = async () => {
        if (!file) return;
        
        setShowPermissionDialog(false);
        setIsScanning(true);
        setScanProgress(0);

        // Slow progress for visual feedback while waiting for API
        const progressInterval = setInterval(() => {
            setScanProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(progressInterval);
                    return 95;
                }
                return prev + 2;
            });
        }, 100);

        // Safety timeout (35 seconds) to ensure the UI doesn't hang if Axios fails to timeout
        const safetyTimeout = setTimeout(() => {
            clearInterval(progressInterval);
            setIsScanning(false);
            setScanProgress(0);
            toast({ 
                title: "ANALYSIS DELAY", 
                description: "The neural scan is taking longer than expected. Please check your network connection.", 
                variant: "destructive" 
            });
        }, 35000);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("consent", consentGiven.toString());
            
            const apiResult = await deepfakeApi.scanMedia(formData, user?.email || undefined);
            
            clearTimeout(safetyTimeout);
            clearInterval(progressInterval);
            setScanProgress(100);
            
            // Artificial delay to show 100% progress
            setTimeout(() => {
                setIsScanning(false);
                setResult(apiResult);
                
                if (apiResult.result === "Modified") {
                    playAlertSound();
                    toast({ 
                        title: "MODIFICATION DETECTED", 
                        description: "Image appears to be cropped, edited, or spliced.", 
                        variant: "destructive" 
                    });
                } else if (apiResult.result === "AI Generated") {
                    playAlertSound();
                    toast({ 
                        title: "SUSPICIOUS MEDIA", 
                        description: "Anomalies detected in media structure.", 
                        variant: "default" 
                    });
                } else {
                    playSuccessSound();
                    toast({ 
                        title: "VERIFICATION COMPLETE", 
                        description: "Media appears authentic.", 
                        variant: "default" 
                    });
                }
            }, 500);

        } catch (error: any) {
            clearTimeout(safetyTimeout);
            console.error("Deepfake Scan Error:", error);
            clearInterval(progressInterval);
            setIsScanning(false);
            setScanProgress(0);
            
            const errorMessage = error.response?.data?.detail || error.message || "Could not connect to deepfake detection server.";
            
            toast({
                title: "Analysis Failed",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const resetScanner = () => {
        setFile(null);
        setPreviewUrl(null);
        setResult(null);
        setScanProgress(0);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Permission Dialog */}
            <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
                <DialogContent className="bg-card border-primary/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary font-display">
                            <Scan className="w-5 h-5" />
                            Analysis Authorization
                        </DialogTitle>
                        <DialogDescription>
                            Initiate Deep Convolutional Neural Network scan?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/10 p-4 rounded-md text-xs font-mono text-muted-foreground">
                        <p>MODEL: EFFICIENTNET-B0-MODIFIED</p>
                        <p>PRECISION: FP32</p>
                        <p>TARGET: MULTILAYER FORENSIC ANOMALIES</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
                        <input 
                            type="checkbox" 
                            id="consent" 
                            checked={consentGiven} 
                            onChange={(e) => setConsentGiven(e.target.checked)}
                            className="w-4 h-4 rounded border-primary/50 text-primary bg-background focus:ring-primary focus:ring-offset-background"
                        />
                        <label htmlFor="consent" className="text-sm text-muted-foreground cursor-pointer">
                            I consent to securely store this image for caching and research purposes.
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowPermissionDialog(false)}>Cancel</Button>
                        <Button variant="cyber" onClick={confirmScan}>Authorize & Scan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                {navigateTo && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 border-primary/20 hover:bg-primary/10"
                        onClick={() => navigateTo('overview')}
                    >
                        <ArrowLeft className="w-5 h-5 text-primary" />
                    </Button>
                )}
                <div className="cyber-panel p-6 rounded-2xl bg-gradient-to-r from-background to-secondary/5 flex-1 border-l-4 border-l-secondary">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                            <Scan className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-white tracking-wide text-glow">
                                DEEPFAKE DETECTOR
                            </h1>
                            <p className="text-muted-foreground mt-1 text-xs font-mono">
                                NEURAL MEDIA FORENSICS
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Area */}
                <div className="space-y-6">
                    <div
                        className={`cyber-panel border-2 border-dashed rounded-xl p-8 transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center text-center
              ${file ? "border-primary/50 bg-primary/5" : "border-primary/20 hover:border-primary/40 hover:bg-primary/5"}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {previewUrl ? (
                            <div className="relative w-full h-full flex flex-col items-center">
                                <img
                                    src={previewUrl}
                                    alt="Scan Target"
                                    className={`max-h-[250px] object-contain rounded-md border border-border shadow-md mb-4 ${isScanning ? "animate-pulse brightness-50" : ""}`}
                                />
                                {isScanning && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Scan className="w-16 h-16 text-primary animate-pulse" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="pointer-events-none">
                                <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">
                                    Upload Media
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                    Supports JPG, PNG (Max 50MB)
                                </p>
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={onFileInputChange}
                        />

                        {!file && (
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Select File
                            </Button>
                        )}

                        {file && !isScanning && !result && (
                            <div className="flex gap-4 mt-4">
                                <Button variant="outline" onClick={resetScanner}>Clear</Button>
                                <Button variant="cyber" onClick={initiateScan}>Start Analysis</Button>
                            </div>
                        )}
                    </div>

                    {isScanning && (
                        <ScanProgress
                            progress={scanProgress}
                            status="scanning"
                            label="analyzing_frame_topology..."
                        />
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/10 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Scans Today</p>
                            <p className="text-2xl font-mono font-bold text-secondary">{stats.scansToday || "0"}</p>
                        </div>
                        <div className="p-4 bg-accent/5 rounded-xl border border-accent/10 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Detection Accuracy</p>
                            <p className="text-2xl font-mono font-bold text-accent">{stats.accuracy || "98.7"}%</p>
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="space-y-6">
                    {result ? (
                        <div className={`cyber-panel p-6 rounded-xl border-l-4 ${result.result === "Modified" ? "border-l-destructive" : result.result === "AI Generated" ? "border-l-yellow-500" : "border-l-accent"} animate-fade-in-up`}>
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold font-display text-white mb-1">
                                        ANALYSIS REPORT
                                    </h3>
                                    <p className="text-xs font-mono text-muted-foreground">
                                        THREAT LEVEL: {result.riskLevel.toUpperCase()}
                                    </p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                    result.result === "Modified" 
                                        ? "bg-destructive/10 text-destructive border-destructive/20" 
                                        : result.result === "AI Generated"
                                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                            : "bg-accent/10 text-accent border-accent/20"
                                }`}>
                                    {result.result.toUpperCase()}
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Integrity Score</span>
                                    <span className={`text-2xl font-mono font-bold ${
                                        result.result === "Modified" ? "text-destructive" : result.result === "AI Generated" ? "text-yellow-500" : "text-accent"
                                    }`}>{result.overallConfidence.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${
                                            result.result === "Modified" ? "bg-destructive" : result.result === "AI Generated" ? "bg-yellow-500" : "bg-accent"
                                        }`}
                                        style={{ width: `${result.overallConfidence}%` }}
                                    />
                                </div>
                            </div>

                            {/* Detailed Metrics */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {[
                                    { label: "Accuracy", value: result.accuracy },
                                    { label: "Precision", value: result.precision },
                                    { label: "Recall", value: result.recall },
                                    { label: "F1 Score", value: result.f1Score }
                                ].map((metric) => (
                                    <div key={metric.label} className="bg-black/20 p-3 rounded border border-white/5">
                                        <p className="text-[10px] text-muted-foreground uppercase mb-1 font-mono">{metric.label}</p>
                                        <p className="text-lg font-bold text-white font-mono">{metric.value.toFixed(1)}%</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6 mb-8">
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                        <BarChart4 className="w-4 h-4 text-primary" />
                                        Forensic Indicators
                                    </h4>
                                    <div className="space-y-2">
                                        {result.detectionDetails.map((detail, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs font-mono text-muted-foreground bg-black/20 p-2 rounded border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    {detail.confidence > 50 ? <AlertTriangle className="w-3 h-3 text-destructive" /> : <CheckCircle className="w-3 h-3 text-accent" />}
                                                    <span>{detail.category}</span>
                                                </div>
                                                <span className={detail.confidence > 50 ? "text-destructive" : "text-accent"}>
                                                    {detail.confidence.toFixed(0)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-2">Findings</h4>
                                    <ul className="space-y-1">
                                        {result.reasons.map((reason, i) => (
                                            <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                <span className="text-primary">•</span>
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-2">Recommended Actions</h4>
                                    <div className="space-y-2">
                                        {result.preventionSteps?.map((action, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                <span className="text-primary mt-0.5">•</span>
                                                {action}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button onClick={resetScanner} variant="outline" className="w-full">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                New Analysis
                            </Button>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-primary/10 rounded-xl opacity-50">
                            <ImageIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground">Awaiting Input</h3>
                            <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
                                Upload media to begin neural forensics.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeepfakeModule;
