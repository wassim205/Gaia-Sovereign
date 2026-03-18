'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  Unlock,
  Share2,
  Trash2,
  Search,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';

interface AuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  appId?: string;
  appName?: string;
  approvedFields?: string[];
  requestedFields?: string[];
  accessedFields?: string[];
  status: 'success' | 'failed' | 'denied';
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface FilterState {
  from: string;
  to: string;
  appId?: string;
  action?: string;
  status?: string;
  searchQuery: string;
}

// Status color mapper
function getStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    'success': 'text-green-400',
    'failed': 'text-red-400',
    'denied': 'text-yellow-400',
  };
  return colorMap[status] || 'text-white/60';
}

// Icon renderer component
function ActionIcon({ action }: { action: string }) {
  const className = 'w-5 h-5 text-blue-400';
  switch (action) {
    case 'VAULT_READ':
    case 'DATA_ACCESS':
      return <Eye className={className} />;
    case 'VAULT_WRITE':
      return <Lock className={className} />;
    case 'VAULT_DELETE':
      return <Trash2 className={className} />;
    case 'CONSENT_APPROVE':
      return <CheckCircle2 className={className} />;
    case 'CONSENT_DENY':
      return <XCircle className={className} />;
    case 'TOKEN_REVOKE':
      return <Unlock className={className} />;
    case 'TOKEN_ISSUED':
      return <Shield className={className} />;
    case 'DATA_SHARE':
      return <Share2 className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
}

function StatusIcon({ status, className }: { status: string; className: string }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className={className} />;
    case 'failed':
      return <XCircle className={className} />;
    case 'denied':
      return <AlertCircle className={className} />;
    default:
      return <AlertCircle className={className} />;
  }
}

// Audit log entry row component
function AuditLogRow({ log, isExpanded, onToggle }: { log: AuditLog; isExpanded: boolean; onToggle: () => void }) {
  const statusColor = getStatusColor(log.status);
  
  const timestamp = new Date(log.timestamp);
  const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <>
      <button
        onClick={onToggle}
        className="w-full"
      >
        <GlassCard className="p-4 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            {/* Left side - Action info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-2.5 bg-white/5 rounded-lg shrink-0">
                <ActionIcon action={log.action} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {log.action.replace(/_/g, ' ')}
                  </h4>
                  {log.appName && (
                    <Badge variant="default" className="text-xs">
                      {log.appName}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span>{log.resourceType}</span>
                  {log.resourceId && <span>•</span>}
                  {log.resourceId && <span className="font-mono text-white/40">{log.resourceId.slice(0, 8)}...</span>}
                </div>
              </div>
            </div>

            {/* Right side - Status & Time */}
            <div className="flex items-center gap-4 ml-4">
              {/* Status */}
              <div className="flex items-center gap-2 shrink-0">
                <StatusIcon status={log.status} className={`w-4 h-4 ${statusColor}`} />
                <span className={`text-xs font-medium ${statusColor}`}>
                  {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                </span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 shrink-0 text-xs text-white/50 min-w-fit">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeStr}</span>
              </div>

              {/* Expand indicator */}
              <ChevronDown
                className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>
        </GlassCard>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="ml-4 mt-2 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timestamp */}
            <div>
              <div className="text-xs font-semibold text-white/60 mb-1">Timestamp</div>
              <div className="text-sm text-white">{dateStr} {timeStr}</div>
            </div>

            {/* IP Address */}
            {log.ipAddress && (
              <div>
                <div className="text-xs font-semibold text-white/60 mb-1">IP Address</div>
                <div className="text-sm text-white font-mono">{log.ipAddress}</div>
              </div>
            )}

            {/* Resource Type */}
            <div>
              <div className="text-xs font-semibold text-white/60 mb-1">Resource Type</div>
              <div className="text-sm text-white">{log.resourceType}</div>
            </div>

            {/* Resource ID */}
            {log.resourceId && (
              <div>
                <div className="text-xs font-semibold text-white/60 mb-1">Resource ID</div>
                <div className="text-sm text-white font-mono">{log.resourceId}</div>
              </div>
            )}

            {/* App Name */}
            {log.appName && (
              <div>
                <div className="text-xs font-semibold text-white/60 mb-1">Application</div>
                <div className="text-sm text-white">{log.appName}</div>
              </div>
            )}

            {/* Status */}
            <div>
              <div className="text-xs font-semibold text-white/60 mb-1">Status</div>
              <div className={`text-sm font-medium ${statusColor}`}>
                {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
              </div>
            </div>
          </div>

          {/* Fields accessed */}
          {(log.approvedFields?.length || log.accessedFields?.length || log.requestedFields?.length) && (
            <div className="border-t border-white/10 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {log.approvedFields && log.approvedFields.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-green-400 mb-2">Approved Fields ({log.approvedFields.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {log.approvedFields.map((field) => (
                        <Badge key={field} variant="success" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {log.accessedFields && log.accessedFields.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-blue-400 mb-2">Accessed Fields ({log.accessedFields.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {log.accessedFields.map((field) => (
                        <Badge key={field} variant="default" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {log.requestedFields && log.requestedFields.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-yellow-400 mb-2">Requested Fields ({log.requestedFields.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {log.requestedFields.map((field) => (
                        <Badge key={field} variant="warning" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Agent */}
          {log.userAgent && (
            <div className="border-t border-white/10 pt-3">
              <div className="text-xs font-semibold text-white/60 mb-1">User Agent</div>
              <div className="text-xs text-white/40 font-mono break-all">{log.userAgent}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Filter panel component
function FilterPanel({
  filters,
  onFilterChange,
  loading,
}: {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  loading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReset = () => {
    onFilterChange({
      from: '',
      to: '',
      appId: '',
      action: '',
      status: '',
      searchQuery: '',
    });
  };

  const hasActiveFilters = filters.from || filters.to || filters.appId || filters.action || filters.status || filters.searchQuery;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium text-white/80"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
            {[filters.from, filters.to, filters.appId, filters.action, filters.status, filters.searchQuery].filter(Boolean).length}
          </span>
        )}
      </button>

      {isOpen && (
        <GlassCard className="p-5 space-y-4">
          {/* Search */}
          <div>
            <label className="text-xs font-semibold text-white/60 mb-2 block">Search</label>
            <Input
              type="text"
              placeholder="Search by resource ID, app name..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              disabled={loading}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/60 mb-2 block">From Date</label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => onFilterChange({ ...filters, from: e.target.value })}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/60 mb-2 block">To Date</label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => onFilterChange({ ...filters, to: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-xs font-semibold text-white/60 mb-2 block">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="denied">Denied</option>
            </select>
          </div>

          {/* Action filter */}
          <div>
            <label className="text-xs font-semibold text-white/60 mb-2 block">Action</label>
            <select
              value={filters.action || ''}
              onChange={(e) => onFilterChange({ ...filters, action: e.target.value })}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
            >
              <option value="">All Actions</option>
              <option value="VAULT_READ">Vault Read</option>
              <option value="VAULT_WRITE">Vault Write</option>
              <option value="VAULT_DELETE">Vault Delete</option>
              <option value="CONSENT_APPROVE">Consent Approve</option>
              <option value="CONSENT_DENY">Consent Deny</option>
              <option value="TOKEN_REVOKE">Token Revoke</option>
              <option value="TOKEN_ISSUED">Token Issued</option>
              <option value="DATA_ACCESS">Data Access</option>
              <option value="DATA_SHARE">Data Share</option>
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <Button
              onClick={handleReset}
              variant="secondary"
              className="w-full text-sm"
              disabled={loading}
            >
              Clear Filters
            </Button>
          )}
        </GlassCard>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    from: '',
    to: '',
    appId: '',
    action: '',
    status: '',
    searchQuery: '',
  });

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.action) params.append('action', filters.action);
      if (filters.status) params.append('status', filters.status);
      params.append('limit', '20');
      params.append('offset', ((pageNum - 1) * 20).toString());

      const response = await fetch(`/api/audit/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (reset) {
        setLogs(data.data || []);
      } else {
        setLogs((prev) => [...prev, ...(data.data || [])]);
      }

      setHasMore((data.data || []).length === 20);
      setPage(pageNum);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch and filter change
  useEffect(() => {
    setPage(1);
    setLogs([]);
    fetchAuditLogs(1, true);
  }, [filters, fetchAuditLogs]);

  // Load more handler
  const handleLoadMore = () => {
    fetchAuditLogs(page + 1);
  };

  // Export logs
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.action) params.append('action', filters.action);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/audit/logs?${params.toString()}&limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export logs');

      const data = await response.json();
      const csv = convertToCSV(data.data || []);
      downloadCSV(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      showToast('Logs exported successfully', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export logs';
      showToast(message, 'error');
    }
  };

  // Refresh handler
  const handleRefresh = () => {
    setPage(1);
    setLogs([]);
    fetchAuditLogs(1, true);
    showToast('Audit logs refreshed', 'success');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
        <p className="text-white/60">View and monitor all account activities and data access events</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1">
          <FilterPanel filters={filters} onFilterChange={setFilters} loading={loading} />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="secondary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={handleExport}
            variant="secondary"
            disabled={loading || logs.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <GlassCard className="p-4 bg-red-500/10 border-red-500/30 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-400">Error Loading Logs</h3>
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        </GlassCard>
      )}

      {/* Loading state */}
      {loading && logs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <GlassCard key={i} className="p-4 h-20 bg-white/5 animate-pulse">
              <div className="w-full h-full" />
            </GlassCard>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-2">No audit logs found</p>
          <p className="text-white/40 text-sm">Try adjusting your filters or check back later</p>
        </GlassCard>
      ) : (
        <>
          {/* Logs list */}
          <div className="space-y-3 mb-6">
            {logs.map((log) => (
              <AuditLogRow
                key={log.id}
                log={log}
                isExpanded={expandedId === log.id}
                onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
              />
            ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                variant="secondary"
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

// Helper function to convert logs to CSV
function convertToCSV(logs: AuditLog[]): string {
  const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'App', 'Status', 'IP Address'];
  const rows = logs.map((log) =>
    [
      log.timestamp,
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.appName || '',
      log.status,
      log.ipAddress || '',
    ].map((field) => `"${field}"`)
  );

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// Helper function to download CSV
function downloadCSV(csv: string, filename: string) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
