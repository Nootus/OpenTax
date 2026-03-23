'use client'

import React, { useState } from 'react'
import { useFilingContext } from '@/filing/context/FilingContext'
import { TaxComputationModel } from '@/filing/models/tax-computation-model'
import { ChapterVIADeductions } from '@/filing/models/filing-model'
import { formatCurrency } from '@/utils/format/currency'

interface TaxComputationScreenProps {
  onClose: () => void
}

export default function TaxComputationScreen({ onClose }: TaxComputationScreenProps) {
  const { filing } = useFilingContext()

  const taxSummaryData = filing.taxComputation ?? undefined

  const [expandSalary, setExpandSalary] = useState(false)
  const [expandHouse, setExpandHouse] = useState(false)
  const [expandCapitalGains, setExpandCapitalGains] = useState(false)
  const [expandOthers, setExpandOthers] = useState(false)

  type ActiveModal = { type: 'income' | 'taxable' | 'slab' | 'special' | 'cess' | 'liability' | 'taxes' | 'deductions'; regime: 'old' | 'new' } | null
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  const openModal = (type: NonNullable<ActiveModal>['type'], regime: 'old' | 'new') => {
    if (type === 'income') { setExpandSalary(false); setExpandHouse(false); setExpandCapitalGains(false); setExpandOthers(false) }
    setActiveModal({ type, regime })
  }

  const getDeductionRows = (chapterVIA: ChapterVIADeductions | null | undefined) =>
    chapterVIA
      ? (Object.keys(SECTION_LABELS) as (keyof ChapterVIADeductions)[])
          .map(key => ({
            key,
            label: SECTION_LABELS[key],
            ...(chapterVIA[key] ?? { claimed: 0, maxAllowed: 0, allowed: 0 }),
          }))
          .filter(row => row.claimed > 0 || row.allowed > 0)
      : []

  const SECTION_LABELS: Record<string, string> = {
    section80C:    '80C – Life Insurance / PPF / ELSS etc.',
    section80Ccc:  '80CCC – Pension Fund',
    section80Ccd1: '80CCD(1) – NPS (Employee)',
    section80Ccd1B:'80CCD(1B) – NPS (Additional)',
    section80Ccd2: '80CCD(2) – NPS (Employer)',
    section80D:    '80D – Health Insurance',
    section80Dd:   '80DD – Disabled Dependent',
    section80Ddb:  '80DDB – Medical Treatment',
    section80E:    '80E – Education Loan Interest',
    section80Ee:   '80EE – Home Loan Interest',
    section80Eea:  '80EEA – Affordable Housing Loan',
    section80Eeb:  '80EEB – Electric Vehicle Loan',
    section80Tta:  '80TTA – Savings Interest',
    section80Ttb:  '80TTB – Deposits Interest (Sr. Citizen)',
    section80G:    '80G – Donations',
    section80Gg:   '80GG – Rent Paid',
    section80Gga:  '80GGA – Scientific Research Donations',
    section80Ggc:  '80GGC – Political Party Donations',
    section80U:    '80U – Disability (Self)',
    section80Cch:  '80CCH – Agnipath Scheme',
    section80Qqb:  '80QQB – Royalty (Books)',
    section80Rrb:  '80RRB – Royalty (Patents)',
  }

  const renderRegimeCard = (regime: 'old' | 'new') => {
    const isOld = regime === 'old'
    const regimeData = isOld ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime
    const borderColor = isOld ? 'border-blue-300' : 'border-green-300'
    const titleColor = isOld ? 'text-blue-800' : 'text-green-800'
    const title = isOld ? 'Old Regime' : 'New Regime (115BAC)'
    const tdsValue = Number(regimeData?.totalTaxesPaid ?? (Number(regimeData?.tds ?? 0) + Number(regimeData?.tcs ?? 0) + Number(regimeData?.advanceTax ?? 0))) || 0
    const slabTaxTotal = (regimeData?.slabBreakdown ?? []).reduce((sum, s) => sum + Number(s.tax ?? 0), 0)
    const totalDeductions = Number(regimeData?.totalDeductions ?? 0) || 0
    const canClickDeductions = totalDeductions > 0
    const hasSurchargeBreakdown = !!regimeData?.surchargeBreakdown
    const specialRows = regimeData?.specialRateTaxBreakdown ?? []
    const explicitSpecial = Number(regimeData?.specialRateTax ?? 0)
    const computedSpecial = specialRows.reduce((sum, r) => sum + Number(r.tax ?? 0), 0)
    const specialTaxTotal = explicitSpecial || computedSpecial
    const hasSpecialRateBreakdown = specialTaxTotal !== 0
    const rebate87a = Number(regimeData?.rebate87a ?? 0) || 0
    const cess = Number(regimeData?.healthEducationCess ?? 0) || 0
    const surcharge = Number(regimeData?.surcharge ?? 0) || 0

    return (
      <div className={`bg-white border-2 ${borderColor} rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${titleColor}`}>{title}</h3>
          {taxSummaryData?.currentRegime?.regime === regime && (
            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              ✓ Recommended
            </span>
          )}
        </div>
        <div className="space-y-3">
          {regimeData?.incomeBreakdown ? (
            <div
              className="flex justify-between py-2 border-b cursor-pointer hover:bg-green-50 rounded px-1 -mx-1 group"
              onClick={() => openModal('income', regime)}
            >
              <span className="text-gray-700 group-hover:text-green-700">Gross Income <span className="text-xs text-green-400 group-hover:text-green-600">(view details ↗)</span></span>
              <span className="font-semibold text-green-600">{formatCurrency(Number(regimeData.grossTotalIncome))}</span>
            </div>
          ) : (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Gross Income</span>
              <span className="font-semibold text-green-600">{formatCurrency(Number(regimeData?.grossTotalIncome ?? 0))}</span>
            </div>
          )}

          {canClickDeductions ? (
            <div
              className="flex justify-between py-2 border-b cursor-pointer hover:bg-blue-50 rounded px-1 -mx-1 group"
              onClick={() => openModal('deductions', regime)}
            >
              <span className="text-gray-700 group-hover:text-blue-700">Total Deductions <span className="text-xs text-blue-400 group-hover:text-blue-600">(view details ↗)</span></span>
              <span className="font-semibold text-blue-600">{formatCurrency(totalDeductions)}</span>
            </div>
          ) : totalDeductions !== 0 ? (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Total Deductions</span>
              <span className="font-semibold text-blue-600">{formatCurrency(totalDeductions)}</span>
            </div>
          ) : null}

          <div
            className="flex justify-between py-2 border-b font-semibold cursor-pointer hover:bg-purple-50 rounded px-1 -mx-1 group"
            onClick={() => openModal('taxable', regime)}
          >
            <span className="text-gray-900 group-hover:text-purple-700">Taxable Income <span className="text-xs text-purple-400 font-normal group-hover:text-purple-600">(view details ↗)</span></span>
            <span className="text-purple-600">{formatCurrency(Number(regimeData?.totalIncome ?? 0))}</span>
          </div>
          {slabTaxTotal !== 0 && (
            <div
              className="flex justify-between py-2 border-b cursor-pointer hover:bg-yellow-50 rounded px-1 -mx-1 group"
              onClick={() => openModal('slab', regime)}
            >
              <span className="text-gray-700 group-hover:text-yellow-700">Slab Tax <span className="text-xs text-yellow-400 group-hover:text-yellow-600">(view slabs ↗)</span></span>
              <span className="font-semibold">{formatCurrency(slabTaxTotal)}</span>
            </div>
          )}

          {hasSpecialRateBreakdown && (
            <div
              className="flex justify-between py-2 border-b cursor-pointer hover:bg-indigo-50 rounded px-1 -mx-1 group"
              onClick={() => openModal('special', regime)}
            >
              <span className="text-gray-700 group-hover:text-indigo-700">Special-rate Tax <span className="text-xs text-indigo-400 group-hover:text-indigo-600">(view details ↗)</span></span>
              <span className="font-semibold text-indigo-700">{formatCurrency(specialTaxTotal)}</span>
            </div>
          )}
          {rebate87a !== 0 && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Less: Rebate u/s 87A</span>
              <span className="font-semibold text-green-600">({formatCurrency(rebate87a)})</span>
            </div>
          )}
          {cess !== 0 && regimeData?.cessBreakdown ? (
            <div
              className="flex justify-between py-2 border-b cursor-pointer hover:bg-teal-50 rounded px-1 -mx-1 group"
              onClick={() => openModal('cess', regime)}
            >
              <span className="text-gray-700 group-hover:text-teal-700">Add: Health &amp; Education Cess <span className="text-xs text-teal-400 group-hover:text-teal-600">(view details ↗)</span></span>
              <span className="font-semibold text-red-600">{formatCurrency(cess)}</span>
            </div>
          ) : cess !== 0 ? (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Add: Health &amp; Education Cess</span>
              <span className="font-semibold text-red-600">{formatCurrency(cess)}</span>
            </div>
          ) : null}
          {surcharge !== 0 && hasSurchargeBreakdown ? (
            <div
              className="flex justify-between py-2 border-b cursor-pointer hover:bg-red-50 rounded px-1 -mx-1 group"
              onClick={() => openModal('liability', regime)}
            >
              <span className="text-gray-700 group-hover:text-red-700">Add: Surcharge <span className="text-xs text-red-300 group-hover:text-red-500">(view details ↗)</span></span>
              <span className="font-semibold text-red-600">{formatCurrency(surcharge)}</span>
            </div>
          ) : surcharge !== 0 ? (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-700">Add: Surcharge</span>
              <span className="font-semibold text-red-600">{formatCurrency(surcharge)}</span>
            </div>
          ) : null}
          <div
            className="flex justify-between py-2 border-b font-semibold text-lg cursor-pointer hover:bg-red-50 rounded px-1 -mx-1 group"
            onClick={() => openModal('liability', regime)}
          >
            <span className="text-gray-900 group-hover:text-red-700">Total Tax Liability <span className="text-xs text-red-300 font-normal group-hover:text-red-500">(view details ↗)</span></span>
            <span className="text-red-600">{formatCurrency(Number(regimeData?.totalTaxLiability ?? 0))}</span>
          </div>
          {tdsValue !== 0 && (
            <div
              className="flex justify-between py-2 border-b cursor-pointer hover:bg-orange-50 rounded px-1 -mx-1 group"
              onClick={() => openModal('taxes', regime)}
            >
              <span className="text-gray-700 group-hover:text-orange-700">Less: TDS/Advance Tax <span className="text-xs text-orange-400 group-hover:text-orange-600">(view details ↗)</span></span>
              <span className="font-semibold text-orange-600">({formatCurrency(tdsValue)})</span>
            </div>
          )}
          <div className="flex justify-between py-4 border-t-2 border-gray-300 font-bold text-xl">
            <span className="text-gray-900">
              {(regimeData?.taxPayable ?? 0) > 0 ? 'Tax Payable' : 'Refund Due'}
            </span>
            <span className={(regimeData?.taxPayable ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}>
              {formatCurrency(Math.abs((regimeData?.taxPayable ?? 0) > 0 ? (regimeData?.taxPayable ?? 0) : (regimeData?.refund ?? 0)))}
            </span>
          </div>
        </div>
      </div>
    )
  }


  return (
    <>
    {/* Income Breakdown Modal */}
    {activeModal?.type === 'income' && (() => {
      const regimeData = activeModal.regime === 'old' ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Income Breakdown — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              <table className="w-full text-sm">
                <tbody>
                  {/* Salary Head Accordion */}
                  {regimeData?.incomeBreakdown?.salary && (() => {
                    const sal = regimeData?.incomeBreakdown?.salary
                    if (!sal) return null

                    const salIncome = sal.IncomeFromSal
                    const grossSalary = sal.GrossSalary
                    const stdDeduction = sal.DeductionUs16ia ?? 0
                    const profTax = sal.ProfessionalTaxUs16iii ?? 0
                    const allwnc = sal.AllwncExemptUs10
                    const allwncTotal = allwnc?.TotalAllwncExemptUs10 ?? 0
                    const allwncDetails = allwnc?.AllwncExemptUs10Dtls ?? []

                    return (
                      <>
                        <tr
                          className="border-b cursor-pointer hover:bg-gray-50 select-none"
                          onClick={() => setExpandSalary(v => !v)}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900 flex items-center gap-1">
                            <span className="text-xs text-gray-400">{expandSalary ? '▾' : '▸'}</span> Salary Head
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-green-700">{formatCurrency(salIncome)}</td>
                        </tr>
                        {expandSalary && (
                          <>
                            {grossSalary > 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Gross Salary</td>
                                <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(grossSalary)}</td>
                              </tr>
                            )}
                            {allwncTotal > 0 && (
                              <>
                                <tr className="border-b bg-gray-50">
                                  <td className="py-2 px-6 text-gray-600">Less: Allowances Exempt u/s 10</td>
                                  <td className="py-2 px-3 text-right text-blue-600">({formatCurrency(allwncTotal)})</td>
                                </tr>
                                {allwncDetails.map((d, i) => {
                                  const nature = d.SalNatureDesc ?? ''
                                  const otherNatureText = d.SalOthNatOfInc ? String(d.SalOthNatOfInc) : ''
                                  const amount = d.SalOthAmount ?? 0
                                  return (
                                    <tr key={i} className="border-b bg-blue-50/40">
                                      <td className="py-1.5 px-9 text-gray-500 text-xs">{nature}{otherNatureText ? ` – ${otherNatureText}` : ''}</td>
                                      <td className="py-1.5 px-3 text-right text-blue-500 text-xs">{formatCurrency(amount)}</td>
                                    </tr>
                                  )
                                })}
                              </>
                            )}
                            {stdDeduction !== 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Standard Deduction u/s 16(ia)</td>
                                <td className="py-2 px-3 text-right text-blue-600">({formatCurrency(stdDeduction)})</td>
                              </tr>
                            )}
                            {profTax !== 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Professional Tax u/s 16(iii)</td>
                                <td className="py-2 px-3 text-right text-blue-600">({formatCurrency(profTax)})</td>
                              </tr>
                            )}
                            <tr className="border-b bg-green-50">
                              <td className="py-2 px-6 font-semibold text-gray-900">Income from Salary</td>
                              <td className="py-2 px-3 text-right font-semibold text-green-700">{formatCurrency(salIncome)}</td>
                            </tr>
                          </>
                        )}
                      </>
                    )
                  })()}

                  {/* House Property Head Accordion */}
                  {regimeData?.incomeBreakdown?.house && (() => {
                    const hp = regimeData?.incomeBreakdown?.house
                    if (!hp) return null

                    const hpTotal = hp.TotalIncomeOfHP
                    const annualValue = hp.AnnualValue
                    const stdDeduction = hp.StandardDeduction
                    const interestPayable = hp.InterestPayable ?? 0
                    const hpColor = hpTotal < 0 ? 'text-red-600' : 'text-green-700'

                    return (
                      <>
                        <tr
                          className="border-b cursor-pointer hover:bg-gray-50 select-none"
                          onClick={() => setExpandHouse(v => !v)}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900 flex items-center gap-1">
                            <span className="text-xs text-gray-400">{expandHouse ? '▾' : '▸'}</span> House Property Head
                          </td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${hpColor}`}>{formatCurrency(hpTotal)}</td>
                        </tr>
                        {expandHouse && (
                          <>
                            {annualValue !== 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Annual Value</td>
                                <td className="py-2 px-3 text-right text-gray-700">{formatCurrency(annualValue)}</td>
                              </tr>
                            )}
                            {stdDeduction !== 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Less: Standard Deduction (30%)</td>
                                <td className="py-2 px-3 text-right text-blue-600">({formatCurrency(stdDeduction)})</td>
                              </tr>
                            )}
                            {interestPayable !== 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Less: Interest on Loan</td>
                                <td className="py-2 px-3 text-right text-blue-600">({formatCurrency(interestPayable)})</td>
                              </tr>
                            )}
                            <tr className="border-b bg-green-50">
                              <td className="py-2 px-6 font-semibold text-gray-900">Income from House Property</td>
                              <td className={`py-2 px-3 text-right font-semibold ${hpColor}`}>{formatCurrency(hpTotal)}</td>
                            </tr>
                          </>
                        )}
                      </>
                    )
                  })()}

                  {/* Other Sources Head Accordion */}
                  {regimeData?.incomeBreakdown?.others && (() => {
                    const os = regimeData?.incomeBreakdown?.others
                    if (!os) return null
                    const osIncome = os.IncomeOthSrc
                    return (
                      <>
                        <tr
                          className="border-b cursor-pointer hover:bg-gray-50 select-none"
                          onClick={() => setExpandOthers(v => !v)}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900 flex items-center gap-1">
                            <span className="text-xs text-gray-400">{expandOthers ? '▾' : '▸'}</span> Other Sources
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-green-700">{formatCurrency(osIncome)}</td>
                        </tr>
                        {expandOthers && (
                          <>
                            <tr className="border-b bg-green-50">
                              <td className="py-2 px-6 font-semibold text-gray-900">Income from Other Sources</td>
                              <td className="py-2 px-3 text-right font-semibold text-green-700">{formatCurrency(osIncome)}</td>
                            </tr>
                          </>
                        )}
                      </>
                    )
                  })()}

                  {/* Capital Gains Accordion */}
                  {regimeData?.incomeBreakdown?.capitalGains && (() => {
                    const cg = regimeData?.incomeBreakdown?.capitalGains
                    if (!cg) return null

                    const cgTotal = Number(cg.total ?? cg.totalCapitalGains ?? 0)
                    const st = Number(cg.shortTerm ?? cg.shortTermGains ?? 0)
                    const lt = Number(cg.longTerm ?? cg.longTermGains ?? 0)
                    const cgColor = cgTotal < 0 ? 'text-red-600' : 'text-green-700'
                    return (
                      <>
                        <tr
                          className="border-b cursor-pointer hover:bg-gray-50 select-none"
                          onClick={() => setExpandCapitalGains(v => !v)}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900 flex items-center gap-1">
                            <span className="text-xs text-gray-400">{expandCapitalGains ? '▾' : '▸'}</span> Capital Gains
                          </td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${cgColor}`}>{formatCurrency(cgTotal)}</td>
                        </tr>
                        {expandCapitalGains && (
                          <>
                            {st !== 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Short Term Capital Gains (STCG)</td>
                                <td className={`py-2 px-3 text-right ${st < 0 ? 'text-red-600' : 'text-gray-700'}`}>{formatCurrency(st)}</td>
                              </tr>
                            )}
                            {lt !== 0 && (
                              <tr className="border-b bg-gray-50">
                                <td className="py-2 px-6 text-gray-600">Long Term Capital Gains (LTCG)</td>
                                <td className={`py-2 px-3 text-right ${lt < 0 ? 'text-red-600' : 'text-gray-700'}`}>{formatCurrency(lt)}</td>
                              </tr>
                            )}
                            <tr className="border-b bg-green-50">
                              <td className="py-2 px-6 font-semibold text-gray-900">Total Capital Gains</td>
                              <td className={`py-2 px-3 text-right font-semibold ${cgColor}`}>{formatCurrency(cgTotal)}</td>
                            </tr>
                          </>
                        )}
                      </>
                    )
                  })()}

                  {/* Gross Total */}
                  {regimeData?.incomeBreakdown && (
                    <tr className="bg-green-50 font-bold border-t-2 border-green-200">
                      <td className="py-3 px-3 text-gray-900">Gross Total Income</td>
                      <td className="py-3 px-3 text-right text-green-700">{formatCurrency(regimeData.incomeBreakdown.grossTotal)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    })()}

    {/* Taxable Income Modal */}
    {activeModal?.type === 'taxable' && (() => {
      const regimeData = activeModal.regime === 'old' ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime
      const belShortfall = Number(regimeData?.belShortfall ?? 0)
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Taxable Income — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-700">Gross Total Income</span>
                <span className="font-semibold text-green-600">{formatCurrency(Number(regimeData?.grossTotalIncome ?? 0))}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-700">Less: Total Deductions</span>
                <span className="font-semibold text-blue-600">({formatCurrency(Number(regimeData?.totalDeductions ?? 0))})</span>
              </div>

              {belShortfall !== 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">BEL absorbed (from special-rate income)</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(belShortfall)}</span>
                </div>
              )}

              <div className="flex justify-between py-3 font-bold text-base border-t-2 border-purple-200">
                <span className="text-gray-900">Taxable Income</span>
                <span className="text-purple-600">{formatCurrency(Number(regimeData?.totalIncome ?? 0))}</span>
              </div>
            </div>
          </div>
        </div>
      )
    })()}

    {/* Slab Breakdown Modal */}
    {activeModal?.type === 'slab' && (() => {
      const regimeData = activeModal.regime === 'old' ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime
      const slabs = regimeData?.slabBreakdown ?? []
      const slabTaxTotal = slabs.reduce((sum, s) => sum + Number(s.tax ?? 0), 0)
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Tax Slab Breakdown — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {slabs.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No slab data available.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                      <th className="text-left py-2 px-3 rounded-l">Slab</th>
                      <th className="text-right py-2 px-3">Rate</th>
                      <th className="text-right py-2 px-3">Taxable Amount</th>
                      <th className="text-right py-2 px-3 rounded-r">Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slabs.map((s, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-700">
                          {formatCurrency(Number(s.fromAmount))} – {s.toAmount != null ? formatCurrency(Number(s.toAmount)) : 'Above'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{s.rate}%</td>
                        <td className="py-2.5 px-3 text-right text-gray-800">{formatCurrency(Number(s.taxableAmount))}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-800">{formatCurrency(Number(s.tax))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-yellow-50 font-semibold">
                      <td className="py-2.5 px-3 text-gray-900" colSpan={3}>Total Slab Tax</td>
                      <td className="py-2.5 px-3 text-right text-yellow-700">{formatCurrency(slabTaxTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )
    })()}

    {/* Special-rate Tax Breakdown Modal */}
    {activeModal?.type === 'special' && (() => {
      const regimeData = activeModal.regime === 'old' ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime
      const specialRows = regimeData?.specialRateTaxBreakdown ?? []
      const explicitTotal = regimeData?.specialRateTax
      const computedTotal = specialRows.reduce((sum, r) => sum + Number(r.tax ?? 0), 0)
      const specialTotal = Number(explicitTotal ?? computedTotal)

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Special-rate Tax Breakdown — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {specialRows.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No special-rate tax data available.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                      <th className="text-left py-2 px-3 rounded-l">Section</th>
                      <th className="text-left py-2 px-3">Description</th>
                      <th className="text-right py-2 px-3">Rate</th>
                      <th className="text-right py-2 px-3">Income</th>
                      <th className="text-right py-2 px-3">Taxable</th>
                      <th className="text-right py-2 px-3 rounded-r">Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specialRows.map((r, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-700 font-medium">{r.section}</td>
                        <td className="py-2.5 px-3 text-gray-700">{r.description}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{r.rate}%</td>
                        <td className="py-2.5 px-3 text-right text-gray-700">{formatCurrency(Number(r.income))}</td>
                        <td className="py-2.5 px-3 text-right text-gray-800">{formatCurrency(Number(r.taxableIncome))}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-800">{formatCurrency(Number(r.tax))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50 font-semibold">
                      <td className="py-2.5 px-3 text-gray-900" colSpan={5}>Total Special-rate Tax</td>
                      <td className="py-2.5 px-3 text-right text-indigo-700">{formatCurrency(specialTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )
    })()}

    {/* Cess Breakdown Modal */}
    {activeModal?.type === 'cess' && (() => {
      const regimeData = activeModal.regime === 'old' ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime
      const cb = regimeData?.cessBreakdown
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Health &amp; Education Cess — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-700">Base Amount (Tax After Rebate)</span>
                <span className="font-semibold text-gray-800">{formatCurrency(Number(cb?.baseAmount ?? 0))}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-700">Cess Rate</span>
                <span className="font-semibold text-gray-800">{cb?.rate ?? '4'}%</span>
              </div>
              <div className="flex justify-between py-3 font-bold text-base border-t-2 border-teal-200">
                <span className="text-gray-900">Health &amp; Education Cess</span>
                <span className="text-teal-700">{formatCurrency(Number(cb?.cess ?? 0))}</span>
              </div>
            </div>
          </div>
        </div>
      )
    })()}

    {/* Tax Liability Modal */}
    {activeModal?.type === 'liability' && (() => {
      const regimeData = activeModal.regime === 'old' ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime
      const slabTaxTotal = (regimeData?.slabBreakdown ?? []).reduce((sum, s) => sum + Number(s.tax ?? 0), 0)
      const specialRows = regimeData?.specialRateTaxBreakdown ?? []
      const explicitSpecial = Number(regimeData?.specialRateTax ?? 0)
      const computedSpecial = specialRows.reduce((sum, r) => sum + Number(r.tax ?? 0), 0)
      const specialTaxTotal = explicitSpecial || computedSpecial

      const taxBeforeRebate = slabTaxTotal + specialTaxTotal
      const rebate = Number(regimeData?.rebate87a ?? 0)
      const cess = Number(regimeData?.healthEducationCess ?? 0)
      const surcharge = Number(regimeData?.surcharge ?? 0)
      const total = taxBeforeRebate - rebate + cess + surcharge
      const sb = regimeData?.surchargeBreakdown
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Tax Liability — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {taxBeforeRebate !== 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Tax Before Rebate (Slab + Special)</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(taxBeforeRebate)}</span>
                </div>
              )}
              {(slabTaxTotal !== 0 || specialTaxTotal !== 0) && (
                <div className="pl-3 -mt-1">
                  {slabTaxTotal !== 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-xs text-gray-500">Slab tax</span>
                      <span className="text-xs text-gray-700 font-medium">{formatCurrency(slabTaxTotal)}</span>
                    </div>
                  )}
                  {specialTaxTotal !== 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-xs text-gray-500">Special-rate tax</span>
                      <span className="text-xs text-gray-700 font-medium">{formatCurrency(specialTaxTotal)}</span>
                    </div>
                  )}
                </div>
              )}
              {rebate !== 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Less: Rebate u/s 87A</span>
                  <span className="font-semibold text-green-600">({formatCurrency(rebate)})</span>
                </div>
              )}
              {cess !== 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Add: Health &amp; Education Cess</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(cess)}</span>
                </div>
              )}
              {surcharge !== 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-700">Add: Surcharge</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(surcharge)}</span>
                </div>
              )}
              {surcharge !== 0 && sb && (
                <div className="pl-3 -mt-1">
                  <div className="flex justify-between py-1">
                    <span className="text-xs text-gray-500">Surcharge rate</span>
                    <span className="text-xs text-gray-700 font-medium">{sb.rate}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-xs text-gray-500">Surcharge (before relief)</span>
                    <span className="text-xs text-gray-700 font-medium">{formatCurrency(Number(sb.surchargeBeforeRelief))}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-xs text-gray-500">Marginal relief</span>
                    <span className="text-xs text-gray-700 font-medium">({formatCurrency(Number(sb.marginalRelief))})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-xs text-gray-500">Net surcharge</span>
                    <span className="text-xs text-gray-700 font-medium">{formatCurrency(Number(sb.netSurcharge))}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between py-3 font-bold text-base border-t-2 border-red-200">
                <span className="text-gray-900">Total Tax Liability</span>
                <span className="text-red-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )
    })()}

    {/* Taxes Paid Modal */}
    {activeModal?.type === 'taxes' && (() => {
      const regimeData = activeModal.regime === 'old' ? taxSummaryData?.oldRegime : taxSummaryData?.newRegime
      const tds = Number(regimeData?.tds ?? 0)
      const tcs = Number(regimeData?.tcs ?? 0)
      const advanceTax = Number(regimeData?.advanceTax ?? 0)
      const total = Number(regimeData?.totalTaxesPaid ?? (tds + tcs + advanceTax))
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                Taxes Paid — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-700">TDS (Tax Deducted at Source)</span>
                <span className="font-semibold text-orange-600">{formatCurrency(tds)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-700">TCS (Tax Collected at Source)</span>
                <span className="font-semibold text-orange-600">{formatCurrency(tcs)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-700">Advance Tax / Self-Assessment Tax</span>
                <span className="font-semibold text-orange-600">{formatCurrency(advanceTax)}</span>
              </div>
              <div className="flex justify-between py-3 font-bold text-base">
                <span className="text-gray-900">Total Taxes Paid</span>
                <span className="text-blue-700">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )
    })()}

    {/* Chapter VIA Deductions Modal */}
    {activeModal?.type === 'deductions' && (() => {
      const chapterVIA = activeModal.regime === 'old' ? filing.chapterVIADeductionsOld : filing.chapterVIADeductionsNew
      const deductionRows = getDeductionRows(chapterVIA)
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Chapter VI-A Deductions — {activeModal.regime === 'old' ? 'Old' : 'New'} Regime</h2>
              <button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {deductionRows.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No deductions claimed.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                      <th className="text-left py-2 px-3 rounded-l">Section</th>
                      <th className="text-right py-2 px-3">Claimed</th>
                      <th className="text-right py-2 px-3">Max Allowed</th>
                      <th className="text-right py-2 px-3 rounded-r">Allowed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductionRows.map(row => (
                      <tr key={row.key} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-700">{row.label}</td>
                        <td className="py-2.5 px-3 text-right text-gray-800">{formatCurrency(row.claimed)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-500">{row.maxAllowed > 0 ? formatCurrency(row.maxAllowed) : '–'}</td>
                        <td className={`py-2.5 px-3 text-right font-semibold ${row.allowed < row.claimed ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(row.allowed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 font-semibold">
                      <td className="py-2.5 px-3 text-gray-900">Total</td>
                      <td className="py-2.5 px-3 text-right text-gray-800">{formatCurrency(deductionRows.reduce((s, r) => s + r.claimed, 0))}</td>
                      <td className="py-2.5 px-3"></td>
                      <td className="py-2.5 px-3 text-right text-blue-700">{formatCurrency(deductionRows.reduce((s, r) => s + r.allowed, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )
    })()}

    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Tax Computation</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            AY {filing.assessmentYear ?? 'N/A'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Back to ITR Filing
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-7xl mx-auto pt-6 px-6">
          <div className="space-y-6">
            {/* Side by Side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderRegimeCard('old')}
              {renderRegimeCard('new')}
            </div>

            {/* Key Differences */}
            {(() => {
              const oldDeductions = taxSummaryData?.oldRegime?.totalDeductions ?? 0
              const newDeductions = taxSummaryData?.newRegime?.totalDeductions ?? 0
              const oldTax = taxSummaryData?.oldRegime?.totalTaxLiability ?? 0
              const newTax = taxSummaryData?.newRegime?.totalTaxLiability ?? 0
              const taxSavings = Math.abs(oldTax - newTax)
              const current = taxSummaryData?.currentRegime?.regime
              const betterRegime = current === 'new' ? 'New' : current === 'old' ? 'Old' : '—'
              const isNewBetter = current === 'new'

              return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shrink-0">
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Key Differences</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 mb-0.5">Deductions Difference</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(Math.abs(oldDeductions - newDeductions))}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {oldDeductions > newDeductions ? 'Old regime has more deductions' : 'New regime has more deductions'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 mb-0.5">Tax Savings</p>
                      <p className={`text-lg font-bold ${isNewBetter ? 'text-green-600' : 'text-blue-600'}`}>
                        {formatCurrency(taxSavings)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {betterRegime} regime saves more
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600 mb-0.5">Recommended</p>
                      <p className={`text-lg font-bold ${isNewBetter ? 'text-green-600' : 'text-blue-600'}`}>
                        {betterRegime} Regime
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Save {formatCurrency(taxSavings)} with {betterRegime} regime
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
