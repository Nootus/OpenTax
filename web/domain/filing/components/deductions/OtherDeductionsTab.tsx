'use client';

import { useState, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  TrashIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Input from '@/domain/filing/ui/Input';
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import type { OtherDeductionModel } from '@/domain/filing/models/deductions/other/other-deduction-model';
import { INITIAL_OTHER_DEDUCTION_FORM_DATA } from '@/domain/filing/models/deductions/other/other-deduction-model';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

function buildEntry(filing: any): OtherDeductionModel | null {
  const tta = filing.section80Tta;
  const ttb = filing.section80Ttb;
  const cch = filing.section80Cch;
  const gg = filing.section80Gg;
  if (!tta && !ttb && !cch && !gg) return null;
  return {
    filingId: null,
    deduction80Tta: tta ?? { deductionId: null, filingId: null, interestAmount: 0 },
    deduction80Ttb: ttb ?? { deductionId: null, filingId: null, interestAmount: 0 },
    deduction80Cch: cch ?? { deductionId: null, filingId: null, contributionAmount: 0 },
    deduction80Gg: gg ?? { deductionId: null, filingId: null, rentPaidAmount: 0 },
  };
}

export default function OtherDeductionsTab() {
  const { filing, updateSection } = useFilingContext();

  const [entry, setEntry] = useState<OtherDeductionModel | null>(() => buildEntry(filing));
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<OtherDeductionModel | null>(null);

  const hasEntry = entry !== null;
  const totalAmount = entry
    ? (entry.deduction80Tta.interestAmount || 0)
      + (entry.deduction80Ttb.interestAmount || 0)
      + (entry.deduction80Cch.contributionAmount || 0)
      + (entry.deduction80Gg.rentPaidAmount || 0)
    : 0;

  const updateSubField = (
    section: 'deduction80Tta' | 'deduction80Ttb' | 'deduction80Cch' | 'deduction80Gg',
    field: string,
    value: any
  ) => {
    setEntry(prev => prev ? { ...prev, [section]: { ...prev[section], [field]: value } } : prev);
    const keyMap: Record<string, string> = { deduction80Tta: 'tta', deduction80Ttb: 'ttb', deduction80Cch: 'cch', deduction80Gg: 'gg' };
    const errKey = keyMap[section];
    if (errKey && errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: '' }));
    if (errors._form) setErrors(prev => ({ ...prev, _form: '' }));
  };

  const validate = (): boolean => {
    if (!entry) return false;
    const e: Record<string, string> = {};
    if ((entry.deduction80Tta.interestAmount || 0) < 0) e.tta = 'Amount cannot be negative';
    if ((entry.deduction80Ttb.interestAmount || 0) < 0) e.ttb = 'Amount cannot be negative';
    if ((entry.deduction80Cch.contributionAmount || 0) < 0) e.cch = 'Amount cannot be negative';
    if ((entry.deduction80Gg.rentPaidAmount || 0) < 0) e.gg = 'Amount cannot be negative';
    const allZero = (entry.deduction80Tta.interestAmount || 0) === 0
      && (entry.deduction80Ttb.interestAmount || 0) === 0
      && (entry.deduction80Cch.contributionAmount || 0) === 0
      && (entry.deduction80Gg.rentPaidAmount || 0) === 0;
    if (allZero) e._form = 'Please enter at least one deduction amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    const newEntry = { ...INITIAL_OTHER_DEDUCTION_FORM_DATA };
    setEntry(newEntry);
    setIsEditing(true);
    savedRef.current = null;
  };

  const handleEdit = () => {
    savedRef.current = entry ? { ...entry } : null;
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (savedRef.current !== null) setEntry(savedRef.current);
    else if (!hasEntry) setEntry(null);
    setErrors({});
    setIsEditing(false);
    savedRef.current = null;
  };

  const handleSave = () => {
    if (!entry || !validate()) return;
    updateSection('section80Tta', entry.deduction80Tta.interestAmount ? entry.deduction80Tta : null);
    updateSection('section80Ttb', entry.deduction80Ttb.interestAmount ? entry.deduction80Ttb : null);
    updateSection('section80Cch', entry.deduction80Cch.contributionAmount ? entry.deduction80Cch : null);
    updateSection('section80Gg', entry.deduction80Gg.rentPaidAmount ? entry.deduction80Gg : null);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setEntry(null);
    updateSection('section80Tta', null);
    updateSection('section80Ttb', null);
    updateSection('section80Cch', null);
    updateSection('section80Gg', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
              <DocumentTextIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">Other Deductions (80TTA / 80TTB / 80CCH / 80GG)</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
          {hasEntry && !isEditing && (
            <>
              <IconButton label="Edit" onClick={handleEdit}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
              <IconButton label="Delete" onClick={() => setConfirmDeleteOpen(true)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
            </>
          )}
          {!hasEntry && !isEditing && <IconButton label="Add Entry" onClick={handleAdd}><PlusCircleIcon className="w-5 h-5" /></IconButton>}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {!hasEntry && !isEditing ? (
            <AddButton label="Add Other Deductions" onClick={handleAdd} colorScheme="blue" />
          ) : entry && (
            <div className="bg-gray-50 rounded-lg p-4">
              {errors._form && <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">{errors._form}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="80TTA - Savings A/C Interest"
                    type="number"
                    value={entry.deduction80Tta.interestAmount || 0}
                    onChange={(e) => updateSubField('deduction80Tta', 'interestAmount', Number(e.target.value))}
                    prefix="₹"
                    disabled={!isEditing}
                    error={errors.tta}
                    hint="Max ₹10,000 — savings bank interest (non-senior citizens)"
                  />
                </div>
                <div>
                  <Input
                    label="80TTB - Senior Citizen Interest"
                    type="number"
                    value={entry.deduction80Ttb.interestAmount || 0}
                    onChange={(e) => updateSubField('deduction80Ttb', 'interestAmount', Number(e.target.value))}
                    prefix="₹"
                    disabled={!isEditing}
                    error={errors.ttb}
                    hint="Max ₹50,000 — bank/post office interest (senior citizens)"
                  />
                </div>
                <div>
                  <Input
                    label="80CCH - Agnipath Contribution"
                    type="number"
                    value={entry.deduction80Cch.contributionAmount || 0}
                    onChange={(e) => updateSubField('deduction80Cch', 'contributionAmount', Number(e.target.value))}
                    prefix="₹"
                    disabled={!isEditing}
                    error={errors.cch}
                    hint="Contribution to Agnipath Scheme (Agniveer Corpus Fund)"
                  />
                </div>
                <div>
                  <Input
                    label="80GG - Rent Paid (HRA not received)"
                    type="number"
                    value={entry.deduction80Gg.rentPaidAmount || 0}
                    onChange={(e) => updateSubField('deduction80Gg', 'rentPaidAmount', Number(e.target.value))}
                    prefix="₹"
                    disabled={!isEditing}
                    error={errors.gg}
                    hint="For self-employed or employees not receiving HRA"
                  />
                </div>
              </div>
              {isEditing && (
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                  <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <ConfirmModal open={confirmDeleteOpen} title="Delete Other Deductions?" message="Are you sure you want to clear all other deductions (80TTA / 80TTB / 80CCH / 80GG)?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={handleDelete} onCancel={() => setConfirmDeleteOpen(false)} />
    </div>
  );
}
