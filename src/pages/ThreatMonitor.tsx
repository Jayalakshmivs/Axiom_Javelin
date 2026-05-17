import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Server,
  Zap,
  Globe,
  Wifi,
  Filter,
  ArrowLeft,
  Download,
  Bell
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/contexts/SimulationContext";
import { playAlertSound } from "@/utils/soundUtils";

const ThreatMonitor = () => {
  const { activeThreats, systemLoad, networkTraffic, isSimulationActive, toggleSimulation } = useSimulation();
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");

  const [events, setEvents] = useState<{ id: string, time: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' }[]>([
    { id: '1', time: '10:05:22', message: 'System integrity verified', severity: 'low' },
    { id: '2', time: '10:06:15', message: 'Anomalous traffic from 192.168.1.45', severity: 'medium' },
    { id: '3', time: '10:07:01', message: 'DDoS mitigation active on eth1', severity: 'high' }
  ]);
  
  const [trafficData, setTrafficData] = useState([
    { time: '00:00', inbound: 400, outbound: 240, threats: 2 },
    { time: '04:00', inbound: 300, outbound: 139, threats: 5 },
    { time: '08:00', inbound: 980, outbound: 800, threats: 12 },
    { time: '12:00', inbound: 780, outbound: 600, threats: 8 },
    { time: '16:00', inbound: 890, outbound: 700, threats: 15 },
    { time: '20:00', inbound: 670, outbound: 500, threats: 10 },
    { time: '23:59', inbound: 450, outbound: 300, threats: 4 },
  ]);

  // Generate data based on selected range
  useEffect(() => {
    const generateDataset = () => {
      const data = [];
      const now = new Date();
      let count = 0;
      let intervalMin = 0;
      
      if (selectedTimeRange === '1h') {
        count = 12; // Every 5 mins
        intervalMin = 5;
      } else if (selectedTimeRange === '24h') {
        count = 24; // Every hour
        intervalMin = 60;
      } else {
        count = 7; // Every day
        intervalMin = 1440;
      }
      
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - (i * intervalMin * 60000));
        let timeStr = "";
        if (selectedTimeRange === '1h') timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        else if (selectedTimeRange === '24h') timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        else timeStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        data.push({
          time: timeStr,
          inbound: Math.floor(Math.random() * 800) + 200,
          outbound: Math.floor(Math.random() * 500) + 100,
          threats: Math.floor(Math.random() * 10)
        });
      }
      setTrafficData(data);
    };
    
    generateDataset();
  }, [selectedTimeRange]);

  // Simulate live data updates
  useEffect(() => {
    // Force active for demo purposes if needed, otherwise respect context
    if (!isSimulationActive) return;

    const interval = setInterval(() => {
      setTrafficData(prev => {
        const newData = [...prev];
        // Keep window size consistent
        if (newData.length > 20) newData.shift();

        const lastData = newData[newData.length - 1];
        const newTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

        // Calculate dynamic values with organic variation
        const baseInbound = 500 + (Math.sin(Date.now() / 1000) * 200); // Sine wave for natural flow
        const baseOutbound = 300 + (Math.cos(Date.now() / 1500) * 150);

        const randomFluctuation = () => (Math.random() - 0.5) * 150;

        const newInbound = Math.max(50, baseInbound + randomFluctuation() + (networkTraffic * 2));
        const newOutbound = Math.max(50, baseOutbound + randomFluctuation() + (networkTraffic * 1.5));

        const newThreats = activeThreats.filter(t => t.status === 'active').length + Math.floor(Math.random() * 2);

        // Play sound if threats spike significantly
        if (newThreats > lastData.threats + 2) {
          playAlertSound();
        }

        newData.push({
          time: newTime,
          inbound: Math.round(newInbound),
          outbound: Math.round(newOutbound),
          threats: newThreats
        });
        return newData;
      });
    }, 1000); // Faster 1s updates for "Live" feel

    return () => clearInterval(interval);
  }, [isSimulationActive, networkTraffic, activeThreats]);

  // Live notifications Simulation
  useEffect(() => {
    if (!isSimulationActive) return;
    
    const messages = [
      "Suspicious API call from unknown source",
      "Kernel module integrity check hash mismatch",
      "SSL handshake failure on port 443",
      "Brute force attempt blocked from 45.2.1.99",
      "New device connected to subnet C",
      "Outbound encrypted traffic burst detected"
    ];
    
    const interval = setInterval(() => {
      const newMessage = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString([], { hour12: false }),
        message: messages[Math.floor(Math.random() * messages.length)],
        severity: (['medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 3)]
      };
      
      setEvents(prev => [newMessage, ...prev].slice(0, 15));
      
      if (newMessage.severity === 'high' || newMessage.severity === 'critical') {
        playAlertSound();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isSimulationActive]);

  const exportToCSV = () => {
    const headers = ["Time", "Inbound (Mbps)", "Outbound (Mbps)", "Active Threats"];
    const rows = trafficData.map(d => [d.time, d.inbound, d.outbound, d.threats]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `axiom_traffic_logs_${selectedTimeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attackVectors = [
    { name: 'SQL Injection', count: 45 + activeThreats.filter(t => t.type === 'sql_injection').length, severity: 'high' },
    { name: 'XSS', count: 82, severity: 'medium' },
    { name: 'DDoS', count: 24 + activeThreats.filter(t => t.type === 'ddos').length, severity: 'critical' },
    { name: 'Brute Force', count: 156, severity: 'low' },
    { name: 'Phishing', count: 93 + activeThreats.filter(t => t.type === 'phishing').length, severity: 'high' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-white/10 hover:bg-white/5 hover:text-primary"
              onClick={() => window.location.href = '/dashboard'}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display text-white tracking-widest uppercase">Global Threat Monitor</h1>
              <p className="text-muted-foreground font-mono text-xs">LIVE NETWORK TELEMETRY & ATTACK VECTORS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card border border-border">
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulationActive ? 'bg-destructive' : 'bg-muted'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulationActive ? 'bg-destructive' : 'bg-muted'}`}></span>
              </span>
              <span className="text-xs font-mono font-bold text-foreground">{isSimulationActive ? "LIVE FEED" : "PAUSED"}</span>
            </div>

            <Button variant="outline" size="sm" onClick={toggleSimulation} className={isSimulationActive ? "text-destructive border-destructive/30 hover:bg-destructive/10" : "text-accent border-accent/30 hover:bg-accent/10"}>
              {isSimulationActive ? "PAUSE FEED" : "RESUME FEED"}
            </Button>
            
            <Button variant="cyber" size="sm" onClick={exportToCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              EXPORT LOGS
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Connections", value: "1,284", icon: Wifi, color: "text-primary" },
            { label: "Threats Blocked", value: (482 + activeThreats.length).toString(), icon: Shield, color: "text-accent" },
            { label: "Bandwidth Usage", value: `${Math.round(networkTraffic)} MB/s`, icon: Activity, color: "text-secondary" },
            { label: "System Load", value: `${Math.round(systemLoad)}%`, icon: Server, color: "text-warning" },
          ].map((stat, i) => (
            <div key={i} className="cyber-panel p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl font-mono font-bold text-foreground">{stat.value}</p>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color} opacity-80`} />
            </div>
          ))}
        </div>

        {/* Main Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Traffic Graph */}
          <div className="lg:col-span-2 cyber-panel p-6 rounded-lg min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Network Traffic Analysis
              </h3>
              <div className="flex gap-2">
                {["1h", "24h", "7d"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`textxs font-mono px-3 py-1 rounded transition-colors ${selectedTimeRange === range
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-white/5"
                      }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickMargin={10}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickMargin={10}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    label={{ value: 'Mbps', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: '10px' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area
                    type="monotone"
                    dataKey="inbound"
                    name="Inbound Traffic"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInbound)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    name="Outbound Traffic"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOutbound)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attack Vectors Bar Chart */}
          <div className="cyber-panel p-6 rounded-lg flex flex-col">
            <h3 className="font-display font-semibold text-lg mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Top Attack Vectors
            </h3>
            <div className="flex-1 w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attackVectors} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.2} horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Incidents"
                    fill="hsl(var(--destructive))"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Live Security Events / Notifications */}
        <div className="cyber-panel p-6 rounded-lg animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              Live Security Events
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">AUTOSCROLL ACTIVE</span>
          </div>
          
          <div className="space-y-3 max-h-[250px] overflow-y-auto section-scrollbar pr-2">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-muted-foreground opacity-60 w-16">{event.time}</span>
                  <div className={cn(
                    "w-1 h-6 rounded-full group-hover:animate-pulse",
                    event.severity === 'critical' ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
                    event.severity === 'high' ? "bg-warning" :
                    event.severity === 'medium' ? "bg-primary" : "bg-accent"
                  )} />
                  <p className="text-sm font-medium tracking-wide">{event.message}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold",
                  event.severity === 'critical' ? "bg-destructive/20 text-destructive border border-destructive/30" :
                  event.severity === 'high' ? "bg-warning/20 text-warning border border-warning/30" :
                  event.severity === 'medium' ? "bg-primary/20 text-primary border border-primary/30" : 
                  "bg-accent/20 text-accent border border-accent/30"
                )}>
                  {event.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ThreatMonitor;
