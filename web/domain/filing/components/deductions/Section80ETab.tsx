'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  TrashIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Input from '@/domain/filing/ui/Input';
import Select from '@/domain/filing/ui/Select';
import DatePicker from '@/domain/filing/ui/DatePicker';
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import type { Deduction80EModel } from '@/domain/filing/models/deductions/loan/deduction-80e-model';
import { LENDER_TYPES } from '@/domain/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const INITIAL_ENTRY: Deduction80EModel = {
  deductionId: null,
  filingId: null,
  lenderType: '',
  lenderName: '',
  loanAccountNumber: null,
  loanSanctionDate: null,
  totalLoanAmount: null,
  loanOutstanding: null,
  interestOnLoan: 0,
};

export default function Section80ETab() {
  const { filing, updateSection } = useFilingContext();

  const [entries, setEntries] = useState<Deduction80EModel[]>(() => filing.section80E ?? []);
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

  const totalAmount = entries.reduce((sum, e) => sum + (e.interestOnLoan || 0), 0);

  const lenderOptions = [{ value: '', label: 'Select lender type' }, ...LENDER_TYPES];

  const updateEntry = (deductionId: number | null | undefined, field: keyof Deduction80EModel, value: any) => {
    setEntries(prev => prev.map(e => e.deductionId === deductionId ? { ...e, [field]: value } : e));
    if (deductionId != null && entryErrors[deductionId as number]?.[field as string]) {
      setEntryErrors(prev => { const curr = { ...prev[deductionId as number] }; delete curr[field as string]; return { ...prev, [deductionId as number]: curr }; });
    }
  };

  const addEntry = () => {
    const tempId = -Date.now();
    setEntries(prev => [...prev, { ...INITIAL_ENTRY, deductionId: tempId }]);
  };

  const saveEntry = (entry: Deduction80EModel) => {
    const errs: Record<string, string> = {};
    if (!entry.lenderType?.trim()) errs.lenderType = 'Lender type is required';
    if (!entry.lenderName?.trim()) errs.lenderName = 'Lender name is required';
    if (!entry.loanAccountNumber?.trim()) errs.loanAccountNumber = 'Loan account number is required';
    if (!entry.loanSanctionDate) errs.loanSanctionDate = 'Loan sanction date is required';
    if (!entry.totalLoanAmount || entry.totalLoanAmount <= 0) errs.totalLoanAmount = 'Total loan amount must be > 0';
    if (!entry.loanOutstanding || entry.loanOutstanding <= 0) errs.loanOutstanding = 'Loan outstanding must be > 0';
    if (!entry.interestOnLoan || entry.interestOnLoan <= 0) errs.interestOnLoan = 'Interest amount must be > 0';
    if (Object.keys(errs).length > 0) {
      if (entry.deductionId != null) setEntryErrors(prev => ({ ...prev, [entry.deductionId!]: errs }));
      return;
    }
    if (entry.deductionId != null) setEntryErrors(prev => { const next = { ...prev }; delete next[entry.deductionId!]; return next; });

    const isNew = (entry.deductionId ?? 0) < 0;
    const savedEntry = { ...entry, deductionId: isNew ? Date.now() : entry.deductionId };
    const updatedEntries = entries.map(e => e.deductionId === entry.deductionId ? savedEntry : e);
    setEntries(updatedEntries);
    updateSection('section80E', updatedEntries);
    setEditingEntryId(null);
  };

  const deleteEntry = (deductionId: number | null | undefined) => {
    const updated = entries.filter(e => e.deductionId !== deductionId);
    setEntries(updated);
    updateSection('section80E', updated);
    if (editingEntryId === deductionId) setEditingEntryId(null);
    setPendingDeleteId(null);
  };

  const cancelEdit = (deductionId: number | null | undefined) => {
    if ((deductionId ?? 0) < 0) setEntries(prev => prev.filter(e => e.deductionId !== deductionId));
    setEditingEntryId(null);
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
              {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <AcademicCapIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">80E - Education Loan Interest</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-gray-500">Total Interest</div>
              <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
            </div>
            <IconButton label="Add Loan" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
              <PlusCircleIcon className="w-5 h-5 text-blue-600" />
            </IconButton>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {entries.length === 0 ? (
              <AddButton label="Add Education Loan" colorScheme="blue" onClick={addEntry} />
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => {
                  const isEditing = editingEntryId === entry.deductionId;
                  const errs = entryErrors[entry.deductionId!] || {};
                  return (
                    <div key={entry.deductionId || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50" ref={index === entries.length - 1 ? lastEntryRef : null}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <Select label="Lender Type" required value={entry.lenderType || ''} onChange={(e) => updateEntry(entry.deductionId, 'lenderType', e.target.value)} options={lenderOptions} disabled={!isEditing} error={errs.lenderType} />
                        <Input label="Lender Name" required value={entry.lenderName || ''} onChange={(e) => updateEntry(entry.deductionId, 'lenderName', e.target.value)} disabled={!isEditing} error={errs.lenderName} />
                        <Input label="Loan Account Number" required value={entry.loanAccountNumber || ''} onChange={(e) => updateEntry(entry.deductionId, 'loanAccountNumber', e.target.value)} disabled={!isEditing} error={errs.loanAccountNumber} />
                        <DatePicker label="Sanction Date" required value={entry.loanSanctionDate ? new Date(entry.loanSanctionDate) : null} onChange={(d) => updateEntry(entry.deductionId, 'loanSanctionDate', d)} disabled={!isEditing} error={errs.loanSanctionDate} />
                        <Input label="Total Loan Amount" required type="number" value={entry.totalLoanAmount || 0} onChange={(e) => updateEntry(entry.deductionId, 'totalLoanAmount', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errs.totalLoanAmount} />
                        <Input label="Loan Outstanding" required type="number" value={entry.loanOutstanding || 0} onChange={(e) => updateEntry(entry.deductionId, 'loanOutstanding', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errs.loanOutstanding} />
                        <Input label="Interest on Loan" required type="number" value={entry.interestOnLoan || 0} onChange={(e) => updateEntry(entry.deductionId, 'interestOnLoan', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errs.interestOnLoan} />
                      </div>
                      <div className="flex justify-end gap-2">
                        {!isEditing ? (
                          <>
                            <IconButton label="Edit" onClick={() => setEditingEntryId(entry.deductionId)}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
                            <IconButton label="Delete" onClick={() => setPendingDeleteId(entry.deductionId)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => cancelEdit(entry.deductionId)}>Cancel</Button>
                            <Button variant="primary" size="sm" onClick={() => saveEntry(entry)}>Save</Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmModal open={pendingDeleteId !== null} title="Delete Entry?" message="Are you sure you want to delete this loan entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={() => { if (pendingDeleteId != null) deleteEntry(pendingDeleteId); }} onCancel={() => setPendingDeleteId(null)} />
    </div>
  );
}
