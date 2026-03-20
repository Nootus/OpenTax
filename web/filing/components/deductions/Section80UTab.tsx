'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HeartIcon,
  TrashIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import Select from '@/filing/ui/Select';
import Input from '@/filing/ui/Input';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import { INITIAL_80U_FORM_DATA } from '@/filing/models/deductions/medical/deduction-80u-model';
import type { Deduction80UModel } from '@/filing/models/deductions/medical/deduction-80u-model';
import { DISABILITY_TYPES } from '@/utils/master-data';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Section80UTab() {
  const { filing, updateSection } = useFilingContext();

  const [entry, setEntry] = useState<Deduction80UModel | null>(() =>
    filing.section80U ? { ...filing.section80U } : null
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<Deduction80UModel | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'section-80u-tab-compact-style';
    style.textContent = `
      .section-80u-tab-compact input,
      .section-80u-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('section-80u-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('section-80u-tab-compact-style')?.remove();
    };
  }, []);

  const hasEntry = entry !== null;
  const totalAmount = entry?.expenditureIncurred || 0;

  const handleDisabilityTypeChange = (value: string) => {
    const expenditure = value === 'SD' ? 125000 : value === 'D' ? 75000 : 0;
    setEntry(prev => prev
      ? { ...prev, disabilityType: value, expenditureIncurred: expenditure }
      : { ...INITIAL_80U_FORM_DATA, disabilityType: value, expenditureIncurred: expenditure }
    );
    if (errors.disabilityType) setErrors(prev => ({ ...prev, disabilityType: '' }));
  };

  const updateField = (field: keyof Deduction80UModel, value: any) => {
    setEntry(prev => prev
      ? { ...prev, [field]: value }
      : { ...INITIAL_80U_FORM_DATA, [field]: value }
    );
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const addEntry = () => {
    savedRef.current = null;
    setEntry({ ...INITIAL_80U_FORM_DATA });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!entry) return;
    const errs: Record<string, string> = {};
    if (!entry.disabilityType?.trim()) errs.disabilityType = 'Disability type is required';
    if (!entry.expenditureIncurred || entry.expenditureIncurred <= 0) {
      errs.expenditureIncurred = 'Expenditure amount is required';
    } else {
      const maxAmount = entry.disabilityType === 'SD' ? 125000 : 75000;
      if (entry.expenditureIncurred > maxAmount) {
        errs.expenditureIncurred = `Maximum deduction is Rs.${maxAmount.toLocaleString('en-IN')}`;
      }
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const saved = { ...entry, deductionId: entry.deductionId ?? Date.now() };
    setEntry(saved);
    updateSection('section80U', saved);
    setIsEditing(false);
  };

  const handleEdit = () => {
    savedRef.current = entry ? { ...entry } : null;
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (savedRef.current !== null) {
      setEntry(savedRef.current);
    } else {
      setEntry(null);
    }
    setIsEditing(false);
    setErrors({});
    savedRef.current = null;
  };

  const handleDelete = () => {
    setEntry(null);
    updateSection('section80U', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  const disabilityOptions = [{ value: '', label: 'Select type' }, ...DISABILITY_TYPES];

  return (
    <div className="section-80u-tab-compact">
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
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <HeartIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">80U - Person with Disability</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">Rs.{formatCurrency(totalAmount)}</span>
            {!hasEntry && (
              <IconButton
                onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}
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
            {!hasEntry ? (
              <div className="py-2">
                <AddButton label="Add Entry" colorScheme="purple" onClick={addEntry} />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-end gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                    <Select
                      label="Disability Type *"
                      value={entry.disabilityType || ''}
                      onChange={(e) => handleDisabilityTypeChange(e.target.value)}
                      options={disabilityOptions}
                      error={errors.disabilityType}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Expenditure Incurred *"
                      type="number"
                      value={entry.expenditureIncurred || 0}
                      onChange={(e) => updateField('expenditureIncurred', Number(e.target.value))}
                      placeholder="0"
                      prefix="Rs."
                      error={errors.expenditureIncurred}
                      disabled={!isEditing}
                    />
                  </div>
                  {isEditing && (
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
                    </div>
                  )}
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
