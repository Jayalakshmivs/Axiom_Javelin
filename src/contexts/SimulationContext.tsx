import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface ThreatData {
    id: string;
    source: string;
    target: string;
    type: 'ddos' | 'sql_injection' | 'malware' | 'phishing';
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    status: 'active' | 'blocked' | 'monitoring';
}

interface SimulationContextType {
    activeThreats: ThreatData[];
    systemLoad: number;
    networkTraffic: number; // Mbps
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    isSimulationActive: boolean;
    toggleSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeThreats, setActiveThreats] = useState<ThreatData[]>([]);
    const [systemLoad, setSystemLoad] = useState(32);
    const [networkTraffic, setNetworkTraffic] = useState(450);
    const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
    const [isSimulationActive, setIsSimulationActive] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isSimulationActive) {
            intervalRef.current = setInterval(() => {
                // Update System Load
                setSystemLoad(prev => {
                    const variation = (Math.random() - 0.5) * 5;
                    return Math.max(10, Math.min(95, prev + variation));
                });

                // Update Network Traffic
                setNetworkTraffic(prev => {
                    const variation = (Math.random() - 0.5) * 50;
                    return Math.max(50, Math.min(1000, prev + variation));
                });

                // Randomly add new threats
                if (Math.random() > 0.7) {
                    const types = ['ddos', 'sql_injection', 'malware', 'phishing'] as const;
                    const severities = ['low', 'medium', 'high', 'critical'] as const;
                    const sources = ['192.168.1.105', '10.0.0.45', '172.16.0.22', '203.0.113.5'];

                    const newThreat: ThreatData = {
                        id: Math.random().toString(36).substr(2, 9),
                        source: sources[Math.floor(Math.random() * sources.length)],
                        target: 'Server_01',
                        type: types[Math.floor(Math.random() * types.length)],
                        severity: severities[Math.floor(Math.random() * severities.length)],
                        timestamp: new Date(),
                        status: 'active'
                    };

                    setActiveThreats(prev => {
                        const updated = [newThreat, ...prev].slice(0, 10); // Keep last 10
                        return updated;
                    });

                    // Auto-resolve older threats
                    setTimeout(() => {
                        setActiveThreats(prev => prev.map(t =>
                            t.id === newThreat.id ? { ...t, status: 'blocked' } : t
                        ));
                    }, 3000);
                }

                // Calculate overarching threat level
                setThreatLevel(prev => {
                    if (activeThreats.filter(t => t.status === 'active' && t.severity === 'critical').length > 0) return 'critical';
                    if (activeThreats.filter(t => t.status === 'active' && t.severity === 'high').length > 0) return 'high';
                    if (activeThreats.filter(t => t.status === 'active').length > 2) return 'medium';
                    return 'low';
                });

            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSimulationActive, activeThreats]);

    const toggleSimulation = () => setIsSimulationActive(!isSimulationActive);

    return (
        <SimulationContext.Provider value={{
            activeThreats,
            systemLoad,
            networkTraffic,
            threatLevel,
            isSimulationActive,
            toggleSimulation
        }}>
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (context === undefined) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
};
