'use client';

import { useState } from 'react';
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
  Activity,
  Shield,
  Zap,
  ExternalLink,
  RefreshCw,
  TrendingUp,
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

// ==================== CHART DATA ====================

const apiUsageData = [
  { day: '06', calls: 1200 },
  { day: '07', calls: 1800 },
  { day: '08', calls: 1400 },
  { day: '09', calls: 2200 },
  { day: '10', calls: 1950 },
  { day: '11', calls: 2800 },
  { day: '12', calls: 2400 },
  { day: '13', calls: 3100 },
];

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
  name,
  keyValue,
  created,
  lastUsed,
  calls,
  status,
}: {
  name: string;
  keyValue: string;
  created: string;
  lastUsed: string;
  calls: string;
  status: 'active' | 'expired';
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="p-5 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-white/50" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{name}</div>
            <div className="text-[10px] text-white/30">Created {created}</div>
          </div>
        </div>
        <Badge variant={status === 'active' ? 'success' : 'danger'}>{status}</Badge>
      </div>

      {/* Key Value */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-white/5 mb-4">
        <code className="flex-1 text-xs font-mono text-white/50 truncate">
          {revealed ? keyValue : keyValue.slice(0, 8) + '••••••••••••••••••••••••'}
        </code>
        <button
          onClick={() => setRevealed(!revealed)}
          className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5 text-white/30" /> : <Eye className="w-3.5 h-3.5 text-white/30" />}
        </button>
        <button className="p-1.5 rounded-md hover:bg-white/5 transition-colors">
          <Copy className="w-3.5 h-3.5 text-white/30" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-xs text-white/30">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Last used: {lastUsed}
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          {calls} calls
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
        <Button variant="ghost" size="sm">
          <RefreshCw className="w-3.5 h-3.5" />
          Rotate
        </Button>
        <Button variant="danger" size="sm">
          <Trash2 className="w-3.5 h-3.5" />
          Revoke
        </Button>
      </div>
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
        <StatCard icon={Key} label="API Keys" value="3" />
        <StatCard icon={Zap} label="Total Calls (24h)" value="3,142" change="+18%" trend="up" />
        <StatCard icon={Clock} label="Avg Response" value="48ms" change="-12%" trend="up" />
        <StatCard icon={Check} label="Success Rate" value="99.8%" />
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
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            Create Key
          </Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <ApiKeyCard
            name="Production Key"
            keyValue="dv_sk_live_a8f72c9e4b1d6f3a2e8c7d5b9f0a1e3d4c6b8a2f7e9d1c5b3a8f4"
            created="Jan 15, 2026"
            lastUsed="2 min ago"
            calls="28.4K"
            status="active"
          />
          <ApiKeyCard
            name="Staging Key"
            keyValue="dv_sk_test_7b3e9a1f4d8c2e6a0f5b8d3c7e1a9f4b2d6c8a0e3f5b7d1c9a2e8"
            created="Jan 20, 2026"
            lastUsed="1 hour ago"
            calls="4.2K"
            status="active"
          />
          <ApiKeyCard
            name="Legacy Key"
            keyValue="dv_sk_live_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7"
            created="Dec 10, 2025"
            lastUsed="30 days ago"
            calls="156"
            status="expired"
          />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WebhooksSection />
        <DocLinks />
      </div>
    </DashboardLayout>
  );
}
