'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Database,
  User,
  Mail,
  FileText,
  Key,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';
import VaultEntryForm from '@/components/vault/VaultEntryForm';
import DeleteConfirmModal from '@/components/vault/DeleteConfirmModal';
import type { VaultEntry } from '@/lib/api';
import { getVaultEntries, getCategoryCounts } from '@/lib/api';
import { VaultItemSkeleton } from '@/components/ui/LoadingSkeleton';

// Category stats component
interface CategoryStatProps {
  icon: React.ElementType;
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function CategoryStat({ icon: Icon, label, count, isActive, onClick }: CategoryStatProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all ${
        isActive
          ? 'bg-white/10 border-white/30'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
          <Icon className="w-5 h-5 text-white/80" />
        </div>
        <div className="text-left">
          <div className="text-xs text-white/60">{label}</div>
          <div className="text-xl font-bold text-white">{count}</div>
        </div>
      </div>
    </button>
  );
}

// Vault item component
interface VaultItemProps {
  entry: VaultEntry;
  icon: React.ElementType;
  isRevealed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite?: () => void;
}

function VaultItemCard({ entry, icon: Icon, isRevealed, onToggle, onEdit, onDelete }: VaultItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <GlassCard className="p-5 hover:bg-white/10 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-3 bg-white/5 rounded-xl">
            <Icon className="w-5 h-5 text-white/80" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white truncate">{entry.title}</h3>
              {entry.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Badge variant="default">{entry.category}</Badge>
              <span>•</span>
              <span>{entry.fields.length} field{entry.fields.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-white/60" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/60" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 transition-colors"
            title="Edit entry"
          >
            <Edit className="w-4 h-4 text-blue-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Description */}
      {entry.description && !isExpanded && (
        <p className="text-sm text-white/60 mb-3 line-clamp-2">{entry.description}</p>
      )}

      {/* Expanded Fields */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-white/10">
          {entry.description && (
            <div className="mb-3">
              <div className="text-xs text-white/40 mb-1">Description</div>
              <p className="text-sm text-white/70">{entry.description}</p>
            </div>
          )}
          
          {entry.fields.map((field, idx) => {
            const displayValue = isRevealed ? field.value : '•'.repeat(Math.min(field.value.length, 20));
            return (
              <div key={idx} className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/60 mb-1.5 flex items-center gap-2">
                      <span>{field.fieldKey}</span>
                      <Badge variant="default" className="text-xs py-0.5">{field.fieldType}</Badge>
                    </div>
                    <div className="text-sm text-white font-mono break-all">{displayValue}</div>
                  </div>
                  <button
                    onClick={() => handleCopy(field.value)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    title="Copy value"
                  >
                    <Copy className="w-3.5 h-3.5 text-white/60" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Toggle reveal */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-white/40">
              Created {new Date(entry.createdAt).toLocaleDateString()}
            </div>
            <button
              onClick={onToggle}
              className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
            >
              {isRevealed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide values
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Reveal values
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview when collapsed */}
      {!isExpanded && entry.fields.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">{entry.fields[0].fieldKey}</span>
            <span className="text-white/60 font-mono">
              {isRevealed ? entry.fields[0].value.substring(0, 20) : '••••••••'}
              {entry.fields[0].value.length > 20 && '...'}
            </span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export default function VaultPage() {
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [revealedFields, setRevealedFields] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<VaultEntry | null>(null);

  useEffect(() => {
    fetchVaultData();
  }, []);

  useEffect(() => {
    let filtered = [...vaultEntries];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query) ||
        entry.fields.some(field => 
          field.fieldKey.toLowerCase().includes(query) ||
          field.value.toLowerCase().includes(query)
        )
      );
    }

    setFilteredEntries(filtered);
  }, [vaultEntries, searchQuery, selectedCategory]);

  const fetchVaultData = async () => {
    try {
      const [entriesResponse, countsResponse] = await Promise.all([
        getVaultEntries({ page: 1, limit: 100 }),
        getCategoryCounts().catch(() => []),
      ]);
      
      setVaultEntries(entriesResponse.data || []);
      
      // Process category counts
      const counts: Record<string, number> = {};
      if (Array.isArray(countsResponse)) {
        countsResponse.forEach((item: { category: string; count: number }) => {
          counts[item.category] = item.count;
        });
      }
      setCategoryCounts(counts);
    } catch (err) {
      showToast('Failed to load vault data', 'error');
      console.error('Error loading vault:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (entryId: string) => {
    setRevealedFields(prev =>
      prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]
    );
  };

  const handleAddClick = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (entry: VaultEntry) => {
    setDeletingEntry(entry);
    setIsDeleteModalOpen(true);
  };

  const handleFormSuccess = () => {
    fetchVaultData();
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteSuccess = () => {
    fetchVaultData();
    setIsDeleteModalOpen(false);
    setDeletingEntry(null);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ElementType> = {
      PROFILE: User,
      CONTACT: Mail,
      DOCUMENT: FileText,
      CREDENTIAL: Key,
      NOTE: FileText,
      OTHER: Database,
    };
    return icons[category] || Database;
  };

  const categories = [
    { key: 'ALL', label: 'All Items', icon: Database },
    { key: 'PROFILE', label: 'Profile', icon: User },
    { key: 'CONTACT', label: 'Contact', icon: Mail },
    { key: 'DOCUMENT', label: 'Document', icon: FileText },
    { key: 'CREDENTIAL', label: 'Credential', icon: Key },
    { key: 'NOTE', label: 'Note', icon: FileText },
    { key: 'OTHER', label: 'Other', icon: Database },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Vault</h1>
        <p className="text-white/60">Manage your secure data entries</p>
      </div>

      {/* Category Filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {categories.map(cat => (
          <CategoryStat
            key={cat.key}
            icon={cat.icon}
            label={cat.label}
            count={cat.key === 'ALL' ? vaultEntries.length : (categoryCounts[cat.key] || 0)}
            isActive={cat.key === 'ALL' ? !selectedCategory : selectedCategory === cat.key}
            onClick={() => setSelectedCategory(cat.key === 'ALL' ? null : cat.key)}
          />
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            type="text"
            placeholder="Search vault entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
        <Button variant="primary" onClick={handleAddClick} className="gap-2">
          <Plus className="w-5 h-5" />
          Add Entry
        </Button>
      </div>

      {/* Vault Entries */}
      {loading ? (
        <div className="space-y-4">
          <VaultItemSkeleton />
          <VaultItemSkeleton />
          <VaultItemSkeleton />
          <VaultItemSkeleton />
          <VaultItemSkeleton />
          <VaultItemSkeleton />
        </div>
      ) : filteredEntries.length === 0 ? (
        <GlassCard className="p-12">
          <div className="text-center">
            <Database className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery || selectedCategory ? 'No entries found' : 'No vault entries yet'}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your search or filters' 
                : 'Create your first entry to secure your data'}
            </p>
            {!searchQuery && !selectedCategory && (
              <Button variant="primary" onClick={handleAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Entry
              </Button>
            )}
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEntries.map(entry => (
            <VaultItemCard
              key={entry.id}
              entry={entry}
              icon={getCategoryIcon(entry.category)}
              isRevealed={revealedFields.includes(entry.id)}
              onToggle={() => toggleReveal(entry.id)}
              onEdit={() => handleEditClick(entry)}
              onDelete={() => handleDeleteClick(entry)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filteredEntries.length > 0 && (
        <div className="mt-6 text-center text-sm text-white/60">
          Showing {filteredEntries.length} of {vaultEntries.length} entries
        </div>
      )}

      {/* Modals */}
      <VaultEntryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        entry={editingEntry}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        entry={deletingEntry}
      />
    </DashboardLayout>
  );
}
