'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { deleteVaultEntry } from '@/lib/api';
import type { VaultEntry } from '@/lib/api';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry: VaultEntry | null;
}

export default function DeleteConfirmModal({ isOpen, onClose, onSuccess, entry }: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!entry) return;

    setIsDeleting(true);
    try {
      await deleteVaultEntry(entry.id);
      showToast('Entry deleted successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      const message = (error as Error)?.message || 'Failed to delete entry';
      showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Vault Entry" size="md">
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
        </div>

        {/* Warning Message */}
        <div className="text-center space-y-2">
          <p className="text-white font-medium">
            Are you sure you want to delete this vault entry?
          </p>
          <p className="text-white/60 text-sm">
            This action cannot be undone. All data associated with <span className="text-white font-semibold">&ldquo;{entry.title}&rdquo;</span> will be permanently deleted.
          </p>
        </div>

        {/* Entry Details */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Title:</span>
              <span className="text-white font-medium">{entry.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Category:</span>
              <span className="text-white">{entry.category}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Fields:</span>
              <span className="text-white">{entry.fields.length} field(s)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete Entry'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
