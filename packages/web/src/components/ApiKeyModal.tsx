import React, { useState, useEffect } from 'react';
import {
  getStoredApiKey,
  getStoredApiUrl,
  setStoredApiKey,
  setStoredApiUrl,
  api,
} from '../lib/api';
import { X, Key, Globe, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiUrl(getStoredApiUrl());
      setApiKey(getStoredApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Save temporarily for the test call
    setStoredApiUrl(apiUrl);
    setStoredApiKey(apiKey);

    try {
      const health = await api.getHealth();
      const isAuthValid = await api.verifyApiKey(apiKey);

      if (!isAuthValid) {
        setTestResult({
          success: false,
          message: 'Worker reachable, but API Secret is invalid (Authentication failed).',
        });
      } else {
        const discordStatus = health.config.hasDiscordToken
          ? 'Discord Token Active'
          : '⚠️ DISCORD_TOKEN secret not yet set in Cloudflare';
        setTestResult({
          success: true,
          message: `Connected successfully to Worker! (${discordStatus})`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to connect: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiUrl(apiUrl);
    setStoredApiKey(apiKey);
    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                API & Authentication
              </h2>
              <p className="text-xs text-slate-400">Connect to your Cloudflare Worker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Worker API URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="e.g. https://motd-worker.usainsrht.workers.dev"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank if running on the same domain or via local Vite proxy.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              API Secret Key (X-API-Key)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter matching API_SECRET from worker"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Must match the <code className="text-amber-300 font-mono">API_SECRET</code> defined in Wrangler secrets.
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-900/60 text-red-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-400' : ''}`} />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
