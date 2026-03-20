'use client';

import { useState, useMemo } from 'react';
import {
  ArrowPathIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  CreditCardIcon,
  BanknotesIcon,
  ScaleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import ITRPreview from '@/domain/filing/components/ITRPreview';
import { useFilingContext } from '@/domain/filing/context/FilingContext';

const fc = (amount: number) => '₹' + Math.round(amount).toLocaleString('en-IN');

// ── FY 2025-26 / AY 2026-27 slab computation ──────────────────
function computeSlabTax(taxableIncome: number, regime: 'old' | 'new'): { slabs: { range: string; rate: number; tax: number }[]; total: number } {
  const slabs: { range: string; rate: number; tax: number }[] = [];
  let remaining = taxableIncome;
  let total = 0;
  const brackets = regime === 'new'
    ? [ // New regime 115BAC (Budget 2025)
        { upto: 400000, rate: 0,  label: '0 – 4L' },
        { upto: 400000, rate: 5,  label: '4L – 8L' },
        { upto: 400000, rate: 10, label: '8L – 12L' },
        { upto: 400000, rate: 15, label: '12L – 16L' },
        { upto: 400000, rate: 20, label: '16L – 20L' },
        { upto: 400000, rate: 25, label: '20L – 24L' },
        { upto: Infinity, rate: 30, label: 'Above 24L' },
      ]
    : [ // Old regime
        { upto: 250000, rate: 0,  label: '0 – 2.5L' },
        { upto: 250000, rate: 5,  label: '2.5L – 5L' },
        { upto: 500000, rate: 20, label: '5L – 10L' },
        { upto: Infinity, rate: 30, label: 'Above 10L' },
      ];
  for (const b of brackets) {
    const taxable = Math.min(remaining, b.upto);
    const tax = Math.round(taxable * b.rate / 100);
    slabs.push({ range: b.label, rate: b.rate, tax });
    total += tax;
    remaining -= taxable;
    if (remaining <= 0) break;
  }
  return { slabs, total };
}

function computeRegimeTax(grossIncome: number, totalDeductions: number, totalTaxesPaid: number, regime: 'old' | 'new') {
  const deductionsAllowed = regime === 'old' ? totalDeductions : 75000; // New regime: only std deduction
  const taxableIncome = Math.max(0, grossIncome - deductionsAllowed);
  const { slabs, total: slabTax } = computeSlabTax(taxableIncome, regime);

  // Rebate u/s 87A
  const rebateLimit = regime === 'new' ? 60000 : 12500;
  const rebateThreshold = regime === 'new' ? 1200000 : 500000;
  const rebate = taxableIncome <= rebateThreshold ? Math.min(slabTax, rebateLimit) : 0;
  const taxAfterRebate = slabTax - rebate;

  // Cess 4%
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTaxLiability = taxAfterRebate + cess;

  const taxPayable = Math.max(0, totalTaxLiability - totalTaxesPaid);
  const refund = Math.max(0, totalTaxesPaid - totalTaxLiability);

  return {
    grossTotalIncome: grossIncome,
    totalDeductions: deductionsAllowed,
    totalIncome: taxableIncome,
    slabBreakdown: slabs,
    slabTax,
    rebate87a: rebate,
    healthEducationCess: cess,
    totalTaxLiability,
    totalTaxesPaid,
    taxPayable,
    refund,
    regime,
  };
}

export default function SummaryTab() {
  const { filing, resetFiling } = useFilingContext();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showITRPreview, setShowITRPreview] = useState(false);

  // ── Income totals ──
  const salaryIncome = filing.salary?.reduce((s, e) => s + ((e as any).grossSalary || (e as any).netSalary || 0), 0) ?? 0;
  const housePropertyIncome = filing.houseProperty?.reduce((s, p) => s + ((p as any).annualValueAfterDeduction || 0), 0) ?? 0;
  const interestIncome = filing.interestIncome?.reduce((s, i) => s + ((i as any).interestAmount || 0), 0) ?? 0;
  const dividendIncome = (filing.dividendIncome as any)?.totalDividendAmount || 0;
  const grossTotalIncome = salaryIncome + housePropertyIncome + interestIncome + dividendIncome;

  // ── Deduction totals ──
  const section80C = filing.section80C?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0;
  const nps =
    (filing.section80Ccc?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd1?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd1B?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd2?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0);
  const section80D =
    ((filing.section80D as any)?.healthInsurance?.reduce((s: number, i: any) => s + (i.healthInsurancePremium || 0), 0) ?? 0) +
    ((filing.section80D as any)?.preventiveCheckup?.reduce((s: number, i: any) => s + (i.checkupAmount || 0), 0) ?? 0) +
    ((filing.section80D as any)?.medicalExpenditure?.reduce((s: number, i: any) => s + (i.expenditureAmount || 0), 0) ?? 0);
  const medical = section80D + ((filing.section80Dd as any)?.expenditureIncurred || 0) + ((filing.section80Ddb as any)?.expenditureIncurred || 0) + ((filing.section80U as any)?.expenditureIncurred || 0);
  const loans = (filing.section80E?.reduce((s, i) => s + ((i as any).interestOnLoan || 0), 0) ?? 0) + ((filing.section80Ee as any)?.interestOnLoan || 0) + ((filing.section80Eea as any)?.interestOnLoan || 0) + ((filing.section80Eeb as any)?.interestOnLoan || 0);
  const donations = (filing.section80G?.reduce((s, i) => s + ((i as any).donationAmount || 0), 0) ?? 0) + (filing.section80Gga?.reduce((s, i) => s + ((i as any).totalDonationAmount || 0), 0) ?? 0) + (filing.section80Ggc?.reduce((s, i) => s + ((i as any).totalContribution || 0), 0) ?? 0);
  const other = ((filing.section80Tta as any)?.interestAmount || 0) + ((filing.section80Ttb as any)?.interestAmount || 0) + ((filing.section80Cch as any)?.contributionAmount || 0) + ((filing.section80Gg as any)?.rentPaidAmount || 0);
  const totalDeductions = section80C + nps + medical + loans + donations + other;

  // ── Tax Credits ──
  const tdsTotal = filing.tds?.reduce((s, e) => s + (e.taxDeducted || 0), 0) ?? 0;
  const tcsTotal = filing.tcs?.reduce((s, e) => s + (e.taxCollected || 0), 0) ?? 0;
  const advanceTaxTotal = filing.advanceTax?.reduce((s, e) => s + (e.taxPaidAmount || 0), 0) ?? 0;
  const totalTaxesPaid = tdsTotal + tcsTotal + advanceTaxTotal;

  // ── Client-side tax computation for both regimes ──
  const oldRegime = useMemo(() => computeRegimeTax(grossTotalIncome, totalDeductions, totalTaxesPaid, 'old'), [grossTotalIncome, totalDeductions, totalTaxesPaid]);
  const newRegime = useMemo(() => computeRegimeTax(grossTotalIncome, totalDeductions, totalTaxesPaid, 'new'), [grossTotalIncome, totalDeductions, totalTaxesPaid]);

  const recommended = oldRegime.totalTaxLiability <= newRegime.totalTaxLiability ? 'old' : 'new';
  const current = recommended === 'old' ? oldRegime : newRegime;
  const savings = Math.abs(oldRegime.totalTaxLiability - newRegime.totalTaxLiability);

  const handleReset = () => { resetFiling(); setConfirmResetOpen(false); };

  const renderRegimeCard = (data: ReturnType<typeof computeRegimeTax>, isRecommended: boolean) => {
    const isOld = data.regime === 'old';
    const borderColor = isOld ? 'border-blue-300' : 'border-green-300';
    const titleColor = isOld ? 'text-blue-800' : 'text-green-800';
    const title = isOld ? 'Old Regime' : 'New Regime (115BAC)';
    const isRefund = data.refund > 0;
    return (
      <div className={`bg-white border-2 ${borderColor} rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${titleColor}`}>{title}</h3>
          {isRecommended && (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">✓ Recommended</span>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-700">Gross Income</span>
            <span className="font-semibold text-green-600">{fc(data.grossTotalIncome)}</span>
          </div>
          {data.totalDeductions > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Total Deductions</span>
              <span className="font-semibold text-blue-600">{fc(data.totalDeductions)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b font-semibold">
            <span className="text-gray-900">Taxable Income</span>
            <span className="text-purple-600">{fc(data.totalIncome)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-700">Slab Tax</span>
            <span className="font-semibold text-yellow-600">{fc(data.slabTax)}</span>
          </div>
          {data.rebate87a > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Less: Rebate u/s 87A</span>
              <span className="font-semibold text-green-600">−{fc(data.rebate87a)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-700">Add: Health &amp; Education Cess</span>
            <span className="font-semibold text-red-600">{fc(data.healthEducationCess)}</span>
          </div>
          <div className="flex justify-between py-2 border-b font-semibold">
            <span className="text-red-700">Total Tax Liability</span>
            <span className="text-red-700 text-lg">{fc(data.totalTaxLiability)}</span>
          </div>
          {data.totalTaxesPaid > 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Less: TDS / Advance Tax</span>
              <span className="font-semibold text-orange-600">{fc(data.totalTaxesPaid)}</span>
            </div>
          )}
          {/* Final: Tax Payable or Refund */}
          <div className={`flex justify-between py-3 px-3 rounded-lg ${isRefund ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`text-lg font-bold ${isRefund ? 'text-green-800' : 'text-red-800'}`}>
              {isRefund ? '🎉 Tax Refund' : 'Tax Payable'}
            </span>
            <span className={`text-2xl font-extrabold ${isRefund ? 'text-green-700' : 'text-red-700'}`}>
              {fc(isRefund ? data.refund : data.taxPayable)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tax Computation — side-by-side regime comparison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Computation</h3>

        {/* Tax Summary Cards Strip (like TaxSummary.tsx) */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200 px-3 py-2 min-w-[130px] text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CurrencyRupeeIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">Total Income</span>
            </div>
            <span className="text-base font-bold text-gray-900">{fc(grossTotalIncome)}</span>
          </div>
          <div className="bg-white rounded-lg border border-orange-200 px-3 py-2 min-w-[130px] text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ChartBarIcon className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium uppercase tracking-wide">Tax Liability</span>
            </div>
            <span className="text-base font-bold text-orange-600">{fc(current.totalTaxLiability)}</span>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 px-3 py-2 min-w-[130px] text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CreditCardIcon className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Tax Paid</span>
            </div>
            <span className="text-base font-bold text-blue-600">{fc(totalTaxesPaid)}</span>
          </div>
          <div className={`rounded-lg border px-3 py-2 min-w-[130px] text-center ${current.refund > 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <BanknotesIcon className="w-4 h-4" />
              <span className={`text-xs font-medium uppercase tracking-wide ${current.refund > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {current.refund > 0 ? 'Tax Refund' : 'Tax Payable'}
              </span>
            </div>
            <span className={`text-base font-bold ${current.refund > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {fc(current.refund > 0 ? current.refund : current.taxPayable)}
            </span>
          </div>
          <div className="bg-white rounded-lg border border-indigo-200 px-3 py-2 min-w-[130px] text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ScaleIcon className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Recommended</span>
            </div>
            <span className="text-base font-bold text-indigo-700 capitalize">{recommended} Regime</span>
          </div>
        </div>

        {/* Side-by-side Regime Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderRegimeCard(oldRegime, recommended === 'old')}
          {renderRegimeCard(newRegime, recommended === 'new')}
        </div>

        {/* Key Differences */}
        {savings > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 text-center">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Deductions Difference</p>
              <p className="text-lg font-bold text-blue-700">{fc(Math.abs(oldRegime.totalDeductions - newRegime.totalDeductions))}</p>
            </div>
            <div className="bg-green-50 rounded-lg border border-green-100 p-4 text-center">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Tax Savings</p>
              <p className="text-lg font-bold text-green-700">{fc(savings)}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-4 text-center">
              <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">Recommended</p>
              <p className="text-lg font-bold text-indigo-700 capitalize">{recommended} Regime</p>
              <p className="text-xs text-gray-500 mt-1">saves {fc(savings)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setShowITRPreview(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
        >
          <DocumentTextIcon className="w-4 h-4" />
          View ITR-1
        </button>
        <button
          onClick={() => setConfirmResetOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset Filing
        </button>
      </div>

      {/* ITR-1 Preview Overlay */}
      {showITRPreview && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <ITRPreview onClose={() => setShowITRPreview(false)} />
        </div>
      )}

      <ConfirmModal
        open={confirmResetOpen}
        title="Reset Filing?"
        message="This will clear all filing data and start fresh. This action cannot be undone."
        confirmText="Reset"
        tone="danger"
        isLoading={false}
        onConfirm={handleReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
}
