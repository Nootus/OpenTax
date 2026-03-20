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
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { Deduction80CModel } from '@/filing/models/deductions/popular/deduction-80c-model';

const SECTION_80C_LIMIT = 150000;

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Section80CTab() {
  const { filing, updateSection } = useFilingContext();

  const [entries, setEntries] = useState<Deduction80CModel[]>(() =>
    (filing.section80C ?? []).map((e, i) =>
      e.deductionId != null ? e : { ...e, deductionId: -(Date.now() + i) }
    )
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState<number | null | undefined>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});

  const prevEntryCountRef = useRef(entries.length);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entries.length > prevEntryCountRef.current) {
      const last = entries[entries.length - 1];
      if ((last.deductionId ?? 0) < 0) {
        setEditingEntryId(last.deductionId);
        setTimeout(() => lastEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    }
    prevEntryCountRef.current = entries.length;
  }, [entries.length]);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'section-80c-tab-compact-style';
    style.textContent = `
      .section-80c-tab-compact input,
      .section-80c-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('section-80c-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => { document.getElementById('section-80c-tab-compact-style')?.remove(); };
  }, []);

  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const remaining80C = Math.max(0, SECTION_80C_LIMIT - totalAmount);

  const validateEntry = (entry: Deduction80CModel): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!entry.description?.trim()) e.description = 'Investment type is required';
    if (!entry.policyNumber?.trim()) e.policyNumber = 'Policy number is required';
    if (!entry.amount || entry.amount <= 0) e.amount = 'Amount must be greater than 0';
    return e;
  };

  const addEntry = () => {
    const tempId = -Date.now();
    setEntries((prev) => [...prev, { deductionId: tempId, filingId: null, description: '', policyNumber: null, amount: 0 }]);
  };

  const updateEntry = (deductionId: number | null | undefined, field: string, value: any) => {
    setEntries((prev) => prev.map((e) => (e.deductionId === deductionId ? { ...e, [field]: value } : e)));
  };

  const saveEntry = (entry: Deduction80CModel) => {
    const validationErrors = validateEntry(entry);
    if (Object.keys(validationErrors).length > 0) {
      setEntryErrors((prev) => ({ ...prev, [entry.deductionId!]: validationErrors }));
      return;
    }
    setEntryErrors((prev) => { const next = { ...prev }; delete next[entry.deductionId!]; return next; });

    const isNew = (entry.deductionId ?? 0) < 0;
    const savedEntry: Deduction80CModel = {
      ...entry,
      deductionId: isNew ? Date.now() : entry.deductionId,
    };
    const updatedEntries = entries.map((e) => (e.deductionId === entry.deductionId ? savedEntry : e));
    setEntries(updatedEntries);
    updateSection('section80C', updatedEntries);
    setEditingEntryId(null);
  };

  const deleteEntry = (deductionId: number | null | undefined) => {
    const updated = entries.filter((e) => e.deductionId !== deductionId);
    setEntries(updated);
    updateSection('section80C', updated);
    if (editingEntryId === deductionId) setEditingEntryId(null);
    setPendingDeleteId(null);
  };

  const cancelEdit = (deductionId: number | null | undefined) => {
    if (deductionId && deductionId < 0) {
      setEntries((prev) => prev.filter((e) => e.deductionId !== deductionId));
    }
    setEditingEntryId(null);
  };

  return (
    <div className="section-80c-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                <BanknotesIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Section 80C</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Claimed</div>
              <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Remaining</div>
              <span className={`text-base font-bold ${remaining80C > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                ₹{formatCurrency(remaining80C)}
              </span>
            </div>
            <IconButton label="Add Investment" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
              <PlusCircleIcon className="w-5 h-5 text-teal-600" />
            </IconButton>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {entries.length === 0 ? (
              <div className="py-2">
                <AddButton label="Add Investment" onClick={addEntry} colorScheme="teal" />
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => {
                  const isEditing = editingEntryId === entry.deductionId;
                  const errors = entryErrors[entry.deductionId!] || {};

                  return (
                    <div
                      key={entry.deductionId}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      ref={index === entries.length - 1 ? lastEntryRef : null}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            label="Investment Type"
                            required
                            value={entry.description || ''}
                            onChange={(e) => updateEntry(entry.deductionId, 'description', e.target.value)}
                            placeholder="e.g., PPF, ELSS, LIC"
                            disabled={!isEditing}
                            error={errors.description}
                          />
                          <Input
                            label="Policy Number"
                            value={entry.policyNumber || ''}
                            onChange={(e) => updateEntry(entry.deductionId, 'policyNumber', e.target.value)}
                            required
                            disabled={!isEditing}
                            error={errors.policyNumber}
                          />
                          <Input
                            label="Amount"
                            type="number"
                            value={entry.amount || 0}
                            onChange={(e) => updateEntry(entry.deductionId, 'amount', Number(e.target.value))}
                            placeholder="0"
                            disabled={!isEditing}
                            prefix="₹"
                            error={errors.amount}
                          />
                        </div>
                        <div className="flex gap-2 items-end pt-5">
                          {!isEditing ? (
                            <>
                              <IconButton label="Edit" onClick={() => setEditingEntryId(entry.deductionId)}>
                                <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                              </IconButton>
                              <IconButton label="Delete" onClick={() => setPendingDeleteId(entry.deductionId)}>
                                <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" onClick={() => cancelEdit(entry.deductionId)}>Cancel</Button>
                              <Button variant="primary" size="sm" onClick={() => saveEntry(entry)}>Save</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete Entry?"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={false}
        onConfirm={() => { if (pendingDeleteId != null) deleteEntry(pendingDeleteId); }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
