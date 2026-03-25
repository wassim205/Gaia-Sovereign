'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  Eye,
  Search,
  MoreHorizontal,
  Server,
  Wifi,
  Lock,
  Ban,
  UserCheck,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { adminApi, type User, type DashboardStats, type SystemHealth, type AuditLog } from '@/lib/api';
import type { LucideProps } from 'lucide-react';

type IconComponent = React.ComponentType<LucideProps>;

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  trend,
  loading,
}: {
  label: string;
  value: string;
  change?: string;
  icon: IconComponent;
  trend?: 'up' | 'down';
  loading?: boolean;
}) {
  return (
    <GlassCard className="p-5" hover={false}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
          ) : (
            <Icon className="w-5 h-5 text-white/60" />
          )}
        </div>
        {change && !loading && (
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
      <div className="text-2xl font-bold text-white mb-1">
        {loading ? '-' : value}
      </div>
      <div className="text-xs text-white/40">{label}</div>
    </GlassCard>
  );
}

function UsersTable({ users, loading, onSuspend, onActivate }: {
  users: User[];
  loading: boolean;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Users</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-white/5 border border-white/5 rounded-lg text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 w-48"
            />
          </div>
          <Button variant="ghost" size="sm">
            <Filter className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-white/30">
            No users found
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] text-white/30 uppercase tracking-wider pb-3 font-medium">
                  User
                </th>
                <th className="text-left text-[10px] text-white/30 uppercase tracking-wider pb-3 font-medium">
                  Fields
                </th>
                <th className="text-left text-[10px] text-white/30 uppercase tracking-wider pb-3 font-medium">
                  Tokens
                </th>
                <th className="text-left text-[10px] text-white/30 uppercase tracking-wider pb-3 font-medium">
                  Status
                </th>
                <th className="text-left text-[10px] text-white/30 uppercase tracking-wider pb-3 font-medium">
                  Joined
                </th>
                <th className="text-left text-[10px] text-white/30 uppercase tracking-wider pb-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <motion.tr
                  key={user.id}
                  className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-[10px] text-white/30">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-white/60">{user.fieldsCount}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-white/60">{user.tokensCount}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={
                        user.status === 'active' ? 'success' : 'danger'
                      }
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-white/30">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() =>
                        user.status === 'active'
                          ? onSuspend(user.id)
                          : onActivate(user.id)
                      }
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      title={
                        user.status === 'active' ? 'Suspend user' : 'Activate user'
                      }
                    >
                      {user.status === 'active' ? (
                        <Ban className="w-4 h-4 text-red-400/70" />
                      ) : (
                        <UserCheck className="w-4 h-4 text-emerald-400/70" />
                      )}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </GlassCard>
  );
}

function SystemHealthComponent({ health, loading }: {
  health: SystemHealth | null;
  loading: boolean;
}) {
  const metrics = [
    {
      icon: Server,
      label: 'API Server',
      status: health?.apiServer.status || 'operational',
      uptime: health?.apiServer.uptime || 0,
    },
    {
      icon: Database,
      label: 'Database',
      status: health?.database.status || 'operational',
      uptime: health?.database.uptime || 0,
    },
    {
      icon: Lock,
      label: 'Auth Service',
      status: health?.authService.status || 'operational',
      uptime: health?.authService.uptime || 0,
    },
    {
      icon: Wifi,
      label: 'CDN',
      status: health?.cdn.status || 'operational',
      uptime: health?.cdn.uptime || 0,
    },
  ];

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">System Health</h3>
        <Badge variant="success">All Systems Nominal</Badge>
      </div>
      <div className="space-y-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white/50" />
                </div>
                <span className="text-sm text-white/70">{metric.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30 font-mono">
                  {loading ? '-' : `${(metric.uptime * 100).toFixed(2)}%`}
                </span>
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    metric.status === 'operational'
                      ? 'bg-emerald-500'
                      : metric.status === 'degraded'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function RecentAudit({ logs, loading }: {
  logs: AuditLog[];
  loading: boolean;
}) {
  const typeIcon: Record<string, IconComponent> = {
    'Data Accessed': Eye,
    'Token Created': UserCheck,
    'Token Revoked': Ban,
    'Account Suspended': AlertTriangle,
    'New User': UserCheck,
  };

  const getTypeVariant = (action: string): 'info' | 'warning' | 'danger' | 'success' => {
    if (action.includes('Revoked') || action.includes('Suspended'))
      return 'danger';
    if (action.includes('Created')) return 'success';
    if (action.includes('Accessed')) return 'info';
    return 'warning';
  };

  return (
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Recent Audit Log</h3>
        <button className="text-xs text-white/30 hover:text-white/60 transition-colors">
          View all
        </button>
      </div>
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-white/30 text-sm py-8">
            No audit logs available
          </div>
        ) : (
          logs.slice(0, 5).map((entry, i) => {
            const Icon = typeIcon[entry.action] || Eye;
            const variant = getTypeVariant(entry.action);
            const variantStyles = {
              info: 'bg-blue-500/10 text-blue-400',
              warning: 'bg-amber-500/10 text-amber-400',
              danger: 'bg-red-500/10 text-red-400',
              success: 'bg-emerald-500/10 text-emerald-400',
            };

            return (
              <motion.div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/2 border border-white/5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', variantStyles[variant])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {entry.action}
                  </div>
                  <div className="text-[10px] text-white/30">
                    {entry.actor} → {entry.target}
                  </div>
                </div>
                <span className="text-[10px] text-white/20 shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <div className="text-[10px] text-white/40 mb-1">{label}</div>
      <div className="text-sm font-bold text-white">
        {payload[0]?.value?.toLocaleString()}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsData, healthData, usersData, logsData] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getSystemHealth(),
          adminApi.getUsers(1, 10),
          adminApi.getAuditLogs(1, 5),
        ]);

        setStats(statsData);
        setHealth(healthData);
        setUsers(usersData.users || []);
        setAuditLogs(logsData.logs || []);
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSuspendUser = async (id: string) => {
    try {
      await adminApi.updateUserStatus(id, 'suspended', 'Admin suspended');
      setUsers(
        users.map((u) =>
          u.id === id ? { ...u, status: 'suspended' } : u
        )
      );
    } catch (err) {
      console.error('Error suspending user:', err);
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      await adminApi.updateUserStatus(id, 'active');
      setUsers(
        users.map((u) =>
          u.id === id ? { ...u, status: 'active' } : u
        )
      );
    } catch (err) {
      console.error('Error activating user:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">Admin Console</h1>
          <p className="text-sm text-white/40">
            Monitor your platform, manage users, and review activity.
          </p>
        </motion.div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers.toLocaleString() || '-'}
          change={stats ? '+12.5%' : undefined}
          trend="up"
          loading={loading}
        />
        <StatCard
          icon={Database}
          label="Total Vaults"
          value={stats?.totalVaults.toLocaleString() || '-'}
          change={stats ? '+8.3%' : undefined}
          trend="up"
          loading={loading}
        />
        <StatCard
          icon={Activity}
          label="API Requests (24h)"
          value={stats?.apiRequests24h.toLocaleString() || '-'}
          change={stats ? '+22%' : undefined}
          trend="up"
          loading={loading}
        />
        <StatCard
          icon={Shield}
          label="Threat Alerts"
          value={stats?.threatAlerts.toString() || '-'}
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  User Growth
                </h3>
                <p className="text-[10px] text-white/30">Last 8 months</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                Total Users
              </div>
            </div>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                </div>
              ) : stats?.userGrowth ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.userGrowth}>
                    <defs>
                      <linearGradient
                        id="userGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.03)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fill: 'rgba(255,255,255,0.3)',
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fill: 'rgba(255,255,255,0.3)',
                      }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#userGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6" hover={false}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">
              Vault Size Distribution
            </h3>
            <p className="text-[10px] text-white/30">By number of fields</p>
          </div>
          <div className="h-48 flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            ) : stats?.vaultDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.vaultDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {stats.vaultDistribution.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'][
                            index % 4
                          ]
                        }
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          <div className="space-y-2 mt-4">
            {stats?.vaultDistribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: [
                        '#6366f1',
                        '#8b5cf6',
                        '#a78bfa',
                        '#c4b5fd',
                      ][
                        stats.vaultDistribution.indexOf(item) % 4
                      ],
                    }}
                  />
                  <span className="text-white/50">{item.name}</span>
                </div>
                <span className="text-white/70 font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <GlassCard className="p-6 lg:col-span-1" hover={false}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">API Requests</h3>
            <p className="text-[10px] text-white/30">This week</p>
          </div>
          <div className="h-48">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
              </div>
            ) : stats?.apiRequestsWeek ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.apiRequestsWeek}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.03)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: 'rgba(255,255,255,0.3)',
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: 'rgba(255,255,255,0.3)',
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="requests"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </GlassCard>

        <div className="lg:col-span-1">
          <SystemHealthComponent health={health} loading={loading} />
        </div>

        <div className="lg:col-span-1">
          <RecentAudit logs={auditLogs} loading={loading} />
        </div>
      </div>

      <UsersTable
        users={users}
        loading={loading}
        onSuspend={handleSuspendUser}
        onActivate={handleActivateUser}
      />
    </DashboardLayout>
  );
}
