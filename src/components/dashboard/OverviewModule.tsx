import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, ShieldAlert, Scan, Lock, Activity, AlertTriangle, CheckCircle, Wifi, Globe, Server } from "lucide-react";
import ModuleCard from "@/components/ModuleCard";
import { useSimulation } from "@/contexts/SimulationContext";
import { playAlertSound } from "@/utils/soundUtils";
import { useNavigate } from "react-router-dom";
import { phishingApi, deepfakeApi, ransomwareApi, alertsApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface ModuleStats {
    phishing: { urlsScanned: number; threatsBlocked: number; lastScan: string };
    deepfake: { scansToday: number; accuracy: number; lastScan: string };
    ransomware: { protectedFiles: number; vaultSize: string; threatsBlocked: number };
    monitor: { eventsToday: number; alerts: number; lastEvent: string };
}

const data = [
    { time: '00:00', threats: 2 },
    { time: '04:00', threats: 5 },
    { time: '08:00', threats: 12 },
    { time: '12:00', threats: 8 },
    { time: '16:00', threats: 15 },
    { time: '20:00', threats: 10 },
    { time: '23:59', threats: 4 },
];

interface OverviewModuleProps {
    navigateTo: (view: string) => void;
}

const OverviewModule = ({ navigateTo }: OverviewModuleProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { activeThreats, systemLoad, networkTraffic, isSimulationActive, threatLevel } = useSimulation();
    const [chartData, setChartData] = useState(data);
    const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [alerts, setAlerts] = useState<any[]>([]);
    const [moduleStats, setModuleStats] = useState<ModuleStats>({
        phishing: { urlsScanned: 2847, threatsBlocked: 23, lastScan: "2m ago" },
        deepfake: { scansToday: 15, accuracy: 98.7, lastScan: "5m ago" },
        ransomware: { protectedFiles: 1284, vaultSize: "2.4 GB", threatsBlocked: 12 },
        monitor: { eventsToday: 156, alerts: 3, lastEvent: "1m ago" },
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [pStats, dStats, rStats, mStats, aData] = await Promise.all([
                    phishingApi.getStats(user?.email || undefined) as Promise<any>,
                    deepfakeApi.getStats(user?.email || undefined) as Promise<any>,
                    ransomwareApi.vault.getStorageInfo() as Promise<any>,
                    ransomwareApi.monitor.getStats() as Promise<any>,
                    alertsApi.getAlerts(user?.email || undefined)
                ]);
                setAlerts(aData);

                setModuleStats({
                    phishing: { 
                        urlsScanned: pStats.urlsScanned, 
                        threatsBlocked: pStats.threatsBlocked, 
                        lastScan: pStats.lastScan || "Just now" 
                    },
                    deepfake: { 
                        scansToday: dStats.scansToday, 
                        accuracy: dStats.accuracy, 
                        lastScan: dStats.lastScan 
                    },
                    ransomware: { 
                        protectedFiles: mStats.files_monitored || 1284, 
                        vaultSize: `${rStats.used} ${rStats.unit}`, 
                        threatsBlocked: mStats.threats_blocked || 0 
                    },
                    monitor: { 
                        eventsToday: (mStats.files_monitored || 0) + 156,
                        alerts: activeThreats.length, 
                        lastEvent: mStats.last_scan || "Just now"
                    },
                });
            } catch (err) {
                console.error("Failed to fetch dashboard stats:", err);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [activeThreats.length]);

    useEffect(() => {
        if (isSimulationActive) {
            updateIntervalRef.current = setInterval(() => {
                // Simulate live chart data
                setChartData(prev => {
                    const newData = [...prev];
                    const lastItem = newData[newData.length - 1];
                    const newThreats = Math.max(2, Math.min(20, lastItem.threats + (Math.random() - 0.5) * 5));

                    if (newData.length > 20) newData.shift();
                    newData.push({
                        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                        threats: Math.round(newThreats)
                    });
                    return newData;
                });

                // Update stats based on active threats
                setModuleStats(prev => ({
                    ...prev,
                    monitor: {
                        eventsToday: prev.monitor.eventsToday + (Math.random() > 0.8 ? 1 : 0),
                        alerts: activeThreats.length,
                        lastEvent: "Just now"
                    },
                    phishing: {
                        ...prev.phishing,
                        threatsBlocked: prev.phishing.threatsBlocked + (Math.random() > 0.9 ? 1 : 0)
                    }
                }));

            }, 2000);
        }

        return () => {
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
        };
    }, [isSimulationActive, activeThreats]);

    const modules = [
        {
            title: "Anti-Phishing Shield",
            description: "Real-time protection against phishing URLs and fraudulent websites.",
            icon: <ShieldAlert className="w-5 h-5" />,
            status: "active" as const,
            statusText: "Active Protection",
            route: "phishing",
            stats: [
                { label: "URLs Scanned", value: moduleStats.phishing.urlsScanned.toLocaleString() },
                { label: "Threats Blocked", value: moduleStats.phishing.threatsBlocked.toString() },
            ],
        },
        {
            title: "Deepfake Scanner",
            description: "AI-powered detection for manipulated images using CNN technology.",
            icon: <Scan className="w-5 h-5" />,
            status: "active" as const,
            statusText: "Ready to Scan",
            route: "deepfake",
            stats: [
                { label: "Scans Today", value: moduleStats.deepfake.scansToday.toString() },
                { label: "Accuracy", value: `${moduleStats.deepfake.accuracy.toFixed(1)}%` },
            ],
        },
        {
            title: "Secure Vault",
            description: "Protect your files from ransomware with real-time monitoring.",
            icon: <Lock className="w-5 h-5" />,
            status: "active" as const,
            statusText: "Monitoring",
            route: "ransomware",
            stats: [
                { label: "Protected Files", value: moduleStats.ransomware.protectedFiles.toLocaleString() },
                { label: "Threats Blocked", value: moduleStats.ransomware.threatsBlocked.toString() },
            ],
        },
        {
            title: "Threat Monitor",
            description: "Centralized view of all security events and system health metrics.",
            icon: <Activity className="w-5 h-5" />,
            status: "active" as const,
            statusText: "Online",
            route: "/threat-monitor", // Keep external route
            stats: [
                { label: "Events Today", value: moduleStats.monitor.eventsToday.toString() },
                { label: "Active Alerts", value: moduleStats.monitor.alerts.toString() },
            ],
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Top Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { icon: Shield, label: "System Status", value: "SECURE", color: "text-accent", bg: "bg-accent/10" },
                    { icon: Globe, label: "Global Network", value: "ONLINE", color: "text-primary", bg: "bg-primary/10" },
                    { icon: Server, label: "Database", value: "CONNECTED", color: "text-primary", bg: "bg-primary/10" },
                    {
                        icon: Wifi,
                        label: "Threat Level",
                        value: threatLevel.toUpperCase(),
                        color: threatLevel === 'critical' ? 'text-destructive' : threatLevel === 'high' ? 'text-warning' : 'text-accent',
                        bg: threatLevel === 'critical' ? "bg-destructive/10" : "bg-accent/10"
                    }
                ].map((stat, i) => (
                    <div key={i} className="cyber-panel p-4 rounded-lg flex items-center space-x-3">
                        <div className={`p-2 rounded-md ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                            <p className={`text-lg font-display font-bold ${stat.color} leading-none`}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Threat Map */}
                <div className="lg:col-span-2 cyber-panel p-6 rounded-lg min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-display font-bold flex items-center gap-2 text-white">
                                <Activity className="w-5 h-5 text-primary" />
                                Live Threat Activity
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5 font-mono">REAL-TIME DATA STREAM</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulationActive ? 'bg-destructive' : 'bg-muted'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulationActive ? 'bg-destructive' : 'bg-muted'}`}></span>
                            </span>
                            <span className="text-xs text-destructive font-mono font-bold">LIVE RECORDING</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorThreatsOverview" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--primary))' }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="threats"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorThreatsOverview)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Security Feed */}
                <div className="cyber-panel p-6 rounded-lg flex flex-col">
                    <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-warning">
                        <AlertTriangle className="w-5 h-5" />
                        Security Intel
                    </h2>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[300px] section-scrollbar">
                        {alerts.map((alert, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-muted/20 border border-transparent hover:border-primary/20 transition-all animate-slide-in-right">
                                <div className={`p-1.5 rounded-full ${alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                                    alert.severity === 'high' ? 'bg-warning/20 text-warning' :
                                        'bg-primary/20 text-primary'
                                    }`}>
                                    <AlertTriangle size={12} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-foreground leading-none mb-1">{alert.message}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono leading-none">Source: {alert.source} • {alert.timestamp}</p>
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && (
                            <div className="text-center text-muted-foreground text-xs py-10">
                                No active alerts detected.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((module, index) => (
                    <div key={module.title} onClick={() => {
                        if (module.route.startsWith('/')) {
                            navigate(module.route);
                        } else {
                            navigateTo(module.route);
                        }
                    }} className="cursor-pointer">
                        <ModuleCard {...module} delay={index * 100} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OverviewModule;
