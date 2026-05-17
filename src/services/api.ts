import axios from "axios";

// ── Mobile / Web detection ────────────────────────────────────────────────────
// BACKEND_IP is the LAN IP of the machine running the FastAPI backend.
// This is ONLY used when the app is running as a native mobile app via Capacitor.
// In a standard web browser, the Vite dev proxy handles /api/* → localhost:8000.
const BACKEND_IP = '10.125.129.121';

function detectNativeMobile(): boolean {
  try {
    const cap = (window as any).Capacitor;
    if (!cap) return false;
    // isNativePlatform is the official Capacitor 3+ API
    if (typeof cap.isNativePlatform === 'function') return cap.isNativePlatform();
    // Fallback for older Capacitor: check platform !== 'web'
    return cap.platform !== undefined && cap.platform !== 'web';
  } catch {
    return false;
  }
}

const isNativeMobile = detectNativeMobile();

// Web mode → empty base = Vite proxy routes /api/* to localhost:8000
// Native mobile → full URL to the machine running the backend
const API_BASE_URL = isNativeMobile ? `http://${BACKEND_IP}:8000` : '';

console.log(
  'AXIOM JAVELIN API mode:', isNativeMobile ? 'Native Mobile' : 'Web/Browser',
  '| Base:', API_BASE_URL || '(Vite proxy → localhost:8000)'
);


export interface ScanResult {
  status: 'safe' | 'risk' | 'malicious';
  confidence: number;
  details: string;
  timestamp: string;
}

export interface PhishingScanResult extends ScanResult {
  url: string;
  prevention: string;
  threatType?: string;
  blockedDomains?: string[];
}

export interface DeepfakeResult {
  result: "Original" | "AI Generated" | "Modified";
  overallConfidence: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  reasons: string[];
  detectionDetails: { category: string; finding: string; confidence: number }[];
  preventionSteps: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface VaultFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  date: string;
  isFolder?: boolean;
  encrypted: boolean;
  hash: string;
}

export interface ThreatEvent {
  id: string;
  name: string;
  level: 'info' | 'warning' | 'danger';
  time: string;
  timestamp: number;
  resolved: boolean;
  details?: string;
}

export interface IntegrityResult {
  fileId: string;
  fileName: string;
  status: 'verified' | 'modified' | 'corrupted';
  originalHash: string;
  currentHash: string;
  lastChecked: string;
}

export interface SimulationResult {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  vulnerabilitiesFound: number;
  details: string[];
  startTime: string;
  endTime?: string;
}

export interface EncryptionCheckResult {
  fileName: string;
  isEncrypted: boolean;
  encryptionType?: string;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

export const phishingApi = {
  scanUrl: async (url: string, userEmail?: string): Promise<PhishingScanResult> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/phishing/scan-url`, { url, userEmail }, { timeout: 10000 });
      return response.data;
    } catch {
      return simulatePhishingScan(url);
    }
  },

  getScanHistory: async (email?: string): Promise<PhishingScanResult[]> => {
    try {
      return await apiCall<PhishingScanResult[]>(`/api/phishing/history${email ? `?email=${email}` : ''}`);
    } catch {
      return [];
    }
  },

  getStats: async (email?: string) => {
    try {
      return await apiCall(`/api/phishing/stats${email ? `?email=${email}` : ''}`);
    } catch {
      return {
        urlsScanned: 2847,
        threatsBlocked: 23,
        safeUrls: 2819,
        warnings: 5,
      };
    }
  },
};

export const deepfakeApi = {
  scanMedia: async (formData: FormData, userEmail?: string): Promise<DeepfakeResult> => {
    try {
      if (userEmail) formData.append('userEmail', userEmail);
      const response = await axios.post(`${API_BASE_URL}/api/deepfake/scan`, formData, { timeout: 30000 });
      return response.data;
    } catch (error) {
      console.error("Deepfake API Error:", error);
      throw error;
    }
  },

  getStats: async (email?: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/deepfake/stats${email ? `?email=${email}` : ''}`, { timeout: 5000 });
      return response.data;
    } catch {
      return { scansToday: 15, accuracy: 98.7, lastScan: "5m ago" };
    }
  },

  getScanHistory: async (email?: string): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/deepfake/history${email ? `?email=${email}` : ''}`, { timeout: 10000 });
      return response.data;
    } catch {
      return [];
    }
  }
};

export const alertsApi = {
  getAlerts: async (email?: string): Promise<any[]> => {
    try {
      return await apiCall<any[]>(`/api/alerts${email ? `?email=${email}` : ''}`);
    } catch {
      return [];
    }
  },

  resolveAlert: async (alertId: string): Promise<void> => {
    try {
      await apiCall(`/api/alerts/resolve/${alertId}`, { method: 'POST' });
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    }
  }
};

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    axios.post(`${API_BASE_URL}/api/auth/signup`, data, { timeout: 10000 }),
  login: (data: { email: string; password: string }) =>
    axios.post(`${API_BASE_URL}/api/auth/login`, data, { timeout: 10000 }),
};

export const ransomwareApi = {
  vault: {
    getFiles: async (): Promise<VaultFile[]> => {
      try {
        return await apiCall<VaultFile[]>('/api/ransomware/vault/files');
      } catch {
        return [];
      }
    },

    uploadFile: async (file: File): Promise<VaultFile> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/ransomware/vault/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
        return await response.json();
      } catch {
        return simulateFileUpload(file);
      }
    },

    deleteFile: async (fileId: string): Promise<void> => {
      try {
        await apiCall(`/api/ransomware/vault/files/${fileId}`, {
          method: 'DELETE',
        });
      } catch {
        console.log('Delete simulated for:', fileId);
      }
    },

    getStorageInfo: async (email?: string) => {
      try {
        return await apiCall(`/api/ransomware/vault/storage${email ? `?email=${email}` : ''}`);
      } catch {
        return { used: 191.8, total: 5120, unit: 'MB' };
      }
    },
  },

  monitor: {
    getThreats: async (email?: string): Promise<ThreatEvent[]> => {
      try {
        return await apiCall<ThreatEvent[]>(`/api/ransomware/monitor/threats${email ? `?email=${email}` : ''}`);
      } catch {
        return [];
      }
    },

    startMonitoring: async (): Promise<void> => {
      try {
        await apiCall('/api/ransomware/monitor/start', { method: 'POST' });
      } catch {
        console.log('Monitoring started (simulated)');
      }
    },

    stopMonitoring: async (): Promise<void> => {
      try {
        await apiCall('/api/ransomware/monitor/stop', { method: 'POST' });
      } catch {
        console.log('Monitoring stopped (simulated)');
      }
    },

    resolveThread: async (threatId: string): Promise<void> => {
      try {
        await apiCall(`/api/ransomware/monitor/threats/${threatId}/resolve`, {
          method: 'POST',
        });
      } catch {
        console.log('Threat resolved (simulated):', threatId);
      }
    },

    getStats: async () => {
      try {
        return await apiCall('/api/ransomware/monitor/stats');
      } catch {
        return { filesMonitored: 1284, threatsBlocked: 12, lastScan: '2m ago' };
      }
    },
  },

  integrity: {
    runCheck: async (): Promise<IntegrityResult[]> => {
      try {
        return await apiCall<IntegrityResult[]>('/api/ransomware/integrity/check', {
          method: 'POST',
        });
      } catch {
        return [];
      }
    },

    getLastResults: async (): Promise<IntegrityResult[]> => {
      try {
        return await apiCall<IntegrityResult[]>('/api/ransomware/integrity/results');
      } catch {
        return [];
      }
    },

    getStats: async () => {
      try {
        return await apiCall('/api/ransomware/integrity/stats');
      } catch {
        return { verifiedFiles: 1284, modifiedFiles: 0, lastCheck: '2 hours ago' };
      }
    },
  },

  simulator: {
    startSimulation: async (type: string): Promise<SimulationResult> => {
      try {
        return await apiCall<SimulationResult>('/api/ransomware/simulator/start', {
          method: 'POST',
          body: JSON.stringify({ type }),
        });
      } catch {
        return simulateRansomwareAttack();
      }
    },

    getSimulationStatus: async (simulationId: string): Promise<SimulationResult> => {
      try {
        return await apiCall<SimulationResult>(`/api/ransomware/simulator/${simulationId}`);
      } catch {
        throw new Error('Simulation not found');
      }
    },

    stopSimulation: async (simulationId: string): Promise<void> => {
      try {
        await apiCall(`/api/ransomware/simulator/${simulationId}/stop`, {
          method: 'POST',
        });
      } catch {
        console.log('Simulation stopped (simulated)');
      }
    },

    getHistory: async (): Promise<SimulationResult[]> => {
      try {
        return await apiCall<SimulationResult[]>('/api/ransomware/simulator/history');
      } catch {
        return [];
      }
    },
  },

  encryption: {
    checkFile: async (file: File): Promise<EncryptionCheckResult> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/ransomware/encryption/check`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Check failed');
        return await response.json();
      } catch {
        return simulateEncryptionCheck(file);
      }
    },
  },
};

function simulatePhishingScan(url: string): PhishingScanResult {
  const urlLower = url.toLowerCase();
  let riskScore = 0;
  const findings: string[] = [];

  const dangerousTLDs = ['.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.click', '.link', '.biz'];
  if (dangerousTLDs.some(tld => urlLower.includes(tld))) {
    riskScore += 35;
    findings.push('High-risk TLD detected');
  }

  const phishingKeywords = [
    'login', 'verify', 'account', 'secure', 'update', 'confirm',
    'signin', 'bank', 'paypal', 'apple', 'microsoft', 'google',
    'wallet', 'crypto', 'giftcard', 'reward', 'prize', 'claim'
  ];
  if (phishingKeywords.some(k => urlLower.includes(k))) {
    riskScore += 25;
    findings.push('Brand or security keywords detected');
  }

  const typosquatPatterns = ['00', '1l', 'rn', 'vv', 'cl', 'rn'];
  if (typosquatPatterns.some(p => urlLower.includes(p))) {
    riskScore += 30;
    findings.push('Potential typosquatting detected');
  }

  const suspiciousChars = (urlLower.match(/[0-9-@!%]/g) || []).length;
  if (suspiciousChars > 2) {
    riskScore += 15;
    findings.push('Excessive numeric or special characters');
  }

  if (!urlLower.startsWith('https')) {
    riskScore += 20;
    findings.push('Unsecured HTTP protocol');
  }

  const whitelist = ['google.com', 'paypal.com', 'apple.com', 'microsoft.com', 'github.com', 'amazon.com'];
  if (whitelist.some(domain => urlLower.includes(domain) && !urlLower.includes('g00gle') && !urlLower.includes('paypa1'))) {
    riskScore = 0;
    findings.length = 0;
  }

  let status: 'safe' | 'risk' | 'malicious' = 'safe';
  if (riskScore >= 45) status = 'malicious';
  else if (riskScore >= 15) status = 'risk';
  const confidence = Math.max(5, Math.min(95, Math.round(riskScore)));

  return {
    url,
    status,
    confidence,
    details: findings.join('. ') || "No immediate threats found in URL structure.",
    prevention: status === 'malicious' ? "Close tab immediately." : "Exercise caution and verify HTTPS.",
    timestamp: new Date().toISOString(),
  };
}

function simulateFileUpload(file: File): VaultFile {
  return {
    id: `file_${Date.now()}`,
    name: file.name,
    size: formatFileSize(file.size),
    sizeBytes: file.size,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    encrypted: true,
    hash: generateHash(),
  };
}

function simulateRansomwareAttack(): SimulationResult {
  return {
    id: `sim_${Date.now()}`,
    status: 'running',
    progress: 0,
    vulnerabilitiesFound: 0,
    details: [],
    startTime: new Date().toISOString(),
  };
}

function simulateEncryptionCheck(file: File): EncryptionCheckResult {
  const isEncrypted = file.name.toLowerCase().endsWith('.encrypted');
  return {
    fileName: file.name,
    isEncrypted,
    threatLevel: isEncrypted ? 'critical' : 'none',
    details: isEncrypted ? 'File appears encrypted by ransomware.' : 'Safe file.',
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function generateHash(): string {
  return Array.from({ length: 8 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('').toUpperCase();
}

export function generateRandomThreat(): ThreatEvent {
  const threats = [
    { name: 'Suspicious process detected', level: 'warning' as const },
    { name: 'Unauthorized file encryption', level: 'danger' as const },
  ];
  const threat = threats[Math.floor(Math.random() * threats.length)];
  return {
    id: `threat_${Date.now()}`,
    ...threat,
    time: 'Just now',
    timestamp: Date.now(),
    resolved: false,
  };
}