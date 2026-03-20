'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CurrencyDollarIcon, PencilSquareIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import Input from '@/filing/ui/Input';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { DividendIncomeRecord } from '@/filing/models/income/dividend/dividend-income-model';

interface QuarterlyData {
  q1Dividend: number; q1Expense: number;
  q2Dividend: number; q2Expense: number;
  q3Dividend: number; q3Expense: number;
  q4Dividend: number; q4Expense: number;
  q5Dividend: number; q5Expense: number;
}

const EMPTY_QUARTERLY: QuarterlyData = {
  q1Dividend: 0, q1Expense: 0,
  q2Dividend: 0, q2Expense: 0,
  q3Dividend: 0, q3Expense: 0,
  q4Dividend: 0, q4Expense: 0,
  q5Dividend: 0, q5Expense: 0,
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const quarterlySum = (q: QuarterlyData) =>
  (q.q1Dividend + q.q2Dividend + q.q3Dividend + q.q4Dividend + q.q5Dividend) -
  (q.q1Expense + q.q2Expense + q.q3Expense + q.q4Expense + q.q5Expense);

const dateToQuarterIndex = (date: string | Date | null | undefined): number => {
  if (!date) return 0;
  const d = new Date(date as string);
  if (isNaN(d.getTime())) return 0;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if ((month >= 4 && month <= 5) || (month === 6 && day <= 15)) return 0;
  if ((month === 6 && day >= 16) || (month >= 7 && month <= 8) || (month === 9 && day <= 15)) return 1;
  if ((month === 9 && day >= 16) || (month >= 10 && month <= 11) || (month === 12 && day <= 15)) return 2;
  if ((month === 12 && day >= 16) || (month <= 2) || (month === 3 && day <= 15)) return 3;
  if (month === 3 && day >= 16) return 4;
  return 0;
};

const recordsToQuarterly = (
  records: DividendIncomeRecord[],
  amountKey: 'amount' | 'amountReceived' = 'amount',
): QuarterlyData => {
  const q: QuarterlyData = { ...EMPTY_QUARTERLY };
  const dividendKeys: (keyof QuarterlyData)[] = ['q1Dividend', 'q2Dividend', 'q3Dividend', 'q4Dividend', 'q5Dividend'];
  for (const r of records) {
    const idx = dateToQuarterIndex(r.dateOfReceipt);
    const key = dividendKeys[idx];
    (q[key] as number) += (r[amountKey] as number) || 0;
  }
  return q;
};

const getQuarterDates = (assessmentYear: string | null): [string, string, string, string, string] => {
  const ayStart = assessmentYear ? parseInt(assessmentYear.split('-')[0], 10) : new Date().getFullYear();
  const fyStart = ayStart - 1;
  const fyEnd = ayStart;
  return [
    `${fyStart}-06-15`,
    `${fyStart}-09-15`,
    `${fyStart}-12-15`,
    `${fyEnd}-03-15`,
    `${fyEnd}-03-31`,
  ];
};

export default function DividendIncomeTab() {
  const { filing, updateSection } = useFilingContext();
  const assessmentYear = filing.assessmentYear ?? null;

  const initFromFiling = () => {
    const rawEquity = (filing.dividendIncome?.equity ?? []) as unknown as DividendIncomeRecord[];
    const rawRsu = (filing.dividendIncome?.rsu ?? []) as unknown as DividendIncomeRecord[];
    const hasAny = rawEquity.length > 0 || rawRsu.length > 0;
    return {
      equityQ: rawEquity.length > 0 ? recordsToQuarterly(rawEquity, 'amount') : EMPTY_QUARTERLY,
      rsuQ: rawRsu.length > 0 ? recordsToQuarterly(rawRsu, 'amountReceived') : EMPTY_QUARTERLY,
      hasData: hasAny,
      showForm: hasAny,
    };
  };

  const init = initFromFiling();
  const [isExpanded, setIsExpanded] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showForm, setShowForm] = useState(init.showForm);
  const [hasData, setHasData] = useState(init.hasData);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [equityQuarterly, setEquityQuarterly] = useState<QuarterlyData>(init.equityQ);
  const [rsuQuarterly, setRsuQuarterly] = useState<QuarterlyData>(init.rsuQ);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'dividend-income-tab-compact-style';
    style.textContent = `.dividend-income-tab-compact input { padding: 0.75rem 0.5rem 0.375rem 0.5rem !important; height: 40px !important; }`;
    if (!document.getElementById('dividend-income-tab-compact-style')) document.head.appendChild(style);
    return () => { document.getElementById('dividend-income-tab-compact-style')?.remove(); };
  }, []);

  const equityTotal = quarterlySum(equityQuarterly);
  const rsuTotal = quarterlySum(rsuQuarterly);
  const totalDividendIncome = equityTotal + rsuTotal;

  const handleSave = () => {
    const quarters = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;
    const hasAnyEquity = quarters.some((q) => equityQuarterly[`${q}Dividend`] > 0);
    const hasAnyRsu = quarters.some((q) => rsuQuarterly[`${q}Dividend`] > 0);
    if (!hasAnyEquity && !hasAnyRsu) {
      setSaveError('At least one quarter must have a dividend amount greater than 0.');
      return;
    }
    const hasEquityNegative = quarters.some((q) => equityQuarterly[`${q}Expense`] > equityQuarterly[`${q}Dividend`]);
    const hasRsuNegative = quarters.some((q) => rsuQuarterly[`${q}Expense`] > rsuQuarterly[`${q}Dividend`]);
    if (hasEquityNegative || hasRsuNegative) {
      setSaveError('Expense cannot exceed dividend for any quarter. Total cannot be negative.');
      return;
    }

    setSaveError(null);
    const [qd1, qd2, qd3, qd4, qd5] = getQuarterDates(assessmentYear);
    const quarterDates = [qd1, qd2, qd3, qd4, qd5] as const;
    const periodLabels = ['Upto 15th June', '16th Jun – 15th Sep', '16th Sep – 15th Dec', '16th Dec – 15th Mar', '16th Mar – 31st Mar'];

    const equityRecords = quarters.flatMap((q, i) => {
      const net = equityQuarterly[`${q}Dividend`] - equityQuarterly[`${q}Expense`];
      if (net === 0) return [];
      return [{
        dividendType: 'equity' as const,
        narration: `${periodLabels[i]} dividend income from equity, stocks, and mutual funds`,
        amount: net,
        dateOfReceipt: quarterDates[i],
        amountReceivedCurrencyType: 'INR',
        taxPaidForeignCurrencyType: 'INR',
      }];
    });

    const rsuRecords = quarters.flatMap((q, i) => {
      const net = rsuQuarterly[`${q}Dividend`] - rsuQuarterly[`${q}Expense`];
      if (net === 0) return [];
      return [{
        dividendType: 'rsu' as const,
        description: `${periodLabels[i]} dividend income from RSUs/ESOPs/ESSPs`,
        amount: net,
        amountReceived: net,
        amountReceivedCurrencyType: 'INR',
        taxPaidForeignCurrencyType: 'INR',
        dateOfReceipt: quarterDates[i],
        receivedDate: quarterDates[i],
        taxPaidOutsideIndia: 0,
      }];
    });

    updateSection('dividendIncome', { equity: equityRecords as any, rsu: rsuRecords as any } as any);
    setHasData(true);
    setEditMode(false);
  };

  const handleCancel = () => {
    setSaveError(null);
    setEditMode(false);
    const init = initFromFiling();
    setEquityQuarterly(init.equityQ);
    setRsuQuarterly(init.rsuQ);
  };

  const handleDelete = () => {
    updateSection('dividendIncome', null);
    setEquityQuarterly(EMPTY_QUARTERLY);
    setRsuQuarterly(EMPTY_QUARTERLY);
    setHasData(false);
    setShowForm(false);
    setEditMode(false);
  };

  const renderQuarterSection = (
    quarterLabel: string,
    dividendValue: number,
    expenseValue: number,
    onDividendChange: (v: number) => void,
    onExpenseChange: (v: number) => void,
  ) => {
    const expenseExceedsDividend = expenseValue > dividendValue;
    return (
      <div className="mb-3">
        <h6 className="text-xs font-medium text-gray-600 mb-2">{quarterLabel}</h6>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Dividend" type="number" value={dividendValue}
            onChange={(e) => {
              const newDividend = Number(e.target.value) || 0;
              onDividendChange(newDividend);
              if (expenseValue > newDividend) onExpenseChange(newDividend);
            }} disabled={!editMode} />
          <Input label="Expense" type="number" value={expenseValue}
            onChange={(e) => {
              const clamped = Math.min(Number(e.target.value) || 0, dividendValue);
              onExpenseChange(clamped);
            }}
            disabled={!editMode}
            error={expenseExceedsDividend ? 'Cannot exceed dividend' : undefined} />
        </div>
      </div>
    );
  };

  return (
    <div className="dividend-income-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700">
              {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <CurrencyDollarIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Dividend Income</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">{formatCurrency(totalDividendIncome)}</span>
            {!showForm ? (
              <IconButton label="Add Dividend Income" onClick={() => { if (!isExpanded) setIsExpanded(true); setShowForm(true); setEditMode(true); }}>
                <PlusCircleIcon className="w-5 h-5 text-purple-600" />
              </IconButton>
            ) : !editMode ? (
              <div className="flex gap-1">
                <IconButton label="Edit" onClick={() => setEditMode(true)}>
                  <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                </IconButton>
                <IconButton label="Delete" onClick={() => setConfirmDeleteOpen(true)}>
                  <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                </IconButton>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSave}>Save</Button>
              </div>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {saveError && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{saveError}</div>
            )}
            {!showForm ? (
              <AddButton label="Add Dividend Income" onClick={() => { setShowForm(true); setEditMode(true); }} colorScheme="purple" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Equity */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-gray-900">Equity, Stocks, Mutual Funds</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Total</span>
                      <span className="text-sm font-bold text-purple-600">{formatCurrency(equityTotal)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                    {renderQuarterSection('Upto 15th June', equityQuarterly.q1Dividend, equityQuarterly.q1Expense,
                      (v) => setEquityQuarterly((p) => ({ ...p, q1Dividend: v })),
                      (v) => setEquityQuarterly((p) => ({ ...p, q1Expense: v })))}
                    {renderQuarterSection('16th Jun – 15th Sep', equityQuarterly.q2Dividend, equityQuarterly.q2Expense,
                      (v) => setEquityQuarterly((p) => ({ ...p, q2Dividend: v })),
                      (v) => setEquityQuarterly((p) => ({ ...p, q2Expense: v })))}
                    {renderQuarterSection('16th Sep – 15th Dec', equityQuarterly.q3Dividend, equityQuarterly.q3Expense,
                      (v) => setEquityQuarterly((p) => ({ ...p, q3Dividend: v })),
                      (v) => setEquityQuarterly((p) => ({ ...p, q3Expense: v })))}
                    {renderQuarterSection('16th Dec – 15th Mar', equityQuarterly.q4Dividend, equityQuarterly.q4Expense,
                      (v) => setEquityQuarterly((p) => ({ ...p, q4Dividend: v })),
                      (v) => setEquityQuarterly((p) => ({ ...p, q4Expense: v })))}
                    {renderQuarterSection('16th Mar – 31st Mar', equityQuarterly.q5Dividend, equityQuarterly.q5Expense,
                      (v) => setEquityQuarterly((p) => ({ ...p, q5Dividend: v })),
                      (v) => setEquityQuarterly((p) => ({ ...p, q5Expense: v })))}
                  </div>
                </div>

                {/* RSU */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-gray-900">RSUs/ESOPs/ESSPs</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">Total</span>
                      <span className="text-sm font-bold text-purple-600">{formatCurrency(rsuTotal)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                    {renderQuarterSection('Upto 15th June', rsuQuarterly.q1Dividend, rsuQuarterly.q1Expense,
                      (v) => setRsuQuarterly((p) => ({ ...p, q1Dividend: v })),
                      (v) => setRsuQuarterly((p) => ({ ...p, q1Expense: v })))}
                    {renderQuarterSection('16th Jun – 15th Sep', rsuQuarterly.q2Dividend, rsuQuarterly.q2Expense,
                      (v) => setRsuQuarterly((p) => ({ ...p, q2Dividend: v })),
                      (v) => setRsuQuarterly((p) => ({ ...p, q2Expense: v })))}
                    {renderQuarterSection('16th Sep – 15th Dec', rsuQuarterly.q3Dividend, rsuQuarterly.q3Expense,
                      (v) => setRsuQuarterly((p) => ({ ...p, q3Dividend: v })),
                      (v) => setRsuQuarterly((p) => ({ ...p, q3Expense: v })))}
                    {renderQuarterSection('16th Dec – 15th Mar', rsuQuarterly.q4Dividend, rsuQuarterly.q4Expense,
                      (v) => setRsuQuarterly((p) => ({ ...p, q4Dividend: v })),
                      (v) => setRsuQuarterly((p) => ({ ...p, q4Expense: v })))}
                    {renderQuarterSection('16th Mar – 31st Mar', rsuQuarterly.q5Dividend, rsuQuarterly.q5Expense,
                      (v) => setRsuQuarterly((p) => ({ ...p, q5Dividend: v })),
                      (v) => setRsuQuarterly((p) => ({ ...p, q5Expense: v })))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete Dividend Income?"
        message="Are you sure you want to delete all dividend income data? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        onConfirm={() => { handleDelete(); setConfirmDeleteOpen(false); }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
