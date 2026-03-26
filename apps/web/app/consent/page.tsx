'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  Check,
  X,
  AlertCircle,
  Loader,
  Clock,
  Building2,
  Lock,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ToastContainer } from '@/components/ui/Toast';
import { type ErrorResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConsentRequest {
  id: string;
  appId: string;
  redirectUri: string;
  requestedFields: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  expiresAt: string;
  state: string | null;
  createdAt: string;
  app: {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
  };
}

// Field descriptions for common consent fields
const FIELD_DESCRIPTIONS: Record<string, string> = {
  'email': 'Your email address used for communication',
  'username': 'Your unique username identifier',
  'profile': 'Your public profile information',
  'phone': 'Your phone number for contact purposes',
  'address': 'Your physical address information',
  'date_of_birth': 'Your date of birth',
  'avatar': 'Your profile picture or avatar',
  'preferences': 'Your account preferences and settings',
  'timezone': 'Your timezone for scheduling',
  'language': 'Your preferred language setting',
};

function ConsentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consentId = searchParams?.get('id');

  const [consent, setConsent] = useState<ConsentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  >([]);

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Fetch consent request details
  useEffect(() => {
    const fetchConsent = async () => {
      if (!consentId) {
        addToast('No consent request ID provided', 'error');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/consent/${consentId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw data as ErrorResponse;
        }

        setConsent(data.data);
        // Initialize selected fields with all requested fields
        setSelectedFields(new Set(data.data.requestedFields));
      } catch (err) {
        const error = err as ErrorResponse;
        const message = Array.isArray(error.message)
          ? error.message.join(', ')
          : error.message || 'Failed to load consent request';
        addToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchConsent();
  }, [consentId]);

  const handleApprove = async () => {
    if (!consent) return;

    setApproving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/consent/${consent.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            approvedFields: Array.from(selectedFields),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw data as ErrorResponse;
      }

      addToast('Consent approved successfully!', 'success');

      // Redirect to the app's redirect URI with consent ID and state
      const redirectUrl = new URL(consent.redirectUri);
      redirectUrl.searchParams.set('consent_id', consent.id);
      if (consent.state) {
        redirectUrl.searchParams.set('state', consent.state);
      }
      setTimeout(() => {
        window.location.href = redirectUrl.toString();
      }, 1500);
    } catch (err) {
      const error = err as ErrorResponse;
      const message = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message || 'Failed to approve consent';
      addToast(message, 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleDeny = async () => {
    if (!consent) return;

    setDenying(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/consent/${consent.id}/deny`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw data as ErrorResponse;
      }

      addToast('Consent request denied', 'success');

      // Redirect to the app's redirect URI with denial indication
      const redirectUrl = new URL(consent.redirectUri);
      redirectUrl.searchParams.set('consent_denied', 'true');
      if (consent.state) {
        redirectUrl.searchParams.set('state', consent.state);
      }
      setTimeout(() => {
        window.location.href = redirectUrl.toString();
      }, 1500);
    } catch (err) {
      const error = err as ErrorResponse;
      const message = Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message || 'Failed to deny consent';
      addToast(message, 'error');
    } finally {
      setDenying(false);
    }
  };

  const toggleField = (field: string) => {
    // Normalize field for comparison (lowercase, replace spaces with underscores)
    const normalizedField = field.trim().toLowerCase();
    const normalizedRequested = consent?.requestedFields.map(f => f.trim().toLowerCase()) || [];
    
    // Validate that field is in requested fields
    if (!normalizedRequested.includes(normalizedField)) {
      setValidationError(`Field "${field}" was not in the original request`);
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    // Clear error on successful toggle
    setValidationError(null);

    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader className="w-12 h-12 animate-spin text-indigo-500" />
          <p className="text-gray-400">Loading consent request...</p>
        </motion.div>
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <GlassCard className="max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-bold">Consent Request Not Found</h1>
            <p className="text-gray-400">
              The consent request could not be found or has expired.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Return to Dashboard
            </Button>
          </motion.div>
        </GlassCard>
      </div>
    );
  }

  const isExpired = new Date(consent.expiresAt) < new Date();
  const expiresIn = Math.ceil(
    (new Date(consent.expiresAt).getTime() - Date.now()) / (60 * 1000)
  );

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-linear-to-br from-black via-indigo-950/10 to-black text-white p-4 sm:p-8">
        {/* Background Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl sm:text-4xl font-bold">Consent Request</h1>
            </div>
            <p className="text-gray-400">
              Review and approve data sharing with the application below
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="p-6 sm:p-8">
              {/* App Info */}
              <div className="mb-8 pb-8 border-b border-indigo-500/20">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">{consent.app.name}</h2>
                    {consent.app.description && (
                      <p className="text-gray-400 mb-3">{consent.app.description}</p>
                    )}
                    <Badge className="text-xs">
                      {consent.app.id.slice(0, 8)}...
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status and Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 pb-8 border-b border-indigo-500/20">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        consent.status === 'PENDING'
                          ? 'bg-yellow-500'
                          : consent.status === 'APPROVED'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                      )}
                    />
                    <span className="font-medium capitalize">{consent.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Expires In</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span
                      className={cn(
                        'font-medium',
                        isExpired
                          ? 'text-red-400'
                          : expiresIn < 5
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      )}
                    >
                      {isExpired ? 'Expired' : `${expiresIn} minutes`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requested Fields */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  Requested Information
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  The application is requesting access to the following information
                </p>

                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{validationError}</p>
                  </motion.div>
                )}

                <div className="space-y-3">
                  {consent.requestedFields.map((field) => (
                    <motion.label
                      key={field}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-4 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.has(field)}
                        onChange={() => toggleField(field)}
                        className="mt-1 w-5 h-5 rounded accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {field.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {FIELD_DESCRIPTIONS[field] || 'Information about your account'}
                        </p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              {/* Warning for expired */}
              {isExpired && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-300">Consent Request Expired</p>
                    <p className="text-sm text-red-200/70 mt-1">
                      This consent request has expired and can no longer be approved.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleDeny}
                  disabled={denying || approving || isExpired}
                  className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 disabled:opacity-50"
                >
                  {denying ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Denying...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Deny
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={
                    approving || denying || isExpired || selectedFields.size === 0
                  }
                  className="flex-1"
                >
                  {approving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>

              {/* Info Text */}
              <p className="text-xs text-gray-500 text-center mt-4">
                By approving, you grant {consent.app.name} access to the selected
                information
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function ConsentLoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Loader className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-gray-400">Loading consent request...</p>
      </motion.div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={<ConsentLoadingFallback />}>
      <ConsentPageContent />
    </Suspense>
  );
}
