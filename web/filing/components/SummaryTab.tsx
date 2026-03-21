'use client';

import { useState, useCallback } from 'react';
import {
  ArrowPathIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import ITRPreview from '@/filing/components/ITRPreview';
import TaxComputationScreen from '@/filing/components/summary/TaxComputationScreen';
import { useFilingContext } from '@/filing/context/FilingContext';
import { calculateTax, getItr1 } from '@/filing/api/filing-api';
import { formatCurrency } from '@/utils/format/currency';
import type { ITR1Model } from '@/filing/models/itr1-model';
import type { ValidationErrorModel } from '@/filing/models/filing-model';

export default function SummaryTab() {
  const { filing, updateFiling, resetFiling } = useFilingContext();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [showITRPreview, setShowITRPreview] = useState(false);
  const [showTaxComputation, setShowTaxComputation] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);

  // ITR-1 view state
  const [itr1Data, setItr1Data] = useState<ITR1Model | null>(null);
  const [itr1Loading, setItr1Loading] = useState(false);
  const [itr1Error, setItr1Error] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorModel[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const hasResult = !!filing.taxComputation?.currentRegime;
  const current = filing.taxComputation?.currentRegime;
  const isRefund = (current?.refund ?? 0) > 0;

  // Check if user has entered any meaningful data
  const hasFilingData =
    !!filing.person?.firstName ||
    filing.salary.length > 0 ||
    filing.houseProperty.length > 0 ||
    filing.interestIncome.length > 0 ||
    filing.tds.length > 0 ||
    filing.tcs.length > 0 ||
    filing.advanceTax.length > 0;

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

  // ── View ITR-1 handler ──
  const handleViewItr1 = useCallback(async () => {
    setItr1Loading(true);
    setItr1Error(null);
    setValidationErrors([]);
    setShowValidationErrors(false);
    try {
      const result = await getItr1(filing);
      if (result.validationErrors?.length > 0) {
        setValidationErrors(result.validationErrors);
        setShowValidationErrors(true);
        if (result.itrSummary) setItr1Data(result.itrSummary);
      } else {
        if (result.itrSummary) {
          setItr1Data(result.itrSummary);
          setShowITRPreview(true);
        }
      }
    } catch (err: unknown) {
      setItr1Error(err instanceof Error ? err.message : 'Failed to build ITR-1');
    } finally {
      setItr1Loading(false);
    }
  }, [filing]);

  return (
    <div className="space-y-4">
      {/* Action Buttons — only when user has entered data */}
      {hasFilingData ? (
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
          onClick={handleViewItr1}
          disabled={itr1Loading}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:bg-indigo-100 disabled:cursor-not-allowed transition-colors"
        >
          {itr1Loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Building ITR-1…
            </>
          ) : (
            <>
              <DocumentTextIcon className="w-4 h-4" />
              View ITR-1
            </>
          )}
        </button>
        <button
          onClick={() => setConfirmResetOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset Filing
        </button>
      </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Please enter your personal details, income, and deductions first.</p>
          <p className="text-gray-400 text-xs mt-1">Compute Tax and View ITR-1 will appear once you add some data.</p>
        </div>
      )}

      {/* Compute Error */}
      {computeError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Computation Error:</strong> {computeError}
        </div>
      )}

      {/* ITR-1 Build Error */}
      {itr1Error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>ITR-1 Build Error:</strong> {itr1Error}
        </div>
      )}

      {/* Validation Errors Panel */}
      {showValidationErrors && validationErrors.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-amber-100 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-amber-800">Please Fix These Issues</h3>
              <span className="bg-amber-200 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                {validationErrors.length} {validationErrors.length === 1 ? 'error' : 'errors'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowValidationErrors(false); setShowITRPreview(true); }}
                className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-200 transition-colors font-medium"
              >
                View ITR-1 Anyway
              </button>
              <button
                onClick={() => setShowValidationErrors(false)}
                className="text-amber-500 hover:text-amber-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="px-5 py-3 space-y-2 max-h-80 overflow-y-auto">
            {validationErrors.map((err, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white rounded-lg px-4 py-2.5 border border-amber-200">
                <span className="text-amber-500 mt-0.5 font-bold text-sm">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{err.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">{err.field}</p>
                </div>
              </div>
            ))}
          </div>
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
          <p className="text-gray-500 text-sm">Click <strong>Compute Tax</strong> to calculate your tax.</p>
        </div>
      )}

      {/* Tax Computation Full-screen Overlay */}
      {showTaxComputation && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <TaxComputationScreen onClose={() => setShowTaxComputation(false)} />
        </div>
      )}

      {/* ITR-1 Preview Overlay */}
      {showITRPreview && itr1Data && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <ITRPreview itr1={itr1Data} onClose={() => setShowITRPreview(false)} />
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
