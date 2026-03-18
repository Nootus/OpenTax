'use client';

import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  BanknotesIcon,
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
import type { TDSModel } from '@/domain/filing/models/tax-credits/tds-model';
import type { TCSModel } from '@/domain/filing/models/tax-credits/tcs-model';
import type { TaxPaidSelfModel } from '@/domain/filing/models/tax-credits/tax-paid-self-model';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const QUARTERS = [
  { value: '', label: 'Select quarter' },
  { value: 'Q1', label: 'Q1 (Apr–Jun)' },
  { value: 'Q2', label: 'Q2 (Jul–Sep)' },
  { value: 'Q3', label: 'Q3 (Oct–Dec)' },
  { value: 'Q4', label: 'Q4 (Jan–Mar)' },
];

const TAX_TYPES = [
  { value: '', label: 'Select type' },
  { value: '100', label: 'Advance Tax' },
  { value: '300', label: 'Self Assessment Tax' },
];

// ─────────── TDS Section ───────────

const INITIAL_TDS: TDSModel = {
  tdsId: null,
  filingId: 0,
  deductorName: '',
  tan: '',
  pan: null,
  incomeSource: null,
  tdsSection: null,
  amountPaid: null,
  taxDeducted: null,
  tdsCertificateNumber: null,
  quarter: null,
};

function TDSSection() {
  const { filing, updateSection } = useFilingContext();
  const [entries, setEntries] = useState<TDSModel[]>(() => filing.tds ? [...filing.tds] : []);
  const [editingId, setEditingId] = useState<number | null | undefined>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const total = entries.reduce((s, e) => s + (e.taxDeducted || 0), 0);

  const tempKey = (e: TDSModel) => e.tdsId ?? -1;

  const updateEntry = (id: number | null | undefined, field: keyof TDSModel, value: any) => {
    setEntries(prev => prev.map(e => (e.tdsId ?? -1) === id ? { ...e, [field]: value } : e));
  };

  const addEntry = () => {
    const tempId = -Date.now();
    setEntries(prev => [...prev, { ...INITIAL_TDS, tdsId: tempId }]);
    setEditingId(tempId);
  };

  const saveEntry = (entry: TDSModel) => {
    const id = tempKey(entry);
    const errs: Record<string, string> = {};
    if (!entry.deductorName?.trim()) errs.deductorName = 'Deductor name is required';
    if (!entry.tan?.trim()) errs.tan = 'TAN is required';
    else if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(entry.tan)) errs.tan = 'Invalid TAN format (e.g., AAAA99999A)';
    if (!entry.incomeSource?.trim()) errs.incomeSource = 'Income source is required';
    if (!entry.taxDeducted || entry.taxDeducted <= 0) errs.taxDeducted = 'Tax deducted amount is required';
    if (Object.keys(errs).length > 0) { setEntryErrors(prev => ({ ...prev, [id]: errs })); return; }

    const isNew = id < 0;
    const savedId = isNew ? Date.now() : id;
    const saved = { ...entry, tdsId: savedId };
    const updated = entries.map(e => tempKey(e) === id ? saved : e);
    setEntries(updated);
    updateSection('tds', updated);
    setEntryErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    setEditingId(null);
  };

  const cancelEdit = (id: number | null | undefined) => {
    const numId = id ?? -1;
    if (numId < 0) setEntries(prev => prev.filter(e => tempKey(e) !== numId));
    setEditingId(null);
  };

  const deleteEntry = (id: number | null | undefined) => {
    const numId = id ?? -1;
    const updated = entries.filter(e => tempKey(e) !== numId);
    setEntries(updated);
    updateSection('tds', updated);
    setPendingDeleteId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <DocumentTextIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">TDS - Tax Deducted at Source</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-blue-600">₹{formatCurrency(total)}</span>
          <IconButton label="Add TDS Entry" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
            <PlusCircleIcon className="w-5 h-5 text-blue-600" />
          </IconButton>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {entries.length === 0 ? (
            <AddButton label="Add TDS Entry" onClick={addEntry} colorScheme="blue" />
          ) : (
            entries.map((entry) => {
              const id = tempKey(entry);
              const isEditing = editingId === id;
              const errs = entryErrors[id] || {};
              return (
                <div key={id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {!isEditing ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.deductorName}</p>
                        <p className="text-xs text-gray-500">TAN: {entry.tan} | Tax Deducted: ₹{formatCurrency(entry.taxDeducted || 0)}</p>
                      </div>
                      <div className="flex gap-1">
                        <IconButton label="Edit" onClick={() => setEditingId(id)}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
                        <IconButton label="Delete" onClick={() => setPendingDeleteId(id)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Deductor Name" required value={entry.deductorName || ''} onChange={(e) => updateEntry(id, 'deductorName', e.target.value)} error={errs.deductorName} />
                        <Input label="TAN" required value={entry.tan || ''} onChange={(e) => updateEntry(id, 'tan', e.target.value.toUpperCase())} placeholder="AAAA99999A" error={errs.tan} />
                        <Input label="Deductor PAN" value={entry.pan || ''} onChange={(e) => updateEntry(id, 'pan', e.target.value.toUpperCase())} />
                        <Input label="Income Source" required value={entry.incomeSource || ''} onChange={(e) => updateEntry(id, 'incomeSource', e.target.value)} error={errs.incomeSource} />
                        <Input label="TDS Section" value={entry.tdsSection || ''} onChange={(e) => updateEntry(id, 'tdsSection', e.target.value)} placeholder="e.g. 192, 194A" />
                        <Input label="Amount Paid / Credited" type="number" value={entry.amountPaid || 0} onChange={(e) => updateEntry(id, 'amountPaid', Number(e.target.value))} prefix="₹" />
                        <Input label="Tax Deducted" required type="number" value={entry.taxDeducted || 0} onChange={(e) => updateEntry(id, 'taxDeducted', Number(e.target.value))} prefix="₹" error={errs.taxDeducted} />
                        <Input label="Certificate Number" value={entry.tdsCertificateNumber || ''} onChange={(e) => updateEntry(id, 'tdsCertificateNumber', e.target.value)} />
                        <Select label="Quarter" value={entry.quarter || ''} onChange={(e) => updateEntry(id, 'quarter', e.target.value)} options={QUARTERS} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <Button variant="outline" size="sm" onClick={() => cancelEdit(id)}>Cancel</Button>
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
              <PlusCircleIcon className="w-4 h-4" /> Add another TDS entry
            </button>
          )}
        </div>
      )}
      <ConfirmModal open={pendingDeleteId != null} title="Delete TDS Entry?" message="Are you sure you want to delete this TDS entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={() => deleteEntry(pendingDeleteId)} onCancel={() => setPendingDeleteId(null)} />
    </div>
  );
}

// ─────────── TCS Section ───────────

const INITIAL_TCS: TCSModel = {
  tcsId: null,
  filingId: null,
  collectorName: '',
  tan: '',
  natureOfCollection: null,
  amountCollected: null,
  taxCollected: null,
  tcsCertificateNumber: null,
  quarter: null,
};

function TCSSection() {
  const { filing, updateSection } = useFilingContext();
  const [entries, setEntries] = useState<TCSModel[]>(() => filing.tcs ? [...filing.tcs] : []);
  const [editingId, setEditingId] = useState<number | null | undefined>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const total = entries.reduce((s, e) => s + (e.taxCollected || 0), 0);
  const tempKey = (e: TCSModel) => e.tcsId ?? -1;

  const updateEntry = (id: number | null | undefined, field: keyof TCSModel, value: any) => {
    setEntries(prev => prev.map(e => (e.tcsId ?? -1) === id ? { ...e, [field]: value } : e));
  };

  const addEntry = () => {
    const tempId = -Date.now();
    setEntries(prev => [...prev, { ...INITIAL_TCS, tcsId: tempId }]);
    setEditingId(tempId);
  };

  const saveEntry = (entry: TCSModel) => {
    const id = tempKey(entry);
    const errs: Record<string, string> = {};
    if (!entry.collectorName?.trim()) errs.collectorName = 'Collector name is required';
    if (!entry.tan?.trim()) errs.tan = 'TAN is required';
    else if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(entry.tan)) errs.tan = 'Invalid TAN format';
    if (!entry.taxCollected || entry.taxCollected <= 0) errs.taxCollected = 'Tax collected amount is required';
    if (Object.keys(errs).length > 0) { setEntryErrors(prev => ({ ...prev, [id]: errs })); return; }

    const isNew = id < 0;
    const savedId = isNew ? Date.now() : id;
    const saved = { ...entry, tcsId: savedId };
    const updated = entries.map(e => tempKey(e) === id ? saved : e);
    setEntries(updated);
    updateSection('tcs', updated);
    setEntryErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    setEditingId(null);
  };

  const cancelEdit = (id: number | null | undefined) => {
    const numId = id ?? -1;
    if (numId < 0) setEntries(prev => prev.filter(e => tempKey(e) !== numId));
    setEditingId(null);
  };

  const deleteEntry = (id: number | null | undefined) => {
    const numId = id ?? -1;
    const updated = entries.filter(e => tempKey(e) !== numId);
    setEntries(updated);
    updateSection('tcs', updated);
    setPendingDeleteId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CurrencyRupeeIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">TCS - Tax Collected at Source</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-blue-600">₹{formatCurrency(total)}</span>
          <IconButton label="Add TCS Entry" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
            <PlusCircleIcon className="w-5 h-5 text-emerald-600" />
          </IconButton>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {entries.length === 0 ? (
            <AddButton label="Add TCS Entry" onClick={addEntry} colorScheme="teal" />
          ) : (
            entries.map((entry) => {
              const id = tempKey(entry);
              const isEditing = editingId === id;
              const errs = entryErrors[id] || {};
              return (
                <div key={id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {!isEditing ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.collectorName}</p>
                        <p className="text-xs text-gray-500">TAN: {entry.tan} | Tax Collected: ₹{formatCurrency(entry.taxCollected || 0)}</p>
                      </div>
                      <div className="flex gap-1">
                        <IconButton label="Edit" onClick={() => setEditingId(id)}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
                        <IconButton label="Delete" onClick={() => setPendingDeleteId(id)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Collector Name" required value={entry.collectorName || ''} onChange={(e) => updateEntry(id, 'collectorName', e.target.value)} error={errs.collectorName} />
                        <Input label="TAN" required value={entry.tan || ''} onChange={(e) => updateEntry(id, 'tan', e.target.value.toUpperCase())} placeholder="AAAA99999A" error={errs.tan} />
                        <Input label="Nature of Collection" value={entry.natureOfCollection || ''} onChange={(e) => updateEntry(id, 'natureOfCollection', e.target.value)} />
                        <Input label="Amount Collected" type="number" value={entry.amountCollected || 0} onChange={(e) => updateEntry(id, 'amountCollected', Number(e.target.value))} prefix="₹" />
                        <Input label="Tax Collected" required type="number" value={entry.taxCollected || 0} onChange={(e) => updateEntry(id, 'taxCollected', Number(e.target.value))} prefix="₹" error={errs.taxCollected} />
                        <Input label="Certificate Number" value={entry.tcsCertificateNumber || ''} onChange={(e) => updateEntry(id, 'tcsCertificateNumber', e.target.value)} />
                        <Select label="Quarter" value={entry.quarter || ''} onChange={(e) => updateEntry(id, 'quarter', e.target.value)} options={QUARTERS} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <Button variant="outline" size="sm" onClick={() => cancelEdit(id)}>Cancel</Button>
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
              <PlusCircleIcon className="w-4 h-4" /> Add another TCS entry
            </button>
          )}
        </div>
      )}
      <ConfirmModal open={pendingDeleteId != null} title="Delete TCS Entry?" message="Are you sure you want to delete this TCS entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={() => deleteEntry(pendingDeleteId)} onCancel={() => setPendingDeleteId(null)} />
    </div>
  );
}

// ─────────── Advance Tax Section ───────────

const INITIAL_TAX_PAID: TaxPaidSelfModel = {
  taxPaidId: null,
  filingId: null,
  challanNumber: null,
  bsrCode: null,
  dateOfPayment: null,
  taxPaidAmount: null,
  taxType: null,
};

function AdvanceTaxSection() {
  const { filing, updateSection } = useFilingContext();
  const [entries, setEntries] = useState<TaxPaidSelfModel[]>(() => filing.advanceTax ? [...filing.advanceTax] : []);
  const [editingId, setEditingId] = useState<number | null | undefined>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const total = entries.reduce((s, e) => s + (e.taxPaidAmount || 0), 0);
  const tempKey = (e: TaxPaidSelfModel) => e.taxPaidId ?? -1;

  const updateEntry = (id: number | null | undefined, field: keyof TaxPaidSelfModel, value: any) => {
    setEntries(prev => prev.map(e => (e.taxPaidId ?? -1) === id ? { ...e, [field]: value } : e));
  };

  const addEntry = () => {
    const tempId = -Date.now();
    setEntries(prev => [...prev, { ...INITIAL_TAX_PAID, taxPaidId: tempId }]);
    setEditingId(tempId);
  };

  const saveEntry = (entry: TaxPaidSelfModel) => {
    const id = tempKey(entry);
    const errs: Record<string, string> = {};
    if (!entry.taxPaidAmount || entry.taxPaidAmount <= 0) errs.taxPaidAmount = 'Tax paid amount is required';
    if (!entry.dateOfPayment) errs.dateOfPayment = 'Date of payment is required';
    if (Object.keys(errs).length > 0) { setEntryErrors(prev => ({ ...prev, [id]: errs })); return; }

    const isNew = id < 0;
    const savedId = isNew ? Date.now() : id;
    const saved = { ...entry, taxPaidId: savedId };
    const updated = entries.map(e => tempKey(e) === id ? saved : e);
    setEntries(updated);
    updateSection('advanceTax', updated);
    setEntryErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    setEditingId(null);
  };

  const cancelEdit = (id: number | null | undefined) => {
    const numId = id ?? -1;
    if (numId < 0) setEntries(prev => prev.filter(e => tempKey(e) !== numId));
    setEditingId(null);
  };

  const deleteEntry = (id: number | null | undefined) => {
    const numId = id ?? -1;
    const updated = entries.filter(e => tempKey(e) !== numId);
    setEntries(updated);
    updateSection('advanceTax', updated);
    setPendingDeleteId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <BanknotesIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">Advance Tax & Self Assessment Tax</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-blue-600">₹{formatCurrency(total)}</span>
          <IconButton label="Add Entry" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
            <PlusCircleIcon className="w-5 h-5 text-purple-600" />
          </IconButton>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {entries.length === 0 ? (
            <AddButton label="Add Tax Payment" onClick={addEntry} colorScheme="purple" />
          ) : (
            entries.map((entry) => {
              const id = tempKey(entry);
              const isEditing = editingId === id;
              const errs = entryErrors[id] || {};
              return (
                <div key={id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {!isEditing ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Challan: {entry.challanNumber || '—'}</p>
                        <p className="text-xs text-gray-500">BSR: {entry.bsrCode || '—'} | Amount: ₹{formatCurrency(entry.taxPaidAmount || 0)}</p>
                      </div>
                      <div className="flex gap-1">
                        <IconButton label="Edit" onClick={() => setEditingId(id)}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
                        <IconButton label="Delete" onClick={() => setPendingDeleteId(id)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="Challan Number" value={entry.challanNumber || ''} onChange={(e) => updateEntry(id, 'challanNumber', e.target.value)} />
                        <Input label="BSR Code" value={entry.bsrCode || ''} onChange={(e) => updateEntry(id, 'bsrCode', e.target.value)} />
                        <DatePicker label="Date of Payment" required value={entry.dateOfPayment ? new Date(entry.dateOfPayment) : null} onChange={(d) => updateEntry(id, 'dateOfPayment', d)} error={errs.dateOfPayment} />
                        <Input label="Tax Paid Amount" required type="number" value={entry.taxPaidAmount || 0} onChange={(e) => updateEntry(id, 'taxPaidAmount', Number(e.target.value))} prefix="₹" error={errs.taxPaidAmount} />
                        <Select label="Tax Type" value={entry.taxType || ''} onChange={(e) => updateEntry(id, 'taxType', e.target.value)} options={TAX_TYPES} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <Button variant="outline" size="sm" onClick={() => cancelEdit(id)}>Cancel</Button>
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
              <PlusCircleIcon className="w-4 h-4" /> Add another payment
            </button>
          )}
        </div>
      )}
      <ConfirmModal open={pendingDeleteId != null} title="Delete Entry?" message="Are you sure you want to delete this tax payment?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={() => deleteEntry(pendingDeleteId)} onCancel={() => setPendingDeleteId(null)} />
    </div>
  );
}

// ─────────── Main TaxPaidTab ───────────

export default function TaxPaidTab() {
  const { filing } = useFilingContext();

  const totalTaxPaid =
    (filing.tds?.reduce((s, e) => s + (e.taxDeducted || 0), 0) ?? 0) +
    (filing.tcs?.reduce((s, e) => s + (e.taxCollected || 0), 0) ?? 0) +
    (filing.advanceTax?.reduce((s, e) => s + (e.taxPaidAmount || 0), 0) ?? 0);

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-8">
        <div className="text-center">
          <h3 className="text-gray-800 text-xl font-semibold mb-3">Total Taxes Paid</h3>
          <div className="text-indigo-600 text-5xl font-bold">₹{formatCurrency(totalTaxPaid)}</div>
          <p className="text-gray-500 text-sm mt-2">Sum of TDS + TCS + Advance Tax / Self Assessment Tax</p>
        </div>
      </div>

      <TDSSection />
      <TCSSection />
      <AdvanceTaxSection />
    </div>
  );
}
