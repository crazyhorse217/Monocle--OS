import { AppId } from '../context/OSContext';

export interface AppMetadata {
  id: AppId;
  name: string;
  version: string;
  description: string;
  icon: string;
  developer: string;
  isSystem: boolean;
  category: 'System' | 'Media' | 'Utility' | 'Security' | 'Network';
  size?: string;
  rating?: number;
  dependencies?: string[];
}

export const APP_REGISTRY: Record<AppId, AppMetadata> = {
  'monocle-player': {
    id: 'monocle-player',
    name: 'Orvane Media Player',
    version: '2.0.0',
    description: 'OMP — Full-featured media player. Video, Audio, Browse, Streams, Playlists, and live radio with Web Audio engine.',
    icon: 'Play',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'Media'
  },
  'orvane-browser': {
    id: 'orvane-browser',
    name: 'Orvane Browser',
    version: '1.0.2',
    description: 'Secure entry point to the interconnected neural network.',
    icon: 'Globe',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'Network'
  },
  'system-settings': {
    id: 'system-settings',
    name: 'Neural Link Settings',
    version: '4.1.0',
    description: 'Configure core neural interface parameters and system bio-metrics.',
    icon: 'Settings',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'System'
  },
  'app-installer': {
    id: 'app-installer',
    name: 'App Installer',
    version: '1.0.0',
    description: 'Verified distribution channel for neural applications.',
    icon: 'Download',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'System'
  },
  'antivirus': {
    id: 'antivirus',
    name: 'Sentinel Antivirus',
    version: 'AVG-9.0.4',
    description: 'Absolute observation layer for heuristic threat detection and neutralized disposal.',
    icon: 'Shield',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'Security'
  },
  'scanner': {
    id: 'scanner',
    name: 'Neural Scanner',
    version: '1.5.0',
    description: 'Deep packet inspection for neural link data streams.',
    icon: 'Search',
    developer: 'Orvane Seven LLC',
    isSystem: false,
    category: 'Utility',
    size: '12MB',
    rating: 4.8,
    dependencies: ['Core.NeuralRuntime']
  },
  'syn-eater': {
    id: 'syn-eater',
    name: 'Syn-Eater',
    version: '2.0.0',
    description: 'Physical malware disposal suite for stubborn bio-digital pathogens.',
    icon: 'Zap',
    developer: 'Orvane Seven LLC',
    isSystem: false,
    category: 'Security',
    size: '8MB',
    rating: 5.0
  },
  'driftzero-aiat': {
    id: 'driftzero-aiat',
    name: 'DriftZero AIAT',
    version: '1.0.0_ALPHA',
    description: 'Absolute AI Alignment Tool using a 5-tier Hierarchy of Neural Needs.',
    icon: 'Cpu',
    developer: 'DriftZero Labs',
    isSystem: false,
    category: 'Security',
    size: '24MB',
    rating: 4.9,
    dependencies: ['Neural.ObservationLayer', 'Core.KernelHooks']
  },
  'mats': {
    id: 'mats',
    name: 'MATS Traversal',
    version: '2.0.4b',
    description: 'Quad-unit bi-directional code traversal and junction box auditing tool.',
    icon: 'Binary',
    developer: 'Orvane Engineering',
    isSystem: false,
    category: 'Utility',
    size: '32MB',
    rating: 4.8,
    dependencies: ['Neural.ObservationLayer', 'TapRoot.Kernel']
  },
  'seven-recovery': {
    id: 'seven-recovery',
    name: 'Seven Recovery (SRP)',
    version: '0.7.1',
    description: 'Seven Recovery Protocol. Encrypted system recovery and restore point management.',
    icon: 'History',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'Security'
  },
  'taproot': {
    id: 'taproot',
    name: 'TapRoot Architecture',
    version: '1.0.0',
    description: 'Canonical law of the system. Auditable Junction Bus (AJB) controller and system mapping.',
    icon: 'Terminal',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'compiler': {
    id: 'compiler',
    name: 'MXE Compiler',
    version: '4.2.0',
    description: 'Package Monocle OS into high-integrity .mxe binaries with neural optimization.',
    icon: 'Package',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'pocket-watch': {
    id: 'pocket-watch',
    name: 'Pocket Watch',
    version: '1.0.0',
    description: 'Monocle OS Pocket Watch Runtime — canonical timekeeping spine with TapRoot-anchored app launcher.',
    icon: 'Watch',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'home-screen': {
    id: 'home-screen',
    name: 'Monocle Home',
    version: '1.0.0',
    description: 'Monocle One canonical home screen — operational dashboard with lens core, rotating app ring, and telemetry strip.',
    icon: 'Smartphone',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'governor-adapter': {
    id: 'governor-adapter',
    name: 'Governor Adapter',
    version: '1.0.0',
    description: 'MinimalGovernorAdapter — bidirectional unit-space engine visualizer. Pixel↔Unit conversion, lifecycle/hierarchy/geometry/anchor/collision subsystems, 60-120Hz enforcement loop.',
    icon: 'Layout',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'monocle-boot': {
    id: 'monocle-boot',
    name: 'Monocle Boot',
    version: '1.0.0',
    description: 'Monocle OS Startup State Machine — chip detection, hardware/software/lite boot modes, TapRoot-anchored boot log.',
    icon: 'Power',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'window-bubble': {
    id: 'window-bubble',
    name: 'Window Bubble',
    version: '1.0.0',
    description: 'Circular desktop demo — macOS Aqua window dragging with 8 snap points, collision arc, and boundary limit inside a 480px bubble.',
    icon: 'Circle',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'governor-diagram': {
    id: 'governor-diagram',
    name: 'Governor Diagram',
    version: '1.0.0',
    description: 'Interactive architecture diagram for the Orvane Circular Screen Governor V1.0 — 9-engine pipeline, anchor matrix, lifecycle FSM, and priority calculator.',
    icon: 'GitBranch',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'pocket-watch-launcher': {
    id: 'pocket-watch-launcher',
    name: 'PW Launcher',
    version: '1.0.0',
    description: 'Monocle OS Pocket Watch Launcher — single window, 5-page radial grid, 12-point anchor system, governor-native snap transitions.',
    icon: 'LayoutGrid',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'alarm-clock': {
    id: 'alarm-clock',
    name: 'Alarm Clock',
    version: '1.0.0',
    description: 'Set, edit and trigger alarms with snooze, day repeat, and sound selection.',
    icon: 'Bell',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'device-settings': {
    id: 'device-settings',
    name: 'Device Settings',
    version: '1.0.0',
    description: 'Full device settings — network, bluetooth, apps, notifications, battery, storage, developer options.',
    icon: 'Settings',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'maps': {
    id: 'maps',
    name: 'Orvane Maps',
    version: '1.0.0',
    description: 'Hands-free navigation with voice commands, turn-by-turn directions, and route planning.',
    icon: 'Map',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'Utility'
  },
  'lens-camera': {
    id: 'lens-camera',
    name: 'LensSuite Camera',
    version: '1.0.0',
    description: 'Circular camera with photo/video/portrait/pro modes, timer, flash, gallery, and zoom — native to Monocle circular screen.',
    icon: 'Camera',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'Media'
  },
  'file-manager': {
    id: 'file-manager',
    name: 'Orvane File Manager',
    version: '1.0.0',
    description: 'Full-featured file manager — browse Internal Storage, Music, Movies, Documents, Downloads, categories, cloud, remote access, and Recycle Bin.',
    icon: 'Folder',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'Utility'
  },
  'monocle-keyboard': {
    id: 'monocle-keyboard',
    name: 'Monocle Input',
    version: '1.0.0',
    description: 'Monocle OS circular keyboard — radial alpha/numeric layout with 5 interchangeable skins: Titanium, Midnight, Cyberpunk, Rosegold, Sage.',
    icon: 'Keyboard',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'lock-screen': {
    id: 'lock-screen',
    name: 'Lock Screen',
    version: '1.0.0',
    description: 'Monocle OS Lock Screen — Trune Aoler Seven Avatar authenticated lock with hold-to-unlock and time display.',
    icon: 'Lock',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'System'
  },
  'orvane-search': {
    id: 'orvane-search',
    name: 'Orvane Search',
    version: '1.0.0',
    description: 'Orvane neural search engine — Home feed, AI overview, images, notifications, and activity history. Powered by Sentinel-verified neural net.',
    icon: 'Search',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'Network'
  },
  'orvane-phone': {
    id: 'orvane-phone',
    name: 'Orvane Phone',
    version: '1.0.0',
    description: 'Monocle OS Phone — VOIP-ready SIP/Opus dialer with visual voicemail, call log, and Sentinel-verified neural link.',
    icon: 'Phone',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'Network'
  },
  'control-room': {
    id: 'control-room',
    name: 'Seven Control Room',
    version: '1.0.0',
    description: 'Orvane Seven Control Room — Aspire-powered infrastructure dashboard. Service health, real-time metrics, log streams, Redis telemetry, and deploy controls.',
    icon: 'Monitor',
    developer: 'Orvane Seven LLC',
    isSystem: true,
    category: 'System'
  },
  'game-dev': {
    id: 'game-dev',
    name: 'Orvane Game Dev',
    version: '1.0.0',
    description: 'Unity/Unreal-style game development IDE — Scene view, Hierarchy, Inspector, Project browser, Console, play controls, and multi-platform build export.',
    icon: 'Gamepad2',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'Utility'
  },
  'fractured-dawn': {
    id: 'fractured-dawn',
    name: 'Fractured Dawn',
    version: '0.2.0',
    description: 'Post-apocalyptic mobile strategy game — build bases, command heroes, rally alliances, and battle the Ironback in a fair-play PvP world. No pay-to-win.',
    icon: 'Swords',
    developer: 'bigdog3845 · Orvane Engineering',
    isSystem: false,
    category: 'Utility',
    size: '48MB',
    rating: 5.0
  },
  'lingo-facilitator': {
    id: 'lingo-facilitator',
    name: 'Orvane PC Lingo Facilitator',
    version: '1.0.0',
    description: 'LangShift-powered PC language translator and code explainer. Translate Python → C# and annotate code in any supported language.',
    icon: 'Languages',
    developer: 'Orvane Engineering',
    isSystem: true,
    category: 'Utility'
  }
};

export const getAppMetadata = (id: AppId): AppMetadata | undefined => APP_REGISTRY[id];
export const getAllApps = (): AppMetadata[] => Object.values(APP_REGISTRY);
export const getSystemApps = (): AppMetadata[] => getAllApps().filter(app => app.isSystem);
