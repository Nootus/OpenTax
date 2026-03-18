'use client';

import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingLibraryIcon,
  TrashIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Input from '@/domain/filing/ui/Input';
import DatePicker from '@/domain/filing/ui/DatePicker';
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import type { Deduction80GGCModel } from '@/domain/filing/models/deductions/donation/deduction-80ggc-model';

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
    filing.section80Ggc ? [...filing.section80Ggc] : []
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingId, setEditingId] = useState<number | null | undefined>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);

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
    setEditingId(tempId);
  };

  const saveEntry = (entry: Deduction80GGCModel) => {
    const errs: Record<string, string> = {};
    if (!entry.doneeName?.trim()) errs.doneeName = 'Donee name is required';
    if (!entry.politicalPartyName?.trim()) errs.politicalPartyName = 'Political party name is required';
    if (!entry.transactionId?.trim()) errs.transactionId = 'Transaction ID is required';
    if (!entry.donorBankIfsc?.trim()) {
      errs.donorBankIfsc = 'Donor bank IFSC is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(entry.donorBankIfsc)) {
      errs.donorBankIfsc = 'Invalid IFSC format (e.g., HDFC0001234)';
    }
    if (!entry.dateOfDonation) errs.dateOfDonation = 'Date of donation is required';
    if ((entry.contributionAmountCash || 0) === 0 && (entry.contributionAmountNonCash || 0) === 0) {
      errs.totalContribution = 'At least one contribution amount is required';
    }
    if (!entry.totalContribution || entry.totalContribution <= 0) errs.totalContribution = errs.totalContribution || 'Total contribution is required';

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <BuildingLibraryIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">80GGC - Political Contributions</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
          <IconButton label="Add Entry" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
            <PlusCircleIcon className="w-5 h-5 text-green-600" />
          </IconButton>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          {entries.length === 0 ? (
            <AddButton label="Add Political Contribution" onClick={addEntry} colorScheme="teal" />
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
                        <p className="text-xs text-gray-500">Party: {entry.politicalPartyName} | Total: ₹{formatCurrency(entry.totalContribution || 0)}</p>
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
                        <Input label="Political Party Name" required value={entry.politicalPartyName || ''} onChange={(e) => updateEntry(entry.deductionId, 'politicalPartyName', e.target.value)} error={errs.politicalPartyName} />
                        <Input label="Transaction ID" required value={entry.transactionId || ''} onChange={(e) => updateEntry(entry.deductionId, 'transactionId', e.target.value)} error={errs.transactionId} />
                        <Input label="Donor Bank IFSC" required value={entry.donorBankIfsc || ''} onChange={(e) => updateEntry(entry.deductionId, 'donorBankIfsc', e.target.value.toUpperCase())} error={errs.donorBankIfsc} />
                        <DatePicker label="Date of Donation" required value={entry.dateOfDonation ? new Date(entry.dateOfDonation) : null} onChange={(d) => updateEntry(entry.deductionId, 'dateOfDonation', d)} error={errs.dateOfDonation} />
                        <Input label="Cash Contribution" type="number" value={entry.contributionAmountCash || 0} onChange={(e) => updateEntry(entry.deductionId, 'contributionAmountCash', Number(e.target.value))} prefix="₹" />
                        <Input label="Non-Cash Contribution" type="number" value={entry.contributionAmountNonCash || 0} onChange={(e) => updateEntry(entry.deductionId, 'contributionAmountNonCash', Number(e.target.value))} prefix="₹" />
                        <Input label="Total Contribution" required type="number" value={entry.totalContribution || 0} onChange={(e) => updateEntry(entry.deductionId, 'totalContribution', Number(e.target.value))} prefix="₹" error={errs.totalContribution} />
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
              <PlusCircleIcon className="w-4 h-4" /> Add another contribution
            </button>
          )}
        </div>
      )}
      <ConfirmModal open={pendingDeleteId != null} title="Delete Entry?" message="Are you sure you want to delete this 80GGC entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={() => deleteEntry(pendingDeleteId)} onCancel={() => setPendingDeleteId(null)} />
    </div>
  );
}
