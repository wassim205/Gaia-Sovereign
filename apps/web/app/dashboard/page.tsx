'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Key,
  Shield,
  Activity,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  FileText,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
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

// VaultItem Component
interface VaultItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  encrypted: boolean;
  isRevealed: boolean;
  onToggle: () => void;
}

function VaultItem({ icon: Icon, label, value, encrypted, isRevealed, onToggle }: VaultItemProps) {
  const displayValue = encrypted && !isRevealed ? '•'.repeat(20) : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
          <span className="text-sm font-medium text-white/80">{label}</span>
        </div>
        {encrypted && <Lock className="w-3 h-3 text-emerald-400" />}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-sm text-white/60 font-mono truncate">{displayValue}</div>
        <div className="flex gap-1">
          {encrypted && (
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-white/60" /> : <Eye className="w-3.5 h-3.5 text-white/60" />}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
      </div>
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
  const [revealedFields, setRevealedFields] = useState<string[]>([]);
  const [vaultEntries, setVaultEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const entries = await getVaultEntries({ page: 1, limit: 6 });
      setVaultEntries(entries.data || []);
    } catch (error) {
      showToast('Failed to load vault data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (fieldId: string) => {
    setRevealedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  // Mock data for demo (will be replaced with real API data)
  const mockVaultData = [
    { id: '1', icon: User, label: 'Full Name', value: 'Wassim El Mourabit', encrypted: false },
    { id: '2', icon: Mail, label: 'Email Address', value: 'wassim@example.com', encrypted: true },
    { id: '3', icon: Phone, label: 'Phone Number', value: '+1-234-567-8900', encrypted: true },
    { id: '4', icon: CreditCard, label: 'Credit Card', value: '4532-****-****-1234', encrypted: true },
    { id: '5', icon: MapPin, label: 'Home Address', value: '123 Main St, City, State 12345', encrypted: true },
    { id: '6', icon: FileText, label: 'Passport ID', value: 'AB123456789', encrypted: true },
  ];

  return (
    <DashboardLayout>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard label="Data Fields" value={6} change="+12%" icon={Database} trend="up" />
        <StatCard label="Active Tokens" value={3} change="+8%" icon={Key} trend="up" />
        <StatCard label="Access Requests" value={12} change="-5%" icon={Shield} trend="down" />
        <StatCard label="Vault Health" value="98%" change="+2%" icon={Activity} trend="up" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Vault Data Section - 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Vault</h2>
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Data
            </Button>
          </div>
          
          {loading ? (
            <GlassCard className="p-6">
              <div className="text-center py-12">
                <p className="text-white/60">Loading vault data...</p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockVaultData.map((item) => (
                <VaultItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  encrypted={item.encrypted}
                  isRevealed={revealedFields.includes(item.id)}
                  onToggle={() => toggleReveal(item.id)}
                />
              ))}
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
    </DashboardLayout>
  );
}
