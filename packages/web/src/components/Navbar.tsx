import React from 'react';
import { BotHealth } from '../types';
import { RefreshCw, Key, HelpCircle, Activity, Github, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  health: BotHealth | null;
  onSyncAll: () => void;
  isSyncingAll: boolean;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onAddServer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  onSyncAll,
  isSyncingAll,
  onOpenSettings,
  onOpenGuide,
  onAddServer,
}) => {
  const isHealthy = health?.status === 'ok';
  const hasDiscordToken = health?.config.hasDiscordToken;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0f172a] rounded-[10px] flex items-center justify-center text-lg">
              🎮
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Serverless MOTD Fetcher
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Cloudflare Free Tier
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Minecraft Status & MOTD Discord Updater
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Health Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            {isHealthy && hasDiscordToken ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-medium">Worker Active</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-medium">Token Needed</span>
              </>
            )}
          </div>

          {/* Sync All Button */}
          <button
            onClick={onSyncAll}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition disabled:opacity-50"
            title="Trigger an immediate manual sync for all active servers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden xs:inline">Sync All</span>
          </button>

          {/* Guide Modal Trigger */}
          <button
            onClick={onOpenGuide}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="View Template Variables & Formatting Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* API Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Configure Worker API URL & Key"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/UsainSrht/serverless-motd-fetcher"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="View on GitHub (github.com/UsainSrht/serverless-motd-fetcher)"
          >
            <Github className="w-4 h-4" />
          </a>

          {/* Add Server Button */}
          <button
            onClick={onAddServer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-medium shadow-md shadow-indigo-600/20 transition"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Server</span>
          </button>
        </div>
      </div>
    </header>
  );
};
