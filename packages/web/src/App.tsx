import React, { useState, useEffect, useCallback } from 'react';
import { BotHealth, CreateServerInput, Server } from './types';
import { api } from './lib/api';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { ServerCard } from './components/ServerCard';
import { ServerModal } from './components/ServerModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { TemplateGuideModal } from './components/TemplateGuideModal';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Server as ServerIcon,
  Radio,
  ExternalLink,
} from 'lucide-react';

export const App: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [health, setHealth] = useState<BotHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Modals
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'offline' | 'channel_name' | 'embed' | 'message'>('all');

  // Toast notifications
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [healthData, serversData] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getServers().catch(() => []),
      ]);
      setHealth(healthData);
      setServers(serversData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh stats every 45 seconds
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSaveServer = async (data: CreateServerInput, id?: number) => {
    if (id) {
      await api.updateServer(id, data);
      showToast(`Updated ${data.name || data.mc_address} successfully!`);
    } else {
      await api.createServer(data);
      showToast(`Added ${data.name || data.mc_address} to tracking!`);
    }
    await loadData();
  };

  const handleDeleteServer = async (id: number) => {
    if (confirm('Are you sure you want to stop tracking this Minecraft server?')) {
      try {
        await api.deleteServer(id);
        showToast('Server removed from tracking.');
        await loadData();
      } catch (err: any) {
        showToast(`Failed to delete: ${err.message}`, 'error');
      }
    }
  };

  const handleSyncSingle = async (id: number) => {
    try {
      const result = await api.syncServer(id);
      if (result.success) {
        const statusText = result.online ? 'Online' : 'Offline';
        showToast(
          `Synced ${result.name} (${statusText})${result.targetChanged ? ' - Discord updated!' : ' - No changes needed'}`
        );
      } else {
        showToast(`Sync failed: ${result.error}`, 'error');
      }
      await loadData();
    } catch (err: any) {
      showToast(`Sync request error: ${err.message}`, 'error');
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const results = await api.syncAll();
      const successes = results.filter((r) => r.success).length;
      showToast(`Synced ${successes} of ${results.length} tracked servers.`);
      await loadData();
    } catch (err: any) {
      showToast(`Sync all error: ${err.message}`, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleInitMessage = async (id: number) => {
    try {
      const res = await api.initMessage(id);
      showToast(`Message posted to channel! Bound Message ID: ${res.messageId}`);
      await loadData();
    } catch (err: any) {
      showToast(`Failed to post message: ${err.message}`, 'error');
    }
  };

  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.mc_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.discord_channel_id.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterType === 'online') return server.last_status === 'online';
    if (filterType === 'offline') return server.last_status === 'offline';
    if (filterType === 'channel_name') return server.update_type === 'channel_name';
    if (filterType === 'embed') return server.update_type === 'embed';
    if (filterType === 'message') return server.update_type === 'message';

    return true;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar
        health={health}
        onSyncAll={handleSyncAll}
        isSyncingAll={isSyncingAll}
        onOpenSettings={() => setIsApiKeyModalOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onAddServer={() => {
          setEditingServer(null);
          setIsServerModalOpen(true);
        }}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium flex items-center gap-2 ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-800 text-red-200'
                : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Setup Warning Banner if Discord token missing */}
      {health && !health.config.hasDiscordToken && (
        <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border-b border-amber-800/80 px-4 py-2.5 text-xs text-amber-200 text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Cloudflare Secret Missing:</strong> Your worker needs the <code>DISCORD_TOKEN</code> secret to update channels or messages. Run <code>wrangler secret put DISCORD_TOKEN</code> in your terminal.
          </span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Stats Overview */}
        <StatsOverview servers={servers} />

        {/* Toolbar: Search and Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search servers by name, IP, or channel ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 hidden sm:block" />
            {(['all', 'online', 'offline', 'channel_name', 'embed', 'message'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition capitalize ${
                  filterType === type
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Server Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-xs">Loading tracked servers from Cloudflare D1...</p>
          </div>
        ) : filteredServers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onEdit={(s) => {
                  setEditingServer(s);
                  setIsServerModalOpen(true);
                }}
                onDelete={handleDeleteServer}
                onSync={handleSyncSingle}
                onInitMessage={handleInitMessage}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto border-dashed border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4 text-2xl">
              🎮
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {servers.length === 0 ? 'No Minecraft Servers Tracked Yet' : 'No Servers Match Your Filter'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              {servers.length === 0
                ? 'Connect your first Minecraft server and link it to a Discord channel name or live embed message.'
                : 'Try adjusting your search query or reset filter to see your configured servers.'}
            </p>
            {servers.length === 0 && (
              <button
                onClick={() => {
                  setEditingServer(null);
                  setIsServerModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/25 transition"
              >
                <Plus className="w-4 h-4" /> Add Your First Server
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Powered by <strong>Cloudflare Workers</strong>, <strong>Cloudflare D1</strong> & <strong>Pages</strong> (100% Free Tier)
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              Template Guide
            </button>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              API Key Config
            </button>
            <a
              href="https://github.com/UsainSrht/serverless-motd-fetcher"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1"
            >
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ServerModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        onSave={handleSaveServer}
        editingServer={editingServer}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={loadData}
      />

      <TemplateGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
};
