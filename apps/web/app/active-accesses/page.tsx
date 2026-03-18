'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  useEffect(() => {
    fetchActiveAccesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchActiveAccesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/user/active-accesses`, {
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
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching active accesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeClick = (access: ActiveAccess) => {
    // Show confirmation modal (implemented in GS-129)
    const confirmRevoke = window.confirm(
      `Are you sure you want to revoke access for "${access.appName}"?\n\nThis app will no longer be able to access your data.`,
    );

    if (confirmRevoke) {
      revokeToken(access.id);
    }
  };

  const revokeToken = async (tokenId: string) => {
    try {
      setRevoking(tokenId);

      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/token/revoke`, {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke token');
      console.error('Error revoking token:', err);
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Accesses</h1>
          <p className="text-gray-600">
            Manage which apps have access to your data. You can revoke access at any time.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading active accesses...</p>
          </div>
        ) : accesses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No active accesses</p>
            <p className="text-sm text-gray-500">
              You haven&apos;t approved any apps to access your data yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accesses.map((access) => (
              <div
                key={access.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {access.appName}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          access.appStatus === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {access.appStatus}
                      </span>
                      {access.isExpired && (
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeClick(access)}
                    disabled={revoking === access.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {revoking === access.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Approved Fields</h3>
                    <div className="flex flex-wrap gap-2">
                      {access.approvedFields.map((field) => (
                        <span
                          key={field}
                          className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Approved:</span>{' '}
                        {new Date(access.createdAt).toLocaleDateString()} at{' '}
                        {new Date(access.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Expires:</span>{' '}
                        {new Date(access.expiresAt).toLocaleDateString()} at{' '}
                        {new Date(access.expiresAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
