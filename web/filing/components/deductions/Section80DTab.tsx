'use client';

import { useState, useRef } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HeartIcon,
  TrashIcon,
  PlusCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Input from '@/filing/ui/Input';
import Select from '@/filing/ui/Select';
import Checkbox from '@/filing/ui/Checkbox';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import {
  Deduction80DModel,
  Deduction80DHealthInsuranceModel,
  Deduction80DPreventiveCheckupModel,
  Deduction80DMedicalExpenditureModel,
  INITIAL_HEALTH_INSURANCE_ITEM,
  INITIAL_PREVENTIVE_CHECKUP_FORM_DATA,
  INITIAL_MEDICAL_EXPENDITURE_FORM_DATA,
} from '@/filing/models/deductions/medical/deduction-80d-model';
import { useMasterData } from '@/filing/context/MasterDataContext';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Section80DTab() {
  const { filing, updateSection } = useFilingContext();
  const { healthInsuranceTakenFor: HEALTH_INSURANCE_TAKEN_FOR, preventiveMedicalTakenFor: PREVENTIVE_MEDICAL_TAKEN_FOR } = useMasterData();

  const [formData, setFormData] = useState<Deduction80DModel>(() => ({
    deductionId: filing.section80D?.deductionId ?? null,
    filingId: filing.section80D?.filingId ?? null,
    healthInsurance: (filing.section80D?.healthInsurance ?? []).map((e, i) => e.healthId != null ? e : { ...e, healthId: -(Date.now() + i) }),
    preventiveCheckup: (filing.section80D?.preventiveCheckup ?? []).map((e, i) => e.checkupId != null ? e : { ...e, checkupId: -(Date.now() + i + 1000) }),
    medicalExpenditure: (filing.section80D?.medicalExpenditure ?? []).map((e, i) => e.expenditureId != null ? e : { ...e, expenditureId: -(Date.now() + i + 2000) }),
  }));

  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const savedFormDataRef = useRef<Deduction80DModel | null>(null);

  const totalAmount =
    (formData.healthInsurance ?? []).reduce((s, e) => s + (e.healthInsurancePremium || 0), 0) +
    (formData.preventiveCheckup ?? []).reduce((s, e) => s + (e.checkupAmount || 0), 0) +
    (formData.medicalExpenditure ?? []).reduce((s, e) => s + (e.expenditureAmount || 0), 0);

  const hasEntries =
    (formData.healthInsurance ?? []).length > 0 ||
    (formData.preventiveCheckup ?? []).length > 0 ||
    (formData.medicalExpenditure ?? []).length > 0;

  const handleSave = () => {
    const allErrors: string[] = [];
    (formData.healthInsurance ?? []).forEach((item, i) => {
      if (!item.takenFor) allErrors.push(`Health insurance #${i + 1}: "Taken For" is required`);
      if (!item.insurerName?.trim()) allErrors.push(`Health insurance #${i + 1}: Insurer name is required`);
      if (!item.policyNumber?.trim()) allErrors.push(`Health insurance #${i + 1}: Policy number is required`);
      if (!item.healthInsurancePremium || item.healthInsurancePremium <= 0) allErrors.push(`Health insurance #${i + 1}: Premium amount is required`);
    });
    (formData.preventiveCheckup ?? []).forEach((item, i) => {
      if (!item.takenFor) allErrors.push(`Preventive checkup #${i + 1}: "Taken For" is required`);
      if (!item.checkupAmount || item.checkupAmount <= 0) allErrors.push(`Preventive checkup #${i + 1}: Amount is required`);
    });
    (formData.medicalExpenditure ?? []).forEach((item, i) => {
      if (!item.takenFor) allErrors.push(`Medical expenditure #${i + 1}: "Taken For" is required`);
      if (!item.expenditureAmount || item.expenditureAmount <= 0) allErrors.push(`Medical expenditure #${i + 1}: Amount is required`);
    });
    if (!hasEntries) allErrors.push('At least one health insurance policy, preventive checkup, or medical expenditure is required');
    if (allErrors.length > 0) { setError(allErrors.join(' • ')); return; }
    setError(null);
    updateSection('section80D', { ...formData });
    setIsEditMode(false);
  };

  const handleEditMode = () => {
    savedFormDataRef.current = {
      ...formData,
      healthInsurance: (formData.healthInsurance ?? []).map(i => ({ ...i })),
      preventiveCheckup: (formData.preventiveCheckup ?? []).map(i => ({ ...i })),
      medicalExpenditure: (formData.medicalExpenditure ?? []).map(i => ({ ...i })),
    };
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (savedFormDataRef.current) setFormData(savedFormDataRef.current);
    setIsEditMode(false);
    setError(null);
    savedFormDataRef.current = null;
  };

  const handleDeleteAll = () => {
    const cleared: Deduction80DModel = { deductionId: null, filingId: null, healthInsurance: [], preventiveCheckup: [], medicalExpenditure: [] };
    setFormData(cleared);
    updateSection('section80D', null);
    setIsEditMode(false);
    setConfirmDeleteOpen(false);
  };

  const addHealthInsurance = () => {
    setIsEditMode(true);
    setFormData(prev => ({ ...prev, healthInsurance: [...(prev.healthInsurance ?? []), { ...INITIAL_HEALTH_INSURANCE_ITEM, healthId: -Date.now(), filingId: null as unknown as number, takenFor: 'Self' } as Deduction80DHealthInsuranceModel] }));
  };
  const updateHealthInsurance = (index: number, field: keyof Deduction80DHealthInsuranceModel, value: any) => {
    setFormData(prev => ({ ...prev, healthInsurance: (prev.healthInsurance ?? []).map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  };
  const removeHealthInsurance = (index: number) => {
    setFormData(prev => ({ ...prev, healthInsurance: (prev.healthInsurance ?? []).filter((_, i) => i !== index) }));
  };

  const addPreventiveCheckup = () => {
    setIsEditMode(true);
    setFormData(prev => ({ ...prev, preventiveCheckup: [...(prev.preventiveCheckup ?? []), { ...INITIAL_PREVENTIVE_CHECKUP_FORM_DATA, checkupId: -Date.now(), filingId: null as unknown as number, takenFor: 'Self & Family' } as Deduction80DPreventiveCheckupModel] }));
  };
  const updatePreventiveCheckup = (index: number, field: keyof Deduction80DPreventiveCheckupModel, value: any) => {
    setFormData(prev => ({ ...prev, preventiveCheckup: (prev.preventiveCheckup ?? []).map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  };
  const removePreventiveCheckup = (index: number) => {
    setFormData(prev => ({ ...prev, preventiveCheckup: (prev.preventiveCheckup ?? []).filter((_, i) => i !== index) }));
  };

  const addMedicalExpenditure = () => {
    setIsEditMode(true);
    setFormData(prev => ({ ...prev, medicalExpenditure: [...(prev.medicalExpenditure ?? []), { ...INITIAL_MEDICAL_EXPENDITURE_FORM_DATA, expenditureId: -Date.now(), filingId: null as unknown as number, takenFor: 'Self & Family' } as Deduction80DMedicalExpenditureModel] }));
  };
  const updateMedicalExpenditure = (index: number, field: keyof Deduction80DMedicalExpenditureModel, value: any) => {
    setFormData(prev => ({ ...prev, medicalExpenditure: (prev.medicalExpenditure ?? []).map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  };
  const removeMedicalExpenditure = (index: number) => {
    setFormData(prev => ({ ...prev, medicalExpenditure: (prev.medicalExpenditure ?? []).filter((_, i) => i !== index) }));
  };

  const hiOptions = [{ value: '', label: 'Select...' }, ...HEALTH_INSURANCE_TAKEN_FOR];
  const pcOptions = [{ value: '', label: 'Select...' }, ...PREVENTIVE_MEDICAL_TAKEN_FOR];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
            {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
              <HeartIcon className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-semibold text-gray-900">Section 80D - Medical Insurance</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-gray-500">Total 80D</div>
            <span className="text-base font-bold text-blue-600">₹{formatCurrency(totalAmount)}</span>
          </div>
          {hasEntries && !isEditMode && (
            <>
              <IconButton label="Edit" onClick={handleEditMode}>
                <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
              </IconButton>
              <IconButton label="Delete All" onClick={() => setConfirmDeleteOpen(true)}>
                <TrashIcon className="w-3.5 h-3.5 text-red-600" />
              </IconButton>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              {error.includes(' • ') ? (
                <ul className="text-sm text-red-700 list-disc list-inside space-y-0.5">
                  {error.split(' • ').map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-red-700">{error}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Column 1: Health Insurance */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-sm font-semibold text-gray-900">Health Insurance Policies</h5>
                {isEditMode && <IconButton onClick={addHealthInsurance} label="Add Policy"><PlusCircleIcon className="w-4 h-4" /></IconButton>}
              </div>
              {(formData.healthInsurance ?? []).length === 0 ? (
                <div className="py-2"><AddButton label="Add Policy" colorScheme="purple" onClick={addHealthInsurance} /></div>
              ) : (
                <div className="space-y-3">
                  {(formData.healthInsurance ?? []).map((entry, index) => (
                    <div key={entry.healthId ?? `hi-${index}`} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Select label="Taken For" required value={entry.takenFor || 'S'} onChange={(e) => updateHealthInsurance(index, 'takenFor', e.target.value)} options={hiOptions} disabled={!isEditMode} />
                          <Input label="Insurer Name" required value={entry.insurerName || ''} onChange={(e) => updateHealthInsurance(index, 'insurerName', e.target.value)} placeholder="Insurance company" disabled={!isEditMode} />
                          <Input label="Policy Number" required value={entry.policyNumber || ''} onChange={(e) => updateHealthInsurance(index, 'policyNumber', e.target.value)} placeholder="Policy number" disabled={!isEditMode} />
                          <Input label="Premium Amount" required type="number" value={entry.healthInsurancePremium || 0} onChange={(e) => updateHealthInsurance(index, 'healthInsurancePremium', Number(e.target.value))} placeholder="0" prefix="₹" disabled={!isEditMode} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Checkbox label="Includes Senior Citizen" checked={entry.includesSeniorCitizen || false} onChange={(e) => updateHealthInsurance(index, 'includesSeniorCitizen', (e as React.ChangeEvent<HTMLInputElement>).target.checked)} disabled={!isEditMode} />
                          <IconButton onClick={() => removeHealthInsurance(index)} label="Remove" disabled={!isEditMode}><TrashIcon className="w-3 h-3" /></IconButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Preventive Checkup */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-sm font-semibold text-gray-900">Preventive Health Checkup</h5>
                {isEditMode && <IconButton onClick={addPreventiveCheckup} label="Add Checkup"><PlusCircleIcon className="w-4 h-4" /></IconButton>}
              </div>
              {(formData.preventiveCheckup ?? []).length === 0 ? (
                <div className="py-2"><AddButton label="Add Checkup" colorScheme="purple" onClick={addPreventiveCheckup} /></div>
              ) : (
                <div className="space-y-3">
                  {(formData.preventiveCheckup ?? []).map((entry, index) => (
                    <div key={entry.checkupId ?? `pc-${index}`} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Select label="Taken For" value={entry.takenFor || 'SF'} onChange={(e) => updatePreventiveCheckup(index, 'takenFor', e.target.value)} options={pcOptions} disabled={!isEditMode} />
                          <Input label="Checkup Amount" type="number" value={entry.checkupAmount || 0} onChange={(e) => updatePreventiveCheckup(index, 'checkupAmount', Number(e.target.value))} placeholder="0" prefix="₹" disabled={!isEditMode} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Checkbox label="Includes Senior Citizen" checked={entry.includesSeniorCitizen || false} onChange={(e) => updatePreventiveCheckup(index, 'includesSeniorCitizen', (e as React.ChangeEvent<HTMLInputElement>).target.checked)} disabled={!isEditMode} />
                          <IconButton onClick={() => removePreventiveCheckup(index)} label="Remove" disabled={!isEditMode}><TrashIcon className="w-3 h-3" /></IconButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 3: Medical Expenditure */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-sm font-semibold text-gray-900">Medical Expenditure</h5>
                {isEditMode && <IconButton onClick={addMedicalExpenditure} label="Add Expenditure"><PlusCircleIcon className="w-4 h-4" /></IconButton>}
              </div>
              {(formData.medicalExpenditure ?? []).length === 0 ? (
                <div className="py-2"><AddButton label="Add Expenditure" colorScheme="purple" onClick={addMedicalExpenditure} /></div>
              ) : (
                <div className="space-y-3">
                  {(formData.medicalExpenditure ?? []).map((entry, index) => (
                    <div key={entry.expenditureId ?? `me-${index}`} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Select label="Taken For" value={entry.takenFor || 'SF'} onChange={(e) => updateMedicalExpenditure(index, 'takenFor', e.target.value)} options={pcOptions} disabled={!isEditMode} />
                          <Input label="Expenditure Amount" type="number" value={entry.expenditureAmount || 0} onChange={(e) => updateMedicalExpenditure(index, 'expenditureAmount', Number(e.target.value))} placeholder="0" prefix="₹" disabled={!isEditMode} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Checkbox label="Includes Senior Citizen" checked={entry.includesSeniorCitizen || false} onChange={(e) => updateMedicalExpenditure(index, 'includesSeniorCitizen', (e as React.ChangeEvent<HTMLInputElement>).target.checked)} disabled={!isEditMode} />
                          <IconButton onClick={() => removeMedicalExpenditure(index)} label="Remove" disabled={!isEditMode}><TrashIcon className="w-3 h-3" /></IconButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isEditMode && (
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete All Entries?"
        message="Are you sure you want to delete all Section 80D entries? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={false}
        onConfirm={handleDeleteAll}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
