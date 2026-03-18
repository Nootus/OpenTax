'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  UserIcon,
  CurrencyRupeeIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';
import Button from '@/domain/filing/ui/Button';
import ConfirmModal from '@/domain/filing/ui/ConfirmModal';
import { useFilingContext } from '@/domain/filing/context/FilingContext';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

interface SummaryRowProps {
  label: string;
  value: number;
  highlight?: boolean;
  subLabel?: string;
}

function SummaryRow({ label, value, highlight, subLabel }: SummaryRowProps) {
  return (
    <div className={`flex justify-between items-center py-2.5 px-3 rounded-lg ${highlight ? 'bg-blue-50 border border-blue-200' : ''}`}>
      <div>
        <span className={`text-sm ${highlight ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>{label}</span>
        {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
      </div>
      <span className={`font-bold tabular-nums ${highlight ? 'text-blue-700 text-base' : 'text-gray-800 text-sm'}`}>
        ₹{formatCurrency(value)}
      </span>
    </div>
  );
}

export default function SummaryTab() {
  const { filing, resetFiling } = useFilingContext();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // ── Income ────────────────────────────────────────────────────
  const salaryIncome = filing.salary?.reduce((s, e) => s + ((e as any).grossSalary || (e as any).netSalary || 0), 0) ?? 0;
  const housePropertyIncome = filing.houseProperty?.reduce((s, p) => s + ((p as any).annualValueAfterDeduction || 0), 0) ?? 0;
  const interestIncome = filing.interestIncome?.reduce((s, i) => s + ((i as any).interestAmount || 0), 0) ?? 0;
  const dividendIncome = (filing.dividendIncome as any)?.totalDividendAmount || 0;
  const grossTotalIncome = salaryIncome + housePropertyIncome + interestIncome + dividendIncome;

  // ── Deductions ────────────────────────────────────────────────
  const section80C = filing.section80C?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0;
  const npsDeductions =
    (filing.section80Ccc?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd1?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd1B?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd2?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0);
  const section80D =
    ((filing.section80D as any)?.healthInsurance?.reduce((s: number, i: any) => s + (i.healthInsurancePremium || 0), 0) ?? 0) +
    ((filing.section80D as any)?.preventiveCheckup?.reduce((s: number, i: any) => s + (i.checkupAmount || 0), 0) ?? 0) +
    ((filing.section80D as any)?.medicalExpenditure?.reduce((s: number, i: any) => s + (i.expenditureAmount || 0), 0) ?? 0);
  const medicalDeductions =
    section80D +
    ((filing.section80Dd as any)?.expenditureIncurred || 0) +
    ((filing.section80Ddb as any)?.expenditureIncurred || 0) +
    ((filing.section80U as any)?.expenditureIncurred || 0);
  const loanDeductions =
    (filing.section80E?.reduce((s, i) => s + ((i as any).interestOnLoan || 0), 0) ?? 0) +
    ((filing.section80Ee as any)?.interestOnLoan || 0) +
    ((filing.section80Eea as any)?.interestOnLoan || 0) +
    ((filing.section80Eeb as any)?.interestOnLoan || 0);
  const donationDeductions =
    (filing.section80G?.reduce((s, i) => s + ((i as any).donationAmount || 0), 0) ?? 0) +
    (filing.section80Gga?.reduce((s, i) => s + ((i as any).totalDonationAmount || 0), 0) ?? 0) +
    (filing.section80Ggc?.reduce((s, i) => s + ((i as any).totalContribution || 0), 0) ?? 0);
  const otherDeductions =
    ((filing.section80Tta as any)?.interestAmount || 0) +
    ((filing.section80Ttb as any)?.interestAmount || 0) +
    ((filing.section80Cch as any)?.contributionAmount || 0) +
    ((filing.section80Gg as any)?.rentPaidAmount || 0);
  const totalDeductions = section80C + npsDeductions + medicalDeductions + loanDeductions + donationDeductions + otherDeductions;

  // ── Tax Credits ──────────────────────────────────────────────
  const tdsTotal = filing.tds?.reduce((s, e) => s + (e.taxDeducted || 0), 0) ?? 0;
  const tcsTotal = filing.tcs?.reduce((s, e) => s + (e.taxCollected || 0), 0) ?? 0;
  const advanceTaxTotal = filing.advanceTax?.reduce((s, e) => s + (e.taxPaidAmount || 0), 0) ?? 0;
  const totalTaxesPaid = tdsTotal + tcsTotal + advanceTaxTotal;

  // ── Tax Computation (if available from backend) ───────────────
  const taxComputation = (filing as any).taxComputation;
  const computedTaxLiability = taxComputation?.currentRegime?.totalTaxLiability || 0;
  const computedTaxPayable = taxComputation?.currentRegime?.taxPayable || 0;
  const computedRefund = taxComputation?.currentRegime?.refund || 0;
  const hasComputation = !!taxComputation;

  // ── Profile Completeness ──────────────────────────────────────
  const checks = [
    { label: 'Personal Details', done: !!filing.person?.panNumber },
    { label: 'Bank Account', done: (filing.bankAccount?.length ?? 0) > 0 },
    { label: 'Income Sources', done: (filing.salary?.length ?? 0) > 0 || grossTotalIncome > 0 },
    { label: 'TDS / Tax Paid', done: totalTaxesPaid > 0 },
  ];
  const completedChecks = checks.filter(c => c.done).length;
  const completionPct = Math.round((completedChecks / checks.length) * 100);

  const handleReset = () => {
    resetFiling();
    setConfirmResetOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Status Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Filing Summary</h2>
            <p className="text-blue-200 text-sm mt-1">
              AY {filing.assessmentYear || '—'} &nbsp;|&nbsp; {filing.regime ? `${filing.regime} Regime` : 'Regime not selected'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Profile Complete</div>
            <div className="text-3xl font-bold">{completionPct}%</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 bg-blue-800 rounded-full h-2">
          <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${completionPct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {checks.map(c => (
            <div key={c.label} className={`flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${c.done ? 'bg-green-500/30 text-green-100' : 'bg-white/10 text-blue-200'}`}>
              {c.done ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <ExclamationTriangleIcon className="w-3.5 h-3.5" />}
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {/* Taxpayer Info */}
      {filing.person && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold text-gray-900">Taxpayer</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-gray-400">Name</p><p className="font-medium">{[filing.person.firstName, filing.person.middleName, filing.person.lastName].filter(Boolean).join(' ') || '—'}</p></div>
            <div><p className="text-xs text-gray-400">PAN</p><p className="font-medium font-mono">{filing.person.panNumber || '—'}</p></div>
            <div><p className="text-xs text-gray-400">Date of Birth</p><p className="font-medium">{filing.person.dateOfBirth ? new Date(filing.person.dateOfBirth).toLocaleDateString('en-IN') : '—'}</p></div>
            <div><p className="text-xs text-gray-400">Status</p><p className="font-medium capitalize">{filing.person.residentialStatus?.toLowerCase() || '—'}</p></div>
          </div>
        </div>
      )}

      {/* Income Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CurrencyRupeeIcon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">Income</h3>
        </div>
        <div className="space-y-1">
          {salaryIncome > 0 && <SummaryRow label="Salary Income" value={salaryIncome} />}
          {housePropertyIncome !== 0 && <SummaryRow label="House Property Income" value={housePropertyIncome} />}
          {interestIncome > 0 && <SummaryRow label="Interest Income" value={interestIncome} />}
          {dividendIncome > 0 && <SummaryRow label="Dividend Income" value={dividendIncome} />}
          <div className="border-t border-gray-100 mt-2 pt-2">
            <SummaryRow label="Gross Total Income" value={grossTotalIncome} highlight />
          </div>
        </div>
      </div>

      {/* Deductions Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <ReceiptPercentIcon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">Deductions (Chapter VIA)</h3>
        </div>
        <div className="space-y-1">
          {section80C > 0 && <SummaryRow label="Section 80C" value={section80C} subLabel="Investments & Payments" />}
          {npsDeductions > 0 && <SummaryRow label="NPS (80CCC / 80CCD)" value={npsDeductions} />}
          {medicalDeductions > 0 && <SummaryRow label="Medical (80D / 80DD / 80DDB / 80U)" value={medicalDeductions} />}
          {loanDeductions > 0 && <SummaryRow label="Loan Interest (80E / 80EE / 80EEA / 80EEB)" value={loanDeductions} />}
          {donationDeductions > 0 && <SummaryRow label="Donations (80G / 80GGA / 80GGC)" value={donationDeductions} />}
          {otherDeductions > 0 && <SummaryRow label="Other (80TTA / 80TTB / 80CCH / 80GG)" value={otherDeductions} />}
          {totalDeductions === 0 && <p className="text-sm text-gray-400 py-2 text-center">No deductions entered yet</p>}
          {totalDeductions > 0 && (
            <div className="border-t border-gray-100 mt-2 pt-2">
              <SummaryRow label="Total Deductions" value={totalDeductions} highlight />
            </div>
          )}
        </div>
      </div>

      {/* Tax Credits Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <BanknotesIcon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">Tax Credits</h3>
        </div>
        <div className="space-y-1">
          {tdsTotal > 0 && <SummaryRow label="TDS (Tax Deducted at Source)" value={tdsTotal} />}
          {tcsTotal > 0 && <SummaryRow label="TCS (Tax Collected at Source)" value={tcsTotal} />}
          {advanceTaxTotal > 0 && <SummaryRow label="Advance Tax / Self Assessment Tax" value={advanceTaxTotal} />}
          {totalTaxesPaid === 0 && <p className="text-sm text-gray-400 py-2 text-center">No tax payments entered yet</p>}
          {totalTaxesPaid > 0 && (
            <div className="border-t border-gray-100 mt-2 pt-2">
              <SummaryRow label="Total Taxes Paid" value={totalTaxesPaid} highlight />
            </div>
          )}
        </div>
      </div>

      {/* Tax Computation (if available) */}
      {hasComputation && (
        <div className={`rounded-2xl border shadow-sm p-6 ${computedRefund > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`text-sm font-semibold mb-3 ${computedRefund > 0 ? 'text-green-900' : 'text-red-900'}`}>
            Tax Calculation
          </h3>
          <div className="space-y-1">
            <SummaryRow label="Total Tax Liability" value={computedTaxLiability} />
            <SummaryRow label="Total Taxes Paid" value={totalTaxesPaid} />
            <div className="border-t border-gray-200 mt-2 pt-2">
              {computedRefund > 0 ? (
                <SummaryRow label="Refund Due" value={computedRefund} highlight />
              ) : (
                <SummaryRow label="Tax Payable" value={computedTaxPayable} highlight />
              )}
            </div>
          </div>
        </div>
      )}

      {!hasComputation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-amber-700 font-medium">Tax computation not yet available.</p>
          <p className="text-xs text-amber-600 mt-1">Complete all sections above and tax calculation will appear here once processed.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
        <button
          onClick={() => setConfirmResetOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset Filing
        </button>
        <Button variant="primary" onClick={() => window.print()} className="flex items-center gap-2">
          <DocumentArrowDownIcon className="w-4 h-4" />
          Print / Save Summary
        </Button>
      </div>

      <ConfirmModal
        open={confirmResetOpen}
        title="Reset Filing?"
        message="This will clear all entered data and start fresh. This action cannot be undone."
        confirmText="Reset"
        tone="danger"
        isLoading={false}
        onConfirm={handleReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
}
