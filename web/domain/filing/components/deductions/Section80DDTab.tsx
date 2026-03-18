'use client';

import { useState, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HeartIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import Input from '@/domain/filing/ui/Input';
import Select from '@/domain/filing/ui/Select';
import DatePicker from '@/domain/filing/ui/DatePicker';
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import { INITIAL_80DD_FORM_DATA } from '@/domain/filing/models/deductions/medical/deduction-80dd-model';
import type { Deduction80DDModel } from '@/domain/filing/models/deductions/medical/deduction-80dd-model';
import { DISABILITY_TYPES, RELATION_TO_DEPENDANT } from '@/domain/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Section80DDTab() {
  const { filing, updateSection } = useFilingContext();

  const [entry, setEntry] = useState<Deduction80DDModel>(() =>
    filing.section80Dd ? { ...filing.section80Dd } : { ...INITIAL_80DD_FORM_DATA }
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<Deduction80DDModel | null>(null);

  const hasEntry = !!filing.section80Dd?.deductionId;
  const totalAmount = entry.expenditureIncurred || 0;

  const updateField = (field: keyof Deduction80DDModel, value: any) => {
    setEntry(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field as string]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!entry.dependantName?.trim()) e.dependantName = 'Dependant name is required';
    if (!entry.relationToDependant?.trim()) e.relationToDependant = 'Relationship is required';
    if (!entry.disabilityType?.trim()) e.disabilityType = 'Disability type is required';
    if (!entry.expenditureIncurred || entry.expenditureIncurred <= 0) e.expenditureIncurred = 'Amount is required';
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const saved = { ...entry, deductionId: entry.deductionId ?? Date.now() };
    setEntry(saved);
    updateSection('section80Dd', saved);
    setIsEditing(false);
  };

  const handleEdit = () => {
    savedRef.current = { ...entry };
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (savedRef.current) setEntry(savedRef.current);
    setIsEditing(false);
    setErrors({});
    savedRef.current = null;
  };

  const handleDelete = () => {
    const cleared = { ...INITIAL_80DD_FORM_DATA };
    setEntry(cleared);
    updateSection('section80Dd', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  const disabilityOptions = [{ value: '', label: 'Select disability type' }, ...DISABILITY_TYPES];
  const relationOptions = [{ value: '', label: 'Select relationship' }, ...RELATION_TO_DEPENDANT];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <HeartIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">80DD - Disabled Dependant</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-gray-500">Deduction</div>
            <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
          </div>
          {hasEntry && !isEditing && (
            <>
              <IconButton label="Edit" onClick={handleEdit}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
              <IconButton label="Delete" onClick={() => setConfirmDeleteOpen(true)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
            </>
          )}
          {!hasEntry && !isEditing && (
            <IconButton label="Add Entry" onClick={() => setIsEditing(true)}><PlusCircleIcon className="w-5 h-5" /></IconButton>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {!hasEntry && !isEditing ? (
            <AddButton label="Add 80DD Entry" colorScheme="teal" onClick={() => setIsEditing(true)} />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Dependant Name" required value={entry.dependantName || ''} onChange={(e) => updateField('dependantName', e.target.value)} disabled={!isEditing} error={errors.dependantName} />
                <Select label="Relationship" required value={entry.relationToDependant || ''} onChange={(e) => updateField('relationToDependant', e.target.value)} options={relationOptions} disabled={!isEditing} error={errors.relationToDependant} />
                <Select label="Disability Type" required value={entry.disabilityType || ''} onChange={(e) => updateField('disabilityType', e.target.value)} options={disabilityOptions} disabled={!isEditing} error={errors.disabilityType} />
                <Input label="Expenditure Incurred" type="number" required value={entry.expenditureIncurred || 0} onChange={(e) => updateField('expenditureIncurred', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errors.expenditureIncurred} />
                <Input label="Dependant PAN" value={entry.dependantPan || ''} onChange={(e) => updateField('dependantPan', e.target.value)} placeholder="ABCDE1234F" disabled={!isEditing} />
                <DatePicker label="Form 10IA Filing Date" value={entry.form101aFilingDate ? new Date(entry.form101aFilingDate) : null} onChange={(d) => updateField('form101aFilingDate', d)} disabled={!isEditing} />
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
      <ConfirmModal open={confirmDeleteOpen} title="Delete Entry?" message="Are you sure you want to delete this Section 80DD entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={handleDelete} onCancel={() => setConfirmDeleteOpen(false)} />
    </div>
  );
}
