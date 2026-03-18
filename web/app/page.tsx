'use client';

import { useState } from 'react';
import {
  UserIcon,
  CurrencyRupeeIcon,
  ReceiptPercentIcon,
  BanknotesIcon,
  CalculatorIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import PersonalDetailsTab from '@/domain/filing/components/PersonalDetailsTab';
import IncomeTab from '@/domain/filing/components/IncomeTab';
import DeductionsTab from '@/domain/filing/components/DeductionsTab';
import TaxPaidTab from '@/domain/filing/components/TaxPaidTab';
import SummaryTab from '@/domain/filing/components/SummaryTab';
import { useFilingContext } from '@/domain/filing/context/FilingContext';

const TABS = [
  { id: 'personal', label: 'Personal', icon: <UserIcon className="w-5 h-5" /> },
  { id: 'income', label: 'Income', icon: <CurrencyRupeeIcon className="w-5 h-5" /> },
  { id: 'deductions', label: 'Deductions', icon: <ReceiptPercentIcon className="w-5 h-5" /> },
  { id: 'tax-paid', label: 'Tax Paid', icon: <BanknotesIcon className="w-5 h-5" /> },
  { id: 'summary', label: 'Summary', icon: <ChartBarIcon className="w-5 h-5" /> },
];

function AppHeader({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (id: string) => void }) {
  const { filing } = useFilingContext();
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <CalculatorIcon className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">OpenTax</h1>
            <p className="text-[10px] text-gray-400 leading-tight">
              Free ITR-1 Filing &nbsp;|&nbsp; AY {filing.assessmentYear || '2026-27'}
            </p>
          </div>
        </div>
        {/* Regime selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">Regime:</span>
          <select
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={filing.regime || 'new'}
            onChange={() => { /* updateSection('regime', ...) — handled in PersonalDetailsTab */ }}
            disabled
          >
            <option value="new">New</option>
            <option value="old">Old</option>
          </select>
        </div>
      </div>
      {/* Tab Navigation */}
      <nav className="max-w-5xl mx-auto px-4 flex gap-0 border-t border-gray-100 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <span className="w-4 h-4">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'personal' && <PersonalDetailsTab />}
        {activeTab === 'income' && <IncomeTab />}
        {activeTab === 'deductions' && <DeductionsTab />}
        {activeTab === 'tax-paid' && <TaxPaidTab />}
        {activeTab === 'summary' && <SummaryTab />}
      </main>
    </div>
  );
}
