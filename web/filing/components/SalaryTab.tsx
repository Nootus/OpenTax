'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  BriefcaseIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import Input from '@/filing/ui/Input';
import Select from '@/filing/ui/Select';
import DatePicker from '@/filing/ui/DatePicker';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import { fyDatesFromAy } from '@/utils/tax-year';
import type { SalaryModel } from '@/filing/models/income/salary/salary-model';
import { useMasterData } from '@/filing/context/MasterDataContext';

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const SECTION_171 = { BASIC_SALARY: 8, HRA: 11, LTA: 13, OTHER_ALLOWANCES: 14 } as const;
const SECTION_172 = { RFA: 5, COMPANY_CAR: 6, OTHER_PERQUISITES: 9 } as const;
const SECTION_173 = { TERMINATION_COMP: 5, GRATUITY: 7, OTHER_PROFITS: 9 } as const;

interface SalaryData {
  entries: SalaryModel[];
  totalGrossSalary: number;
  totalExemptions: number;
  totalNetSalary: number;
}

const calcTotals = (entries: SalaryModel[]) => ({
  totalGrossSalary: entries.reduce(
    (sum, e) =>
      sum +
      e.salarySection171.reduce((s, i) => s + (i.amount || 0), 0) +
      e.salarySection172.reduce((s, i) => s + (i.amount || 0), 0) +
      e.salarySection173.reduce((s, i) => s + (i.amount || 0), 0),
    0
  ),
  totalExemptions: entries.reduce(
    (sum, e) => sum + e.salarySection171.reduce((s, i) => s + (i.exemptionAmount || 0), 0),
    0
  ),
  totalNetSalary: Math.max(
    0,
    entries.reduce((sum, e) => {
      const gross =
        e.salarySection171.reduce((s, i) => s + (i.amount || 0), 0) +
        e.salarySection172.reduce((s, i) => s + (i.amount || 0), 0) +
        e.salarySection173.reduce((s, i) => s + (i.amount || 0), 0);
      const exempt = e.salarySection171.reduce((s, i) => s + (i.exemptionAmount || 0), 0);
      const ded =
        (e.salaryDeduction16?.standardDeduction || 0) +
        (e.salaryDeduction16?.entertainmentAllowance || 0) +
        (e.salaryDeduction16?.professionalTax || 0);
      return sum + (gross - exempt - ded);
    }, 0)
  ),
});

export default function SalaryTab() {
  const { filing, updateSection } = useFilingContext();
  const { states: STATES, countries: COUNTRIES, employerTypes: EMPLOYER_TYPES } = useMasterData();
  const stateOptions = [{ value: '', label: 'Select state' }, ...STATES];
  const countryOptions = [{ value: '', label: 'Select country' }, ...COUNTRIES];
  const employerTypeOptions = [{ value: '', label: 'Select type' }, ...EMPLOYER_TYPES];
  const assessmentYear = filing.assessmentYear ?? '2026-27';
  const standardDeductionAmount = filing.taxComputation?.currentRegime?.incomeBreakdown?.salary?.DeductionUs16ia
    ?? ((filing.regime ?? 'new').toLowerCase() === 'new' ? 75000 : 50000);
  const { fyMinDate, fyMaxDate } = fyDatesFromAy(assessmentYear);

  const normalizeEntry = useCallback(
    (entry: SalaryModel, isFirstEntry: boolean): SalaryModel => {
      const defaultStdDed = isFirstEntry ? standardDeductionAmount : 0;
      const find171 = (cid: number) => (entry.salarySection171 ?? []).find((s) => s.componentId === cid);
      const find172 = (cid: number) => (entry.salarySection172 ?? []).find((s) => s.componentId === cid);
      const find173 = (cid: number) => (entry.salarySection173 ?? []).find((s) => s.componentId === cid);

      const knownIds171: number[] = [SECTION_171.BASIC_SALARY, SECTION_171.HRA, SECTION_171.LTA, SECTION_171.OTHER_ALLOWANCES];
      const unknownAmt171 = (entry.salarySection171 ?? []).filter((s) => s.componentId != null && !knownIds171.includes(s.componentId)).reduce((s, i) => s + (i.amount || 0), 0);
      const unknownExempt171 = (entry.salarySection171 ?? []).filter((s) => s.componentId != null && !knownIds171.includes(s.componentId)).reduce((s, i) => s + (i.exemptionAmount || 0), 0);

      const knownIds172: number[] = [SECTION_172.COMPANY_CAR, SECTION_172.RFA, SECTION_172.OTHER_PERQUISITES];
      const unknownAmt172 = (entry.salarySection172 ?? []).filter((s) => s.componentId != null && !knownIds172.includes(s.componentId)).reduce((s, i) => s + (i.amount || 0), 0);

      const knownIds173: number[] = [SECTION_173.TERMINATION_COMP, SECTION_173.GRATUITY, SECTION_173.OTHER_PROFITS];
      const unknownAmt173 = (entry.salarySection173 ?? []).filter((s) => s.componentId != null && !knownIds173.includes(s.componentId)).reduce((s, i) => s + (i.amount || 0), 0);

      return {
        ...entry,
        employerAddress: entry.employerAddress ?? {
          employerAddressId: undefined, employerId: undefined,
          addressLine1: '', addressLine2: '', landmark: '', city: '', district: '', state: '', pincode: '', country: 'IN',
        },
        salaryDeduction16: entry.salaryDeduction16
          ? { ...entry.salaryDeduction16, standardDeduction: defaultStdDed }
          : { salaryDeductionId: undefined, filingId: null, employerId: undefined, standardDeduction: defaultStdDed, entertainmentAllowance: 0, professionalTax: 0 },
        salarySection171: [
          { componentId: SECTION_171.BASIC_SALARY, amount: find171(SECTION_171.BASIC_SALARY)?.amount || 0, filingId: null, exemptionAmount: find171(SECTION_171.BASIC_SALARY)?.exemptionAmount || 0 },
          { componentId: SECTION_171.HRA, amount: find171(SECTION_171.HRA)?.amount || 0, filingId: null, exemptionAmount: find171(SECTION_171.HRA)?.exemptionAmount || 0 },
          { componentId: SECTION_171.LTA, amount: find171(SECTION_171.LTA)?.amount || 0, filingId: null, exemptionAmount: find171(SECTION_171.LTA)?.exemptionAmount || 0 },
          { componentId: SECTION_171.OTHER_ALLOWANCES, amount: (find171(SECTION_171.OTHER_ALLOWANCES)?.amount || 0) + unknownAmt171, filingId: null, exemptionAmount: (find171(SECTION_171.OTHER_ALLOWANCES)?.exemptionAmount || 0) + unknownExempt171 },
        ],
        salarySection172: [
          { componentId: SECTION_172.COMPANY_CAR, amount: find172(SECTION_172.COMPANY_CAR)?.amount || 0, filingId: null },
          { componentId: SECTION_172.RFA, amount: find172(SECTION_172.RFA)?.amount || 0, filingId: null },
          { componentId: SECTION_172.OTHER_PERQUISITES, amount: (find172(SECTION_172.OTHER_PERQUISITES)?.amount || 0) + unknownAmt172, filingId: null },
        ],
        salarySection173: [
          { componentId: SECTION_173.TERMINATION_COMP, amount: find173(SECTION_173.TERMINATION_COMP)?.amount || 0, filingId: null },
          { componentId: SECTION_173.GRATUITY, amount: find173(SECTION_173.GRATUITY)?.amount || 0, filingId: null },
          { componentId: SECTION_173.OTHER_PROFITS, amount: (find173(SECTION_173.OTHER_PROFITS)?.amount || 0) + unknownAmt173, filingId: null },
        ],
      };
    },
    [standardDeductionAmount]
  );

  const [data, setData] = useState<SalaryData>(() => {
    const entries = (filing.salary ?? []).map((e, i) => {
      const normalized = normalizeEntry(e, i === 0);
      if (normalized.employer.employerId != null) return normalized;
      return { ...normalized, employer: { ...normalized.employer, employerId: -(Date.now() + i) } };
    });
    return { entries, ...calcTotals(entries) };
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [expandedAddresses, setExpandedAddresses] = useState<Record<number, boolean>>({});

  const prevCountRef = useRef(data.entries.length);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.entries.length > prevCountRef.current) {
      const last = data.entries[data.entries.length - 1];
      if ((last.employer.employerId ?? 0) < 0) {
        setEditingEntryId(last.employer.employerId!);
        setTimeout(() => lastEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    }
    prevCountRef.current = data.entries.length;
  }, [data.entries.length]);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'salary-tab-compact-style';
    style.textContent = `
      .salary-tab-compact input,
      .salary-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('salary-tab-compact-style')) document.head.appendChild(style);
    return () => { document.getElementById('salary-tab-compact-style')?.remove(); };
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────
  const validateEntry = (entry: SalaryModel): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!entry.employer.employerName?.trim()) e.employerName = 'Employer name is required';
    if (!entry.employer.employerType?.trim()) e.employerType = 'Employer type is required';
    if (!entry.employer.tanNumber?.trim()) {
      e.tanNumber = 'TAN number is required';
    } else if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(entry.employer.tanNumber)) {
      e.tanNumber = 'Invalid TAN format (e.g., ABCD12345E)';
    }
    if (entry.employer.panNumber?.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(entry.employer.panNumber)) {
      e.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }
    if (entry.employer.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.employer.email)) {
      e.email = 'Invalid email format';
    }
    if (!entry.employmentPeriod?.employmentFrom) e.employmentFrom = 'Employment start date is required';
    if (!entry.employmentPeriod?.employmentTo) e.employmentTo = 'Employment end date is required';
    if (
      entry.employmentPeriod?.employmentFrom &&
      entry.employmentPeriod?.employmentTo &&
      new Date(entry.employmentPeriod.employmentTo) < new Date(entry.employmentPeriod.employmentFrom)
    ) {
      e.employmentTo = 'Employment To cannot be before Employment From';
    }
    if (entry.employerAddress?.pincode?.trim() && !/^\d{6}$/.test(entry.employerAddress.pincode)) {
      e.pincode = 'Pincode must be 6 digits';
    }
    const gross =
      entry.salarySection171.reduce((s, i) => s + (i.amount || 0), 0) +
      entry.salarySection172.reduce((s, i) => s + (i.amount || 0), 0) +
      entry.salarySection173.reduce((s, i) => s + (i.amount || 0), 0);
    const exempt = entry.salarySection171.reduce((s, i) => s + (i.exemptionAmount || 0), 0);
    if (gross > 0 && exempt > gross) e.exemptions = 'Exempt allowances cannot exceed gross salary';
    return e;
  };

  // ── Handlers ────────────────────────────────────────────────────────────
  const addEntry = () => {
    const tempId = -Date.now();
    const newEntry: SalaryModel = {
      employer: { employerId: tempId, filingId: null, employerName: '', employerType: '', tanNumber: '', panNumber: '', telephone: '', email: '' },
      employerAddress: { employerAddressId: undefined, employerId: undefined, addressLine1: '', addressLine2: '', landmark: '', city: '', district: '', state: '', pincode: '', country: 'IN' },
      employmentPeriod: { employmentPeriodId: undefined, filingId: null, employerId: undefined, employmentFrom: null, employmentTo: null },
      salaryDeduction16: { salaryDeductionId: undefined, filingId: null, employerId: undefined, standardDeduction: standardDeductionAmount, entertainmentAllowance: 0, professionalTax: 0 },
      salarySection171: [
        { componentId: SECTION_171.BASIC_SALARY, amount: 0, filingId: null, exemptionAmount: 0 },
        { componentId: SECTION_171.HRA, amount: 0, filingId: null, exemptionAmount: 0 },
        { componentId: SECTION_171.LTA, amount: 0, filingId: null, exemptionAmount: 0 },
        { componentId: SECTION_171.OTHER_ALLOWANCES, amount: 0, filingId: null, exemptionAmount: 0 },
      ],
      salarySection172: [
        { componentId: SECTION_172.COMPANY_CAR, amount: 0, filingId: null },
        { componentId: SECTION_172.RFA, amount: 0, filingId: null },
        { componentId: SECTION_172.OTHER_PERQUISITES, amount: 0, filingId: null },
      ],
      salarySection173: [
        { componentId: SECTION_173.TERMINATION_COMP, amount: 0, filingId: null },
        { componentId: SECTION_173.GRATUITY, amount: 0, filingId: null },
        { componentId: SECTION_173.OTHER_PROFITS, amount: 0, filingId: null },
      ],
    };
    setData((prev) => ({ ...prev, entries: [...prev.entries, newEntry] }));
  };

  const updateEntry = (employerId: number | null | undefined, field: string, value: any) => {
    setData((prev) => {
      const entries = prev.entries.map((entry) => {
        if (entry.employer.employerId !== employerId) return entry;
        const updated = { ...entry };
        const parts = field.split('.');
        if (parts.length === 3) {
          const [section, idxStr, key] = parts;
          if (section === 'salarySection171' || section === 'salarySection172' || section === 'salarySection173') {
            const arr = [...updated[section as 'salarySection171' | 'salarySection172' | 'salarySection173']];
            const idx = parseInt(idxStr, 10);
            while (arr.length <= idx) arr.push(section === 'salarySection171' ? { componentId: null, amount: null, filingId: null, exemptionAmount: null } : { componentId: null, amount: null, filingId: null });
            arr[idx] = { ...arr[idx], [key]: value } as any;
            updated[section as 'salarySection171' | 'salarySection172' | 'salarySection173'] = arr as any;
          }
        } else if (parts.length === 2) {
          const [section, key] = parts;
          updated[section as keyof SalaryModel] = { ...updated[section as keyof SalaryModel], [key]: value } as any;
        }
        return updated;
      });
      return { entries, ...calcTotals(entries) };
    });
  };

  const saveEntry = (entry: SalaryModel) => {
    const eid = entry.employer.employerId;
    const errs = validateEntry(entry);
    if (Object.keys(errs).length > 0) {
      setEntryErrors((prev) => ({ ...prev, [eid!]: errs }));
      return;
    }
    setEntryErrors((prev) => { const n = { ...prev }; delete n[eid!]; return n; });

    const isNew = !eid || eid < 0;
    const savedEntry: SalaryModel = {
      ...entry,
      employer: { ...entry.employer, employerId: isNew ? Date.now() : eid! },
    };
    const updated = data.entries.map((e) => (e.employer.employerId === eid ? savedEntry : e));
    const newData = { entries: updated, ...calcTotals(updated) };
    setData(newData);
    updateSection('salary', updated);
    setEditingEntryId(null);
  };

  const deleteEntry = (employerId: number) => {
    const updated = data.entries.filter((e) => e.employer.employerId !== employerId);
    const newData = { entries: updated, ...calcTotals(updated) };
    setData(newData);
    updateSection('salary', updated);
    setEntryErrors((prev) => { const n = { ...prev }; delete n[employerId]; return n; });
    setPendingDeleteId(null);
  };

  const cancelEntry = (entry: SalaryModel) => {
    const eid = entry.employer.employerId!;
    if (eid < 0) {
      setData((prev) => {
        const entries = prev.entries.filter((e) => e.employer.employerId !== eid);
        return { entries, ...calcTotals(entries) };
      });
    } else {
      const saved = (filing.salary ?? []).find((e) => e.employer.employerId === eid);
      if (saved) {
        setData((prev) => {
          const entries = prev.entries.map((e) => (e.employer.employerId === eid ? normalizeEntry(saved, prev.entries.findIndex(x => x.employer.employerId === eid) === 0) : e));
          return { entries, ...calcTotals(entries) };
        });
      }
    }
    setEditingEntryId(null);
    setEntryErrors((prev) => { const n = { ...prev }; delete n[eid]; return n; });
  };

  return (
    <div className="salary-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700"
            >
              {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <BriefcaseIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Salary Income</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">{formatCurrency(data.totalNetSalary)}</span>
            <IconButton label="Add Salary" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
              <PlusCircleIcon className="w-5 h-5 text-blue-600" />
            </IconButton>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {data.entries.length === 0 ? (
              <AddButton label="Add Salary Income" onClick={addEntry} colorScheme="blue" />
            ) : (
              data.entries.map((entry, index) => {
                const total171 = entry.salarySection171.reduce((s, i) => s + (i.amount || 0), 0);
                const total172 = entry.salarySection172.reduce((s, i) => s + (i.amount || 0), 0);
                const total173 = entry.salarySection173.reduce((s, i) => s + (i.amount || 0), 0);
                const grossAnnualSalary = total171 + total172 + total173;
                const totalExemptions = entry.salarySection171.reduce((s, i) => s + (i.exemptionAmount || 0), 0);
                const totalDeductions =
                  (entry.salaryDeduction16?.standardDeduction || 0) +
                  (entry.salaryDeduction16?.entertainmentAllowance || 0) +
                  (entry.salaryDeduction16?.professionalTax || 0);
                const eid = entry.employer.employerId!;
                const isEditing = editingEntryId === eid;
                const errs = entryErrors[eid] ?? {};

                return (
                  <div
                    key={eid}
                    className="border border-gray-200 rounded-lg p-4 mb-4"
                    ref={index === data.entries.length - 1 ? lastEntryRef : null}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-gray-900">Employer {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 py-1.5 bg-blue-50 px-3 rounded-lg">
                            <span className="text-xs font-semibold text-gray-900">Gross Annual Salary</span>
                            <span className="text-xs font-bold text-blue-600">{formatCurrency(grossAnnualSalary)}</span>
                          </div>
                          <div className="flex items-center gap-2 py-1.5 bg-green-50 px-3 rounded-lg">
                            <span className="text-xs font-semibold text-gray-900">Net Annual Salary</span>
                            <span className="text-xs font-bold text-green-600">{formatCurrency(grossAnnualSalary - totalExemptions)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <>
                            <IconButton label="Edit" onClick={() => setEditingEntryId(eid)}>
                              <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                            </IconButton>
                            <IconButton label="Delete" onClick={() => setPendingDeleteId(eid)}>
                              <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => cancelEntry(entry)}>Cancel</Button>
                            <Button variant="primary" size="sm" onClick={() => saveEntry(entry)}>Save</Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Validation errors */}
                    {isEditing && Object.keys(errs).length > 0 && (
                      <div className="mt-2 mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                        <ul className="list-disc list-inside space-y-0.5">
                          {Object.values(errs).map((msg, i) => <li key={i}>{msg}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Two-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
                      {/* LEFT: Salary Calculations */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h5 className="text-sm font-medium text-gray-900">Gross Salary</h5>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">Total</span>
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(grossAnnualSalary)}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {/* Section 17(1) */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <h6 className="text-xs font-medium text-gray-800">Salary u/s 17(1)</h6>
                                <span className="text-[10px] font-bold text-blue-600">{formatCurrency(total171)}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <Input label="Basic Salary" type="number" value={entry.salarySection171[0]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection171.0.amount', Number(e.target.value))} disabled={!isEditing} />
                                <Input label="HRA" type="number" value={entry.salarySection171[1]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection171.1.amount', Number(e.target.value))} disabled={!isEditing} />
                                <Input label="LTA" type="number" value={entry.salarySection171[2]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection171.2.amount', Number(e.target.value))} disabled={!isEditing} />
                                <Input label="Other Allowances" type="number" value={entry.salarySection171[3]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection171.3.amount', Number(e.target.value))} disabled={!isEditing} />
                              </div>
                            </div>
                            {/* Section 17(2) and 17(3) side by side */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <h6 className="text-xs font-medium text-gray-800">Salary u/s 17(2)</h6>
                                  <span className="text-[10px] font-bold text-blue-600">{formatCurrency(total172)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <Input label="Car" type="number" value={entry.salarySection172[0]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection172.0.amount', Number(e.target.value))} disabled={!isEditing} />
                                  <Input label="RFA" type="number" value={entry.salarySection172[1]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection172.1.amount', Number(e.target.value))} disabled={!isEditing} />
                                  <Input label="Other Perqs" type="number" value={entry.salarySection172[2]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection172.2.amount', Number(e.target.value))} disabled={!isEditing} />
                                </div>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <h6 className="text-xs font-medium text-gray-800">Salary u/s 17(3)</h6>
                                  <span className="text-[10px] font-bold text-blue-600">{formatCurrency(total173)}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <Input label="Termination" type="number" value={entry.salarySection173[0]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection173.0.amount', Number(e.target.value))} disabled={!isEditing} />
                                  <Input label="Gratuity" type="number" value={entry.salarySection173[1]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection173.1.amount', Number(e.target.value))} disabled={!isEditing} />
                                  <Input label="Other Profits" type="number" value={entry.salarySection173[2]?.amount || 0} onChange={(e) => updateEntry(eid, 'salarySection173.2.amount', Number(e.target.value))} disabled={!isEditing} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Exemptions and Deductions */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h6 className="text-xs font-medium text-gray-800">Exempt Allowances</h6>
                              <span className="text-[10px] font-bold text-green-600">(-) {formatCurrency(totalExemptions)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Input label="HRA" type="number" value={entry.salarySection171[1]?.exemptionAmount || 0} onChange={(e) => updateEntry(eid, 'salarySection171.1.exemptionAmount', Number(e.target.value))} disabled={!isEditing} />
                              <Input label="LTA" type="number" value={entry.salarySection171[2]?.exemptionAmount || 0} onChange={(e) => updateEntry(eid, 'salarySection171.2.exemptionAmount', Number(e.target.value))} disabled={!isEditing} />
                              <Input label="Other" type="number" value={entry.salarySection171[3]?.exemptionAmount || 0} onChange={(e) => updateEntry(eid, 'salarySection171.3.exemptionAmount', Number(e.target.value))} disabled={!isEditing} />
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <h6 className="text-xs font-medium text-gray-800">Deductions u/s 16</h6>
                              <span className="text-[10px] font-bold text-red-600">(-) {formatCurrency(totalDeductions)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Input label="Entertainment" type="number" value={entry.salaryDeduction16?.entertainmentAllowance ?? 0} onChange={(e) => updateEntry(eid, 'salaryDeduction16.entertainmentAllowance', Number(e.target.value))} disabled={!isEditing} />
                              <Input label="Prof. Tax" type="number" value={entry.salaryDeduction16?.professionalTax ?? 0} onChange={(e) => updateEntry(eid, 'salaryDeduction16.professionalTax', Number(e.target.value))} disabled={!isEditing} />
                              <Input label="Standard" type="number" value={entry.salaryDeduction16?.standardDeduction ?? 0} disabled={true} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: Employer Details */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Employer Details</h5>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Employer Name" required value={entry.employer.employerName} onChange={(e) => updateEntry(eid, 'employer.employerName', e.target.value)} disabled={!isEditing} error={isEditing ? errs.employerName : undefined} />
                            <Input label="TAN Number" required value={entry.employer.tanNumber} onChange={(e) => updateEntry(eid, 'employer.tanNumber', e.target.value.toUpperCase())} disabled={!isEditing} error={isEditing ? errs.tanNumber : undefined} />
                            <Select label="Employer Type" required value={entry.employer.employerType || ''} onChange={(e) => updateEntry(eid, 'employer.employerType', e.target.value)} options={employerTypeOptions} disabled={!isEditing} error={isEditing ? errs.employerType : undefined} />
                            <Input label="Employer PAN" value={entry.employer.panNumber || ''} onChange={(e) => updateEntry(eid, 'employer.panNumber', e.target.value.toUpperCase())} disabled={!isEditing} error={isEditing ? errs.panNumber : undefined} />
                            <DatePicker label="Employment From *" value={entry.employmentPeriod?.employmentFrom} onChange={(date) => updateEntry(eid, 'employmentPeriod.employmentFrom', date)} disabled={!isEditing} error={isEditing ? errs.employmentFrom : undefined} minDate={fyMinDate} maxDate={entry.employmentPeriod?.employmentTo ? new Date(entry.employmentPeriod.employmentTo) : fyMaxDate} />
                            <DatePicker label="Employment To *" value={entry.employmentPeriod?.employmentTo} onChange={(date) => updateEntry(eid, 'employmentPeriod.employmentTo', date)} disabled={!isEditing} error={isEditing ? errs.employmentTo : undefined} minDate={entry.employmentPeriod?.employmentFrom ? new Date(entry.employmentPeriod.employmentFrom) : fyMinDate} maxDate={fyMaxDate} />
                            <Input label="Telephone" value={entry.employer.telephone || ''} onChange={(e) => updateEntry(eid, 'employer.telephone', e.target.value)} disabled={!isEditing} />
                            <Input label="Email" value={entry.employer.email || ''} onChange={(e) => updateEntry(eid, 'employer.email', e.target.value)} disabled={!isEditing} error={isEditing ? errs.email : undefined} />
                          </div>
                          {/* Address accordion */}
                          <div className="border border-gray-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setExpandedAddresses((prev) => ({ ...prev, [eid]: !prev[eid] }))}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-700">Employer Address Details</span>
                              {expandedAddresses[eid] ? (
                                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                            {expandedAddresses[eid] && (
                              <div className="p-3 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-3">
                                  <Input label="Address Line-1" value={entry.employerAddress?.addressLine1 || ''} onChange={(e) => updateEntry(eid, 'employerAddress.addressLine1', e.target.value)} disabled={!isEditing} />
                                  <Input label="Address Line-2" value={entry.employerAddress?.addressLine2 || ''} onChange={(e) => updateEntry(eid, 'employerAddress.addressLine2', e.target.value)} disabled={!isEditing} />
                                  <Input label="Landmark" value={entry.employerAddress?.landmark || ''} onChange={(e) => updateEntry(eid, 'employerAddress.landmark', e.target.value)} disabled={!isEditing} />
                                  <Input label="City" value={entry.employerAddress?.city || ''} onChange={(e) => updateEntry(eid, 'employerAddress.city', e.target.value)} disabled={!isEditing} />
                                  <Input label="District" value={entry.employerAddress?.district || ''} onChange={(e) => updateEntry(eid, 'employerAddress.district', e.target.value)} disabled={!isEditing} />
                                  <Select label="State" value={entry.employerAddress?.state || ''} onChange={(e) => updateEntry(eid, 'employerAddress.state', e.target.value)} options={stateOptions} disabled={!isEditing} />
                                  <Select label="Country" value={entry.employerAddress?.country || ''} onChange={(e) => updateEntry(eid, 'employerAddress.country', e.target.value)} options={countryOptions} disabled={!isEditing} />
                                  <Input label="Pincode" value={entry.employerAddress?.pincode || ''} onChange={(e) => updateEntry(eid, 'employerAddress.pincode', e.target.value)} disabled={!isEditing} error={isEditing ? errs.pincode : undefined} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete Employer?"
        message="Are you sure you want to delete this employer and all associated salary data? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={false}
        onConfirm={() => { if (pendingDeleteId != null) deleteEntry(pendingDeleteId); }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
