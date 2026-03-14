'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  Shield,
  Zap,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ThirdPartyApp {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  status: 'ACTIVE' | 'BLOCKED';
  redirectUris: string[];
  createdAt: string;
  updatedAt: string;
  clientSecret?: string; // Only shown once during creation
}

interface CreateAppForm {
  name: string;
  description: string;
  redirectUris: string[];
}

export default function DeveloperPortal() {
  const [apps, setApps] = useState<ThirdPartyApp[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [createForm, setCreateForm] = useState<CreateAppForm>({
    name: '',
    description: '',
    redirectUris: [''],
  });

  // Fetch apps on component mount
  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/third-party-apps', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setApps(data.data || []);
      }
    } catch {
      alert('Failed to fetch apps');
    }
  };

  const createApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/third-party-apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...createForm,
          redirectUris: createForm.redirectUris.filter(uri => uri.trim()),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Add the new app with the clientSecret (only shown once)
        setApps([data.data, ...apps]);
        setShowCreateForm(false);
        setCreateForm({ name: '', description: '', redirectUris: [''] });
      } else {
        alert(data.message || 'Failed to create app');
      }
    } catch {
      alert('Failed to create app');
    } finally {
      setLoading(false);
    }
  };

  const rotateSecret = async (appId: string) => {
    if (!confirm('Are you sure you want to rotate the client secret? This will invalidate the current secret.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/third-party-apps/${appId}/rotate-secret`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        // Update the app with new secret
        setApps(apps.map(app => 
          app.id === appId ? { ...data.data, clientSecret: data.data.clientSecret } : app
        ));
        alert('Client secret rotated successfully! Save the new secret securely.');
      } else {
        alert(data.message || 'Failed to rotate secret');
      }
    } catch {
      alert('Failed to rotate secret');
    }
  };

  const changeStatus = async (appId: string, status: 'ACTIVE' | 'BLOCKED') => {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this app?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/third-party-apps/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (response.ok) {
        setApps(apps.map(app => 
          app.id === appId ? { ...app, status: data.data.status } : app
        ));
      } else {
        alert(data.message || 'Failed to change status');
      }
    } catch {
      alert('Failed to change status');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleSecretVisibility = (appId: string) => {
    setRevealedSecrets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const addRedirectUri = () => {
    setCreateForm(prev => ({
      ...prev,
      redirectUris: [...prev.redirectUris, ''],
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setCreateForm(prev => ({
      ...prev,
      redirectUris: prev.redirectUris.map((uri, i) => i === index ? value : uri),
    }));
  };

  const removeRedirectUri = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      redirectUris: prev.redirectUris.filter((_, i) => i !== index),
    }));
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Developer Portal</h1>
          <p className="text-sm text-white/40">Manage your third-party applications and API credentials.</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Key} label="Applications" value={apps.length.toString()} />
        <StatCard icon={Zap} label="Active Apps" value={apps.filter(app => app.status === 'ACTIVE').length.toString()} />
        <StatCard icon={Shield} label="Total API Calls" value="0" />
        <StatCard icon={Check} label="Success Rate" value="100%" />
      </div>

      {/* Create App Button */}
      <div className="mb-6">
        <Button 
          variant="primary" 
          onClick={() => setShowCreateForm(true)}
          className="mb-4"
        >
          <Plus className="w-3.5 h-3.5" />
          Create New Application
        </Button>
      </div>

      {/* Create App Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-xl bg-white/5 border border-white/10"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Create New Application</h2>
          <form onSubmit={createApp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Application Name</label>
              <input
                type="text"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                placeholder="My Application"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Description (Optional)</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                rows={3}
                placeholder="Describe your application..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Redirect URIs</label>
              {createForm.redirectUris.map((uri, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    required={index === 0}
                    value={uri}
                    onChange={(e) => updateRedirectUri(index, e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                    placeholder="https://yourapp.com/callback"
                  />
                  {createForm.redirectUris.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeRedirectUri(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addRedirectUri}
                className="mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Redirect URI
              </Button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading} variant="primary">
                Create Application
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {apps.map((app) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{app.name}</div>
                  <div className="text-[10px] text-white/30">Created {new Date(app.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                app.status === 'ACTIVE' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              )}>
                {app.status}
              </div>
            </div>

            {/* Client ID */}
            <div className="mb-4">
              <label className="text-xs text-white/40 mb-1 block">Client ID</label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-white/5">
                <code className="flex-1 text-xs font-mono text-white/50 truncate">
                  {app.clientId}
                </code>
                <button
                  onClick={() => copyToClipboard(app.clientId)}
                  className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-white/30" />
                </button>
              </div>
            </div>

            {/* Client Secret (only shown once) */}
            {app.clientSecret && (
              <div className="mb-4">
                <label className="text-xs text-white/40 mb-1 block">Client Secret (Save this securely!)</label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-white/5">
                  <code className="flex-1 text-xs font-mono text-white/50 truncate">
                    {revealedSecrets.has(app.id) ? (app.clientSecret || '') : (app.clientSecret || '').slice(0, 8) + '••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => toggleSecretVisibility(app.id)}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                  >
                    {revealedSecrets.has(app.id) ? 
                      <EyeOff className="w-3.5 h-3.5 text-white/30" /> : 
                      <Eye className="w-3.5 h-3.5 text-white/30" />
                    }
                  </button>
                  <button
                    onClick={() => copyToClipboard(app.clientSecret || '')}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => rotateSecret(app.id)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Rotate Secret
              </Button>
              <Button 
                variant={app.status === 'ACTIVE' ? 'danger' : 'primary'}
                size="sm"
                onClick={() => changeStatus(app.id, app.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE')}
              >
                {app.status === 'ACTIVE' ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                {app.status === 'ACTIVE' ? 'Block' : 'Activate'}
              </Button>
            </div>
          </motion.div>
        ))}

        {apps.length === 0 && !showCreateForm && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No applications yet</h3>
            <p className="text-sm text-white/40 mb-4">Create your first third-party application to get started.</p>
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-3.5 h-3.5" />
              Create Application
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Helper component for stats
function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="p-5 rounded-xl bg-white/2 border border-white/5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/60" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}
