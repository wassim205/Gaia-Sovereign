'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { showToast } from '@/components/ui/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ActiveAccess {
  id: string;
  appId: string;
  appName: string;
  appStatus: string;
  approvedFields: string[];
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
}

export default function ActiveAccessesPage() {
  const [accesses, setAccesses] = useState<ActiveAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<ActiveAccess | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchActiveAccesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActiveAccesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/user/active-accesses`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active accesses');
      }

      const data = await response.json();
      setAccesses(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching active accesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeClick = (access: ActiveAccess) => {
    // Show confirmation modal (GS-129)
    setSelectedAccess(access);
    setShowConfirmModal(true);
  };

  const handleConfirmRevoke = () => {
    if (selectedAccess) {
      revokeToken(selectedAccess.id);
      setShowConfirmModal(false);
    }
  };

  const handleCancelRevoke = () => {
    setSelectedAccess(null);
    setShowConfirmModal(false);
  };

  const revokeToken = async (tokenId: string) => {
    try {
      setRevoking(tokenId);

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/token/revoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke token');
      }

      // Remove the revoked token from the list
      setAccesses(accesses.filter((a) => a.id !== tokenId));
      showToast('Access revoked successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke token';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Error revoking token:', err);
    } finally {
      setRevoking(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Access Control</h1>
          <p className="text-white/60">
            Manage which apps have access to your data. Revoke access instantly at any time.
          </p>
        </div>

        {error && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Error Loading Accesses</p>
                  <p className="text-xs text-red-300/70 mt-1">{error}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-6" hover={false}>
                <div className="space-y-4">
                  <div className="h-6 bg-white/5 rounded-lg w-1/3 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded-lg w-1/2 animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-white/5 rounded-lg w-20 animate-pulse" />
                    <div className="h-8 bg-white/5 rounded-lg w-20 animate-pulse" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : accesses.length === 0 ? (
          <GlassCard className="p-12" hover={false}>
            <div className="text-center">
              <Lock className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-2">No active accesses</p>
              <p className="text-xs text-white/40">
                You haven&apos;t approved any apps to access your data yet.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {accesses.map((access, index) => (
              <motion.div
                key={access.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-6" hover={true}>
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-white mb-2">
                        {access.appName}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            access.appStatus === 'ACTIVE'
                              ? 'success'
                              : 'default'
                          }
                        >
                          {access.appStatus}
                        </Badge>
                        {access.isExpired && (
                          <Badge variant="warning">Expired</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRevokeClick(access)}
                      disabled={revoking === access.id}
                      loading={revoking === access.id}
                      variant="danger"
                      size="sm"
                    >
                      {revoking === access.id ? 'Revoking' : 'Revoke'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-white/5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-3">
                        Approved Fields
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {access.approvedFields.map((field) => (
                          <Badge key={field} variant="info">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
                          Access Period
                        </p>
                        <div className="flex items-center gap-2 text-white/70">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm">
                            {new Date(access.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-white/40 mb-1">
                          Expires
                        </p>
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-sm">
                            {new Date(access.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Revoke App Access"
        message={
          selectedAccess
            ? `Are you sure you want to revoke access for "${selectedAccess.appName}"? This app will no longer be able to access your data.`
            : ''
        }
        isDangerous
        isLoading={revoking === selectedAccess?.id}
        confirmText="Revoke"
        cancelText="Cancel"
        onConfirm={handleConfirmRevoke}
        onCancel={handleCancelRevoke}
      />
    </DashboardLayout>
  );
}
