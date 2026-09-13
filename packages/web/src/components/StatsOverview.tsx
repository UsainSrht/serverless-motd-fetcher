import React from 'react';
import { Server } from '../types';
import { Server as ServerIcon, Radio, Clock, MessageSquare, Hash } from 'lucide-react';

interface StatsOverviewProps {
  servers: Server[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ servers }) => {
  const total = servers.length;
  const onlineCount = servers.filter((s) => s.last_status === 'online').length;
  const channelCount = servers.filter((s) => s.update_type === 'channel_name').length;
  const messageCount = servers.filter((s) => s.update_type === 'message' || s.update_type === 'embed').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* Total Tracked */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <ServerIcon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Tracked Servers</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">{total}</h3>
            <span className="text-xs text-slate-500">instances</span>
          </div>
        </div>
      </div>

      {/* Online Status */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Radio className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Online Status</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {onlineCount} <span className="text-sm font-normal text-slate-500">/ {total}</span>
            </h3>
            <span className={`text-xs font-medium ${onlineCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {total > 0 ? `${Math.round((onlineCount / total) * 100)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Update Modes */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <div className="flex gap-0.5">
            <Hash className="w-4 h-4" />
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Update Targets</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {channelCount} Channels
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {messageCount} Messages
            </span>
          </div>
        </div>
      </div>

      {/* Cron Trigger Interval */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Cron Schedule</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-lg font-bold text-white tracking-tight">Every 5 min</h3>
            <span className="text-[10px] text-cyan-400 font-mono">*/5 * * * *</span>
          </div>
        </div>
      </div>
    </div>
  );
};
