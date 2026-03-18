'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useFilingContext } from '@/domain/filing/context/FilingContext';

import Section80CTab from './deductions/Section80CTab';
import NPSTab from './deductions/NPSTab';
import Section80DTab from './deductions/Section80DTab';
import Section80DDTab from './deductions/Section80DDTab';
import Section80DDBTab from './deductions/Section80DDBTab';
import Section80UTab from './deductions/Section80UTab';
import Section80ETab from './deductions/Section80ETab';
import Section80EETab from './deductions/Section80EETab';
import Section80EEATab from './deductions/Section80EEATab';
import Section80EEBTab from './deductions/Section80EEBTab';
import Section80GTab from './deductions/Section80GTab';
import Section80GGATab from './deductions/Section80GGATab';
import Section80GGCTab from './deductions/Section80GGCTab';
import OtherDeductionsTab from './deductions/OtherDeductionsTab';

const formatCurrency = (amount: number) =>
  amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function DeductionsTab() {
  const { filing } = useFilingContext();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loansExpanded, setLoansExpanded] = useState(true);
  const [donationsExpanded, setDonationsExpanded] = useState(true);
  const [medicalExpanded, setMedicalExpanded] = useState(true);
  const [otherExpanded, setOtherExpanded] = useState(true);

  const totalDeductionsClaimed =
    (filing.section80C?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0) +
    (filing.section80Ccc?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd1?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd1B?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    (filing.section80Ccd2?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0) +
    ((filing.section80D as any)?.healthInsurance?.reduce((s: number, i: any) => s + (i.healthInsurancePremium || 0), 0) ?? 0) +
    ((filing.section80D as any)?.preventiveCheckup?.reduce((s: number, i: any) => s + (i.checkupAmount || 0), 0) ?? 0) +
    ((filing.section80D as any)?.medicalExpenditure?.reduce((s: number, i: any) => s + (i.expenditureAmount || 0), 0) ?? 0) +
    ((filing.section80Dd as any)?.expenditureIncurred || 0) +
    ((filing.section80Ddb as any)?.expenditureIncurred || 0) +
    ((filing.section80U as any)?.expenditureIncurred || 0) +
    (filing.section80E?.reduce((s, i) => s + ((i as any).interestOnLoan || 0), 0) ?? 0) +
    ((filing.section80Ee as any)?.interestOnLoan || 0) +
    ((filing.section80Eea as any)?.interestOnLoan || 0) +
    ((filing.section80Eeb as any)?.interestOnLoan || 0) +
    (filing.section80G?.reduce((s, i) => s + ((i as any).donationAmount || 0), 0) ?? 0) +
    (filing.section80Gga?.reduce((s, i) => s + ((i as any).totalDonationAmount || 0), 0) ?? 0) +
    (filing.section80Ggc?.reduce((s, i) => s + ((i as any).totalContribution || 0), 0) ?? 0) +
    ((filing.section80Tta as any)?.interestAmount || 0) +
    ((filing.section80Ttb as any)?.interestAmount || 0) +
    ((filing.section80Cch as any)?.contributionAmount || 0) +
    ((filing.section80Gg as any)?.rentPaidAmount || 0);

  return (
    <div className="space-y-6">
      {/* Total Deductions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-8">
        <div className="text-center">
          <h3 className="text-gray-800 text-xl font-semibold mb-3">Total Deductions Claimed</h3>
          <div className="text-blue-600 text-5xl font-bold">₹{formatCurrency(totalDeductionsClaimed)}</div>
        </div>
      </div>

      {/* Popular: 80C + NPS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section80CTab />
        <NPSTab />
      </div>

      {/* 80D - Full Width */}
      <Section80DTab />

      {/* Advanced toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
        >
          {showAdvanced ? 'Hide Advanced Deductions' : 'Show Advanced Deductions'}
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-6 pt-4 border-t border-gray-200">

          {/* Loans Group */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
            <button onClick={() => setLoansExpanded(!loansExpanded)} className="w-full flex items-center gap-2 text-left">
              {loansExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-600 flex-shrink-0" /> : <ChevronRightIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />}
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center text-sm font-bold">L</span>
              <h3 className="text-lg font-semibold text-gray-800 flex-1">Loan Deductions</h3>
            </button>
            {loansExpanded && (
              <div className="space-y-4 mt-4">
                <Section80ETab />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Section80EETab />
                  <Section80EEATab />
                  <Section80EEBTab />
                </div>
              </div>
            )}
          </div>

          {/* Donations Group */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <button onClick={() => setDonationsExpanded(!donationsExpanded)} className="w-full flex items-center gap-2 text-left">
              {donationsExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-600 flex-shrink-0" /> : <ChevronRightIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />}
              <span className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold">D</span>
              <h3 className="text-lg font-semibold text-gray-800 flex-1">Donation Deductions</h3>
            </button>
            {donationsExpanded && (
              <div className="space-y-4 mt-4">
                <Section80GTab />
                <Section80GGATab />
                <Section80GGCTab />
              </div>
            )}
          </div>

          {/* Medical Group */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5">
            <button onClick={() => setMedicalExpanded(!medicalExpanded)} className="w-full flex items-center gap-2 text-left">
              {medicalExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-600 flex-shrink-0" /> : <ChevronRightIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />}
              <span className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center text-sm font-bold">M</span>
              <h3 className="text-lg font-semibold text-gray-800 flex-1">Medical Deductions</h3>
            </button>
            {medicalExpanded && (
              <div className="space-y-4 mt-4">
                <Section80DDTab />
                <Section80DDBTab />
                <Section80UTab />
              </div>
            )}
          </div>

          {/* Other Deductions Group */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-100 p-5">
            <button onClick={() => setOtherExpanded(!otherExpanded)} className="w-full flex items-center gap-2 text-left">
              {otherExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-600 flex-shrink-0" /> : <ChevronRightIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />}
              <span className="w-8 h-8 rounded-lg bg-slate-500 text-white flex items-center justify-center text-sm font-bold">O</span>
              <h3 className="text-lg font-semibold text-gray-800 flex-1">Other Deductions</h3>
            </button>
            {otherExpanded && (
              <div className="space-y-4 mt-4">
                <OtherDeductionsTab />
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
