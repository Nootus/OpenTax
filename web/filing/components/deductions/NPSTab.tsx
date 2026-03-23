'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  BanknotesIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Input from '@/filing/ui/Input';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';

const SECTION_80CCD1B_LIMIT = 50000;

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

interface NPSFormData {
  pranNumber: string;
  cccAmount: number;
  ccd1Amount: number;
  ccd1bAmount: number;
  ccd2Amount: number;
}

export default function NPSTab() {
  const { filing, updateSection } = useFilingContext();

  const buildFormData = (): NPSFormData => {
    const ccc = filing.section80Ccc?.[0];
    const ccd1 = filing.section80Ccd1?.[0];
    const ccd1b = filing.section80Ccd1B?.[0];
    const ccd2 = filing.section80Ccd2?.[0];
    return {
      pranNumber: ccc?.pranNumber || ccd1?.pranNumber || ccd1b?.pranNumber || ccd2?.pranNumber || '',
      cccAmount: ccc?.amount || 0,
      ccd1Amount: ccd1?.amount || 0,
      ccd1bAmount: ccd1b?.amount || 0,
      ccd2Amount: ccd2?.amount || 0,
    };
  };

  const [formData, setFormData] = useState<NPSFormData>(buildFormData);
  const [editableData, setEditableData] = useState<NPSFormData>(formData);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const hasEntry = !!(
    filing.section80Ccc?.length ||
    filing.section80Ccd1?.length ||
    filing.section80Ccd1B?.length ||
    filing.section80Ccd2?.length
  );

  const totalAmount = editableData.cccAmount + editableData.ccd1Amount + editableData.ccd1bAmount + editableData.ccd2Amount;

  const makeRecord = (amount: number, pran: string) =>
    amount > 0 ? [{ deductionId: Date.now(), filingId: null as unknown as number, pranNumber: pran, amount }] : [];

  const handleSave = () => {
    const total = editableData.cccAmount + editableData.ccd1Amount + editableData.ccd1bAmount + editableData.ccd2Amount;
    if (total <= 0) { setSaveError('Please enter at least one NPS contribution amount'); return; }
    if (!editableData.pranNumber?.trim()) { setSaveError('PRAN number is required'); return; }
    if (!/^\d{12}$/.test(editableData.pranNumber.trim())) { setSaveError('PRAN number must be exactly 12 digits'); return; }
    if (editableData.ccd1bAmount > SECTION_80CCD1B_LIMIT) {
      setSaveError(`80CCD(1B) amount cannot exceed ₹${SECTION_80CCD1B_LIMIT.toLocaleString('en-IN')}`); return;
    }
    setSaveError(null);
    const pran = editableData.pranNumber.trim();
    updateSection('section80Ccc', makeRecord(editableData.cccAmount, pran));
    updateSection('section80Ccd1', makeRecord(editableData.ccd1Amount, pran));
    updateSection('section80Ccd1B', makeRecord(editableData.ccd1bAmount, pran));
    updateSection('section80Ccd2', makeRecord(editableData.ccd2Amount, pran));
    setFormData({ ...editableData });
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditableData(formData);
    setEditMode(false);
    setSaveError(null);
  };

  const handleDeleteAll = () => {
    updateSection('section80Ccc', []);
    updateSection('section80Ccd1', []);
    updateSection('section80Ccd1B', []);
    updateSection('section80Ccd2', []);
    const cleared: NPSFormData = { pranNumber: '', cccAmount: 0, ccd1Amount: 0, ccd1bAmount: 0, ccd2Amount: 0 };
    setFormData(cleared);
    setEditableData(cleared);
    setConfirmDeleteOpen(false);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'nps-tab-compact-style';
    style.textContent = `
      .nps-tab-compact input,
      .nps-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('nps-tab-compact-style')) document.head.appendChild(style);
    return () => { document.getElementById('nps-tab-compact-style')?.remove(); };
  }, []);

  return (
    <div className="nps-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700 flex-shrink-0"
            >
              {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
              <BanknotesIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900 whitespace-nowrap flex-shrink-0">NPS Deductions</h4>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {(editMode || hasEntry) && (
              <div style={{ width: '135px' }} className="hidden md:block flex-shrink-0">
                <Input
                  label="PRAN Number"
                  value={(editMode ? editableData.pranNumber : formData.pranNumber) || ''}
                  onChange={(e) => setEditableData(prev => ({ ...prev, pranNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="12 Digit PRAN"
                  maxLength={12}
                  inputMode="numeric"
                  disabled={!editMode}
                />
              </div>
            )}
            <div className="text-right">
              <div className="text-xs text-gray-500">Total</div>
              <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
            </div>
            {!editMode ? (
              <>
                {!hasEntry && (
                  <IconButton label="Add Entry" onClick={() => setEditMode(true)}>
                    <PlusCircleIcon className="w-5 h-5" />
                  </IconButton>
                )}
                {hasEntry && (
                  <>
                    <IconButton label="Edit" onClick={() => setEditMode(true)}>
                      <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                    </IconButton>
                    <IconButton label="Delete" onClick={() => setConfirmDeleteOpen(true)}>
                      <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                    </IconButton>
                  </>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>

          {editMode && (
            <div className="md:hidden w-full">
              <Input
                label="PRAN Number"
                value={editableData.pranNumber || ''}
                onChange={(e) => setEditableData(prev => ({ ...prev, pranNumber: e.target.value.replace(/\D/g, '') }))}
                placeholder="12 Digit PRAN"
                maxLength={12}
                inputMode="numeric"
              />
            </div>
          )}
        </div>

        {saveError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{saveError}</p>
          </div>
        )}

        {isExpanded && (
          <div className="mt-4">
            {!hasEntry && !editMode ? (
              <div className="py-2">
                <AddButton label="Add NPS Entry" colorScheme="purple" onClick={() => setEditMode(true)} />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="Pension"
                    type="number"
                    value={editableData.cccAmount}
                    onChange={(e) => setEditableData(prev => ({ ...prev, cccAmount: Number(e.target.value) }))}
                    placeholder="0"
                    disabled={!editMode}
                    prefix="₹"
                  />
                  <Input
                    label="Employee"
                    type="number"
                    value={editableData.ccd1Amount}
                    onChange={(e) => setEditableData(prev => ({ ...prev, ccd1Amount: Number(e.target.value) }))}
                    placeholder="0"
                    disabled={!editMode}
                    prefix="₹"
                  />
                  <Input
                    label="Additional"
                    type="number"
                    value={editableData.ccd1bAmount}
                    onChange={(e) => setEditableData(prev => ({ ...prev, ccd1bAmount: Number(e.target.value) }))}
                    placeholder="0"
                    disabled={!editMode}
                    prefix="₹"
                  />
                  <Input
                    label="Employer"
                    type="number"
                    value={editableData.ccd2Amount}
                    onChange={(e) => setEditableData(prev => ({ ...prev, ccd2Amount: Number(e.target.value) }))}
                    placeholder="0"
                    disabled={!editMode}
                    prefix="₹"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete NPS Entry?"
        message="Are you sure you want to delete all NPS entries? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={false}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
