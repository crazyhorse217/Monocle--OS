import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { APP_REGISTRY, getSystemApps, AppMetadata } from '../lib/registry';

export type AppId = 'monocle-player' | 'orvane-browser' | 'system-settings' | 'scanner' | 'antivirus' | 'app-installer' | 'syn-eater' | 'driftzero-aiat' | 'mats' | 'seven-recovery' | 'taproot' | 'compiler' | 'pocket-watch' | 'home-screen' | 'governor-adapter' | 'monocle-boot' | 'window-bubble' | 'governor-diagram' | 'pocket-watch-launcher' | 'alarm-clock' | 'device-settings' | 'maps' | 'lens-camera' | 'file-manager' | 'monocle-keyboard' | 'lock-screen' | 'orvane-search' | 'orvane-phone' | 'control-room' | 'game-dev' | 'fractured-dawn' | 'lingo-facilitator';

export interface RestorePoint {
  id: string;
  name: string;
  timestamp: string;
  integrity: 'verified' | 'unverified';
  state: string; // Serialized state hash
}

export interface AJBLog {
  id: string;
  timestamp: string;
  source: string;
  target: string;
  command: string;
  status: 'VERIFIED' | 'PENDING' | 'BLOCKED';
}

export interface WindowInstance {
  id: string;
  appId: AppId;
  title: string;
  isOpen: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isVerified?: boolean;
}

export type InstalledApp = AppMetadata;

interface OSContextType {
  windows: WindowInstance[];
  activeWindowId: string | null;
  installedApps: InstalledApp[];
  lastUpdate: string;
  restorePoints: RestorePoint[];
  srpStatus: 'isolated' | 'accessed' | 'restoring';
  ajbLogs: AJBLog[];
  logSysCall: (log: Omit<AJBLog, 'id' | 'timestamp'>) => void;
  openApp: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateWindow: (id: string, updates: Partial<WindowInstance>) => void;
  installApp: (app: InstalledApp) => void;
  checkForUpdates: () => void;
  getAppMetadata: (id: AppId) => AppMetadata | undefined;
  createRestorePoint: (name: string) => void;
  restoreSystem: (pointId: string) => void;
  setSrpStatus: (status: 'isolated' | 'accessed' | 'restoring') => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [lastUpdate, setLastUpdate] = useState('2026-04-29T12:00:00Z');
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([
    { id: 'rp-initial', name: 'Factory Baseline', timestamp: '2026-04-20T08:00:00Z', integrity: 'verified', state: '0xDEADBEEF' }
  ]);
  const [srpStatus, setSrpStatus] = useState<'isolated' | 'accessed' | 'restoring'>('isolated');
  const [ajbLogs, setAjbLogs] = useState<AJBLog[]>([]);
  
  // Initialize with system apps from the registry
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>(getSystemApps());

  const logSysCall = useCallback((log: Omit<AJBLog, 'id' | 'timestamp'>) => {
    const newLog: AJBLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false })
    };
    setAjbLogs(prev => [newLog, ...prev.slice(0, 99)]);
  }, []);

  const getAppMetadata = (appId: AppId) => APP_REGISTRY[appId];

  const focusWindow = (id: string) => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZ } : w));
    setActiveWindowId(id);
    
    // Log focus event to AJB
    const window = windows.find(w => w.id === id);
    if (window) {
      logSysCall({
        source: 'UI_MANAGER',
        target: 'AJB_DZ/MATS',
        command: `focus_window:${window.appId}`,
        status: 'VERIFIED'
      });
    }
  };

  const openApp = (appId: AppId) => {
    logSysCall({
      source: 'REGISTRY',
      target: 'AJB_DZ/MATS',
      command: `request_app_boot:${appId}`,
      status: 'VERIFIED'
    });

    const existing = windows.find(w => w.appId === appId);
    if (existing) {
      focusWindow(existing.id);
      return;
    }

    const app = getAppMetadata(appId);
    if (!app) {
      logSysCall({
        source: 'REGISTRY',
        target: 'TAPROOT',
        command: `boot_failure:${appId}`,
        status: 'BLOCKED'
      });
      return;
    }

    const newId = `${appId}-${Date.now()}`;
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    
    setWindows(prev => [...prev, {
      id: newId,
      appId: appId,
      title: app.name,
      isOpen: true,
      isMaximized: false,
      zIndex: newZ,
      position: { x: 100 + (prev.length * 40), y: 100 + (prev.length * 40) },
      size: { width: 800, height: 600 },
      isVerified: true
    }]);
    setActiveWindowId(newId);

    logSysCall({
      source: 'TAPROOT',
      target: appId.toUpperCase(),
      command: 'init_canonical_handshake',
      status: 'VERIFIED'
    });
  };

  const checkForUpdates = () => {
    setLastUpdate(new Date().toISOString());
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) setActiveWindowId(null);
  };

  const toggleMaximize = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const updateWindow = (id: string, updates: Partial<WindowInstance>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const installApp = (app: InstalledApp) => {
    setInstalledApps(prev => {
      if (prev.find(a => a.id === app.id)) return prev;
      return [...prev, app];
    });
  };

  const createRestorePoint = (name: string) => {
    const newPoint: RestorePoint = {
      id: `rp-${Date.now()}`,
      name,
      timestamp: new Date().toISOString(),
      integrity: 'verified',
      state: '0xSHASH'
    };
    setRestorePoints(prev => [...prev, newPoint]);
  };

  const restoreSystem = (pointId: string) => {
    setSrpStatus('restoring');
    setTimeout(() => {
      setWindows([]);
      setSrpStatus('isolated');
      alert(`System restored to point: ${pointId}`);
    }, 3000);
  };

  return (
    <OSContext.Provider value={{
      windows, activeWindowId, installedApps, lastUpdate, restorePoints, srpStatus, ajbLogs,
      openApp, closeWindow, focusWindow, toggleMaximize, updateWindow, installApp, checkForUpdates,
      getAppMetadata, createRestorePoint, restoreSystem, setSrpStatus, logSysCall
    }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) throw new Error('useOS must be used within an OSProvider');
  return context;
};
