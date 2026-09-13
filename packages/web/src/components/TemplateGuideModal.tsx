import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, AlertTriangle, Sparkles, Hash, MessageSquare } from 'lucide-react';

interface TemplateGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateGuideModal: React.FC<TemplateGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const variables = [
    { tag: '{status_emoji}', example: '🟢 or 🔴', desc: 'Colored status circle indicator' },
    { tag: '{online}', example: 'Online / Offline', desc: 'Textual connection state' },
    { tag: '{players_online}', example: '42', desc: 'Current number of players connected' },
    { tag: '{players_max}', example: '100', desc: 'Maximum player capacity of the server' },
    { tag: '{players_percent}', example: '42', desc: 'Server player capacity percentage (0-100)' },
    { tag: '{name}', example: 'Survival SMP', desc: 'Configured friendly server name' },
    { tag: '{ip}', example: 'play.example.com', desc: 'Server hostname or IP address' },
    { tag: '{port}', example: '25565', desc: 'Server connection port' },
    { tag: '{version}', example: '1.21.1', desc: 'Minecraft server version' },
    { tag: '{motd}', example: 'Welcome to our Survival Realm!', desc: 'Cleaned, single-line server MOTD' },
    { tag: '{motd_line1}', example: 'First MOTD line', desc: 'First line of the MOTD only' },
    { tag: '{timestamp}', example: '04:20 PM UTC', desc: 'Last time the status was checked' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Template Variables & Rules Guide
              </h2>
              <p className="text-xs text-slate-400">Syntax reference and Discord API constraints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Rate Limits Alert */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-200">
            <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Discord Channel Name Rate Limit Note
            </div>
            <p className="text-slate-300 leading-relaxed">
              Discord strictly enforces a rate limit of <strong>2 channel name modifications per 10 minutes</strong> per channel.
              Our Cloudflare Worker automatically hashes the target channel name and <strong>skips unnecessary PATCH calls</strong> if the formatted name has not changed!
            </p>
          </div>

          {/* Variables Table */}
          <div>
            <h3 className="font-semibold text-sm text-white mb-2">Available Variables</h3>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60">
              <div className="grid grid-cols-12 bg-slate-800/80 p-2.5 font-semibold text-slate-300 text-[11px]">
                <div className="col-span-4">Placeholder Tag</div>
                <div className="col-span-3">Example Output</div>
                <div className="col-span-5">Description</div>
              </div>
              <div className="divide-y divide-slate-800/60">
                {variables.map((item) => (
                  <div
                    key={item.tag}
                    onClick={() => copyToClipboard(item.tag)}
                    className="grid grid-cols-12 p-2.5 items-center hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <div className="col-span-4 flex items-center gap-1 font-mono text-indigo-300">
                      <span>{item.tag}</span>
                      {copiedTag === item.tag ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                      )}
                    </div>
                    <div className="col-span-3 font-mono text-slate-400 truncate">{item.example}</div>
                    <div className="col-span-5 text-slate-300 truncate">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1">
                <Hash className="w-4 h-4" />
                Channel Name Mode
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Max 100 characters. Replaces spaces with hyphens in text channels. Preserves unicode emojis.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                <Sparkles className="w-4 h-4" />
                Discord Embed Mode
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Sends a sleek dark-mode embed with colored status bar (green/red), player progress bar, and server favicon.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
