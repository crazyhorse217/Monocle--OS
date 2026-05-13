import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Square, Minus, GripVertical, Maximize2, Activity, Shield, Zap, Cpu, Brain } from 'lucide-react';
import { useOS, WindowInstance } from '../context/OSContext';
import { OrvaneMediaPlayer } from './OrvaneMediaPlayer';
import { OrvaneBrowser } from './OrvaneBrowser';
import { AppInstaller } from './AppInstaller';
import { SentinelAV } from './SentinelAV';
import { DriftZeroAIAT } from './DriftZeroAIAT';
import { MATS } from './MATS';
import { SevenRecovery } from './SevenRecovery';
import { TapRoot } from './TapRoot';
import { SystemSettings } from './SystemSettings';
import { Compiler } from './Compiler';
import { PocketWatch } from './PocketWatch';
import { HomeScreen } from './HomeScreen';
import { GovernorAdapter } from './GovernorAdapter';
import { MonocleBoot } from './MonocleBoot';
import { WindowBubble } from './WindowBubble';
import { GovernorDiagram } from './GovernorDiagram';
import { PocketWatchLauncher } from './PocketWatchLauncher';
import AlarmClock from './AlarmClock';
import DeviceSettings from './DeviceSettings';
import { MapsApp } from './MapsApp';
import { LensCameraApp } from './LensCameraApp';
import { OrvaneFileManager } from './OrvaneFileManager';
import { MonocleKeyboard } from './MonocleKeyboard';
import { LockScreen } from './LockScreen';
import { OrvaneSearch } from './OrvaneSearch';
import { OrvanePhone } from './OrvanePhone';
import { OrvaneSevenControlRoom } from './OrvaneSevenControlRoom';
import { OrvaneGameDev } from './OrvaneGameDev';
import { FracturedDawn } from './FracturedDawn';
import { OrvanePCLingoFacilitator } from './OrvanePCLingoFacilitator';

import { AppIcon } from './AppIcon';

type SnapRegion = 'none' | 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export const Window: React.FC<{ win: WindowInstance }> = ({ win }) => {
  const { closeWindow, focusWindow, toggleMaximize, updateWindow, getAppMetadata } = useOS();
  const [snapRegion, setSnapRegion] = useState<SnapRegion>('none');
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  const appMeta = getAppMetadata(win.appId);

  const handleDrag = (_: any, info: any) => {
    const { x, y } = info.point;
    const threshold = 50;
    const padding = 10;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    let newRegion: SnapRegion = 'none';

    if (y < threshold) {
      if (x < threshold) newRegion = 'top-left';
      else if (x > screenWidth - threshold) newRegion = 'top-right';
      else newRegion = 'top';
    } else if (y > screenHeight - threshold) {
      if (x < threshold) newRegion = 'bottom-left';
      else if (x > screenWidth - threshold) newRegion = 'bottom-right';
      else newRegion = 'bottom';
    } else if (x < threshold) {
      newRegion = 'left';
    } else if (x > screenWidth - threshold) {
      newRegion = 'right';
    }

    setSnapRegion(newRegion);
  };

  const handleDragEnd = (_: any, info: any) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const taskbarHeight = 80;

    if (snapRegion === 'top') {
      updateWindow(win.id, { isMaximized: true, position: { x: 0, y: 0 } });
    } else if (snapRegion === 'left') {
      updateWindow(win.id, { 
        isMaximized: false, 
        position: { x: 0, y: 0 }, 
        size: { width: screenWidth / 2, height: screenHeight - taskbarHeight } 
      });
    } else if (snapRegion === 'right') {
      updateWindow(win.id, { 
        isMaximized: false, 
        position: { x: screenWidth / 2, y: 0 }, 
        size: { width: screenWidth / 2, height: screenHeight - taskbarHeight } 
      });
    } else if (snapRegion === 'top-left') {
       updateWindow(win.id, { 
        isMaximized: false, 
        position: { x: 0, y: 0 }, 
        size: { width: screenWidth / 2, height: (screenHeight - taskbarHeight) / 2 } 
      });
    } else if (snapRegion === 'top-right') {
       updateWindow(win.id, { 
        isMaximized: false, 
        position: { x: screenWidth / 2, y: 0 }, 
        size: { width: screenWidth / 2, height: (screenHeight - taskbarHeight) / 2 } 
      });
    } else {
      // Just update position if no snap
      updateWindow(win.id, { position: { x: info.point.x - (win.size.width / 2), y: info.point.y - 20 } });
    }
    setSnapRegion('none');
  };

  const renderContent = () => {
    switch (win.appId) {
      case 'orvane-browser':
        return <OrvaneBrowser />;
      case 'monocle-player':
        return <OrvaneMediaPlayer />;
      case 'app-installer':
        return <AppInstaller />;
      case 'antivirus':
        return <SentinelAV />;
      case 'driftzero-aiat':
        return <DriftZeroAIAT />;
      case 'mats':
        return <MATS />;
      case 'seven-recovery':
        return <SevenRecovery />;
      case 'taproot':
        return <TapRoot />;
      case 'system-settings':
        return <SystemSettings />;
      case 'compiler':
        return <Compiler />;
      case 'pocket-watch':
        return <PocketWatch />;
      case 'home-screen':
        return <HomeScreen />;
      case 'governor-adapter':
        return <GovernorAdapter />;
      case 'monocle-boot':
        return <MonocleBoot />;
      case 'window-bubble':
        return <WindowBubble />;
      case 'governor-diagram':
        return <GovernorDiagram />;
      case 'pocket-watch-launcher':
        return <PocketWatchLauncher />;
      case 'alarm-clock':
        return <AlarmClock />;
      case 'device-settings':
        return <DeviceSettings />;
      case 'maps':
        return <MapsApp />;
      case 'lens-camera':
        return <LensCameraApp />;
      case 'file-manager':
        return <OrvaneFileManager />;
      case 'monocle-keyboard':
        return <MonocleKeyboard />;
      case 'lock-screen':
        return <LockScreen />;
      case 'orvane-search':
        return <OrvaneSearch />;
      case 'orvane-phone':
        return <OrvanePhone />;
      case 'control-room':
        return <OrvaneSevenControlRoom />;
      case 'game-dev':
        return <OrvaneGameDev />;
      case 'fractured-dawn':
        return <FracturedDawn />;
      case 'lingo-facilitator':
        return <OrvanePCLingoFacilitator />;
      case 'syn-eater':
        return (
          <div className="h-full w-full bg-red-950/10 p-8 flex flex-col font-mono text-red-500">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-black italic">SYN_EATER_v2.0.0</span>
              <Zap size={20} className="animate-pulse" />
            </div>
            <div className="flex-1 border border-red-500/20 rounded-2xl p-6 bg-black/40 overflow-y-auto space-y-4">
              <div className="flex items-center space-x-3 text-red-500/50">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                 <span className="text-[10px] uppercase tracking-widest">Awaiting_Malware_Input...</span>
              </div>
              <div className="text-[10px] opacity-40 leading-relaxed uppercase">
                [SYSTEM] ORVANE_SEVEN_LLC :: HARDWARE_SUITE_CONNECTED<br />
                [SYSTEM] DISPOSAL_CHUTE_PRESSURE :: NORMAL<br />
                [SYSTEM] BIO_DIGITAL_BURNER :: STANDBY<br />
              </div>
            </div>
          </div>
        );
      case 'scanner':
        return (
          <div className="h-full w-full bg-black p-8 flex flex-col font-mono text-brand-cyan">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl">NEURAL_SCANNER_v1.5.0</span>
              <Activity size={20} className="animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 text-[10px] opacity-70">
              <p>[0x3F] SYNCING_CORES...</p>
              <p>[0x3F] BUFFER_INITIALIZED</p>
              <p>[0x3F] LISTENING_ON_7700</p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1 }} className="text-green-500 underline">ACTIVE_RELAY_FOUND</motion.div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-zinc-600 font-mono text-sm">
            ERROR: APP_NOT_FOUND [{win.appId}]
          </div>
        );
    }
  };

  const getSnapPreviewStyle = () => {
    const sw = window.innerWidth;
    const sh = window.innerHeight - 80;
    switch (snapRegion) {
      case 'top': return { inset: 0 };
      case 'left': return { left: 0, top: 0, width: sw / 2, height: sh };
      case 'right': return { right: 0, top: 0, width: sw / 2, height: sh };
      case 'top-left': return { left: 0, top: 0, width: sw / 2, height: sh / 2 };
      case 'top-right': return { right: 0, top: 0, width: sw / 2, height: sh / 2 };
      default: return null;
    }
  };

  const previewStyle = getSnapPreviewStyle();

  return (
    <>
      <AnimatePresence>
        {previewStyle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bg-brand-cyan/10 border-2 border-brand-cyan/30 z-0 pointer-events-none backdrop-blur-sm rounded-xl"
            style={previewStyle}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          left: win.isMaximized ? 0 : win.position.x,
          top: win.isMaximized ? 0 : win.position.y,
          width: win.isMaximized ? '100%' : win.size.width,
          height: win.isMaximized ? 'calc(100% - 80px)' : win.size.height,
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        drag
        dragMomentum={false}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onMouseDown={() => focusWindow(win.id)}
        style={{ zIndex: win.zIndex }}
        className={`absolute bg-zinc-900 rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col transition-[width,height,left,top] duration-300 ease-out ${
          win.isMaximized ? 'rounded-none shadow-none z-10' : ''
        }`}
      >
        {/* Absolute Observation Layer: Sentinel Overlay */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-cyan/30 z-50 overflow-hidden">
           <motion.div 
             animate={{ x: [-1000, 1000] }}
             transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
             className="w-48 h-full bg-brand-cyan shadow-[0_0_10px_#00f2ff]"
           />
        </div>

        {/* Window Header */}
        <div className="h-10 bg-zinc-900 border-b border-white/5 flex items-center justify-between px-4 group cursor-default select-none">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
               {appMeta && <AppIcon iconName={appMeta.icon} size={14} className="text-zinc-500" />}
               <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">{win.title}</span>
               {win.isVerified && (
                 <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-brand-cyan/10 rounded border border-brand-cyan/20">
                    <Shield size={8} className="text-brand-cyan" />
                    <span className="text-[8px] font-mono text-brand-cyan uppercase tracking-widest leading-none">Verified_by_Sentinel</span>
                 </div>
               )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors">
              <Minus size={14} />
            </button>
            <button 
              onClick={() => toggleMaximize(win.id)}
              className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <Square size={12} />
            </button>
            <button 
              onClick={() => closeWindow(win.id)}
              className="p-1.5 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex-1 relative overflow-hidden">
          {renderContent()}
        </div>

        {/* Observation Status Footer */}
        <div className="h-4 bg-black/80 border-t border-white/5 flex items-center justify-between px-3 shrink-0">
           <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
              <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Observable_Layer_v9.0.4r :: Stable</span>
           </div>
           <div className="text-[8px] font-mono text-zinc-800">ORVANE_SENTINEL_UPLINK::ENCRYPTED</div>
        </div>

        {/* Resize Handles - Simplistic approach */}
        {!win.isMaximized && (
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group">
             <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-zinc-700 group-hover:border-brand-cyan transition-colors" />
          </div>
        )}
      </motion.div>
    </>
  );
};
