import React, { useEffect, useState } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type FeatureFlag = {
  name: string;
  enabled: boolean;
  last_changed?: string | null;
  toggler?: string | null;
};

export default function AdminFeatureFlags() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.permissions?.includes('admin') || false;

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const resp = await fetch('/api/admin/feature-flags', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const body = await resp.json();
      const list: FeatureFlag[] = body?.data?.flags || [];
      setFlags(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load flags';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleFlag = async (flag: FeatureFlag) => {
    setSaving(flag.name);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const resp = await fetch(`/api/admin/feature-flags/${encodeURIComponent(flag.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ enabled: !flag.enabled, toggler: 'admin-system' })
      });
      const body = await resp.json();
      if (!resp.ok || body?.success === false) {
        throw new Error(body?.error?.message || 'Toggle failed');
      }
      const updated: FeatureFlag = body?.data?.flag;
      setFlags(prev => prev.map(f => (f.name === updated.name ? updated : f)));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Toggle failed';
      setError(msg);
    } finally {
      setSaving(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
            <ShieldCheck className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">Administrator privileges required to access feature flags.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">Feature Flags</h1>
          {loading && (
            <div className="flex items-center text-white space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading…</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">{error}</div>
        )}

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 divide-y divide-slate-700/40">
          {flags.map((flag) => (
            <div key={flag.name} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{flag.name}</div>
                <div className="text-gray-400 text-sm">
                  {flag.last_changed ? (
                    <>
                      Last change: {new Date(flag.last_changed).toLocaleString()} • by {flag.toggler || 'admin-system'}
                    </>
                  ) : (
                    'No changes yet'
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleFlag(flag)}
                disabled={saving === flag.name}
                className={`px-3 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                  flag.enabled ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-slate-700 border-slate-600 text-gray-200'
                }`}
              >
                {saving === flag.name ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : flag.enabled ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                <span>{flag.enabled ? 'Enabled' : 'Disabled'}</span>
              </button>
            </div>
          ))}
          {!loading && flags.length === 0 && (
            <div className="p-6 text-center text-gray-400">No feature flags found.</div>
          )}
        </div>

        <div className="text-gray-400 text-xs">Toggler identity: admin-system</div>
      </div>
    </div>
  );
}
