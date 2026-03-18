'use client';

import { useState, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HeartIcon,
  TrashIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Input from '@/domain/filing/ui/Input';
import Select from '@/domain/filing/ui/Select';
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import type { Deduction80GModel } from '@/domain/filing/models/deductions/donation/deduction-80g-model';
import { DONATION_TYPES, QUALIFYING_PERCENTAGES, LIMIT_ON_DEDUCTION, STATES } from '@/domain/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const INITIAL_ENTRY: Deduction80GModel = {
  deductionId: null,
  filingId: null,
  doneeName: '',
  doneePan: null,
  donationType: null,
  donationAmountCash: 0,
  donationAmountNonCash: 0,
  donationAmount: 0,
  limitOnDeduction: null,
  qualifyingPercentage: null,
  approvalReferenceNumber: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  pincode: null,
};

export default function Section80GTab() {
  const { filing, updateSection } = useFilingContext();

  const [entries, setEntries] = useState<Deduction80GModel[]>(() =>
    filing.section80G ? [...filing.section80G] : []
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<number | null | undefined>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);
  const savedEntryRef = useRef<Deduction80GModel | null>(null);

  const totalAmount = entries.reduce((sum, e) => sum + (e.donationAmount || 0), 0);

  const updateEntry = (id: number | null | undefined, field: keyof Deduction80GModel, value: any) => {
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
    const newEntry = { ...INITIAL_ENTRY, deductionId: tempId };
    setEntries(prev => [...prev, newEntry]);
    setEditingId(tempId);
  };

  const saveEntry = (entry: Deduction80GModel) => {
    const errs: Record<string, string> = {};
    if (!entry.doneeName?.trim()) errs.doneeName = 'Donee name is required';
    if (!entry.doneePan?.trim()) {
      errs.doneePan = 'Donee PAN is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(entry.doneePan)) {
      errs.doneePan = 'Invalid PAN format (e.g., AAATA9999A)';
    }
    if (!entry.donationType) errs.donationType = 'Donation type is required';
    if ((entry.donationAmountCash || 0) > 2000) errs.donationAmountCash = 'Cash donations above ₹2,000 are not eligible';
    if ((entry.donationAmountCash || 0) === 0 && (entry.donationAmountNonCash || 0) === 0) errs.donationAmount = 'At least one donation amount is required';
    if (!entry.qualifyingPercentage) errs.qualifyingPercentage = 'Qualifying percentage is required';
    if (!entry.limitOnDeduction) errs.limitOnDeduction = 'Limit on deduction is required';
    if (!entry.approvalReferenceNumber?.trim()) errs.approvalReferenceNumber = 'Approval reference number is required';
    if (!entry.addressLine1?.trim()) errs.addressLine1 = 'Address is required';
    if (!entry.city?.trim()) errs.city = 'City is required';
    if (!entry.state) errs.state = 'State is required';
    if (!entry.pincode?.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(entry.pincode)) {
      errs.pincode = 'Invalid pincode format';
    }
    if (!entry.donationAmount || entry.donationAmount <= 0) errs.donationAmount = errs.donationAmount || 'Total donation amount is required';

    if (Object.keys(errs).length > 0) {
      if (entry.deductionId != null) setEntryErrors(prev => ({ ...prev, [entry.deductionId!]: errs }));
      return;
    }

    const isNew = (entry.deductionId ?? 0) < 0;
    const savedId = isNew ? Date.now() : entry.deductionId!;
    const saved = { ...entry, deductionId: savedId };
    const updatedEntries = isNew
      ? entries.map(e => e.deductionId === entry.deductionId ? saved : e)
      : entries.map(e => e.deductionId === entry.deductionId ? saved : e);
    setEntries(updatedEntries);
    if (entry.deductionId != null) setEntryErrors(prev => { const n = { ...prev }; delete n[entry.deductionId!]; return n; });
    updateSection('section80G', updatedEntries.map(e => e.deductionId === entry.deductionId ? saved : e));
    setEditingId(null);
  };

  const cancelEdit = (id: number | null | undefined) => {
    if ((id ?? 0) < 0) {
      setEntries(prev => prev.filter(e => e.deductionId !== id));
    }
    setEditingId(null);
  };

  const deleteEntry = (id: number | null | undefined) => {
    const updated = entries.filter(e => e.deductionId !== id);
    setEntries(updated);
    updateSection('section80G', updated);
    setPendingDeleteId(null);
    if (editingId === id) setEditingId(null);
  };

  const donationOptions = [{ value: '', label: 'Select type' }, ...DONATION_TYPES];
  const qualifyingOptions = [{ value: '', label: 'Select percentage' }, ...QUALIFYING_PERCENTAGES];
  const limitOptions = [{ value: '', label: 'Select limit' }, ...LIMIT_ON_DEDUCTION];
  const stateOptions = [{ value: '', label: 'Select state' }, ...STATES];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <HeartIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">80G - Donations to Charity</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
          <IconButton label="Add Entry" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
            <PlusCircleIcon className="w-5 h-5 text-rose-600" />
          </IconButton>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {entries.length === 0 ? (
            <AddButton label="Add Donation Entry" onClick={addEntry} colorScheme="orange" />
          ) : (
            entries.map((entry) => {
              const isEditing = editingId === entry.deductionId;
              const errs = entryErrors[entry.deductionId!] || {};
              return (
                <div key={entry.deductionId} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {!isEditing ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.doneeName}</p>
                        <p className="text-xs text-gray-500">PAN: {entry.doneePan} | Total: ₹{formatCurrency(entry.donationAmount || 0)}</p>
                      </div>
                      <div className="flex gap-1">
                        <IconButton label="Edit" onClick={() => setEditingId(entry.deductionId)}>
                          <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                        </IconButton>
                        <IconButton label="Delete" onClick={() => setPendingDeleteId(entry.deductionId)}>
                          <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                        </IconButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Donee Name" required value={entry.doneeName || ''} onChange={(e) => updateEntry(entry.deductionId, 'doneeName', e.target.value)} error={errs.doneeName} />
                        <Input label="Donee PAN" required value={entry.doneePan || ''} onChange={(e) => updateEntry(entry.deductionId, 'doneePan', e.target.value.toUpperCase())} error={errs.doneePan} />
                        <Select label="Donation Type" required value={entry.donationType || ''} onChange={(e) => updateEntry(entry.deductionId, 'donationType', e.target.value)} options={donationOptions} error={errs.donationType} />
                        <Input label="Approval Reference Number" required value={entry.approvalReferenceNumber || ''} onChange={(e) => updateEntry(entry.deductionId, 'approvalReferenceNumber', e.target.value)} error={errs.approvalReferenceNumber} />
                        <Input label="Cash Donation" type="number" value={entry.donationAmountCash || 0} onChange={(e) => updateEntry(entry.deductionId, 'donationAmountCash', Number(e.target.value))} prefix="₹" error={errs.donationAmountCash} />
                        <Input label="Non-Cash Donation" type="number" value={entry.donationAmountNonCash || 0} onChange={(e) => updateEntry(entry.deductionId, 'donationAmountNonCash', Number(e.target.value))} prefix="₹" />
                        <Input label="Total Donation Amount" required type="number" value={entry.donationAmount || 0} onChange={(e) => updateEntry(entry.deductionId, 'donationAmount', Number(e.target.value))} prefix="₹" error={errs.donationAmount} />
                        <Select label="Qualifying Percentage" required value={entry.qualifyingPercentage || ''} onChange={(e) => updateEntry(entry.deductionId, 'qualifyingPercentage', e.target.value)} options={qualifyingOptions} error={errs.qualifyingPercentage} />
                        <Select label="Limit on Deduction" required value={entry.limitOnDeduction || ''} onChange={(e) => updateEntry(entry.deductionId, 'limitOnDeduction', e.target.value)} options={limitOptions} error={errs.limitOnDeduction} />
                        <Input label="Address Line 1" required value={entry.addressLine1 || ''} onChange={(e) => updateEntry(entry.deductionId, 'addressLine1', e.target.value)} error={errs.addressLine1} />
                        <Input label="City" required value={entry.city || ''} onChange={(e) => updateEntry(entry.deductionId, 'city', e.target.value)} error={errs.city} />
                        <Select label="State" required value={entry.state || ''} onChange={(e) => updateEntry(entry.deductionId, 'state', e.target.value)} options={stateOptions} error={errs.state} />
                        <Input label="Pincode" required value={entry.pincode || ''} onChange={(e) => updateEntry(entry.deductionId, 'pincode', e.target.value)} error={errs.pincode} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <Button variant="outline" size="sm" onClick={() => cancelEdit(entry.deductionId)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={() => saveEntry(entry)}>Save</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {entries.length > 0 && (
            <button onClick={addEntry} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
              <PlusCircleIcon className="w-4 h-4" /> Add another donation
            </button>
          )}
        </div>
      )}
      <ConfirmModal open={pendingDeleteId != null} title="Delete Entry?" message="Are you sure you want to delete this 80G donation entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={() => deleteEntry(pendingDeleteId)} onCancel={() => setPendingDeleteId(null)} />
    </div>
  );
}
