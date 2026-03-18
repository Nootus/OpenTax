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
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import { INITIAL_80DDB_FORM_DATA } from '@/domain/filing/models/deductions/medical/deduction-80ddb-model';
import type { Deduction80DDBModel } from '@/domain/filing/models/deductions/medical/deduction-80ddb-model';
import { DISEASES_80DDB, TREATMENT_FOR, SENIOR_CITIZEN_TYPES } from '@/domain/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Section80DDBTab() {
  const { filing, updateSection } = useFilingContext();

  const [entry, setEntry] = useState<Deduction80DDBModel>(() =>
    filing.section80Ddb ? { ...filing.section80Ddb } : { ...INITIAL_80DDB_FORM_DATA }
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<Deduction80DDBModel | null>(null);

  const hasEntry = !!filing.section80Ddb?.deductionId;
  const totalAmount = entry.expenditureIncurred || 0;

  const updateField = (field: keyof Deduction80DDBModel, value: any) => {
    setEntry(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field as string]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!entry.disease?.trim()) e.disease = 'Disease is required';
    if (!entry.treatmentFor?.trim()) e.treatmentFor = 'Treatment for is required';
    if (!entry.expenditureIncurred || entry.expenditureIncurred <= 0) e.expenditureIncurred = 'Amount is required';
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const saved = { ...entry, deductionId: entry.deductionId ?? Date.now() };
    setEntry(saved);
    updateSection('section80Ddb', saved);
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
    setEntry({ ...INITIAL_80DDB_FORM_DATA });
    updateSection('section80Ddb', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  const diseaseOptions = [{ value: '', label: 'Select disease' }, ...DISEASES_80DDB];
  const treatmentOptions = [{ value: '', label: 'Select...' }, ...TREATMENT_FOR];
  const scOptions = [{ value: '', label: 'Select...' }, ...SENIOR_CITIZEN_TYPES];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <HeartIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">80DDB - Specified Disease</h4>
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
          {!hasEntry && !isEditing && <IconButton label="Add Entry" onClick={() => setIsEditing(true)}><PlusCircleIcon className="w-5 h-5" /></IconButton>}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {!hasEntry && !isEditing ? (
            <AddButton label="Add 80DDB Entry" colorScheme="orange" onClick={() => setIsEditing(true)} />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Disease" required value={entry.disease || ''} onChange={(e) => updateField('disease', e.target.value)} options={diseaseOptions} disabled={!isEditing} error={errors.disease} />
                <Select label="Treatment For" required value={entry.treatmentFor || ''} onChange={(e) => updateField('treatmentFor', e.target.value)} options={treatmentOptions} disabled={!isEditing} error={errors.treatmentFor} />
                <Select label="Senior Citizen Type" value={entry.seniorCitizenType || ''} onChange={(e) => updateField('seniorCitizenType', e.target.value)} options={scOptions} disabled={!isEditing} />
                <Input label="Expenditure Incurred" type="number" required value={entry.expenditureIncurred || 0} onChange={(e) => updateField('expenditureIncurred', Number(e.target.value))} prefix="₹" disabled={!isEditing} error={errors.expenditureIncurred} />
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
      <ConfirmModal open={confirmDeleteOpen} title="Delete Entry?" message="Are you sure you want to delete this Section 80DDB entry?" confirmText="Delete" tone="danger" isLoading={false} onConfirm={handleDelete} onCancel={() => setConfirmDeleteOpen(false)} />
    </div>
  );
}
