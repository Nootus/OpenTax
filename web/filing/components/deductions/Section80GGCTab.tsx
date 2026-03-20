'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HeartIcon,
  TrashIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import Input from '@/filing/ui/Input';
import DatePicker from '@/filing/ui/DatePicker';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { Deduction80GGCModel } from '@/filing/models/deductions/donation/deduction-80ggc-model';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const INITIAL_ENTRY: Deduction80GGCModel = {
  deductionId: null,
  filingId: null,
  doneeName: '',
  politicalPartyName: null,
  transactionId: null,
  donorBankIfsc: null,
  dateOfDonation: null,
  contributionAmountCash: 0,
  contributionAmountNonCash: 0,
  totalContribution: 0,
};

export default function Section80GGCTab() {
  const { filing, updateSection } = useFilingContext();

  const [entries, setEntries] = useState<Deduction80GGCModel[]>(() =>
    (filing.section80Ggc ?? []).map((e, i) =>
      e.deductionId != null ? e : { ...e, deductionId: -(Date.now() + i) }
    )
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<number | null | undefined>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);
  const prevCountRef = useRef(0);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'section-80ggc-tab-compact-style';
    style.textContent = `
      .section-80ggc-tab-compact input,
      .section-80ggc-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('section-80ggc-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('section-80ggc-tab-compact-style')?.remove();
    };
  }, []);

  useEffect(() => {
    if (entries.length > prevCountRef.current) {
      const last = entries[entries.length - 1];
      if ((last.deductionId ?? 0) < 0) {
        setEditingId(last.deductionId);
        setTimeout(() => lastEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    }
    prevCountRef.current = entries.length;
  }, [entries.length]);

  const totalAmount = entries.reduce((sum, e) => sum + (e.totalContribution || 0), 0);

  const updateEntry = (id: number | null | undefined, field: keyof Deduction80GGCModel, value: any) => {
    setEntries(prev => prev.map(e => e.deductionId === id ? { ...e, [field]: value } : e));
    if (id != null && entryErrors[id]?.[field as string]) {
      setEntryErrors(prev => {
        const next = { ...prev[id] };
        delete next[field as string];
        return { ...prev, [id]: next };
      });
    }
  };

  const addEntry = () => {
    const tempId = -Date.now();
    setEntries(prev => [...prev, { ...INITIAL_ENTRY, deductionId: tempId }]);
  };

  const saveEntry = (entry: Deduction80GGCModel) => {
    const errs: Record<string, string> = {};
    if (!entry.doneeName?.trim()) errs.doneeName = 'Donee name is required';
    if (!entry.politicalPartyName?.trim()) errs.politicalPartyName = 'Political party name is required';
    if (!entry.transactionId?.trim()) errs.transactionId = 'Transaction ID is required';
    if (!entry.dateOfDonation) errs.dateOfDonation = 'Date of donation is required';
    if (!entry.totalContribution || entry.totalContribution <= 0) errs.totalContribution = 'Total contribution is required';
    if ((entry.contributionAmountCash || 0) === 0 && (entry.contributionAmountNonCash || 0) === 0) {
      errs.totalContribution = errs.totalContribution || 'At least one contribution amount is required';
    }
    if (entry.donorBankIfsc?.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(entry.donorBankIfsc)) errs.donorBankIfsc = 'Invalid IFSC format (e.g., HDFC0001234)';
    if (!entry.donorBankIfsc?.trim()) errs.donorBankIfsc = 'Donor bank IFSC is required';
    if (Object.keys(errs).length > 0) {
      if (entry.deductionId != null) setEntryErrors(prev => ({ ...prev, [entry.deductionId!]: errs }));
      return;
    }
    const isNew = (entry.deductionId ?? 0) < 0;
    const savedId = isNew ? Date.now() : entry.deductionId!;
    const saved = { ...entry, deductionId: savedId };
    const updatedEntries = entries.map(e => e.deductionId === entry.deductionId ? saved : e);
    setEntries(updatedEntries);
    if (entry.deductionId != null) setEntryErrors(prev => { const n = { ...prev }; delete n[entry.deductionId!]; return n; });
    updateSection('section80Ggc', updatedEntries);
    setEditingId(null);
  };

  const cancelEdit = (id: number | null | undefined) => {
    if ((id ?? 0) < 0) setEntries(prev => prev.filter(e => e.deductionId !== id));
    setEditingId(null);
  };

  const deleteEntry = (id: number | null | undefined) => {
    const updated = entries.filter(e => e.deductionId !== id);
    setEntries(updated);
    updateSection('section80Ggc', updated);
    setPendingDeleteId(null);
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="section-80ggc-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
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
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <HeartIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">80GGC - Political Parties</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">Rs.{formatCurrency(totalAmount)}</span>
            <IconButton label="Add Entry" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
              <PlusCircleIcon className="w-5 h-5 text-indigo-600" />
            </IconButton>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {entries.length === 0 ? (
              <div className="py-2">
                <AddButton label="Add Entry" onClick={addEntry} colorScheme="purple" />
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, index) => {
                  const isEditing = editingId === entry.deductionId;
                  const errors = entryErrors[entry.deductionId!] || {};

                  return (
                    <div
                      key={entry.deductionId ?? `new-${index}`}
                      className="border border-gray-200 rounded-lg p-2.5 bg-gray-50"
                      ref={index === entries.length - 1 ? lastEntryRef : null}
                    >
                      <div className="space-y-2.5">
                        {/* Row 1: Donee Name | Political Party Name | Transaction ID | Donor Bank IFSC */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <Input
                            label="Donee Name *"
                            value={entry.doneeName || ''}
                            onChange={(e) => updateEntry(entry.deductionId, 'doneeName', e.target.value)}
                            placeholder="Name of person/organization"
                            error={errors.doneeName}
                            disabled={!isEditing}
                          />
                          <Input
                            label="Political Party Name *"
                            value={entry.politicalPartyName || ''}
                            onChange={(e) => updateEntry(entry.deductionId, 'politicalPartyName', e.target.value)}
                            placeholder="Name of political party"
                            disabled={!isEditing}
                            error={errors.politicalPartyName}
                          />
                          <Input
                            label="Transaction ID *"
                            value={entry.transactionId || ''}
                            onChange={(e) => updateEntry(entry.deductionId, 'transactionId', e.target.value)}
                            placeholder="Required"
                            disabled={!isEditing}
                            error={errors.transactionId}
                          />
                          <Input
                            label="Donor Bank IFSC *"
                            value={entry.donorBankIfsc || ''}
                            onChange={(e) => updateEntry(entry.deductionId, 'donorBankIfsc', e.target.value.toUpperCase())}
                            placeholder="e.g., HDFC0001234"
                            error={errors.donorBankIfsc}
                            disabled={!isEditing}
                          />
                        </div>

                        {/* Row 2: Date of Donation | Cash Amount | Non-Cash Amount | Total Contribution + Buttons */}
                        <div className="flex items-end gap-2.5">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1">
                            <DatePicker
                              label="Date of Donation *"
                              value={entry.dateOfDonation || null}
                              onChange={(date) => updateEntry(entry.deductionId, 'dateOfDonation', date)}
                              disabled={!isEditing}
                              error={errors.dateOfDonation}
                            />
                            <Input
                              label="Cash Amount"
                              type="number"
                              value={entry.contributionAmountCash || 0}
                              onChange={(e) => updateEntry(entry.deductionId, 'contributionAmountCash', Number(e.target.value))}
                              placeholder="0"
                              prefix="Rs."
                              disabled={!isEditing}
                            />
                            <Input
                              label="Non-Cash Amount"
                              type="number"
                              value={entry.contributionAmountNonCash || 0}
                              onChange={(e) => updateEntry(entry.deductionId, 'contributionAmountNonCash', Number(e.target.value))}
                              placeholder="0"
                              prefix="Rs."
                              disabled={!isEditing}
                            />
                            <Input
                              label="Total Contribution *"
                              type="number"
                              value={entry.totalContribution || 0}
                              onChange={(e) => updateEntry(entry.deductionId, 'totalContribution', Number(e.target.value))}
                              placeholder="0"
                              prefix="Rs."
                              error={errors.totalContribution}
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="flex gap-2 pb-0.5">
                            {!isEditing ? (
                              <>
                                <IconButton label="Edit" onClick={() => setEditingId(entry.deductionId)}>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        open={pendingDeleteId !== null && pendingDeleteId !== undefined}
        title="Delete Entry?"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={false}
        onConfirm={() => { if (pendingDeleteId != null) deleteEntry(pendingDeleteId); setPendingDeleteId(null); }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
