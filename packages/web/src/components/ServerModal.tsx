import React, { useState, useEffect, useRef } from 'react';
import { CreateServerInput, PreviewResponse, Server, UpdateType } from '../types';
import { api } from '../lib/api';
import {
  X,
  Sparkles,
  Hash,
  MessageSquare,
  Play,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react';

interface ServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateServerInput, id?: number) => Promise<void>;
  editingServer?: Server | null;
}

const TEMPLATE_PRESETS: Record<UpdateType, { label: string; template: string }[]> = {
  channel_name: [
    { label: 'Minimal Status', template: '{status_emoji}・{players_online}-online' },
    { label: 'With Max Players', template: '{status_emoji}・mc-{players_online}/{players_max}' },
    { label: 'Server & Count', template: 'mc-{online}-{players_online}' },
  ],
  embed: [
    {
      label: 'Default Embed MOTD',
      template: '{motd}\n\nJoin our community! Updates every 5 minutes.',
    },
    {
      label: 'Detailed Info',
      template: '**Welcome to {name}**\n\n> {motd}\n\nRunning Minecraft version {version}.',
    },
  ],
  message: [
    {
      label: 'Standard Message',
      template:
        '🎮 **{name} Server Status**\nStatus: {status_emoji} **{online}**\nPlayers: **{players_online} / {players_max}** ({players_percent}%)\nMOTD: `{motd}`\n*Updated: {timestamp}*',
    },
  ],
};

const VARIABLE_CHIPS = [
  { tag: '{status_emoji}', desc: '🟢 or 🔴' },
  { tag: '{online}', desc: 'Online / Offline' },
  { tag: '{players_online}', desc: 'Current player count' },
  { tag: '{players_max}', desc: 'Max players allowed' },
  { tag: '{players_percent}', desc: 'Capacity %' },
  { tag: '{name}', desc: 'Server name' },
  { tag: '{ip}', desc: 'Server host/IP' },
  { tag: '{port}', desc: 'Server port' },
  { tag: '{version}', desc: 'MC version' },
  { tag: '{motd}', desc: 'Clean MOTD' },
  { tag: '{timestamp}', desc: 'UTC timestamp' },
];

export const ServerModal: React.FC<ServerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingServer,
}) => {
  const [name, setName] = useState('');
  const [mcAddress, setMcAddress] = useState('');
  const [updateType, setUpdateType] = useState<UpdateType>('channel_name');
  const [discordChannelId, setDiscordChannelId] = useState('');
  const [discordMessageId, setDiscordMessageId] = useState('');
  const [formatTemplate, setFormatTemplate] = useState('{status_emoji}・{players_online}-online');

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const templateInputRef = useRef<HTMLTextAreaElement>(null);

  // Populate form on edit
  useEffect(() => {
    if (editingServer) {
      setName(editingServer.name);
      setMcAddress(editingServer.mc_address);
      setUpdateType(editingServer.update_type);
      setDiscordChannelId(editingServer.discord_channel_id);
      setDiscordMessageId(editingServer.discord_message_id || '');
      setFormatTemplate(editingServer.format_template);
    } else {
      setName('');
      setMcAddress('');
      setUpdateType('channel_name');
      setDiscordChannelId('');
      setDiscordMessageId('');
      setFormatTemplate('{status_emoji}・{players_online}-online');
    }
    setPreviewData(null);
    setPreviewError(null);
    setSaveError(null);
  }, [editingServer, isOpen]);

  // When updateType changes, if template is empty or default, suggest default
  const handleTypeChange = (type: UpdateType) => {
    setUpdateType(type);
    if (!editingServer) {
      if (type === 'channel_name') {
        setFormatTemplate('{status_emoji}・{players_online}-online');
      } else if (type === 'embed') {
        setFormatTemplate('{motd}\n\nJoin our community! Updates every 5 minutes.');
      } else {
        setFormatTemplate(
          '🎮 **{name} Server Status**\nStatus: {status_emoji} **{online}**\nPlayers: **{players_online} / {players_max}**\nMOTD: `{motd}`'
        );
      }
    }
  };

  const insertVariable = (tag: string) => {
    const input = templateInputRef.current;
    if (!input) {
      setFormatTemplate((prev) => prev + tag);
      return;
    }

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const current = input.value;
    const updated = current.substring(0, start) + tag + current.substring(end);
    setFormatTemplate(updated);

    // Reposition cursor after the inserted tag
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + tag.length, start + tag.length);
    }, 10);
  };

  const fetchLivePreview = async () => {
    if (!mcAddress.trim()) {
      setPreviewError('Please enter a Minecraft server address first.');
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);

    try {
      const data = await api.getPreview({
        mc_address: mcAddress.trim(),
        format_template: formatTemplate,
        update_type: updateType,
        name: name.trim() || mcAddress.trim(),
      });
      setPreviewData(data);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to fetch live preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcAddress.trim() || !discordChannelId.trim()) {
      setSaveError('Minecraft Address and Discord Channel ID are required.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(
        {
          name: name.trim() || mcAddress.trim(),
          mc_address: mcAddress.trim(),
          discord_channel_id: discordChannelId.trim(),
          discord_message_id: discordMessageId.trim() || null,
          update_type: updateType,
          format_template: formatTemplate.trim(),
        },
        editingServer?.id
      );
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save server');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              {editingServer ? <Sparkles className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {editingServer ? 'Edit Tracked Server' : 'Add Minecraft Server'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure MOTD tracking and automated Discord status updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {saveError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Row 1: Name and Minecraft Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Server Friendly Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Survival SMP"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Minecraft Server IP / Address <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={mcAddress}
                  onChange={(e) => setMcAddress(e.target.value)}
                  placeholder="e.g. play.hypixel.net or mc.xyz:25565"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Update Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Update Target Mode <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Channel Name */}
              <button
                type="button"
                onClick={() => handleTypeChange('channel_name')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  updateType === 'channel_name'
                    ? 'bg-purple-950/30 border-purple-500 text-purple-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-sm text-white">Channel Name</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Updates Discord channel title (e.g. 🟢・42-online)
                </p>
              </button>

              {/* Rich Embed */}
              <button
                type="button"
                onClick={() => handleTypeChange('embed')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  updateType === 'embed'
                    ? 'bg-indigo-950/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-sm text-white">Discord Embed</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dynamic card with player bar, MOTD, and server thumbnail
                </p>
              </button>

              {/* Plain Message */}
              <button
                type="button"
                onClick={() => handleTypeChange('message')}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  updateType === 'message'
                    ? 'bg-cyan-950/30 border-cyan-500 text-cyan-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-sm text-white">Plain Message</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Standard Discord markdown text message
                </p>
              </button>
            </div>
          </div>

          {/* Row 3: Discord Channel & Message ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Discord Channel ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={discordChannelId}
                onChange={(e) => setDiscordChannelId(e.target.value)}
                placeholder="e.g. 112233445566778899"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Right-click channel in Discord & copy ID (requires Developer Mode)
              </p>
            </div>

            {updateType !== 'channel_name' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Discord Message ID <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={discordMessageId}
                  onChange={(e) => setDiscordMessageId(e.target.value)}
                  placeholder="Leave empty to auto-send on first sync"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The bot will create a message automatically if left blank.
                </p>
              </div>
            )}
          </div>

          {/* Row 4: Format Template Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Format Template <span className="text-red-400">*</span>
              </label>
              {/* Presets */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 mr-1">Presets:</span>
                {TEMPLATE_PRESETS[updateType]?.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setFormatTemplate(p.template)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={templateInputRef}
              rows={updateType === 'channel_name' ? 2 : 4}
              value={formatTemplate}
              onChange={(e) => setFormatTemplate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
            />

            {/* Variable chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VARIABLE_CHIPS.map((chip) => (
                <button
                  key={chip.tag}
                  type="button"
                  onClick={() => insertVariable(chip.tag)}
                  title={chip.desc}
                  className="px-2 py-0.5 rounded-lg bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 font-mono text-[11px] text-indigo-300 transition"
                >
                  {chip.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Row 5: Live Discord Simulator & Preview */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Live Discord Output Preview
                </span>
              </div>
              <button
                type="button"
                onClick={fetchLivePreview}
                disabled={isPreviewLoading}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isPreviewLoading ? 'animate-spin' : ''}`} />
                {isPreviewLoading ? 'Testing API...' : 'Fetch Live Preview'}
              </button>
            </div>

            {previewError && (
              <p className="text-xs text-amber-400 mb-2">{previewError}</p>
            )}

            {/* Discord Simulator Mockup Container */}
            <div className="bg-[#1e1f22] rounded-xl p-4 border border-[#2b2d31] font-sans">
              {updateType === 'channel_name' && (
                <div className="flex items-center gap-2 bg-[#2b2d31] px-3 py-1.5 rounded-md max-w-sm text-slate-300 text-sm">
                  <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-white truncate">
                    {previewData?.preview.channelName ||
                      formatTemplate
                        .replace('{status_emoji}', '🟢')
                        .replace('{players_online}', '42')
                        .replace('{players_max}', '100')
                        .replace('{name}', name || 'Minecraft Server')}
                  </span>
                </div>
              )}

              {updateType === 'message' && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    BOT
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">MOTD Bot</span>
                      <span className="text-[10px] px-1 rounded bg-[#5865F2] text-white font-semibold">
                        BOT
                      </span>
                      <span className="text-[11px] text-slate-400">Today at 4:20 PM</span>
                    </div>
                    <div className="text-slate-200 text-sm whitespace-pre-wrap">
                      {previewData?.preview.messagePayload?.content ||
                        formatTemplate
                          .replace('{status_emoji}', '🟢')
                          .replace('{online}', 'Online')
                          .replace('{players_online}', '42')
                          .replace('{players_max}', '100')
                          .replace('{players_percent}', '42')
                          .replace('{motd}', 'A Minecraft Server')
                          .replace('{name}', name || 'Minecraft Server')}
                    </div>
                  </div>
                </div>
              )}

              {updateType === 'embed' && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    BOT
                  </div>
                  <div className="flex-1 max-w-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-white text-sm">MOTD Bot</span>
                      <span className="text-[10px] px-1 rounded bg-[#5865F2] text-white font-semibold">
                        BOT
                      </span>
                      <span className="text-[11px] text-slate-400">Today at 4:20 PM</span>
                    </div>
                    {/* Simulated Discord Embed */}
                    <div className="bg-[#2b2d31] rounded-r-lg border-l-4 border-emerald-500 p-4 text-xs">
                      <h4 className="font-bold text-white text-sm mb-2">
                        🎮 {name || 'Minecraft Server'}
                      </h4>
                      <p className="text-slate-300 whitespace-pre-wrap mb-3">
                        {previewData?.preview.messagePayload?.embeds?.[0]?.description ||
                          'Sample MOTD or custom server description'}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#1e1f22]/50 p-2.5 rounded">
                        <div>
                          <span className="text-slate-400 block font-medium">Status</span>
                          <span className="text-emerald-400 font-semibold">🟢 Online</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Players</span>
                          <span className="text-white font-semibold">42 / 100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingServer ? 'Update Server' : 'Add Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
