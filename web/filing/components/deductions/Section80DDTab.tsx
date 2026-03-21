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
import Input from '@/filing/ui/Input';
import Select from '@/filing/ui/Select';
import DatePicker from '@/filing/ui/DatePicker';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import { INITIAL_80DD_FORM_DATA } from '@/filing/models/deductions/medical/deduction-80dd-model';
import type { Deduction80DDModel } from '@/filing/models/deductions/medical/deduction-80dd-model';
import { useMasterData } from '@/filing/context/MasterDataContext';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Section80DDTab() {
  const { filing, updateSection } = useFilingContext();
  const { disabilityTypes: DISABILITY_TYPES, disabilityRelationships: RELATION_TO_DEPENDANT } = useMasterData();

  const [entry, setEntry] = useState<Deduction80DDModel | null>(() =>
    filing.section80Dd ? { ...filing.section80Dd } : null
  );
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedRef = useRef<Deduction80DDModel | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'section-80dd-tab-compact-style';
    style.textContent = `
      .section-80dd-tab-compact input,
      .section-80dd-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('section-80dd-tab-compact-style')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('section-80dd-tab-compact-style')?.remove();
    };
  }, []);

  const hasEntry = entry !== null;
  const totalAmount = entry?.expenditureIncurred || 0;

  const updateField = (field: keyof Deduction80DDModel, value: any) => {
    setEntry(prev => prev
      ? { ...prev, [field]: value }
      : { ...INITIAL_80DD_FORM_DATA, [field]: value }
    );
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const addEntry = () => {
    savedRef.current = null;
    setEntry({ ...INITIAL_80DD_FORM_DATA });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!entry) return;
    const errs: Record<string, string> = {};
    if (!entry.dependantName?.trim()) errs.dependantName = 'Dependant name is required';
    if (!entry.relationToDependant?.trim()) errs.relationToDependant = 'Relationship is required';
    if (!entry.disabilityType?.trim()) errs.disabilityType = 'Disability type is required';
    if (!entry.expenditureIncurred || entry.expenditureIncurred <= 0) errs.expenditureIncurred = 'Expenditure amount is required';
    if (entry.dependantPan?.trim()) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(entry.dependantPan.trim())) {
        errs.dependantPan = 'Invalid PAN format (e.g., ABCDE1234F)';
      } else {
        const filingPan = filing.person?.panNumber?.toUpperCase();
        if (filingPan && entry.dependantPan.trim().toUpperCase() === filingPan) {
          errs.dependantPan = "Dependant's PAN cannot be the same as the filing PAN";
        }
      }
    }
    if (entry.form101aFilingDate && new Date(entry.form101aFilingDate) > new Date()) {
      errs.form101aFilingDate = 'Form 10-IA filing date cannot be a future date';
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const saved = { ...entry, deductionId: entry.deductionId ?? Date.now() };
    setEntry(saved);
    updateSection('section80Dd', saved);
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
    updateSection('section80Dd', null);
    setIsEditing(false);
    setConfirmDeleteOpen(false);
  };

  const disabilityOptions = [{ value: '', label: 'Select disability type' }, ...DISABILITY_TYPES];
  const relationOptions = [{ value: '', label: 'Select relationship' }, ...RELATION_TO_DEPENDANT];

  return (
    <div className="section-80dd-tab-compact">
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
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <HeartIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">80DD - Disabled Dependant</h4>
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
                <div className="space-y-3">
                  {/* Row 1: Essential Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Input
                      label="Dependant Name *"
                      value={entry.dependantName || ''}
                      onChange={(e) => updateField('dependantName', e.target.value)}
                      placeholder="Name"
                      error={errors.dependantName}
                      disabled={!isEditing}
                    />
                    <Select
                      label="Relation *"
                      value={entry.relationToDependant || ''}
                      onChange={(e) => updateField('relationToDependant', e.target.value)}
                      options={relationOptions}
                      error={errors.relationToDependant}
                      disabled={!isEditing}
                    />
                    <Select
                      label="Disability Type *"
                      value={entry.disabilityType || ''}
                      onChange={(e) => updateField('disabilityType', e.target.value)}
                      options={disabilityOptions}
                      error={errors.disabilityType}
                      disabled={!isEditing}
                    />
                    <Input
                      label="Expenditure *"
                      type="number"
                      value={entry.expenditureIncurred || 0}
                      onChange={(e) => updateField('expenditureIncurred', Number(e.target.value))}
                      placeholder="0"
                      prefix="Rs."
                      error={errors.expenditureIncurred}
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Row 2: Nature of Disability + PAN */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Input
                        label="Nature of Disability"
                        value={entry.natureOfDisability || ''}
                        onChange={(e) => updateField('natureOfDisability', e.target.value)}
                        placeholder="Describe the nature of disability"
                        disabled={!isEditing}
                      />
                    </div>
                    <Input
                      label="Dependant PAN"
                      value={entry.dependantPan || ''}
                      onChange={(e) => updateField('dependantPan', e.target.value.toUpperCase())}
                      placeholder="AAAAA0000A"
                      maxLength={10}
                      disabled={!isEditing}
                      error={isEditing ? errors.dependantPan : undefined}
                    />
                  </div>

                  {/* Row 3: Form 10-IA Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label="UDID Number"
                      value={entry.udidNo || ''}
                      onChange={(e) => updateField('udidNo', e.target.value)}
                      placeholder="Optional"
                      disabled={!isEditing}
                    />
                    <DatePicker
                      label="Form 10-IA Filing Date"
                      value={entry.form101aFilingDate || null}
                      onChange={(date) => updateField('form101aFilingDate', date)}
                      maxDate={new Date()}
                      disabled={!isEditing}
                      error={isEditing ? errors.form101aFilingDate : undefined}
                    />
                    <Input
                      label="Form 10-IA Ack No."
                      value={entry.form101aAckNo || ''}
                      onChange={(e) => updateField('form101aAckNo', e.target.value)}
                      placeholder="Optional"
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Action buttons */}
                  {isEditing && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
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
