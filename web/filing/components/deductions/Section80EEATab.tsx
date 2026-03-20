'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HomeModernIcon,
  TrashIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Input from '@/filing/ui/Input';
import Select from '@/filing/ui/Select';
import DatePicker from '@/filing/ui/DatePicker';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { Deduction80EEAModel } from '@/filing/models/deductions/loan/deduction-80eea-model';
import { LENDER_TYPES } from '@/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const INITIAL_FORM: Deduction80EEAModel = {
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

export default function Section80EEATab() {
  const { filing, updateSection } = useFilingContext();

  const [formData, setFormData] = useState<Deduction80EEAModel>(() =>
    filing.section80Eea ? { ...filing.section80Eea } : { ...INITIAL_FORM }
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<Deduction80EEAModel | null>(null);

  const hasEntry = !!filing.section80Eea;
  const totalAmount = formData.interestOnLoan || 0;

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'section-80eea-tab-compact-style';
    style.textContent = `
      .section-80eea-tab-compact input,
      .section-80eea-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('section-80eea-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('section-80eea-tab-compact-style')?.remove();
    };
  }, []);

  const update = (field: keyof Deduction80EEAModel, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field as string]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.lenderType?.trim()) e.lenderType = 'Lender type is required';
    if (!formData.lenderName?.trim()) e.lenderName = 'Lender name is required';
    if (!formData.loanAccountNumber?.trim()) e.loanAccountNumber = 'Loan account number is required';
    if (!formData.loanSanctionDate) {
      e.loanSanctionDate = 'Loan sanction date is required';
    } else if (new Date(formData.loanSanctionDate) > new Date()) {
      e.loanSanctionDate = 'Loan sanction date cannot be a future date';
    }
    if (!formData.totalLoanAmount || formData.totalLoanAmount <= 0) e.totalLoanAmount = 'Total loan amount must be > 0';
    if (!formData.loanOutstanding || formData.loanOutstanding <= 0) e.loanOutstanding = 'Loan outstanding must be > 0';
    if (!formData.interestOnLoan || formData.interestOnLoan <= 0) e.interestOnLoan = 'Interest amount must be > 0';
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const saved = { ...formData, deductionId: formData.deductionId ?? Date.now() };
    setFormData(saved);
    updateSection('section80Eea', saved);
    setIsEditing(false);
  };

  const handleEdit = () => {
    savedRef.current = { ...formData };
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (savedRef.current) setFormData(savedRef.current);
    setIsEditing(false);
    setErrors({});
    savedRef.current = null;
  };

  const handleDelete = () => {
    setFormData({ ...INITIAL_FORM });
    updateSection('section80Eea', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  const lenderOptions = [{ value: '', label: 'Select lender type' }, ...LENDER_TYPES];

  return (
    <div className="section-80eea-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
              {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center">
                <HomeModernIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">80EEA - Affordable Housing Loan</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">Rs.{formatCurrency(totalAmount)}</span>
            {!hasEntry && !isEditing && (
              <IconButton
                onClick={() => { if (!isExpanded) setIsExpanded(true); savedRef.current = null; setIsEditing(true); setFormData({ ...INITIAL_FORM }); }}
                label="Add Entry"
              >
                <PlusCircleIcon className="w-5 h-5" />
              </IconButton>
            )}
            {hasEntry && !isEditing && (
              <>
                <IconButton label="Edit" onClick={handleEdit}>
                  <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                </IconButton>
                <IconButton label="Delete" onClick={() => setConfirmDeleteOpen(true)}>
                  <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                </IconButton>
              </>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {!hasEntry && !isEditing ? (
              <div className="py-2">
                <AddButton label="Add Entry" colorScheme="teal" onClick={() => { savedRef.current = null; setIsEditing(true); setFormData({ ...INITIAL_FORM }); }} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="space-y-2.5">
                    {/* Row 1: Lender Type | Loan Sanction Date */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <Select
                        label="Lender Type *"
                        value={formData.lenderType || ''}
                        onChange={(e) => update('lenderType', e.target.value)}
                        options={lenderOptions}
                        error={errors.lenderType}
                        disabled={!isEditing}
                      />
                      <DatePicker
                        label="Loan Sanction Date *"
                        value={formData.loanSanctionDate || null}
                        onChange={(date) => update('loanSanctionDate', date)}
                        error={errors.loanSanctionDate}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 2: Lender Name | Loan Account Number */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <Input
                        label="Lender Name *"
                        value={formData.lenderName || ''}
                        onChange={(e) => update('lenderName', e.target.value)}
                        placeholder="Name of lender"
                        error={errors.lenderName}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Loan Account Number *"
                        value={formData.loanAccountNumber || ''}
                        onChange={(e) => update('loanAccountNumber', e.target.value)}
                        placeholder="Enter loan account number"
                        error={errors.loanAccountNumber}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 3: Total Loan Amount | Loan Outstanding */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <Input
                        label="Total Loan Amount *"
                        type="number"
                        value={formData.totalLoanAmount || 0}
                        onChange={(e) => update('totalLoanAmount', Number(e.target.value))}
                        placeholder="0"
                        prefix="Rs."
                        error={errors.totalLoanAmount}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Loan Outstanding *"
                        type="number"
                        value={formData.loanOutstanding || 0}
                        onChange={(e) => update('loanOutstanding', Number(e.target.value))}
                        placeholder="0"
                        prefix="Rs."
                        error={errors.loanOutstanding}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 4: Interest on Loan + Action Buttons */}
                    <div className="flex items-end gap-2.5">
                      <div className="flex-1">
                        <Input
                          label="Interest on Loan *"
                          type="number"
                          value={formData.interestOnLoan || 0}
                          onChange={(e) => update('interestOnLoan', Number(e.target.value))}
                          placeholder="0"
                          prefix="Rs."
                          error={errors.interestOnLoan}
                          disabled={!isEditing}
                        />
                      </div>
                      {isEditing && (
                        <div className="flex gap-1 pb-0.5">
                          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                          <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
                        </div>
                      )}
                    </div>
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
