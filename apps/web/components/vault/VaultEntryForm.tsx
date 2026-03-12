'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import { createVaultEntry, updateVaultEntry } from '@/lib/api';
import type { VaultEntry, VaultField } from '@/lib/api';

interface VaultEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry?: VaultEntry | null;
}

const CATEGORIES = [
  { value: 'PROFILE', label: 'Profile' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'CREDENTIAL', label: 'Credential' },
  { value: 'NOTE', label: 'Note' },
  { value: 'OTHER', label: 'Other' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'password', label: 'Password' },
  { value: 'url', label: 'URL' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Long Text' },
];

export default function VaultEntryForm({ isOpen, onClose, onSuccess, entry }: VaultEntryFormProps) {
  const isEditing = !!entry;
  
  const [title, setTitle] = useState(entry?.title || '');
  const [category, setCategory] = useState(entry?.category || 'OTHER');
  const [description, setDescription] = useState(entry?.description || '');
  const [isFavorite, setIsFavorite] = useState(entry?.isFavorite || false);
  const [fields, setFields] = useState<VaultField[]>(
    entry?.fields || [{ fieldKey: '', value: '', fieldType: 'text' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when entry changes (for edit mode)
  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setCategory(entry.category);
      setDescription(entry.description || '');
      setIsFavorite(entry.isFavorite || false);
      setFields(entry.fields);
    } else {
      // Reset form for create mode
      setTitle('');
      setCategory('OTHER');
      setDescription('');
      setIsFavorite(false);
      setFields([{ fieldKey: '', value: '', fieldType: 'text' }]);
    }
  }, [entry]);

  const handleAddField = () => {
    setFields([...fields, { fieldKey: '', value: '', fieldType: 'text' }]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (index: number, key: keyof VaultField, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    const validFields = fields
      .filter(f => f.fieldKey.trim() && f.value.trim())
      .map(({ fieldKey, value, fieldType }) => ({ fieldKey, value, fieldType })); // Strip DB fields
    
    if (validFields.length === 0) {
      showToast('At least one field is required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        isFavorite,
        fields: validFields,
      };

      if (isEditing && entry) {
        await updateVaultEntry(entry.id, data);
        showToast('Entry updated successfully', 'success');
      } else {
        await createVaultEntry(data);
        showToast('Entry created successfully', 'success');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      const message = (error as Error)?.message || 'Failed to save entry';
      showToast(Array.isArray(message) ? message.join(', ') : message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setCategory('OTHER');
    setDescription('');
    setIsFavorite(false);
    setFields([{ fieldKey: '', value: '', fieldType: 'text' }]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Vault Entry' : 'Create Vault Entry'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Personal Email, Bank Account"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-black">
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
          />
        </div>

        {/* Favorite */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="favorite"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="w-4 h-4 rounded bg-white/5 border-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
          />
          <label htmlFor="favorite" className="text-sm text-white/80">
            Mark as favorite
          </label>
        </div>

        {/* Fields */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-white/80">
              Fields <span className="text-red-400">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              className="text-xs py-1.5 px-3"
              onClick={handleAddField}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Field
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={field.fieldKey}
                    onChange={(e) => handleFieldChange(index, 'fieldKey', e.target.value)}
                    placeholder="Field name (e.g., Email, Password)"
                    className="mb-2"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type={field.fieldType === 'password' ? 'password' : 'text'}
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, 'value', e.target.value)}
                    placeholder="Field value"
                    className="mb-2"
                  />
                </div>
                <div className="w-32">
                  <select
                    value={field.fieldType}
                    onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value} className="bg-black">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(index)}
                    className="p-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Entry' : 'Create Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
