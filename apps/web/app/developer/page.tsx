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
  Clock,
  Check,
  Code2,
  Terminal,
  BookOpen,
  Webhook,
  Shield,
  Zap,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { LucideProps } from 'lucide-react';

type IconComponent = React.ComponentType<LucideProps>;

// ==================== TYPES ====================

interface ThirdPartyApp {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  status: 'ACTIVE' | 'BLOCKED';
  redirectUris: string[];
  createdAt: string;
  updatedAt: string;
  clientSecret?: string; // Only returned once on creation/rotation
}

interface CreateAppForm {
  name: string;
  description: string;
  redirectUris: string[];
}

// ==================== API SERVICE ====================

class ApiService {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getApps(): Promise<{ data: ThirdPartyApp[] }> {
    return this.request('/api/third-party-apps');
  }

  async createApp(data: CreateAppForm): Promise<{ data: ThirdPartyApp & { clientSecret: string } }> {
    return this.request('/api/third-party-apps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async rotateSecret(id: string): Promise<{ data: ThirdPartyApp & { clientSecret: string } }> {
    return this.request(`/api/third-party-apps/${id}/rotate-secret`, {
      method: 'PATCH',
    });
  }

  async updateApp(
    id: string,
    data: CreateAppForm,
  ): Promise<{ data: ThirdPartyApp }> {
    return this.request(`/api/third-party-apps/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changeStatus(id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<{ data: ThirdPartyApp }> {
    return this.request(`/api/third-party-apps/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

const apiService = new ApiService();

// ==================== CHART DATA ====================

const generateMockData = () => [
  { day: '06', calls: Math.floor(Math.random() * 2000) + 1000 },
  { day: '07', calls: Math.floor(Math.random() * 2000) + 1000 },
  { day: '08', calls: Math.floor(Math.random() * 2000) + 1000 },
  { day: '09', calls: Math.floor(Math.random() * 2000) + 1000 },
  { day: '10', calls: Math.floor(Math.random() * 2000) + 1000 },
  { day: '11', calls: Math.floor(Math.random() * 2000) + 1000 },
  { day: '12', calls: Math.floor(Math.random() * 2000) + 1000 },
  { day: '13', calls: Math.floor(Math.random() * 2000) + 1000 },
];

const apiUsageData = generateMockData();

// ==================== CHART TOOLTIP ====================

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[10px] text-white/40 mb-1">Feb {label}</div>
      <div className="text-sm font-bold text-white">{payload[0]?.value?.toLocaleString()} calls</div>
    </div>
  );
}

// ==================== API KEY CARD ====================

function ApiKeyCard({
  app,
  onRotateSecret,
  onChangeStatus,
  onEdit,
}: {
  app: ThirdPartyApp & { clientSecret?: string };
  onRotateSecret: (id: string) => void;
  onChangeStatus: (id: string, status: 'ACTIVE' | 'BLOCKED') => void;
  onEdit: (app: ThirdPartyApp) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusVariant = (status: string) => {
    return status === 'ACTIVE' ? 'success' : 'danger';
  };

  return (
    <div className="p-5 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-white/50" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{app.name}</div>
            <div className="text-[10px] text-white/30">Created {formatDate(app.createdAt)}</div>
          </div>
        </div>
        <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
      </div>

      {/* Client ID */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-white/5 mb-4">
        <code className="flex-1 text-xs font-mono text-white/50 truncate">
          {revealed && app.clientSecret ? app.clientSecret : app.clientId}
        </code>
        {app.clientSecret && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            {revealed ? <EyeOff className="w-3.5 h-3.5 text-white/30" /> : <Eye className="w-3.5 h-3.5 text-white/30" />}
          </button>
        )}
        <button 
          onClick={() => handleCopy(app.clientSecret || app.clientId)}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/30" />}
        </button>
      </div>

      {/* App Info */}
      {app.description && (
        <div className="mb-3">
          <p className="text-xs text-white/40">{app.description}</p>
        </div>
      )}

      {/* Redirect URIs */}
      {app.redirectUris.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] text-white/30 mb-1">Redirect URIs:</div>
          {app.redirectUris.slice(0, 2).map((uri, index) => (
            <code key={index} className="block text-xs font-mono text-white/20 truncate mb-1">
              {uri}
            </code>
          ))}
          {app.redirectUris.length > 2 && (
            <div className="text-[10px] text-white/20">
              +{app.redirectUris.length - 2} more
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(app)}
        >
          <Code2 className="w-3.5 h-3.5" />
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onRotateSecret(app.id)}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Rotate
        </Button>
        <Button 
          variant={app.status === 'ACTIVE' ? 'danger' : 'primary'} 
          size="sm"
          onClick={() => onChangeStatus(app.id, app.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE')}
        >
          {app.status === 'ACTIVE' ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          {app.status === 'ACTIVE' ? 'Block' : 'Activate'}
        </Button>
      </div>
    </div>
  );
}

// ==================== CREATE APP MODAL ====================

function CreateAppModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateAppForm) => Promise<void>;
}) {
  const [formData, setFormData] = useState<CreateAppForm>({
    name: '',
    description: '',
    redirectUris: ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validUris = formData.redirectUris.filter(uri => uri.trim());
      await onCreate({
        ...formData,
        redirectUris: validUris
      });
      setFormData({ name: '', description: '', redirectUris: [''] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create app');
    } finally {
      setLoading(false);
    }
  };

  const addRedirectUri = () => {
    setFormData(prev => ({
      ...prev,
      redirectUris: [...prev.redirectUris, '']
    }));
  };

  const removeRedirectUri = (index: number) => {
    setFormData(prev => ({
      ...prev,
      redirectUris: prev.redirectUris.filter((_, i) => i !== index)
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      redirectUris: prev.redirectUris.map((uri, i) => i === index ? value : uri)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Create New App</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                App Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                placeholder="My Application"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                placeholder="Describe your application..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Redirect URIs *
              </label>
              {formData.redirectUris.map((uri, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    required={index === 0}
                    value={uri}
                    onChange={(e) => updateRedirectUri(index, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                    placeholder="https://yourapp.com/callback"
                  />
                  {formData.redirectUris.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRedirectUri(index)}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRedirectUri}
                className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-colors text-sm"
              >
                + Add Redirect URI
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="flex-1"
              >
                Create App
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ==================== SECRET DISPLAY MODAL ====================

function SecretDisplayModal({ 
  clientSecret, 
  onClose 
}: {
  clientSecret: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(clientSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Client Secret Generated</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-400">
                Save this secret securely. It won&apos;t be shown again.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <code className="text-xs font-mono text-white break-all">{clientSecret}</code>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleCopy}
            className="w-full"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Secret
              </>
            )}
          </Button>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ==================== EDIT APP MODAL ====================

function EditAppModal({
  app,
  onClose,
  onUpdate,
}: {
  app: ThirdPartyApp;
  onClose: () => void;
  onUpdate: (data: CreateAppForm) => Promise<void>;
}) {
  const [formData, setFormData] = useState<CreateAppForm>({
    name: app.name,
    description: app.description || '',
    redirectUris: app.redirectUris.length > 0 ? app.redirectUris : [''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const validUris = formData.redirectUris.filter((uri) => uri.trim());
      await onUpdate({
        ...formData,
        redirectUris: validUris,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update app');
    } finally {
      setLoading(false);
    }
  };

  const addRedirectUri = () => {
    setFormData((prev) => ({
      ...prev,
      redirectUris: [...prev.redirectUris, ''],
    }));
  };

  const removeRedirectUri = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      redirectUris: prev.redirectUris.filter((_, i) => i !== index),
    }));
  };

  const updateRedirectUri = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      redirectUris: prev.redirectUris.map((uri, i) => (i === index ? value : uri)),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Edit App</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                App Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                placeholder="My Application"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                placeholder="Describe your application..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Redirect URIs *
              </label>
              {formData.redirectUris.map((uri, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    required={index === 0}
                    value={uri}
                    onChange={(e) => updateRedirectUri(index, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                    placeholder="https://yourapp.com/callback"
                  />
                  {formData.redirectUris.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRedirectUri(index)}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRedirectUri}
                className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-colors text-sm"
              >
                + Add Redirect URI
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={loading} className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ==================== CODE SNIPPET ====================

function CodeSnippet() {
  const code = `// Fetch user's vault data with scoped token
const response = await fetch('https://api.datavault.io/v1/vault', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer dv_sk_live_...',
    'X-Scope': 'name,email',
    'X-Token-TTL': '3600'
  }
});

const data = await response.json();
// { name: "Wassim", email: "wassim@..." }`;

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Quick Start</h3>
        </div>
        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Copy className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>
      <pre className="p-4 rounded-lg bg-black/50 border border-white/5 overflow-x-auto">
        <code className="text-xs font-mono text-white/60 leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </GlassCard>
  );
}

// ==================== WEBHOOK CONFIG ====================

function WebhooksSection() {
  const webhooks = [
    { url: 'https://myapp.com/webhook/vault', events: ['token.created', 'token.revoked'], status: 'active' as const },
    { url: 'https://myapp.com/webhook/access', events: ['data.accessed'], status: 'active' as const },
    { url: 'https://staging.myapp.com/hook', events: ['*'], status: 'inactive' as const },
  ];

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Webhook className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Webhooks</h3>
            <p className="text-[10px] text-white/30">Receive real-time event notifications</p>
          </div>
        </div>
        <Button variant="secondary" size="sm">
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
      <div className="space-y-3">
        {webhooks.map((hook, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5">
            <div className="flex-1 min-w-0">
              <code className="text-xs font-mono text-white/60 truncate block">{hook.url}</code>
              <div className="flex items-center gap-2 mt-1">
                {hook.events.map((event) => (
                  <span key={event} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 font-mono">
                    {event}
                  </span>
                ))}
              </div>
            </div>
            <Badge variant={hook.status === 'active' ? 'success' : 'default'}>{hook.status}</Badge>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ==================== DOC LINKS ====================

function DocLinks() {
  const docs = [
    { icon: BookOpen, title: 'Getting Started', desc: 'Quick start guide and authentication', color: 'bg-blue-500/10 text-blue-400' },
    { icon: Code2, title: 'API Reference', desc: 'Full REST API documentation', color: 'bg-indigo-500/10 text-indigo-400' },
    { icon: Key, title: 'Authentication', desc: 'Token scoping, TTL, and permissions', color: 'bg-emerald-500/10 text-emerald-400' },
    { icon: Shield, title: 'Security', desc: 'Encryption, zero-knowledge architecture', color: 'bg-purple-500/10 text-purple-400' },
  ];

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Documentation</h3>
        <button className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
          View all <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map((doc) => {
          const Icon = doc.icon;
          return (
            <motion.button
              key={doc.title}
              className="flex items-start gap-3 p-4 rounded-xl bg-white/2 border border-white/5 hover:bg-white/4 hover:border-white/10 transition-all text-left group"
              whileHover={{ scale: 1.02 }}
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', doc.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-white group-hover:text-white/90">{doc.title}</div>
                <div className="text-[10px] text-white/30">{doc.desc}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ==================== STAT CARD ====================

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  change?: string;
  icon: IconComponent;
  trend?: 'up' | 'down';
}) {
  return (
    <GlassCard className="p-5" hover={false}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/60" />
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1',
              trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            )}
          >
            <TrendingUp className={cn('w-3 h-3', trend === 'down' && 'rotate-180')} />
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </GlassCard>
  );
}

// ==================== MAIN DEVELOPER PORTAL ====================

export default function DeveloperPortal() {
  const [apps, setApps] = useState<ThirdPartyApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientSecret, setNewClientSecret] = useState<string | null>(null);
  const [editingApp, setEditingApp] = useState<ThirdPartyApp | null>(null);

  // Load apps on mount
  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const response = await apiService.getApps();
      setApps(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApp = async (data: CreateAppForm) => {
    try {
      const response = await apiService.createApp(data);
      // Add the new app with its secret
      setApps(prev => [response.data, ...prev]);
      // Show the secret modal
      setNewClientSecret(response.data.clientSecret);
    } catch (err) {
      throw err;
    }
  };

  const handleRotateSecret = async (appId: string) => {
    try {
      const response = await apiService.rotateSecret(appId);
      // Update the app with new secret
      setApps(prev => prev.map(app => 
        app.id === appId 
          ? { ...response.data, clientSecret: response.data.clientSecret }
          : app
      ));
      // Show the secret modal
      setNewClientSecret(response.data.clientSecret);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to rotate secret');
    }
  };

  const handleChangeStatus = async (appId: string, status: 'ACTIVE' | 'BLOCKED') => {
    try {
      const response = await apiService.changeStatus(appId, status);
      // Update the app status
      setApps(prev => prev.map(app => 
        app.id === appId ? response.data : app
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to change status');
    }
  };

  const handleEditApp = (app: ThirdPartyApp) => {
    setEditingApp(app);
  };

  const handleUpdateApp = async (data: CreateAppForm) => {
    if (!editingApp) return;

    try {
      const response = await apiService.updateApp(editingApp.id, data);
      setApps(prev => prev.map(app => 
        app.id === editingApp.id ? response.data : app
      ));
      setEditingApp(null);
    } catch (err) {
      throw err;
    }
  };

  const totalCalls = Math.floor(Math.random() * 5000) + 1000; // Mock data for now
  const avgResponse = Math.floor(Math.random() * 100) + 20; // Mock data for now
  const successRate = 99.8; // Mock data for now

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Developer Portal</h1>
          <p className="text-sm text-white/40">Manage API keys, monitor usage, and integrate with DataVault.</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Key} label="API Keys" value={apps.length.toString()} />
        <StatCard icon={Zap} label="Total Calls (24h)" value={totalCalls.toLocaleString()} change="+18%" trend="up" />
        <StatCard icon={Clock} label="Avg Response" value={`${avgResponse}ms`} change="-12%" trend="up" />
        <StatCard icon={Check} label="Success Rate" value={`${successRate}%`} />
      </div>

      {/* API Usage Chart */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">API Usage</h3>
                <p className="text-[10px] text-white/30">Last 8 days</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                API Calls
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={apiUsageData}>
                  <defs>
                    <linearGradient id="apiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="calls" stroke="#06b6d4" strokeWidth={2} fill="url(#apiGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Quick Start Code */}
        <CodeSnippet />
      </div>

      {/* API Keys */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">API Keys</h2>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Key
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white/40">Loading apps...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400">{error}</div>
            <Button variant="ghost" size="sm" onClick={loadApps} className="mt-2">
              Retry
            </Button>
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/40 mb-4">No apps created yet</div>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Your First App
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {apps.map((app) => (
              <ApiKeyCard
                key={app.id}
                app={app}
                onRotateSecret={handleRotateSecret}
                onChangeStatus={handleChangeStatus}
                onEdit={handleEditApp}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WebhooksSection />
        <DocLinks />
      </div>

      {/* Modals */}
      <CreateAppModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateApp}
      />
      
      {newClientSecret && (
        <SecretDisplayModal
          clientSecret={newClientSecret}
          onClose={() => setNewClientSecret(null)}
        />
      )}

      {editingApp && (
        <EditAppModal
          app={editingApp}
          onClose={() => setEditingApp(null)}
          onUpdate={handleUpdateApp}
        />
      )}
    </DashboardLayout>
  );
}
