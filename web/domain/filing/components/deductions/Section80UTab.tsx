'use client';

import { useState, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  UserIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import Select from '@/domain/filing/ui/Select';
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import { INITIAL_80U_FORM_DATA } from '@/domain/filing/models/deductions/medical/deduction-80u-model';
import type { Deduction80UModel } from '@/domain/filing/models/deductions/medical/deduction-80u-model';
import { DISABILITY_TYPES } from '@/domain/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Section80UTab() {
  const { filing, updateSection } = useFilingContext();

  const [entry, setEntry] = useState<Deduction80UModel>(() =>
    filing.section80U ? { ...filing.section80U } : { ...INITIAL_80U_FORM_DATA }
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<Deduction80UModel | null>(null);

  const hasEntry = !!filing.section80U?.deductionId;

  // 80U auto-computes deduction: D=75000, SD=125000
  const deductionAmount = entry.disabilityType === 'SD' ? 125000 : entry.disabilityType === 'D' ? 75000 : 0;

  const updateField = (field: keyof Deduction80UModel, value: any) => {
    setEntry(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'disabilityType') {
        updated.expenditureIncurred = value === 'SD' ? 125000 : value === 'D' ? 75000 : 0;
      }
      return updated;
    });
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field as string]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!entry.disabilityType?.trim()) e.disabilityType = 'Disability type is required';
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const saved = { ...entry, deductionId: entry.deductionId ?? Date.now() };
    setEntry(saved);
    updateSection('section80U', saved);
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
    setEntry({ ...INITIAL_80U_FORM_DATA });
    updateSection('section80U', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  const disabilityOptions = [{ value: '', label: 'Select disability type' }, ...DISABILITY_TYPES];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">80U - Person with Disability</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-gray-500">Deduction</div>
            <span className="text-base font-bold text-blue-600">₹{formatCurrency(deductionAmount)}</span>
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
            <AddButton label="Add 80U Entry" colorScheme="purple" onClick={() => setIsEditing(true)} />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Disability Type" required value={entry.disabilityType || ''} onChange={(e) => updateField('disabilityType', e.target.value)} options={disabilityOptions} disabled={!isEditing} error={errors.disabilityType} />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Auto-computed Deduction</p>
                  <p className="text-lg font-bold text-blue-600">₹{formatCurrency(deductionAmount)}</p>
                  <p className="text-xs text-gray-400">
                    {entry.disabilityType === 'D' ? '₹75,000 for disability (40%–79%)' : entry.disabilityType === 'SD' ? '₹1,25,000 for severe disability (80%+)' : 'Select disability type to see amount'}
                  </p>
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
      <ConfirmModal open={confirmDeleteOpen} title="Delete Entry?" message="Are you sure you want to delete this Section 80U entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={handleDelete} onCancel={() => setConfirmDeleteOpen(false)} />
    </div>
  );
}
