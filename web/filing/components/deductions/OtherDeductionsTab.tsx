'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import Input from '@/filing/ui/Input';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { OtherDeductionModel } from '@/filing/models/deductions/other/other-deduction-model';
import { INITIAL_OTHER_DEDUCTION_FORM_DATA } from '@/filing/models/deductions/other/other-deduction-model';

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<OtherDeductionModel | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'other-deductions-tab-compact-style';
    style.textContent = `
      .other-deductions-tab-compact input,
      .other-deductions-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('other-deductions-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('other-deductions-tab-compact-style')?.remove();
    };
  }, []);

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
    if (errKey && errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: '', _form: '' }));
  };

  const addEntry = () => {
    savedRef.current = null;
    setEntry({ ...INITIAL_OTHER_DEDUCTION_FORM_DATA });
    setIsEditMode(true);
  };

  const handleEditMode = () => {
    savedRef.current = entry ? { ...entry } : null;
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (savedRef.current !== null) {
      setEntry(savedRef.current);
    }
    setErrors({});
    setIsEditMode(false);
  };

  const handleSave = () => {
    if (!entry) return;
    const newErrors: Record<string, string> = {};
    const tta = entry.deduction80Tta.interestAmount || 0;
    const ttb = entry.deduction80Ttb.interestAmount || 0;
    const cch = entry.deduction80Cch.contributionAmount || 0;
    const gg = entry.deduction80Gg.rentPaidAmount || 0;
    if (tta < 0) newErrors.tta = 'Amount cannot be negative';
    if (ttb < 0) newErrors.ttb = 'Amount cannot be negative';
    if (cch < 0) newErrors.cch = 'Amount cannot be negative';
    if (gg < 0) newErrors.gg = 'Amount cannot be negative';
    if (tta > 0 && ttb > 0) {
      newErrors.tta = '80TTA and 80TTB are mutually exclusive';
      newErrors.ttb = '80TTA and 80TTB are mutually exclusive';
    }
    if (tta === 0 && ttb === 0 && cch === 0 && gg === 0) {
      newErrors._form = 'Please enter at least one deduction amount';
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    updateSection('section80Tta', entry.deduction80Tta.interestAmount ? entry.deduction80Tta : null);
    updateSection('section80Ttb', entry.deduction80Ttb.interestAmount ? entry.deduction80Ttb : null);
    updateSection('section80Cch', entry.deduction80Cch.contributionAmount ? entry.deduction80Cch : null);
    updateSection('section80Gg', entry.deduction80Gg.rentPaidAmount ? entry.deduction80Gg : null);
    setIsEditMode(false);
  };

  const handleDelete = () => {
    setEntry(null);
    updateSection('section80Tta', null);
    updateSection('section80Ttb', null);
    updateSection('section80Cch', null);
    updateSection('section80Gg', null);
    setIsEditMode(false);
    setConfirmDeleteOpen(false);
  };

  return (
    <div className="other-deductions-tab-compact">
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
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                <DocumentTextIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Other Deductions</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">Rs.{formatCurrency(totalAmount)}</span>
            {!hasEntry && (
              <IconButton label="Add Entry" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
                <PlusCircleIcon className="w-5 h-5 text-slate-600" />
              </IconButton>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {errors._form && <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded"><p className="text-sm text-amber-700">{errors._form}</p></div>}
            {!hasEntry ? (
              <div className="py-2">
                <AddButton label="Add Entry" onClick={addEntry} colorScheme="blue" />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-end gap-2.5">
                  <div className="grid grid-cols-4 gap-2.5 flex-1">
                    <Input
                      label="80TTA - Savings Interest"
                      type="number"
                      value={entry.deduction80Tta.interestAmount || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateSubField('deduction80Tta', 'interestAmount', val);
                        if (val > 0 && (entry.deduction80Ttb.interestAmount || 0) > 0) {
                          setErrors(prev => ({ ...prev, tta: '80TTA and 80TTB are mutually exclusive', ttb: '80TTA and 80TTB are mutually exclusive' }));
                        } else {
                          setErrors(prev => ({ ...prev, tta: '', ttb: '' }));
                        }
                      }}
                      placeholder="0"
                      prefix="Rs."
                      error={errors.tta}
                      disabled={!isEditMode}
                    />
                    <Input
                      label="80TTB - Senior Citizen"
                      type="number"
                      value={entry.deduction80Ttb.interestAmount || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        updateSubField('deduction80Ttb', 'interestAmount', val);
                        if (val > 0 && (entry.deduction80Tta.interestAmount || 0) > 0) {
                          setErrors(prev => ({ ...prev, tta: '80TTA and 80TTB are mutually exclusive', ttb: '80TTA and 80TTB are mutually exclusive' }));
                        } else {
                          setErrors(prev => ({ ...prev, tta: '', ttb: '' }));
                        }
                      }}
                      placeholder="0"
                      prefix="Rs."
                      error={errors.ttb}
                      disabled={!isEditMode}
                    />
                    <Input
                      label="80CCH - Agnipath"
                      type="number"
                      value={entry.deduction80Cch.contributionAmount || 0}
                      onChange={(e) => updateSubField('deduction80Cch', 'contributionAmount', Number(e.target.value))}
                      placeholder="0"
                      prefix="Rs."
                      error={errors.cch}
                      disabled={!isEditMode}
                    />
                    <Input
                      label="80GG - Rent Paid"
                      type="number"
                      value={entry.deduction80Gg.rentPaidAmount || 0}
                      onChange={(e) => updateSubField('deduction80Gg', 'rentPaidAmount', Number(e.target.value))}
                      placeholder="0"
                      prefix="Rs."
                      error={errors.gg}
                      disabled={!isEditMode}
                    />
                  </div>
                  <div className="flex gap-2 pb-0.5">
                    {!isEditMode ? (
                      <>
                        <IconButton label="Edit" onClick={handleEditMode}>
                          <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                        </IconButton>
                        <IconButton label="Delete" onClick={() => setConfirmDeleteOpen(true)}>
                          <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete Entry?"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={false}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
