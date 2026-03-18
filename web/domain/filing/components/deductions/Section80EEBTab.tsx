'use client';

import { useState, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  BoltIcon,
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
import type { Deduction80EEBModel } from '@/domain/filing/models/deductions/loan/deduction-80eeb-model';
import { LENDER_TYPES } from '@/domain/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const INITIAL_FORM: Deduction80EEBModel = {
  deductionId: null,
  filingId: null,
  vehicleMakeModel: '',
  vehicleRegistrationNumber: '',
  lenderType: '',
  lenderName: '',
  loanAccountNumber: null,
  loanSanctionDate: null,
  totalLoanAmount: null,
  loanOutstanding: null,
  interestOnLoan: 0,
};

export default function Section80EEBTab() {
  const { filing, updateSection } = useFilingContext();

  const [formData, setFormData] = useState<Deduction80EEBModel>(() =>
    filing.section80Eeb ? { ...filing.section80Eeb } : { ...INITIAL_FORM }
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<Deduction80EEBModel | null>(null);

  const hasEntry = !!filing.section80Eeb?.deductionId;
  const totalAmount = formData.interestOnLoan || 0;

  const update = (field: keyof Deduction80EEBModel, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field as string]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.vehicleMakeModel?.trim()) e.vehicleMakeModel = 'Vehicle make/model is required';
    if (!formData.vehicleRegistrationNumber?.trim()) e.vehicleRegistrationNumber = 'Vehicle registration number is required';
    if (!formData.lenderType?.trim()) e.lenderType = 'Lender type is required';
    if (!formData.lenderName?.trim()) e.lenderName = 'Lender name is required';
    if (!formData.loanAccountNumber?.trim()) e.loanAccountNumber = 'Loan account number is required';
    if (!formData.totalLoanAmount || formData.totalLoanAmount <= 0) e.totalLoanAmount = 'Total loan amount must be > 0';
    if (!formData.loanOutstanding || formData.loanOutstanding <= 0) e.loanOutstanding = 'Loan outstanding must be > 0';
    if (!formData.interestOnLoan || formData.interestOnLoan <= 0) e.interestOnLoan = 'Interest amount must be > 0';
    if (!formData.loanSanctionDate) {
      e.loanSanctionDate = 'Loan sanction date is required';
    } else {
      const sanctionDate = new Date(formData.loanSanctionDate);
      const minDate = new Date('2019-04-01');
      const maxDate = new Date('2023-03-31');
      maxDate.setHours(23, 59, 59, 999);
      if (sanctionDate < minDate || sanctionDate > maxDate) {
        e.loanSanctionDate = 'Loan sanction date must be between 01-04-2019 and 31-03-2023';
      }
    }
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const saved = { ...formData, deductionId: formData.deductionId ?? Date.now() };
    setFormData(saved);
    updateSection('section80Eeb', saved);
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
    updateSection('section80Eeb', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  const lenderOptions = [{ value: '', label: 'Select lender type' }, ...LENDER_TYPES];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <BoltIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">80EEB - Electric Vehicle Loan</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-gray-500">Interest</div>
            <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
          </div>
          {hasEntry && !isEditing && (
            <>
              <IconButton label="Edit" onClick={handleEdit}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
              <IconButton label="Delete" onClick={() => setConfirmDeleteOpen(true)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
            </>
          )}
          {!hasEntry && !isEditing && <IconButton label="Add Entry" onClick={() => setIsEditing(true)}><PlusCircleIcon className="w-5 h-5" /></IconButton>}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {!hasEntry && !isEditing ? (
            <AddButton label="Add 80EEB Entry" colorScheme="orange" onClick={() => setIsEditing(true)} />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Vehicle Make / Model" required value={formData.vehicleMakeModel || ''} onChange={(e) => update('vehicleMakeModel', e.target.value)} disabled={!isEditing} error={errors.vehicleMakeModel} />
                <Input label="Vehicle Registration Number" required value={formData.vehicleRegistrationNumber || ''} onChange={(e) => update('vehicleRegistrationNumber', e.target.value)} disabled={!isEditing} error={errors.vehicleRegistrationNumber} />
                <Select label="Lender Type" required value={formData.lenderType || ''} onChange={(e) => update('lenderType', e.target.value)} options={lenderOptions} disabled={!isEditing} error={errors.lenderType} />
                <Input label="Lender Name" required value={formData.lenderName || ''} onChange={(e) => update('lenderName', e.target.value)} disabled={!isEditing} error={errors.lenderName} />
                <Input label="Loan Account Number" required value={formData.loanAccountNumber || ''} onChange={(e) => update('loanAccountNumber', e.target.value)} disabled={!isEditing} error={errors.loanAccountNumber} />
                <DatePicker label="Loan Sanction Date" required value={formData.loanSanctionDate ? new Date(formData.loanSanctionDate) : null} onChange={(d) => update('loanSanctionDate', d)} disabled={!isEditing} error={errors.loanSanctionDate} minDate={new Date('2019-04-01')} maxDate={new Date('2023-03-31')} />
                <Input label="Total Loan Amount" required type="number" value={formData.totalLoanAmount || 0} onChange={(e) => update('totalLoanAmount', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errors.totalLoanAmount} />
                <Input label="Loan Outstanding" required type="number" value={formData.loanOutstanding || 0} onChange={(e) => update('loanOutstanding', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errors.loanOutstanding} />
                <Input label="Interest on Loan" required type="number" value={formData.interestOnLoan || 0} onChange={(e) => update('interestOnLoan', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errors.interestOnLoan} />
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
      <ConfirmModal open={confirmDeleteOpen} title="Delete Entry?" message="Are you sure you want to delete this Section 80EEB entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={handleDelete} onCancel={() => setConfirmDeleteOpen(false)} />
    </div>
  );
}
