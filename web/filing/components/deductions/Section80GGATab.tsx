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
import Input from '@/filing/ui/Input';
import Select from '@/filing/ui/Select';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { Deduction80GGAModel } from '@/filing/models/deductions/donation/deduction-80gga-model';
import { useMasterData } from '@/filing/context/MasterDataContext';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const INITIAL_ENTRY: Deduction80GGAModel = {
  deductionId: null,
  filingId: null,
  clauseUnderDonation: null,
  doneeName: '',
  doneePan: null,
  donationAmountCash: 0,
  donationAmountNonCash: 0,
  totalDonationAmount: 0,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  pincode: null,
};

export default function Section80GGATab() {
  const { filing, updateSection } = useFilingContext();
  const { clauseTypes: CLAUSE_TYPES_80GGA, states: STATES } = useMasterData();

  const [entries, setEntries] = useState<Deduction80GGAModel[]>(() =>
    (filing.section80Gga ?? []).map((e, i) =>
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
    style.id = 'section-80gga-tab-compact-style';
    style.textContent = `
      .section-80gga-tab-compact input,
      .section-80gga-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('section-80gga-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('section-80gga-tab-compact-style')?.remove();
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

  const totalAmount = entries.reduce((sum, e) => sum + (e.totalDonationAmount || 0), 0);

  const updateEntry = (id: number | null | undefined, field: keyof Deduction80GGAModel, value: any) => {
    setEntries(prev => prev.map(e => {
      if (e.deductionId !== id) return e;
      const updated = { ...e, [field]: value };
      if (field === 'donationAmountCash' || field === 'donationAmountNonCash') {
        updated.totalDonationAmount = (updated.donationAmountCash || 0) + (updated.donationAmountNonCash || 0);
      }
      return updated;
    }));
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

  const saveEntry = (entry: Deduction80GGAModel) => {
    const errs: Record<string, string> = {};
    if (!entry.clauseUnderDonation) errs.clauseUnderDonation = 'Research/Program type is required';
    if (!entry.doneeName?.trim()) errs.doneeName = 'Donee/Institution name is required';
    if (!entry.doneePan?.trim()) {
      errs.doneePan = 'Donee PAN is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(entry.doneePan)) {
      errs.doneePan = 'Invalid PAN format (e.g., AAATA9999A)';
    } else if (filing.person?.panNumber && entry.doneePan.toUpperCase() === filing.person.panNumber.toUpperCase()) {
      errs.doneePan = 'Donee PAN cannot be the same as your filing PAN';
    }
    if ((entry.donationAmountCash || 0) === 0 && (entry.donationAmountNonCash || 0) === 0) {
      errs.totalDonationAmount = 'At least one donation amount is required';
    }
    if ((entry.donationAmountCash || 0) > 10000) {
      errs.donationAmountCash = 'Cash donations above Rs.10,000 are not eligible';
    }
    if (!entry.addressLine1?.trim()) errs.addressLine1 = 'Address is required';
    if (!entry.city?.trim()) errs.city = 'City is required';
    if (!entry.state) errs.state = 'State is required';
    if (!entry.pincode?.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(entry.pincode)) {
      errs.pincode = 'Invalid pincode format';
    }
    if (!entry.totalDonationAmount || entry.totalDonationAmount <= 0) errs.totalDonationAmount = errs.totalDonationAmount || 'Total donation amount is required';
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
    updateSection('section80Gga', updatedEntries);
    setEditingId(null);
  };

  const cancelEdit = (id: number | null | undefined) => {
    if ((id ?? 0) < 0) setEntries(prev => prev.filter(e => e.deductionId !== id));
    setEditingId(null);
  };

  const deleteEntry = (id: number | null | undefined) => {
    const updated = entries.filter(e => e.deductionId !== id);
    setEntries(updated);
    updateSection('section80Gga', updated);
    setPendingDeleteId(null);
    if (editingId === id) setEditingId(null);
  };

  const clauseOptions = [{ value: '', label: 'Select type' }, ...CLAUSE_TYPES_80GGA];
  const stateOptions = [{ value: '', label: 'Select state' }, ...STATES];

  return (
    <div className="section-80gga-tab-compact">
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
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <HeartIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">80GGA - Scientific Research</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">Rs.{formatCurrency(totalAmount)}</span>
            <IconButton
              label="Add Entry"
              onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}
            >
              <PlusCircleIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {entries.length === 0 ? (
              <div className="py-2">
                <AddButton label="Add Entry" colorScheme="purple" onClick={addEntry} />
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, index) => {
                  const isEditing = editingId === entry.deductionId;
                  const errors = entryErrors[entry.deductionId!] || {};

                  return (
                    <div
                      key={entry.deductionId}
                      className="border border-gray-200 rounded-lg p-2.5 bg-gray-50"
                      ref={index === entries.length - 1 ? lastEntryRef : null}
                    >
                      {/* 2-Column Layout: Left = Donation Details, Right = Address */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* LEFT COLUMN - Donation Details */}
                        <div className="space-y-2.5">
                          {/* Row 1: Clause Under Donation | Donee Name */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <Select
                              label="Clause Under Donation *"
                              value={entry.clauseUnderDonation || ''}
                              onChange={(e) => updateEntry(entry.deductionId, 'clauseUnderDonation', e.target.value)}
                              options={clauseOptions}
                              disabled={!isEditing}
                              error={errors.clauseUnderDonation}
                            />
                            <Input
                              label="Donee Name *"
                              value={entry.doneeName || ''}
                              onChange={(e) => updateEntry(entry.deductionId, 'doneeName', e.target.value)}
                              placeholder="Name of institution"
                              error={errors.doneeName}
                              disabled={!isEditing}
                            />
                          </div>

                          {/* Row 2: Donee PAN | Cash Amount */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <Input
                              label="Donee PAN"
                              value={entry.doneePan || ''}
                              onChange={(e) => updateEntry(entry.deductionId, 'doneePan', e.target.value.toUpperCase())}
                              placeholder="AAATA9999A"
                              disabled={!isEditing}
                              error={errors.doneePan}
                            />
                            <Input
                              label="Cash Amount"
                              type="number"
                              value={entry.donationAmountCash || 0}
                              onChange={(e) => updateEntry(entry.deductionId, 'donationAmountCash', Number(e.target.value))}
                              placeholder="0"
                              prefix="Rs."
                              disabled={!isEditing}
                              error={errors.donationAmountCash}
                            />
                          </div>

                          {/* Row 3: Non-Cash Amount | Total Donation Amount */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <Input
                              label="Non-Cash Amount"
                              type="number"
                              value={entry.donationAmountNonCash || 0}
                              onChange={(e) => updateEntry(entry.deductionId, 'donationAmountNonCash', Number(e.target.value))}
                              placeholder="0"
                              prefix="Rs."
                              disabled={!isEditing}
                            />
                            <Input
                              label="Total Donation Amount *"
                              type="number"
                              value={entry.totalDonationAmount || 0}
                              onChange={(e) => updateEntry(entry.deductionId, 'totalDonationAmount', Number(e.target.value))}
                              placeholder="0"
                              prefix="Rs."
                              error={errors.totalDonationAmount}
                              disabled
                            />
                          </div>
                        </div>

                        {/* RIGHT COLUMN - Address Details */}
                        <div className="space-y-2.5">
                          {/* Row 1: Address Line 1 | Address Line 2 */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <Input
                              label="Address Line 1 *"
                              value={entry.addressLine1 || ''}
                              onChange={(e) => updateEntry(entry.deductionId, 'addressLine1', e.target.value)}
                              placeholder="Required"
                              disabled={!isEditing}
                              error={errors.addressLine1}
                            />
                            <Input
                              label="Address Line 2"
                              value={entry.addressLine2 || ''}
                              onChange={(e) => updateEntry(entry.deductionId, 'addressLine2', e.target.value)}
                              placeholder="Optional"
                              disabled={!isEditing}
                            />
                          </div>

                          {/* Row 2: City | State */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <Input
                              label="City *"
                              value={entry.city || ''}
                              onChange={(e) => updateEntry(entry.deductionId, 'city', e.target.value)}
                              placeholder="Required"
                              disabled={!isEditing}
                              error={errors.city}
                            />
                            <Select
                              label="State *"
                              value={entry.state || ''}
                              onChange={(e) => updateEntry(entry.deductionId, 'state', e.target.value)}
                              options={stateOptions}
                              disabled={!isEditing}
                              error={errors.state}
                            />
                          </div>

                          {/* Row 3: Pincode + Action Buttons */}
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <Input
                                label="Pincode *"
                                value={entry.pincode || ''}
                                onChange={(e) => updateEntry(entry.deductionId, 'pincode', e.target.value)}
                                placeholder="Required"
                                disabled={!isEditing}
                                error={errors.pincode}
                              />
                            </div>
                            <div className="flex gap-1 pb-0.5">
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
