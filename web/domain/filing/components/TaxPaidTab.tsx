'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CurrencyRupeeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import IconButton from '@/domain/filing/ui/IconButton';
import AddButton from '@/domain/filing/ui/AddButton';
import Input from '@/domain/filing/ui/Input';
import Select from '@/domain/filing/ui/Select';
import Button from '@/domain/filing/ui/Button';
import DatePicker from '@/domain/filing/ui/DatePicker';
import { useFilingContext } from '@/domain/filing/context/FilingContext';
import { fyDatesFromAy } from '@/domain/utils/tax-year';
import type { TDSModel } from '@/domain/filing/models/tax-credits/tds-model';
import type { TCSModel } from '@/domain/filing/models/tax-credits/tcs-model';
import type { TaxPaidSelfModel } from '@/domain/filing/models/tax-credits/tax-paid-self-model';

const fc = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

// Static master data options (no API in OpenTax)
const INCOME_SOURCE_OPTIONS = [
  { value: '', label: 'Select source' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'INTEREST', label: 'Interest Income' },
  { value: 'RENT', label: 'Rental Income' },
  { value: 'DIVIDEND', label: 'Dividend Income' },
  { value: 'COMMISSION', label: 'Commission' },
  { value: 'PROFESSIONAL', label: 'Professional Fee' },
  { value: 'OTHER', label: 'Other' },
];

const TDS_SECTION_OPTIONS = [
  { value: '', label: 'Select section' },
  { value: '192', label: '192 - Salary' },
  { value: '192A', label: '192A - PF Premature Withdrawal' },
  { value: '193', label: '193 - Interest on Securities' },
  { value: '194', label: '194 - Dividend' },
  { value: '194A', label: '194A - Interest (Other than Securities)' },
  { value: '194B', label: '194B - Lottery/Puzzle Winnings' },
  { value: '194C', label: '194C - Contractor Payments' },
  { value: '194D', label: '194D - Insurance Commission' },
  { value: '194H', label: '194H - Commission/Brokerage' },
  { value: '194I', label: '194I - Rent' },
  { value: '194IA', label: '194IA - Sale of Immovable Property' },
  { value: '194J', label: '194J - Professional/Technical Fees' },
  { value: '194N', label: '194N - Cash Withdrawal' },
  { value: '194Q', label: '194Q - Purchase of Goods' },
  { value: 'OTHER', label: 'Other' },
];

const QUARTER_OPTIONS = [
  { value: '', label: 'Select quarter' },
  { value: 'Q1', label: 'Q1 (Apr-Jun)' },
  { value: 'Q2', label: 'Q2 (Jul-Sep)' },
  { value: 'Q3', label: 'Q3 (Oct-Dec)' },
  { value: 'Q4', label: 'Q4 (Jan-Mar)' },
];

const NATURE_OF_COLLECTION_OPTIONS = [
  { value: '', label: 'Select nature' },
  { value: '6CA', label: '6CA - Alcoholic Liquor' },
  { value: '6CB', label: '6CB - Tendu Leaves' },
  { value: '6CC', label: '6CC - Timber (Forest Lease)' },
  { value: '6CD', label: '6CD - Timber (Other mode)' },
  { value: '6CE', label: '6CE - Other Forest Produce' },
  { value: '6CF', label: '6CF - Scrap' },
  { value: '6CG', label: '6CG - Minerals' },
  { value: '6CH', label: '6CH - Motor Vehicle above 10L' },
  { value: '6CI', label: '6CI - Overseas Tour Package' },
  { value: '6CJ', label: '6CJ - Remittance under LRS' },
  { value: 'OTHER', label: 'Other' },
];

const TAX_TYPE_OPTIONS = [
  { value: '', label: 'Select type' },
  { value: '100', label: '100 - Advance Tax' },
  { value: '300', label: '300 - Self Assessment Tax' },
];

// Interfaces
interface TDSData { entries: TDSModel[]; totalAmount: number; }
interface TCSData { entries: TCSModel[]; totalAmount: number; }
interface TaxPaidData { entries: TaxPaidSelfModel[]; totalAmount: number; }

const tdsSum = (e: TDSModel[]) => e.reduce((s, i) => s + (i.taxDeducted || 0), 0);
const tcsSum = (e: TCSModel[]) => e.reduce((s, i) => s + (i.taxCollected || 0), 0);
const advSum = (e: TaxPaidSelfModel[]) => e.reduce((s, i) => s + (i.taxPaidAmount || 0), 0);

export default function TaxPaidTab() {
  const { filing, updateSection } = useFilingContext();
  const { fyMinDate, fyMaxDate } = fyDatesFromAy(filing.assessmentYear);

  // TDS state
  const [tdsData, setTdsData] = useState<TDSData>(() => { const e = filing.tds ? [...filing.tds] : []; return { entries: e, totalAmount: tdsSum(e) }; });
  const [editableTdsData, setEditableTdsData] = useState<TDSData>(() => { const e = filing.tds ? [...filing.tds] : []; return { entries: e, totalAmount: tdsSum(e) }; });
  const [editingTdsIndex, setEditingTdsIndex] = useState<number | null>(null);

  // TCS state
  const [tcsData, setTcsData] = useState<TCSData>(() => { const e = filing.tcs ? [...filing.tcs] : []; return { entries: e, totalAmount: tcsSum(e) }; });
  const [editableTcsData, setEditableTcsData] = useState<TCSData>(() => { const e = filing.tcs ? [...filing.tcs] : []; return { entries: e, totalAmount: tcsSum(e) }; });
  const [editingTcsIndex, setEditingTcsIndex] = useState<number | null>(null);

  // Advance Tax state
  const [taxPaidData, setTaxPaidData] = useState<TaxPaidData>(() => { const e = filing.advanceTax ? [...filing.advanceTax] : []; return { entries: e, totalAmount: advSum(e) }; });
  const [editableTaxPaidData, setEditableTaxPaidData] = useState<TaxPaidData>(() => { const e = filing.advanceTax ? [...filing.advanceTax] : []; return { entries: e, totalAmount: advSum(e) }; });
  const [editingTaxPaidIndex, setEditingTaxPaidIndex] = useState<number | null>(null);

  // Accordion
  const [tdsExpanded, setTdsExpanded] = useState(true);
  const [tcsExpanded, setTcsExpanded] = useState(true);
  const [taxPaidExpanded, setTaxPaidExpanded] = useState(true);

  // Refs
  const tdsRef = useRef<HTMLDivElement>(null);
  const tcsRef = useRef<HTMLDivElement>(null);
  const taxPaidRef = useRef<HTMLDivElement>(null);

  // Validation errors
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

  // CSS injection for compact table inputs
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'tax-paid-tab-input-style';
    style.textContent = `
      .tax-paid-tab-compact table input,
      .tax-paid-tab-compact table select,
      .tax-paid-tab-compact table .react-datepicker-wrapper input {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
      .tax-paid-tab-compact table .nature-column { min-width: 160px; }
      .tax-paid-tab-compact table .deductor-column { min-width: 150px; }
      .tax-paid-tab-compact table .tan-column { min-width: 130px; }
      .tax-paid-tab-compact table .income-source-column { min-width: 160px; }
      .tax-paid-tab-compact table .tds-section-column { min-width: 160px; }
      .tax-paid-tab-compact table .amount-column { min-width: 100px; }
      .tax-paid-tab-compact table .certificate-column { min-width: 130px; }
      .tax-paid-tab-compact table .quarter-column { min-width: 90px; }
      .tax-paid-tab-compact table .actions-column { min-width: 140px; }
      .tax-paid-tab-compact input[type="number"]::-webkit-inner-spin-button,
      .tax-paid-tab-compact input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      .tax-paid-tab-compact input[type="number"] { -moz-appearance: textfield; }
    `;
    if (!document.getElementById('tax-paid-tab-input-style')) document.head.appendChild(style);
    return () => { document.getElementById('tax-paid-tab-input-style')?.remove(); };
  }, []);

  // Auto-scroll effects
  useEffect(() => {
    if (tdsExpanded && tdsRef.current) { const t = setTimeout(() => tdsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100); return () => clearTimeout(t); }
  }, [tdsExpanded]);
  useEffect(() => {
    if (tcsExpanded && tcsRef.current) { const t = setTimeout(() => tcsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100); return () => clearTimeout(t); }
  }, [tcsExpanded]);
  useEffect(() => {
    if (taxPaidExpanded && taxPaidRef.current) { const t = setTimeout(() => taxPaidRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100); return () => clearTimeout(t); }
  }, [taxPaidExpanded]);

  const totalTaxPaid = (tdsData.totalAmount || 0) + (tcsData.totalAmount || 0) + (taxPaidData.totalAmount || 0);

  // TDS handlers
  const addTdsEntry = () => {
    const newEntry: TDSModel = { tdsId: undefined, filingId: filing.filingId, deductorName: '', tan: '', pan: null, incomeSource: undefined, tdsSection: undefined, amountPaid: undefined, taxDeducted: undefined, tdsCertificateNumber: undefined, quarter: undefined };
    const updatedEntries = [...editableTdsData.entries, newEntry];
    setEditableTdsData({ entries: updatedEntries, totalAmount: tdsSum(updatedEntries) });
    setEditingTdsIndex(updatedEntries.length - 1);
  };
  const updateTdsEntry = (index: number, field: keyof TDSModel, value: any) => {
    const updatedEntries = editableTdsData.entries.map((e, i) => i === index ? { ...e, [field]: value } : e);
    setEditableTdsData({ entries: updatedEntries, totalAmount: tdsSum(updatedEntries) });
    setSaveErrors({});
  };
  const saveTdsEntry = (index: number) => {
    const entry = editableTdsData.entries[index];
    const errors: Record<string, string> = {};
    if (!entry.deductorName?.trim()) errors[`tds_${index}_deductorName`] = 'Deductor name is required';
    if (!entry.tan?.trim()) errors[`tds_${index}_tan`] = 'TAN is required';
    else if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(entry.tan)) errors[`tds_${index}_tan`] = 'Invalid TAN (e.g. AAAA99999A)';
    if (!entry.taxDeducted || entry.taxDeducted === 0) errors[`tds_${index}_taxDeducted`] = 'Tax deducted is required';
    if (Object.keys(errors).length > 0) { setSaveErrors(errors); return; }
    setSaveErrors({});
    const saved = { ...entry, tdsId: entry.tdsId ?? Date.now() };
    const updatedEntries = editableTdsData.entries.map((e, i) => i === index ? saved : e);
    const newData = { entries: updatedEntries, totalAmount: tdsSum(updatedEntries) };
    setTdsData(newData); setEditableTdsData(newData); updateSection('tds', updatedEntries); setEditingTdsIndex(null);
  };
  const cancelTdsEdit = (index: number) => {
    const original = tdsData.entries[index];
    if (original) { const u = editableTdsData.entries.map((e, i) => i === index ? original : e); setEditableTdsData({ entries: u, totalAmount: tdsSum(u) }); }
    else { const u = editableTdsData.entries.filter((_, i) => i !== index); setEditableTdsData({ entries: u, totalAmount: tdsSum(u) }); }
    setEditingTdsIndex(null); setSaveErrors({});
  };
  const deleteTdsEntry = (index: number) => {
    const u = tdsData.entries.filter((_, i) => i !== index);
    const newData = { entries: u, totalAmount: tdsSum(u) };
    setTdsData(newData); setEditableTdsData(newData); updateSection('tds', u);
  };

  // TCS handlers
  const addTcsEntry = () => {
    const newEntry: TCSModel = { tcsId: undefined, filingId: filing.filingId, collectorName: '', tan: '', natureOfCollection: undefined, amountCollected: undefined, taxCollected: undefined, tcsCertificateNumber: undefined, quarter: undefined, yearOfCollection: null, taxCreditClaimed: undefined };
    const updatedEntries = [...editableTcsData.entries, newEntry];
    setEditableTcsData({ entries: updatedEntries, totalAmount: tcsSum(updatedEntries) });
    setEditingTcsIndex(updatedEntries.length - 1);
  };
  const updateTcsEntry = (index: number, field: keyof TCSModel, value: any) => {
    const updatedEntries = editableTcsData.entries.map((e, i) => i === index ? { ...e, [field]: value } : e);
    setEditableTcsData({ entries: updatedEntries, totalAmount: tcsSum(updatedEntries) });
    setSaveErrors({});
  };
  const saveTcsEntry = (index: number) => {
    const entry = editableTcsData.entries[index];
    const errors: Record<string, string> = {};
    if (!entry.collectorName?.trim()) errors[`tcs_${index}_collectorName`] = 'Collector name is required';
    if (!entry.tan?.trim()) errors[`tcs_${index}_tan`] = 'TAN is required';
    else if (!/^[A-Z]{4}[0-9]{5}[A-Z]$/.test(entry.tan)) errors[`tcs_${index}_tan`] = 'Invalid TAN (e.g. AAAA99999A)';
    if (!entry.taxCollected || entry.taxCollected === 0) errors[`tcs_${index}_taxCollected`] = 'Tax collected is required';
    if (Object.keys(errors).length > 0) { setSaveErrors(errors); return; }
    setSaveErrors({});
    const saved = { ...entry, tcsId: entry.tcsId ?? Date.now() };
    const updatedEntries = editableTcsData.entries.map((e, i) => i === index ? saved : e);
    const newData = { entries: updatedEntries, totalAmount: tcsSum(updatedEntries) };
    setTcsData(newData); setEditableTcsData(newData); updateSection('tcs', updatedEntries); setEditingTcsIndex(null);
  };
  const cancelTcsEdit = (index: number) => {
    const original = tcsData.entries[index];
    if (original) { const u = editableTcsData.entries.map((e, i) => i === index ? original : e); setEditableTcsData({ entries: u, totalAmount: tcsSum(u) }); }
    else { const u = editableTcsData.entries.filter((_, i) => i !== index); setEditableTcsData({ entries: u, totalAmount: tcsSum(u) }); }
    setEditingTcsIndex(null); setSaveErrors({});
  };
  const deleteTcsEntry = (index: number) => {
    const u = tcsData.entries.filter((_, i) => i !== index);
    const newData = { entries: u, totalAmount: tcsSum(u) };
    setTcsData(newData); setEditableTcsData(newData); updateSection('tcs', u);
  };

  // Advance Tax handlers
  const addTaxPaidEntry = () => {
    const newEntry: TaxPaidSelfModel = { taxPaidId: undefined, filingId: filing.filingId, challanNumber: undefined, bsrCode: undefined, dateOfPayment: null, taxPaidAmount: undefined, taxPaidDate: null, taxType: undefined };
    const updatedEntries = [...editableTaxPaidData.entries, newEntry];
    setEditableTaxPaidData({ entries: updatedEntries, totalAmount: advSum(updatedEntries) });
    setEditingTaxPaidIndex(updatedEntries.length - 1);
  };
  const updateTaxPaidEntry = (index: number, field: keyof TaxPaidSelfModel, value: any) => {
    const updatedEntries = editableTaxPaidData.entries.map((e, i) => i === index ? { ...e, [field]: value } : e);
    setEditableTaxPaidData({ entries: updatedEntries, totalAmount: advSum(updatedEntries) });
    setSaveErrors({});
  };
  const saveTaxPaidEntry = (index: number) => {
    const entry = editableTaxPaidData.entries[index];
    const errors: Record<string, string> = {};
    if (!entry.taxType) errors[`taxPaid_${index}_taxType`] = 'Tax type is required';
    if (!entry.taxPaidAmount || entry.taxPaidAmount === 0) errors[`taxPaid_${index}_amount`] = 'Amount is required';
    if (!entry.challanNumber) errors[`taxPaid_${index}_challan`] = 'Challan number is required';
    if (!entry.bsrCode?.trim()) errors[`taxPaid_${index}_bsrCode`] = 'BSR code is required';
    else if (!/^[0-9]{7}$/.test(entry.bsrCode)) errors[`taxPaid_${index}_bsrCode`] = 'BSR code must be 7 digits';
    if (!entry.dateOfPayment) errors[`taxPaid_${index}_date`] = 'Date of payment is required';
    else if (fyMinDate && new Date(entry.dateOfPayment) < fyMinDate) errors[`taxPaid_${index}_date`] = 'Date must be within the financial year';
    else if (fyMaxDate && new Date(entry.dateOfPayment) > fyMaxDate) errors[`taxPaid_${index}_date`] = 'Date must be within the financial year';
    if (Object.keys(errors).length > 0) { setSaveErrors(errors); return; }
    setSaveErrors({});
    const saved = { ...entry, taxPaidId: entry.taxPaidId ?? Date.now() };
    const updatedEntries = editableTaxPaidData.entries.map((e, i) => i === index ? saved : e);
    const newData = { entries: updatedEntries, totalAmount: advSum(updatedEntries) };
    setTaxPaidData(newData); setEditableTaxPaidData(newData); updateSection('advanceTax', updatedEntries); setEditingTaxPaidIndex(null);
  };
  const cancelTaxPaidEdit = (index: number) => {
    const original = taxPaidData.entries[index];
    if (original) { const u = editableTaxPaidData.entries.map((e, i) => i === index ? original : e); setEditableTaxPaidData({ entries: u, totalAmount: advSum(u) }); }
    else { const u = editableTaxPaidData.entries.filter((_, i) => i !== index); setEditableTaxPaidData({ entries: u, totalAmount: advSum(u) }); }
    setEditingTaxPaidIndex(null); setSaveErrors({});
  };
  const deleteTaxPaidEntry = (index: number) => {
    const u = taxPaidData.entries.filter((_, i) => i !== index);
    const newData = { entries: u, totalAmount: advSum(u) };
    setTaxPaidData(newData); setEditableTaxPaidData(newData); updateSection('advanceTax', u);
  };

  return (
    <div className="space-y-4 tax-paid-tab-compact">

      {/* Total Tax Paid Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Tax Paid</h3>
          <p className="text-5xl font-bold text-blue-600">&#8377;{fc(totalTaxPaid)}</p>
        </div>
      </div>

      {/* TDS Section */}
      <div ref={tdsRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-all" onClick={() => setTdsExpanded(!tdsExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tdsExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-600" /> : <ChevronRightIcon className="w-5 h-5 text-gray-600" />}
              <DocumentTextIcon className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tax Deducted at Source (TDS)</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-600">&#8377;{fc(tdsData.totalAmount)}</p>
          </div>
        </div>
        {tdsExpanded && (
          <div className="p-6 space-y-4">
            {editableTdsData.entries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 deductor-column">Deductor Name <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tan-column">TAN <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 income-source-column">Income Source</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tds-section-column">TDS Section</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 amount-column">Amount Paid</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 amount-column">Tax Deducted <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 certificate-column">Certificate No</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 quarter-column">Quarter</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableTdsData.entries.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 [&>td]:align-top">
                        {editingTdsIndex === index ? (
                          <>
                            <td className="px-3 py-2 deductor-column"><Input value={entry.deductorName} onChange={(e) => updateTdsEntry(index, 'deductorName', e.target.value)} placeholder="Deductor" className="text-sm" error={saveErrors[`tds_${index}_deductorName`]} /></td>
                            <td className="px-3 py-2 tan-column"><Input value={entry.tan} onChange={(e) => updateTdsEntry(index, 'tan', e.target.value.toUpperCase())} placeholder="AAAA99999A" maxLength={10} className="text-sm uppercase" error={saveErrors[`tds_${index}_tan`]} /></td>
                            <td className="px-3 py-2 income-source-column"><Select value={entry.incomeSource || ''} onChange={(e) => updateTdsEntry(index, 'incomeSource', e.target.value)} options={INCOME_SOURCE_OPTIONS} className="text-sm" /></td>
                            <td className="px-3 py-2 tds-section-column"><Select value={entry.tdsSection || ''} onChange={(e) => updateTdsEntry(index, 'tdsSection', e.target.value)} options={TDS_SECTION_OPTIONS} className="text-sm" /></td>
                            <td className="px-3 py-2 amount-column"><Input type="number" value={entry.amountPaid || ''} onChange={(e) => updateTdsEntry(index, 'amountPaid', parseFloat(e.target.value) || 0)} placeholder="Amount" className="text-sm" /></td>
                            <td className="px-3 py-2 amount-column"><Input type="number" value={entry.taxDeducted || ''} onChange={(e) => updateTdsEntry(index, 'taxDeducted', parseFloat(e.target.value) || 0)} placeholder="Tax" className="text-sm" error={saveErrors[`tds_${index}_taxDeducted`]} /></td>
                            <td className="px-3 py-2 certificate-column"><Input value={entry.tdsCertificateNumber || ''} onChange={(e) => updateTdsEntry(index, 'tdsCertificateNumber', e.target.value)} placeholder="Certificate" className="text-sm" /></td>
                            <td className="px-3 py-2 quarter-column"><Select value={entry.quarter || ''} onChange={(e) => updateTdsEntry(index, 'quarter', e.target.value)} options={QUARTER_OPTIONS} className="text-sm" /></td>
                            <td className="px-3 py-2 actions-column">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="primary" size="sm" onClick={() => saveTdsEntry(index)}>Save</Button>
                                <Button variant="outline" size="sm" onClick={() => cancelTdsEdit(index)}>Cancel</Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-sm text-gray-900 deductor-column">{entry.deductorName || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 tan-column">{entry.tan || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 income-source-column">{entry.incomeSource || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 tds-section-column">{entry.tdsSection || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 amount-column">&#8377;{fc(entry.amountPaid || 0)}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-emerald-600 amount-column">&#8377;{fc(entry.taxDeducted || 0)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 certificate-column">{entry.tdsCertificateNumber || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 quarter-column">{entry.quarter || '-'}</td>
                            <td className="px-3 py-2 actions-column">
                              <div className="flex items-center justify-center gap-2">
                                <IconButton label="Edit" onClick={() => { setSaveErrors({}); setEditingTdsIndex(index); }}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
                                <IconButton label="Delete" onClick={() => deleteTdsEntry(index)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pt-2">
              <AddButton label="Add TDS Entry" onClick={addTdsEntry} colorScheme="teal" disableEdit={editingTdsIndex !== null} />
            </div>
          </div>
        )}
      </div>

      {/* TCS Section */}
      <div ref={tcsRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-all" onClick={() => setTcsExpanded(!tcsExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tcsExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-600" /> : <ChevronRightIcon className="w-5 h-5 text-gray-600" />}
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Tax Collected at Source (TCS)</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">&#8377;{fc(tcsData.totalAmount)}</p>
          </div>
        </div>
        {tcsExpanded && (
          <div className="p-6 space-y-4">
            {editableTcsData.entries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Collector Name <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 tan-column">TAN <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 nature-column">Nature</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 amount-column">Amount Collected</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 amount-column">Tax Collected <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 certificate-column">Certificate No</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 quarter-column">Quarter</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableTcsData.entries.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 [&>td]:align-top">
                        {editingTcsIndex === index ? (
                          <>
                            <td className="px-3 py-2"><Input value={entry.collectorName} onChange={(e) => updateTcsEntry(index, 'collectorName', e.target.value)} placeholder="Collector" className="text-sm" error={saveErrors[`tcs_${index}_collectorName`]} /></td>
                            <td className="px-3 py-2 tan-column"><Input value={entry.tan} onChange={(e) => updateTcsEntry(index, 'tan', e.target.value.toUpperCase())} placeholder="AAAA99999A" maxLength={10} className="text-sm uppercase" error={saveErrors[`tcs_${index}_tan`]} /></td>
                            <td className="px-3 py-2 nature-column"><Select value={entry.natureOfCollection || ''} onChange={(e) => updateTcsEntry(index, 'natureOfCollection', e.target.value)} options={NATURE_OF_COLLECTION_OPTIONS} className="text-sm" /></td>
                            <td className="px-3 py-2 amount-column"><Input type="number" value={entry.amountCollected || ''} onChange={(e) => updateTcsEntry(index, 'amountCollected', parseFloat(e.target.value) || 0)} placeholder="Amount" className="text-sm" /></td>
                            <td className="px-3 py-2 amount-column"><Input type="number" value={entry.taxCollected || ''} onChange={(e) => updateTcsEntry(index, 'taxCollected', parseFloat(e.target.value) || 0)} placeholder="Tax" className="text-sm" error={saveErrors[`tcs_${index}_taxCollected`]} /></td>
                            <td className="px-3 py-2 certificate-column"><Input value={entry.tcsCertificateNumber || ''} onChange={(e) => updateTcsEntry(index, 'tcsCertificateNumber', e.target.value)} placeholder="Certificate" className="text-sm" /></td>
                            <td className="px-3 py-2 quarter-column"><Select value={entry.quarter || ''} onChange={(e) => updateTcsEntry(index, 'quarter', e.target.value)} options={QUARTER_OPTIONS} className="text-sm" /></td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="primary" size="sm" onClick={() => saveTcsEntry(index)}>Save</Button>
                                <Button variant="outline" size="sm" onClick={() => cancelTcsEdit(index)}>Cancel</Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-sm text-gray-900">{entry.collectorName || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 tan-column">{entry.tan || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 nature-column">{entry.natureOfCollection || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 amount-column">&#8377;{fc(entry.amountCollected || 0)}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-purple-600 amount-column">&#8377;{fc(entry.taxCollected || 0)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 certificate-column">{entry.tcsCertificateNumber || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 quarter-column">{entry.quarter || '-'}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-2">
                                <IconButton label="Edit" onClick={() => { setSaveErrors({}); setEditingTcsIndex(index); }}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
                                <IconButton label="Delete" onClick={() => deleteTcsEntry(index)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pt-2">
              <AddButton label="Add TCS Entry" onClick={addTcsEntry} colorScheme="purple" disableEdit={editingTcsIndex !== null} />
            </div>
          </div>
        )}
      </div>

      {/* Advance Tax / Self Assessment Section */}
      <div ref={taxPaidRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 cursor-pointer hover:from-orange-100 hover:to-amber-100 transition-all" onClick={() => setTaxPaidExpanded(!taxPaidExpanded)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {taxPaidExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-600" /> : <ChevronRightIcon className="w-5 h-5 text-gray-600" />}
              <CurrencyRupeeIcon className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Advance Tax / Self Assessment Tax</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">&#8377;{fc(taxPaidData.totalAmount)}</p>
          </div>
        </div>
        {taxPaidExpanded && (
          <div className="p-6 space-y-4">
            {editableTaxPaidData.entries.length > 0 && (
              <div className="overflow-visible">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Challan Number <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">BSR Code <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date of Payment <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 amount-column">Tax Paid <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Tax Type <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editableTaxPaidData.entries.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 [&>td]:align-top">
                        {editingTaxPaidIndex === index ? (
                          <>
                            <td className="px-3 py-2"><Input value={entry.challanNumber || ''} onChange={(e) => updateTaxPaidEntry(index, 'challanNumber', e.target.value)} placeholder="Challan" className="text-sm" error={saveErrors[`taxPaid_${index}_challan`]} /></td>
                            <td className="px-3 py-2"><Input value={entry.bsrCode || ''} onChange={(e) => updateTaxPaidEntry(index, 'bsrCode', e.target.value.replace(/[^\d]/g, ''))} placeholder="7-digit BSR" maxLength={7} className="text-sm" error={saveErrors[`taxPaid_${index}_bsrCode`]} /></td>
                            <td className="px-3 py-2"><DatePicker value={entry.dateOfPayment} onChange={(date) => updateTaxPaidEntry(index, 'dateOfPayment', date)} className="text-sm" minDate={fyMinDate} maxDate={fyMaxDate} error={saveErrors[`taxPaid_${index}_date`]} /></td>
                            <td className="px-3 py-2 amount-column"><Input type="number" value={entry.taxPaidAmount || ''} onChange={(e) => updateTaxPaidEntry(index, 'taxPaidAmount', parseFloat(e.target.value) || 0)} placeholder="Amount" className="text-sm" error={saveErrors[`taxPaid_${index}_amount`]} /></td>
                            <td className="px-3 py-2"><Select value={entry.taxType || ''} onChange={(e) => updateTaxPaidEntry(index, 'taxType', e.target.value)} options={TAX_TYPE_OPTIONS} className="text-sm" error={saveErrors[`taxPaid_${index}_taxType`]} /></td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="primary" size="sm" onClick={() => saveTaxPaidEntry(index)}>Save</Button>
                                <Button variant="outline" size="sm" onClick={() => cancelTaxPaidEdit(index)}>Cancel</Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2 text-sm text-gray-900">{entry.challanNumber || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{entry.bsrCode || '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{entry.dateOfPayment ? new Date(entry.dateOfPayment).toLocaleDateString('en-IN') : '-'}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-orange-600 amount-column">&#8377;{fc(entry.taxPaidAmount || 0)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{TAX_TYPE_OPTIONS.find(o => o.value === entry.taxType)?.label.replace(/^\d+ - /, '') || entry.taxType || '-'}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-2">
                                <IconButton label="Edit" onClick={() => { setSaveErrors({}); setEditingTaxPaidIndex(index); }}><PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" /></IconButton>
                                <IconButton label="Delete" onClick={() => deleteTaxPaidEntry(index)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="pt-2">
              <AddButton label="Add Tax Payment Entry" onClick={addTaxPaidEntry} colorScheme="orange" disableEdit={editingTaxPaidIndex !== null} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
