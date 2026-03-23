'use client';

import { useState } from 'react';
import PersonalDetailsTab from '@/filing/components/PersonalDetailsTab';
import IncomeTab from '@/filing/components/IncomeTab';
import DeductionsTab from '@/filing/components/DeductionsTab';
import TaxPaidTab from '@/filing/components/TaxPaidTab';
import SummaryTab from '@/filing/components/SummaryTab';
import { useFilingContext } from '@/filing/context/FilingContext';
import { calculateTax } from '@/filing/api/filing-api';
import { ayToFy } from '@/utils/tax-year';
import { ASSESSMENT_YEAR_OPTIONS } from '@/utils/assessment-year';
import { TEST_FILING } from '@/filing/test-data/fill-test-data';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'personal-details', label: 'Personal Details' },
  { id: 'income', label: 'Income' },
  { id: 'deductions', label: 'Deductions' },
  { id: 'tax-paid', label: 'Tax Paid' },
] as const;

export default function Home() {
  const { filing, updateFiling } = useFilingContext();
  const [activeTab, setActiveTab] = useState<string>('summary');

  const handleFillTest = async () => {
    const merged = { ...filing, ...TEST_FILING };
    updateFiling(merged);
    setActiveTab('summary');
    try {
      const result = await calculateTax(merged);
      updateFiling({
        taxComputation: result.taxComputation,
        chapterVIADeductions: result.chapterVIADeductions,
        userValidationErrors: result.userValidationErrors,
        taxIntrest: result.taxIntrest,
      });
    } catch {
      // silently ignore — user can retry Compute Tax manually
    }
  };

  const assessmentYear = filing.assessmentYear || '2026-27';
  const financialYear = ayToFy(assessmentYear);
  const personName = [filing.person?.firstName, filing.person?.lastName].filter(Boolean).join(' ');
  const personPan = filing.person?.panNumber ?? '';

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Client Info Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="relative bg-gray-50 rounded-lg border border-gray-200 p-2 pt-3">
                <label className="absolute -top-2 left-2 text-xs font-medium text-gray-500 bg-white px-2">Client Name</label>
                <p className="text-sm font-semibold text-gray-900">{personName || '—'}</p>
              </div>
              <div className="relative bg-gray-50 rounded-lg border border-gray-200 p-2 pt-3">
                <label className="absolute -top-2 left-2 text-xs font-medium text-gray-500 bg-white px-2">PAN Number</label>
                <p className="text-sm font-semibold text-gray-900">{personPan || '—'}</p>
              </div>
              <div className="relative bg-gray-50 rounded-lg border border-gray-200 p-2 pt-3">
                <label className="absolute -top-2 left-2 text-xs font-medium text-gray-500 bg-white px-2">Financial Year (FY)</label>
                <p className="text-sm font-semibold text-gray-900">{financialYear || '—'}</p>
              </div>
              <div className="relative bg-gray-50 rounded-lg border border-gray-200 p-2 pt-3">
                <label className="absolute -top-2 left-2 text-xs font-medium text-gray-500 bg-white px-2">Assessment Year (AY)</label>
                <select
                  value={assessmentYear}
                  onChange={(e) => updateFiling({ assessmentYear: e.target.value })}
                  className="text-sm font-semibold text-indigo-700 bg-transparent border-none outline-none cursor-pointer w-full"
                >
                  {ASSESSMENT_YEAR_OPTIONS.map((ay) => (
                    <option key={ay} value={ay}>{ay}</option>
                  ))}
                </select>
              </div>
              <div className="relative bg-gray-50 rounded-lg border border-gray-200 p-2 pt-3">
                <label className="absolute -top-2 left-2 text-xs font-medium text-gray-500 bg-white px-2">ITR Type</label>
                <p className="text-sm font-semibold text-blue-600">ITR-1</p>
              </div>
            </div>
            {/* Dev: Fill Test Data */}
            <button
              onClick={handleFillTest}
              title="Fill form with sample test data"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
            >
              <span>🧪</span>
              <span className="hidden sm:inline">Fill Test Data</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
          <div className="border-b border-gray-200">
            <nav className="flex px-4">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-4">
          {activeTab === 'summary' && <SummaryTab />}
          {activeTab === 'personal-details' && <PersonalDetailsTab />}
          {activeTab === 'income' && <IncomeTab />}
          {activeTab === 'deductions' && <DeductionsTab />}
          {activeTab === 'tax-paid' && <TaxPaidTab />}
        </div>
      </div>
    </div>
  );
}
