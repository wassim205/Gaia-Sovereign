'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Database,
  Key,
  Clock,
  Check,
  Activity,
  User,
  Mail,
  FileText,
  Plus,
  ArrowUpRight,
  Copy,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import VaultEntryForm from '@/components/vault/VaultEntryForm';
import DeleteConfirmModal from '@/components/vault/DeleteConfirmModal';
import { getVaultEntries, getCategoryCounts } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

import type { LucideProps } from 'lucide-react';
import type { VaultEntry } from '@/lib/api';

type IconComponent = React.ComponentType<LucideProps>;

// Generate encrypted-looking hex string from actual value (deterministic)
const generateEncryptedDisplay = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Generate 16 hex characters based on hash
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return (hex + hex).substring(0, 16) + '...';
};

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
              'text-xs font-medium px-2 py-1 rounded-lg',
              trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            )}
          >
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </GlassCard>
  );
}

// ==================== VAULT ITEM ====================

function VaultItem({
  icon: Icon,
  label,
  value,
  encrypted,
  isRevealed,
  onToggle,
}: {
  icon: IconComponent;
  label: string;
  value: string;
  encrypted: string;
  isRevealed: boolean;
  onToggle: () => void;
}) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <motion.div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all',
        'bg-white/2 border-white/5 hover:border-white/10'
      )}
      whileHover={{ scale: 1.005 }}
    >
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-white/50" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1">{label}</div>
        {isRevealed ? (
          <div className="text-sm font-medium text-white truncate">{value}</div>
        ) : (
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-white/20" />
            <code className="text-xs text-white/20 font-mono">{encrypted}</code>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          {isRevealed ? (
            <EyeOff className="w-4 h-4 text-white/40" />
          ) : (
            <Eye className="w-4 h-4 text-white/40" />
          )}
        </button>
        <button 
          onClick={handleCopy}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Copy className="w-4 h-4 text-white/40" />
        </button>
      </div>
    </motion.div>
  );
}

// ==================== RECENT ACCESS ====================

function RecentAccess() {
  const accesses = [
    { app: 'ShopNow', fields: ['Name', 'Email'], time: '2 min ago', status: 'active' as const },
    { app: 'DeliverIt', fields: ['Name', 'Phone', 'Address'], time: '1 hour ago', status: 'active' as const },
    { app: 'SocialHub', fields: ['Name', 'Email'], time: '3 hours ago', status: 'expired' as const },
    { app: 'BankApp', fields: ['Name', 'ID Document'], time: '1 day ago', status: 'revoked' as const },
    { app: 'HealthCare', fields: ['Name', 'Phone'], time: '2 days ago', status: 'expired' as const },
  ];

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Recent Access</h3>
        <button className="text-xs text-white/30 hover:text-white/60 transition-colors">View all</button>
      </div>
      <div className="space-y-3">
        {accesses.map((access, i) => (
          <motion.div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/70">
                {access.app[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{access.app}</div>
                <div className="text-[10px] text-white/30">{access.fields.join(' · ')}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/20">{access.time}</span>
              <Badge variant={access.status === 'active' ? 'success' : access.status === 'expired' ? 'warning' : 'danger'}>
                {access.status}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

// ==================== MAIN DASHBOARD ====================

export default function UserDashboard() {
  const [revealedFields, setRevealedFields] = useState<string[]>([]);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, tokens: 3, requests: 12, health: 98 });
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);

  // Get user data
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.username || 'User');
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [entriesResponse] = await Promise.all([
        getVaultEntries({ page: 1, limit: 10 }),
        getCategoryCounts().catch(() => []),
      ]);
      
      setVaultEntries(entriesResponse.data || []);
      setStats(prev => ({
        ...prev,
        total: entriesResponse.data?.length || 0,
      }));
    } catch (err) {
      showToast('Failed to load vault data', 'error');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    fetchDashboardData();
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleAddClick = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchDashboardData();
    setIsDeleteModalOpen(false);
    setDeletingEntry(null);
  };

  // Map vault entries to display format
  const vaultItems = vaultEntries.slice(0, 6).map((entry) => {
    const iconMap: Record<string, IconComponent> = {
      PROFILE: User,
      CONTACT: Mail,
      DOCUMENT: FileText,
      CREDENTIAL: Key,
      NOTE: FileText,
      OTHER: Database,
    };

    const firstField = entry.fields[0];
    return {
      icon: iconMap[entry.category] || Database,
      label: entry.title,
      value: firstField?.value || 'No data',
      encrypted: firstField?.value ? generateEncryptedDisplay(firstField.value) : '...',
    };
  });

  const toggleField = (label: string) => {
    setRevealedFields((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {userName}</h1>
          <p className="text-sm text-white/40">Your vault is secure. Here&apos;s your overview.</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Database} label="Data Fields" value={stats.total.toString()} change="+1" trend="up" />
        <StatCard icon={Key} label="Active Tokens" value={stats.tokens.toString()} change="-2" trend="down" />
        <StatCard icon={Shield} label="Access Requests" value={stats.requests.toString()} change="+4" trend="up" />
        <StatCard icon={Activity} label="Vault Health" value={`${stats.health}%`} />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Vault Data */}
        <div className="lg:col-span-3">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5 text-white/60" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Your Encrypted Vault</h3>
                  <p className="text-[10px] text-white/30 font-mono">AES-256 • ZERO KNOWLEDGE</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAddClick}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Field
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-white/60">Loading vault data...</p>
              </div>
            ) : vaultItems.length === 0 ? (
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No vault entries yet</p>
                <p className="text-white/40 text-sm">Create your first entry to secure your data</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vaultItems.map((item) => (
                  <VaultItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    value={item.value}
                    encrypted={item.encrypted}
                    isRevealed={revealedFields.includes(item.label)}
                    onToggle={() => toggleField(item.label)}
                  />
                ))}
              </div>
            )}

            {/* Vault Info */}
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-400/80">
                All data is encrypted at rest with your personal key. No one else — including DataVault — can access it.
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tokens */}
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Active Tokens</h3>
              <Badge variant="success">3 active</Badge>
            </div>
            <div className="space-y-3">
              {[
                { app: 'ShopNow', fields: 3, expires: '23h 14m', color: 'from-blue-500 to-cyan-500' },
                { app: 'DeliverIt', fields: 3, expires: '18h 42m', color: 'from-green-500 to-emerald-500' },
                { app: 'SocialHub', fields: 2, expires: '6h 08m', color: 'from-purple-500 to-pink-500' },
              ].map((token, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg bg-linear-to-br flex items-center justify-center text-xs font-bold text-white', token.color)}>
                      {token.app[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{token.app}</div>
                      <div className="text-[10px] text-white/30">{token.fields} fields shared</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Clock className="w-3 h-3" />
                      {token.expires}
                    </div>
                    <button className="text-[10px] text-red-400 hover:text-red-300 mt-1 transition-colors">Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Plus, label: 'Add Data', color: 'bg-indigo-500/10 text-indigo-400', action: handleAddClick },
                { icon: Key, label: 'New Token', color: 'bg-emerald-500/10 text-emerald-400', action: () => {} },
                { icon: Unlock, label: 'Revoke All', color: 'bg-red-500/10 text-red-400', action: () => {} },
                { icon: ArrowUpRight, label: 'Export', color: 'bg-amber-500/10 text-amber-400', action: () => {} },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all text-left"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', action.color)}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-white/60">{action.label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Access */}
      <div className="mt-6">
        <RecentAccess />
      </div>

      {/* Modals */}
      {isFormOpen && (
        <VaultEntryForm
          isOpen={isFormOpen}
          entry={editingEntry}
          onSuccess={handleFormSuccess}
          onClose={() => {
            setIsFormOpen(false);
            setEditingEntry(null);
          }}
        />
      )}

      {isDeleteModalOpen && deletingEntry && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          entry={deletingEntry}
          onSuccess={handleDeleteSuccess}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingEntry(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
