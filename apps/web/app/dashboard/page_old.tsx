'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Database,
  Key,
  Shield,
  Activity,
  User,
  Mail,
  FileText,
  Lock,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import VaultEntryForm from '@/components/vault/VaultEntryForm';
import DeleteConfirmModal from '@/components/vault/DeleteConfirmModal';
import type { VaultEntry } from '@/lib/api';
import { getVaultEntries, getCategoryCounts } from '@/lib/api';

// StatCard Component
interface StatCardProps {
  label: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  trend: 'up' | 'down';
}

function StatCard({ label, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white/5 rounded-xl">
          <Icon className="w-5 h-5 text-white/80" />
        </div>
        <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{change}</span>
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/40">{label}</div>
    </GlassCard>
  );
}

// VaultItem Component (Overview - Simple)
interface VaultItemProps {
  entry: VaultEntry;
  icon: React.ElementType;
}

function VaultItem({ entry, icon: Icon }: VaultItemProps) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon className="w-4 h-4 text-white/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/80 truncate">{entry.title}</div>
          <div className="text-xs text-white/40">{entry.category}</div>
        </div>
        <Lock className="w-3 h-3 text-emerald-400" />
      </div>
      
      {entry.fields.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">{entry.fields[0].fieldKey}</span>
            <span className="text-white/60 font-mono">••••••••</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// RecentAccess Component
function RecentAccess() {
  const recentAccess = [
    { app: 'Mobile Banking', fields: 3, time: '2 minutes ago', status: 'active' as const },
    { app: 'Email Client', fields: 2, time: '1 hour ago', status: 'active' as const },
    { app: 'Healthcare Portal', fields: 5, time: '3 hours ago', status: 'expired' as const },
    { app: 'Shopping App', fields: 4, time: 'Yesterday', status: 'active' as const },
    { app: 'Social Network', fields: 1, time: '2 days ago', status: 'revoked' as const },
  ];

  const statusVariants = {
    active: 'success' as const,
    expired: 'warning' as const,
    revoked: 'danger' as const,
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-sm font-semibold mb-4 text-white/80">Recent Access</h3>
      <div className="space-y-3">
        {recentAccess.map((access, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div className="flex-1">
              <div className="text-sm font-medium text-white/80">{access.app}</div>
              <div className="text-xs text-white/40">{access.fields} fields accessed • {access.time}</div>
            </div>
            <Badge variant={statusVariants[access.status]}>{access.status}</Badge>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default function DashboardPage() {
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, tokens: 3, requests: 12, health: 98 });
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);

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
        total: entriesResponse.meta?.total || 0,
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

  // Map category to icon
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ElementType> = {
      PROFILE: User,
      CONTACT: Mail,
      DOCUMENT: FileText,
      CREDENTIAL: Key,
      NOTE: FileText,
      OTHER: FileText,
    };
    return icons[category] || FileText;
  };

  return (
    <DashboardLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard label="Data Fields" value={stats.total} change="+12%" icon={Database} trend="up" />
        <StatCard label="Active Tokens" value={stats.tokens} change="+8%" icon={Key} trend="up" />
        <StatCard label="Access Requests" value={stats.requests} change="-5%" icon={Shield} trend="down" />
        <StatCard label="Vault Health" value={`${stats.health}%`} change="+2%" icon={Activity} trend="up" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Vault Data Section - 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Quick Access Vault</h2>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/vault"
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-all flex items-center gap-2"
              >
                View All in My Vault
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Button variant="primary" className="gap-2" onClick={handleAddClick}>
                <Plus className="w-4 h-4" />
                Add Data
              </Button>
            </div>
          </div>
          
          {loading ? (
            <GlassCard className="p-6">
              <div className="text-center py-12">
                <p className="text-white/60">Loading vault data...</p>
              </div>
            </GlassCard>
          ) : vaultEntries.length === 0 ? (
            <GlassCard className="p-6">
              <div className="text-center py-12">
                <Database className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No vault entries yet</p>
                <p className="text-white/40 text-sm">Create your first entry to secure your data</p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultEntries.slice(0, 6).map((entry) => {
                const Icon = getCategoryIcon(entry.category);
                
                return (
                  <VaultItem
                    key={entry.id}
                    entry={entry}
                    icon={Icon}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Active Tokens */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-white/80">Active Tokens</h3>
            <div className="space-y-3">
              {[
                { app: 'Mobile Banking', fields: 3, expires: '2 days' },
                { app: 'Healthcare Portal', fields: 5, expires: '5 days' },
                { app: 'Shopping App', fields: 4, expires: '7 days' },
              ].map((token, idx) => (
                <div key={idx} className="p-3 bg-white/3 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/80">{token.app}</span>
                    <Badge variant="success">{token.expires}</Badge>
                  </div>
                  <div className="text-xs text-white/40">{token.fields} fields shared</div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-white/80">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full">Add Data</Button>
              <Button variant="outline" className="w-full">New Token</Button>
              <Button variant="outline" className="w-full">Revoke All</Button>
              <Button variant="outline" className="w-full">Export</Button>
            </div>
          </GlassCard>

          {/* Recent Access */}
          <RecentAccess />
        </div>
      </div>

      {/* Vault Entry Form Modal */}
      <VaultEntryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        entry={editingEntry}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        entry={deletingEntry}
      />
    </DashboardLayout>
  );
}
