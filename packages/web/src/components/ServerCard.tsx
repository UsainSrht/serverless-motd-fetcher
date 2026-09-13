import React, { useState } from 'react';
import { Server } from '../types';
import {
  Copy,
  Check,
  RefreshCw,
  Edit2,
  Trash2,
  Hash,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  Send,
  ExternalLink,
} from 'lucide-react';

interface ServerCardProps {
  server: Server;
  onEdit: (server: Server) => void;
  onDelete: (id: number) => void;
  onSync: (id: number) => Promise<void>;
  onInitMessage: (id: number) => Promise<void>;
}

export const ServerCard: React.FC<ServerCardProps> = ({
  server,
  onEdit,
  onDelete,
  onSync,
  onInitMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSendingInit, setIsSendingInit] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(server.mc_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync(server.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInitMessage = async () => {
    setIsSendingInit(true);
    try {
      await onInitMessage(server.id);
    } finally {
      setIsSendingInit(false);
    }
  };

  const isOnline = server.last_status === 'online';
  const isError = server.last_status === 'error';

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group">
      {/* Accent top border gradient */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          isOnline
            ? 'from-emerald-500 to-teal-400'
            : isError
            ? 'from-amber-500 to-red-500'
            : 'from-slate-700 to-slate-800'
        }`}
      />

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">{server.name}</h3>
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : isError
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-400 glow-emerald' : isError ? 'bg-amber-400' : 'bg-slate-500'
                  }`}
                />
                {isOnline ? 'Online' : isError ? 'Sync Error' : 'Offline / Pending'}
              </span>
            </div>

            {/* Address with copy button */}
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/50">
                {server.mc_address}
              </span>
              <button
                onClick={copyAddress}
                className="text-slate-400 hover:text-slate-200 transition p-1"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Update Type Badge */}
          <div className="shrink-0">
            {server.update_type === 'channel_name' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Hash className="w-3.5 h-3.5" /> Channel Name
              </span>
            )}
            {server.update_type === 'embed' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5" /> Rich Embed
              </span>
            )}
            {server.update_type === 'message' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <MessageSquare className="w-3.5 h-3.5" /> Plain Message
              </span>
            )}
          </div>
        </div>

        {/* Target Details */}
        <div className="space-y-1.5 my-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Discord Channel:</span>
            <span className="font-mono text-slate-300 select-all">{server.discord_channel_id}</span>
          </div>

          {server.update_type !== 'channel_name' && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Target Message:</span>
              {server.discord_message_id ? (
                <span className="font-mono text-slate-300 select-all">{server.discord_message_id}</span>
              ) : (
                <button
                  onClick={handleInitMessage}
                  disabled={isSendingInit}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 transition disabled:opacity-50"
                >
                  <Send className={`w-3 h-3 ${isSendingInit ? 'animate-spin' : ''}`} />
                  {isSendingInit ? 'Sending...' : 'Auto-Generate Message'}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
            <span>Template:</span>
            <span className="font-mono text-slate-300 truncate max-w-[200px]" title={server.format_template}>
              {server.format_template}
            </span>
          </div>
        </div>

        {/* Error message notification if any */}
        {server.last_error && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-red-300 text-xs mb-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="overflow-hidden">
              <p className="font-medium text-red-200">Last Error</p>
              <p className="truncate text-red-300/80">{server.last_error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer / Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          {server.last_synced_at
            ? `Synced: ${new Date(server.last_synced_at).toLocaleTimeString()}`
            : 'Never synced'}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Manual Sync */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50"
            title="Sync this server now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(server)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Edit configuration"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(server.id)}
            className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-900/30 transition"
            title="Delete server"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
