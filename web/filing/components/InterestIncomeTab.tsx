'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  BanknotesIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import Input from '@/filing/ui/Input';
import Select from '@/filing/ui/Select';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { InterestIncomeModel } from '@/filing/models/income/interest-income-model';
import { useMasterData } from '@/filing/context/MasterDataContext';

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

// PF interest type has id=5 in the original master data
const PF_TYPE_ID = 5;

export default function InterestIncomeTab() {
  const { filing, updateSection } = useFilingContext();
  const { interestTypes: INTEREST_TYPES, providentFundTypes: PROVIDENT_FUND_TYPES } = useMasterData();
  const interestTypeOptions = [{ value: '', label: 'Select type' }, ...INTEREST_TYPES];
  const pfTypeOptions = [{ value: '', label: 'Select type' }, ...PROVIDENT_FUND_TYPES];

  // Local copy of entries for inline editing
  const [entries, setEntries] = useState<InterestIncomeModel[]>(filing.interestIncome ?? []);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});

  const prevCountRef = useRef(entries.length);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  // Inject compact styles
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'interest-income-tab-compact-style';
    style.textContent = `
      .interest-income-tab-compact input,
      .interest-income-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('interest-income-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => { document.getElementById('interest-income-tab-compact-style')?.remove(); };
  }, []);

  // Scroll to new entry
  useEffect(() => {
    if (entries.length > prevCountRef.current) {
      const last = entries[entries.length - 1];
      if ((last.interestId ?? 0) < 0) {
        setEditingEntryId(last.interestId!);
        setTimeout(() => lastEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    }
    prevCountRef.current = entries.length;
  }, [entries.length]);

  const totalIncome = entries.reduce((s, e) => s + (e.amount || 0), 0);

  // ── Validation ──────────────────────────────────────────────────────────
  const validateEntry = (entry: InterestIncomeModel): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!entry.interestTypeId) e.interestTypeId = 'Interest type is required';
    if (!entry.amount || entry.amount === 0) e.amount = 'Amount is required';
    const selectedType = INTEREST_TYPES.find((t) => Number(t.value) === entry.interestTypeId);
    if (selectedType?.label?.toLowerCase().includes('other') && !entry.description?.trim()) {
      e.description = 'Description is required for Other Income';
    }
    return e;
  };

  const isOtherIncomeType = (id: number | null | undefined): boolean => {
    if (!id) return false;
    return !!INTEREST_TYPES.find((t) => Number(t.value) === id)?.label?.toLowerCase().includes('other');
  };

  // ── Handlers ────────────────────────────────────────────────────────────
  const addEntry = () => {
    const tempId = -Date.now();
    setEntries((prev) => [
      ...prev,
      { interestId: tempId, filingId: null, interestTypeId: null, amount: 0 },
    ]);
  };

  const updateEntry = (interestId: number, field: string, value: any) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.interestId !== interestId) return e;
        const updated = { ...e, [field]: value };
        if (field === 'interestTypeId' && !isOtherIncomeType(value === '' ? null : Number(value))) {
          updated.description = null;
        }
        return updated;
      })
    );
  };

  const saveEntry = (entry: InterestIncomeModel) => {
    const errs = validateEntry(entry);
    if (Object.keys(errs).length > 0) {
      setEntryErrors((prev) => ({ ...prev, [entry.interestId!]: errs }));
      return;
    }
    setEntryErrors((prev) => { const n = { ...prev }; delete n[entry.interestId!]; return n; });

    // Assign a stable positive local ID to new entries
    const savedEntry: InterestIncomeModel = {
      ...entry,
      interestId: entry.interestId! > 0 ? entry.interestId : Date.now(),
      providentFundType: entry.interestTypeId === PF_TYPE_ID ? (entry.providentFundType || null) : null,
    };
    const updated = entries.map((e) => (e.interestId === entry.interestId ? savedEntry : e));
    setEntries(updated);
    updateSection('interestIncome', updated);
    setEditingEntryId(null);
  };

  const deleteEntry = (interestId: number) => {
    const updated = entries.filter((e) => e.interestId !== interestId);
    setEntries(updated);
    updateSection('interestIncome', updated);
    setEntryErrors((prev) => { const n = { ...prev }; delete n[interestId]; return n; });
    setPendingDeleteId(null);
  };

  const cancelEntry = (entry: InterestIncomeModel) => {
    if (entry.interestId! < 0) {
      // Never saved — remove from local list
      setEntries((prev) => prev.filter((e) => e.interestId !== entry.interestId));
    } else {
      // Revert to last saved version from context
      const saved = (filing.interestIncome ?? []).find((e) => e.interestId === entry.interestId);
      if (saved) {
        setEntries((prev) => prev.map((e) => (e.interestId === entry.interestId ? saved : e)));
      }
    }
    setEditingEntryId(null);
    setEntryErrors((prev) => { const n = { ...prev }; if (entry.interestId != null) delete n[entry.interestId]; return n; });
  };

  // Filter already-used types
  const usedTypeIds = new Set(
    entries.map((e) => e.interestTypeId).filter((id): id is number => id != null)
  );
  const getTypeOptions = (currentId: number | null | undefined) => [
    { value: '', label: 'Select type' },
    ...INTEREST_TYPES.filter((t) => Number(t.value) === currentId || !usedTypeIds.has(Number(t.value))),
  ];

  return (
    <div className="interest-income-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700"
            >
              {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <BanknotesIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Income from Other Sources</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">{formatCurrency(totalIncome)}</span>
            <IconButton
              label="Add Income"
              onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}
            >
              <PlusCircleIcon className="w-5 h-5 text-indigo-600" />
            </IconButton>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {entries.length === 0 ? (
              <AddButton label="Add Income from Other Sources" onClick={addEntry} colorScheme="blue" />
            ) : (
              entries.map((entry, index) => {
                const id = entry.interestId!;
                const isEditing = editingEntryId === id;
                const errs = entryErrors[id] ?? {};
                const isPFType = entry.interestTypeId === PF_TYPE_ID;

                return (
                  <div
                    key={id}
                    className="border border-gray-200 rounded-lg mb-4"
                    ref={index === entries.length - 1 ? lastEntryRef : null}
                  >
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-end gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Select
                            label="Interest Type"
                            required
                            value={entry.interestTypeId ? String(entry.interestTypeId) : ''}
                            onChange={(e) =>
                              updateEntry(id, 'interestTypeId', e.target.value === '' ? null : Number(e.target.value))
                            }
                            options={getTypeOptions(entry.interestTypeId)}
                            disabled={!isEditing}
                            error={isEditing ? errs.interestTypeId : undefined}
                          />
                          {isPFType && (
                            <Select
                              label="Provident Fund Type"
                              value={entry.providentFundType || ''}
                              onChange={(e) => updateEntry(id, 'providentFundType', e.target.value)}
                              options={pfTypeOptions}
                              disabled={!isEditing}
                            />
                          )}
                          <Input
                            label="Interest Amount"
                            required
                            type="number"
                            value={entry.amount ?? 0}
                            onChange={(e) => updateEntry(id, 'amount', Number(e.target.value))}
                            disabled={!isEditing}
                            error={isEditing ? errs.amount : undefined}
                          />
                          {isOtherIncomeType(entry.interestTypeId) && (
                            <Input
                              label="Description of Other Income *"
                              value={entry.description || ''}
                              onChange={(e) => updateEntry(id, 'description', e.target.value)}
                              placeholder="Describe the other income"
                              disabled={!isEditing}
                              error={isEditing ? errs.description : undefined}
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!isEditing ? (
                            <>
                              <IconButton label="Edit" onClick={() => setEditingEntryId(id)}>
                                <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                              </IconButton>
                              <IconButton label="Delete" onClick={() => setPendingDeleteId(id)}>
                                <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => cancelEntry(entry)}>Cancel</Button>
                              <Button variant="primary" size="sm" onClick={() => saveEntry(entry)}>Save</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete Entry?"
        message="Are you sure you want to delete this interest income entry? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={false}
        onConfirm={() => { if (pendingDeleteId != null) deleteEntry(pendingDeleteId); }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
