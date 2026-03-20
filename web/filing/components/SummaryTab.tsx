'use client';

import { useState, useCallback } from 'react';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import ITRPreview from '@/filing/components/ITRPreview';
import TaxComputationScreen from '@/filing/components/summary/TaxComputationScreen';
import { useFilingContext } from '@/filing/context/FilingContext';
import { calculateTax } from '@/filing/api/filing-api';
import { formatCurrency } from '@/utils/format/currency';

export default function SummaryTab() {
  const { filing, updateFiling, resetFiling } = useFilingContext();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showITRPreview, setShowITRPreview] = useState(false);
  const [showTaxComputation, setShowTaxComputation] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);

  const hasResult = !!filing.taxComputation?.currentRegime;
  const current = filing.taxComputation?.currentRegime;
  const isRefund = (current?.refund ?? 0) > 0;

  // ── Compute Tax handler ──
  const handleComputeTax = useCallback(async () => {
    setIsComputing(true);
    setComputeError(null);
    try {
      const result = await calculateTax(filing);
      updateFiling({
        taxComputation: result.taxComputation,
        chapterVIADeductions: result.chapterVIADeductions,
        userValidationErrors: result.userValidationErrors,
        taxIntrest: result.taxIntrest,
      });
    } catch (err: unknown) {
      setComputeError(err instanceof Error ? err.message : 'Tax computation failed');
    } finally {
      setIsComputing(false);
    }
  }, [filing, updateFiling]);

  const handleReset = () => { resetFiling(); setConfirmResetOpen(false); };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleComputeTax}
          disabled={isComputing}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isComputing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Computing…
            </>
          ) : (
            <>
              <CalculatorIcon className="w-4 h-4" />
              Compute Tax
            </>
          )}
        </button>
        {hasResult && (
          <button
            onClick={() => setShowTaxComputation(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
          >
            View Tax Computation
          </button>
        )}
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

      {/* Compute Error */}
      {computeError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Computation Error:</strong> {computeError}
        </div>
      )}

      {/* Tax Computation Result */}
      {hasResult ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tax Computation</h3>
            <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              ✓ Computed
            </span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-200 px-3 py-3 text-center">
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Total Income</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(current!.grossTotalIncome)}</p>
            </div>
            <div className="bg-white rounded-lg border border-orange-200 px-3 py-3 text-center">
              <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">Tax Liability</p>
              <p className="text-base font-bold text-orange-600">{formatCurrency(current!.totalTaxLiability)}</p>
            </div>
            <div className="bg-white rounded-lg border border-blue-200 px-3 py-3 text-center">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Tax Paid</p>
              <p className="text-base font-bold text-blue-600">{formatCurrency(current!.totalTaxesPaid)}</p>
            </div>
            <div className={`rounded-lg border px-3 py-3 text-center ${isRefund ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isRefund ? 'text-green-600' : 'text-red-600'}`}>
                {isRefund ? 'Tax Refund' : 'Tax Payable'}
              </p>
              <p className={`text-base font-bold ${isRefund ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(isRefund ? (current!.refund ?? 0) : (current!.taxPayable ?? 0))}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-indigo-200 px-3 py-3 text-center">
              <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">Recommended</p>
              <p className="text-base font-bold text-indigo-700 capitalize">{current!.regime} Regime</p>
            </div>
          </div>

          {/* Old vs New quick comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(['old', 'new'] as const).map(regime => {
              const data = regime === 'old' ? filing.taxComputation!.oldRegime : filing.taxComputation!.newRegime;
              const isOld = regime === 'old';
              const isRecommended = current!.regime === regime;
              const dataRefund = (data?.refund ?? 0) > 0;
              return (
                <div key={regime} className={`border-2 ${isOld ? 'border-blue-200' : 'border-green-200'} rounded-lg p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-bold ${isOld ? 'text-blue-800' : 'text-green-800'}`}>
                      {isOld ? 'Old Regime' : 'New Regime (115BAC)'}
                    </h4>
                    {isRecommended && (
                      <span className="bg-green-500 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">✓ Recommended</span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b">
                      <span className="text-gray-600">Gross Income</span>
                      <span className="font-semibold text-green-600">{formatCurrency(data?.grossTotalIncome ?? 0)}</span>
                    </div>
                    {(data?.totalDeductions ?? 0) > 0 && (
                      <div className="flex justify-between py-1.5 border-b">
                        <span className="text-gray-600">Deductions</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(data!.totalDeductions)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b font-semibold">
                      <span className="text-gray-800">Taxable Income</span>
                      <span className="text-purple-600">{formatCurrency(data?.totalIncome ?? 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b font-semibold">
                      <span className="text-red-700">Total Tax Liability</span>
                      <span className="text-red-600">{formatCurrency(data?.totalTaxLiability ?? 0)}</span>
                    </div>
                    <div className={`flex justify-between py-2 px-2 rounded ${dataRefund ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className={`font-bold ${dataRefund ? 'text-green-800' : 'text-red-800'}`}>
                        {dataRefund ? 'Refund' : 'Tax Payable'}
                      </span>
                      <span className={`font-bold text-lg ${dataRefund ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(Math.abs(dataRefund ? (data?.refund ?? 0) : (data?.taxPayable ?? 0)))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Full Computation Link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowTaxComputation(true)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              View detailed tax computation with slab breakdown, income breakdown, and more →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <CalculatorIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Click <strong>Compute Tax</strong> to calculate your tax using the backend engine.</p>
        </div>
      )}

      {/* Tax Computation Full-screen Overlay */}
      {showTaxComputation && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <TaxComputationScreen onClose={() => setShowTaxComputation(false)} />
        </div>
      )}

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
