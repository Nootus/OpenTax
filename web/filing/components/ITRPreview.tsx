'use client'

import Image from 'next/image'
import type { ITR1Model } from '@/filing/models/itr1-model'

// ─── Helpers ─────────────────────────────────────────────

const fc = (v: number | null | undefined): string => '₹' + Math.round(Number(v) || 0).toLocaleString('en-IN')
const safe = (v: unknown): string => {
  if (v == null) return '—'
  if (typeof v === 'object') return '—'
  return String(v)
}
const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return String(d) }
}

// ─── Sub-Components ──────────────────────────────────────

function SectionHeader({ title, partLabel }: { title: string; partLabel?: string }) {
  return (
    <div className="bg-blue-800 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 print:bg-blue-800">
      {partLabel && <span className="bg-white text-blue-800 px-2 py-0.5 rounded text-xs font-bold">{partLabel}</span>}
      {title}
    </div>
  )
}

function Row({ label, value, indent, highlight, bold }: {
  label: string; value?: string | number | null; indent?: boolean; highlight?: boolean; bold?: boolean
}) {
  const displayVal = typeof value === 'number' ? fc(value) : (value ?? '—')
  return (
    <div className={`flex items-center border-b border-gray-200 text-sm ${highlight ? 'bg-blue-50' : ''} ${indent ? 'pl-8' : ''}`}>
      <div className={`flex-1 px-3 py-1.5 ${bold ? 'font-semibold' : ''}`}>{label}</div>
      <div className={`w-56 text-right px-3 py-1.5 border-l border-gray-200 font-mono text-sm ${bold ? 'font-bold' : ''}`}>
        {displayVal}
      </div>
    </div>
  )
}

function SubHeader({ label }: { label: string }) {
  return <div className="bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200">{label}</div>
}

function DeductionRow({ label, claimed, eligible }: { label: string; claimed: number; eligible: number }) {
  if (claimed === 0 && eligible === 0) return null
  return (
    <div className="flex items-center border-b border-gray-200 text-sm">
      <div className="flex-1 px-3 py-1.5">{label}</div>
      <div className="w-28 text-right px-3 py-1.5 border-l border-gray-200 font-mono text-sm text-gray-600">{fc(claimed)}</div>
      <div className={`w-28 text-right px-3 py-1.5 border-l border-gray-200 font-mono text-sm font-semibold ${eligible < claimed ? 'text-orange-600' : 'text-green-700'}`}>{fc(eligible)}</div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

interface ITRPreviewProps {
  itr1: ITR1Model
  onClose: () => void
}

export default function ITRPreview({ itr1, onClose }: ITRPreviewProps) {
  const pi = itr1.PersonalInfo
  const addr = pi.Address
  const inc = itr1.ITR1_IncomeDeductions
  const tax = itr1.ITR1_TaxComputation
  const paid = itr1.TaxPaid
  const refund = itr1.Refund
  const filing = itr1.FilingStatus

  const name = [pi.AssesseeName.FirstName, pi.AssesseeName.MiddleName, pi.AssesseeName.SurNameOrOrgName].filter(Boolean).join(' ') || '—'
  const isOldRegime = filing.OptOutNewTaxRegime === 'Y'

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          {/* Left — logo + name */}
          <div className="flex items-center gap-3">
            <Image src="/ITAI-logo.png" alt="OpenTax" width={32} height={32} className="rounded-lg" />
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">OpenTax</h1>
              <p className="text-[10px] text-gray-400 leading-tight">Free &amp; Open-Source ITR Filing</p>
            </div>
          </div>
          {/* Right — powered by */}
          <a
            href="https://indiatax.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity"
          >
            <Image src="/logo.webp" alt="IndiaTax.AI" width={24} height={24} className="rounded" />
            <span className="text-xs text-gray-500 hidden sm:inline">Powered by <span className="font-semibold text-blue-600">IndiaTax.AI</span></span>
          </a>
        </div>
        {/* Sub-bar — back, title, regime, download */}
        <div className="border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-white hover:bg-gray-100 text-gray-700 transition-colors border border-gray-300 shadow-sm">← Back</button>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-bold text-gray-800">ITR‑1 SAHAJ — Preview</span>
              <span className="text-xs text-gray-500 hidden sm:inline">AY {itr1.Form_ITR1.AssessmentYear}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${isOldRegime ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                {isOldRegime ? 'Old Regime' : 'New Regime'}
              </span>
            </div>
            <button
              onClick={() => {
                const json = JSON.stringify(itr1, null, 2)
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `ITR1_${itr1.Form_ITR1?.AssessmentYear ?? 'AY'}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
              className="flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg border border-green-400 text-green-700 bg-green-50 hover:bg-green-100 transition-colors shadow-sm"
            >
              ⬇ Download JSON
            </button>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-0 print:py-0 print:px-0">
        {/* ═══════════════════════════════════════════════════════
            FORM HEADER
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-300 rounded-t-lg overflow-hidden">
          <div className="bg-blue-900 text-white text-center py-3 px-4">
            <h2 className="text-base font-bold">INDIAN INCOME TAX RETURN</h2>
            <p className="text-xs mt-0.5 opacity-90">
              [For individuals being a resident (other than not ordinarily resident) having total income upto ₹50 lakh,
              having Income from Salaries, one house property, other sources (Interest etc.), and agricultural income upto ₹5000]
            </p>
            <p className="text-xs mt-0.5 font-semibold">FORM ITR-1 SAHAJ</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-gray-300 text-sm">
            <div className="px-3 py-2 border-r border-gray-200">
              <p className="text-xs text-gray-500">Assessment Year</p>
              <p className="font-semibold">{itr1.Form_ITR1.AssessmentYear || '—'}</p>
            </div>
            <div className="px-3 py-2 border-r border-gray-200">
              <p className="text-xs text-gray-500">PAN</p>
              <p className="font-semibold font-mono">{pi.PAN || '—'}</p>
            </div>
            <div className="px-3 py-2 border-r border-gray-200">
              <p className="text-xs text-gray-500">Aadhaar Number</p>
              <p className="font-semibold font-mono">{pi.AadhaarCardNo ? `XXXX XXXX ${String(pi.AadhaarCardNo).slice(-4)}` : '—'}</p>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-semibold">{name}</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART A — GENERAL INFORMATION
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="GENERAL INFORMATION" partLabel="Part A" />

          <SubHeader label="Personal Details" />
          <Row label="First Name" value={safe(pi.AssesseeName.FirstName)} />
          <Row label="Middle Name" value={safe(pi.AssesseeName.MiddleName)} />
          <Row label="Last Name / Surname" value={safe(pi.AssesseeName.SurNameOrOrgName)} />
          <Row label="Date of Birth" value={fmtDate(pi.DOB)} />
          <Row label="PAN" value={safe(pi.PAN)} />
          <Row label="Aadhaar Number" value={safe(pi.AadhaarCardNo)} />
          <Row label="Employer Category" value={safe(pi.EmployerCategory)} />
          <Row label="Email" value={safe(addr.EmailAddress)} />
          <Row label="Mobile" value={addr.MobileNo ? `+${addr.CountryCodeMobile}-${addr.MobileNo}` : '—'} />

          <SubHeader label="Address" />
          <Row label="Flat/Door/Block No." value={safe(addr.ResidenceNo)} />
          <Row label="Name of Premises/Building" value={safe(addr.ResidenceName)} />
          <Row label="Road/Street" value={safe(addr.RoadOrStreet)} />
          <Row label="Area/Locality" value={safe(addr.LocalityOrArea)} />
          <Row label="Town/City/District" value={safe(addr.CityOrTownOrDistrict)} />
          <Row label="State" value={safe(addr.StateCode)} />
          <Row label="Country" value={safe(addr.CountryCode)} />
          <Row label="Pin Code" value={safe(addr.PinCode)} />

          <SubHeader label="Filing Status" />
          <Row label="Return Filed u/s" value={safe(filing.ReturnFileSec)} />
          <Row label="Opted Out of New Regime" value={filing.OptOutNewTaxRegime === 'Y' ? 'Yes' : 'No'} />
          <Row label="ITR Filing Due Date" value={fmtDate(filing.ItrFilingDueDate)} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART B — GROSS TOTAL INCOME
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="GROSS TOTAL INCOME" partLabel="Part B" />

          {/* B1 — Salary */}
          <SubHeader label="B1 — Income from Salary / Pension" />
          <Row label="Gross Salary" value={inc.GrossSalary} />
          {inc.Salary != null && <Row label="  (i) Salary" value={inc.Salary} indent />}
          {inc.PerquisitesValue != null && <Row label="  (ii) Value of Perquisites" value={inc.PerquisitesValue} indent />}
          {inc.ProfitsInSalary != null && <Row label="  (iii) Profits in Lieu of Salary" value={inc.ProfitsInSalary} indent />}
          {inc.AllwncExemptUs10 && inc.AllwncExemptUs10.TotalAllwncExemptUs10 > 0 && (
            <Row label="Less: Allowances Exempt u/s 10" value={inc.AllwncExemptUs10.TotalAllwncExemptUs10} indent />
          )}
          <Row label="Net Salary" value={inc.NetSalary} />
          <Row label="Deductions u/s 16" value={inc.DeductionUs16} />
          {inc.DeductionUs16ia != null && <Row label="  (ia) Standard Deduction" value={inc.DeductionUs16ia} indent />}
          {inc.EntertainmentAlw16ii != null && <Row label="  (ii) Entertainment Allowance" value={inc.EntertainmentAlw16ii} indent />}
          {inc.ProfessionalTaxUs16iii != null && <Row label="  (iii) Professional Tax" value={inc.ProfessionalTaxUs16iii} indent />}
          <Row label="Income from Salary" value={inc.IncomeFromSal} bold highlight />

          {/* B2 — House Property */}
          <SubHeader label="B2 — Income from House Property" />
          {inc.GrossRentReceived != null && <Row label="Gross Rent Received" value={inc.GrossRentReceived} />}
          {inc.TaxPaidlocalAuth != null && <Row label="Tax Paid to Local Authority" value={inc.TaxPaidlocalAuth} />}
          <Row label="Annual Value" value={inc.AnnualValue} />
          <Row label="Standard Deduction (30%)" value={inc.StandardDeduction} />
          {inc.InterestPayable != null && <Row label="Interest on Housing Loan" value={inc.InterestPayable} />}
          <Row label="Total Income from House Property" value={inc.TotalIncomeOfHP} bold highlight />

          {/* B3 — Other Sources */}
          <SubHeader label="B3 — Income from Other Sources" />
          {inc.OthersInc?.OthersIncDtlsOthSrc?.map((src, idx) => (
            <Row key={idx} label={src.OthSrcNatureDesc || `Other Source ${idx + 1}`} value={src.OthSrcOthAmount} indent />
          ))}
          <Row label="Total Income from Other Sources" value={inc.IncomeOthSrc} bold highlight />

          {/* Gross Total */}
          <div className="bg-blue-50 border-t-2 border-blue-200">
            <Row label="GROSS TOTAL INCOME" value={inc.GrossTotIncome} bold highlight />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART C — DEDUCTIONS UNDER CHAPTER VI-A
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="DEDUCTIONS UNDER CHAPTER VI-A" partLabel="Part C" />
          {(() => {
            const d = inc.DeductUndChapVIA
            const u = inc.UsrDeductUndChapVIA
            return (
              <>
                {/* Column headers */}
                <div className="flex items-center border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wide">
                  <div className="flex-1 px-3 py-1.5">Section</div>
                  <div className="w-28 text-right px-3 py-1.5 border-l border-gray-200">Claimed</div>
                  <div className="w-28 text-right px-3 py-1.5 border-l border-gray-200">Eligible</div>
                </div>
                <DeductionRow label="Section 80C — Life Insurance, PPF, ELSS, etc." claimed={u.Section80C} eligible={d.Section80C} />
                <DeductionRow label="Section 80CCC — Pension Fund" claimed={u.Section80CCC} eligible={d.Section80CCC} />
                <DeductionRow label="Section 80CCD(1) — Employee NPS" claimed={u.Section80CCDEmployeeOrSE} eligible={d.Section80CCDEmployeeOrSE} />
                <DeductionRow label="Section 80CCD(1B) — Additional NPS" claimed={u.Section80CCD1B} eligible={d.Section80CCD1B} />
                <DeductionRow label="Section 80CCD(2) — Employer NPS" claimed={u.Section80CCDEmployer} eligible={d.Section80CCDEmployer} />
                <DeductionRow label="Section 80D — Health Insurance" claimed={u.Section80D} eligible={d.Section80D} />
                <DeductionRow label="Section 80DD — Disabled Dependent" claimed={u.Section80DD} eligible={d.Section80DD} />
                <DeductionRow label="Section 80DDB — Medical Treatment" claimed={u.Section80DDB} eligible={d.Section80DDB} />
                <DeductionRow label="Section 80E — Education Loan Interest" claimed={u.Section80E} eligible={d.Section80E} />
                <DeductionRow label="Section 80EE — Home Loan Interest" claimed={u.Section80EE} eligible={d.Section80EE} />
                <DeductionRow label="Section 80EEA — Affordable Housing" claimed={u.Section80EEA} eligible={d.Section80EEA} />
                <DeductionRow label="Section 80EEB — Electric Vehicle Loan" claimed={u.Section80EEB} eligible={d.Section80EEB} />
                <DeductionRow label="Section 80G — Donations" claimed={u.Section80G} eligible={d.Section80G} />
                <DeductionRow label="Section 80GG — Rent Paid" claimed={u.Section80GG} eligible={d.Section80GG} />
                <DeductionRow label="Section 80GGA — Scientific Research" claimed={u.Section80GGA} eligible={d.Section80GGA} />
                <DeductionRow label="Section 80GGC — Political Contributions" claimed={u.Section80GGC} eligible={d.Section80GGC} />
                <DeductionRow label="Section 80U — Self Disability" claimed={u.Section80U} eligible={d.Section80U} />
                <DeductionRow label="Section 80TTA — Savings Interest" claimed={u.Section80TTA} eligible={d.Section80TTA} />
                <DeductionRow label="Section 80TTB — Sr. Citizen Interest" claimed={u.Section80TTB} eligible={d.Section80TTB} />
                <DeductionRow label="Section 80CCH — Agnipath Contribution" claimed={u.AnyOthSec80CCH} eligible={d.AnyOthSec80CCH} />
                <div className="bg-blue-50 border-t-2 border-blue-200">
                  <div className="flex items-center text-sm font-bold">
                    <div className="flex-1 px-3 py-1.5">TOTAL DEDUCTIONS UNDER CHAPTER VI-A</div>
                    <div className="w-28 text-right px-3 py-1.5 border-l border-gray-200 font-mono">{fc(u.TotalChapVIADeductions)}</div>
                    <div className="w-28 text-right px-3 py-1.5 border-l border-gray-200 font-mono text-blue-700">{fc(d.TotalChapVIADeductions)}</div>
                  </div>
                </div>
              </>
            )
          })()}
        </div>

        {/* ═══════════════════════════════════════════════════════
            TOTAL INCOME
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <div className="bg-green-50 border-t-2 border-green-200">
            <Row label="TOTAL TAXABLE INCOME" value={inc.TotalIncome} bold highlight />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART D — TAX COMPUTATION
           ═══════════════════════════════════════════════════════ */}
        {tax && (
          <div className="bg-white border-x border-b border-gray-300">
            <SectionHeader title="COMPUTATION OF TAX LIABILITY" partLabel="Part D" />
            <Row label="Tax Payable on Total Income" value={tax.TotalTaxPayable} />
            <Row label="Rebate u/s 87A" value={tax.Rebate87A} />
            <Row label="Tax Payable after Rebate" value={tax.TaxPayableOnRebate} />
            <Row label="Health & Education Cess (4%)" value={tax.EducationCess} />
            <Row label="Gross Tax Liability" value={tax.GrossTaxLiability} bold />
            {tax.Section89 > 0 && <Row label="Relief u/s 89" value={tax.Section89} />}
            <Row label="Net Tax Liability" value={tax.NetTaxLiability} bold highlight />
            {tax.TotalIntrstPay > 0 && (
              <>
                <SubHeader label="Interest & Fees" />
                {tax.IntrstPay.IntrstPayUs234A > 0 && <Row label="Interest u/s 234A" value={tax.IntrstPay.IntrstPayUs234A} indent />}
                {tax.IntrstPay.IntrstPayUs234B > 0 && <Row label="Interest u/s 234B" value={tax.IntrstPay.IntrstPayUs234B} indent />}
                {tax.IntrstPay.IntrstPayUs234C > 0 && <Row label="Interest u/s 234C" value={tax.IntrstPay.IntrstPayUs234C} indent />}
                {tax.IntrstPay.LateFilingFee234F > 0 && <Row label="Late Filing Fee u/s 234F" value={tax.IntrstPay.LateFilingFee234F} indent />}
                <Row label="Total Interest Payable" value={tax.TotalIntrstPay} bold />
              </>
            )}
            <div className="bg-orange-50 border-t-2 border-orange-200">
              <Row label="TOTAL TAX + INTEREST" value={tax.TotTaxPlusIntrstPay} bold highlight />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            PART E — TAX PAYMENTS & VERIFICATION
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="TAX PAYMENTS" partLabel="Part E" />

          {/* TDS on Salary */}
          {itr1.TDSonSalaries?.TDSonSalary && itr1.TDSonSalaries.TDSonSalary.length > 0 && (
            <>
              <SubHeader label="TDS on Salary" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Employer Name</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">TAN</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">Income</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">TDS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itr1.TDSonSalaries.TDSonSalary.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5">{t.EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.EmployerOrDeductorOrCollectDetl.TAN}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.IncChrgSal)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.TotalTDSSal)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="px-3 py-1.5 text-right">Total TDS on Salary</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(itr1.TDSonSalaries.TotalTDSonSalaries)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TDS on Other Than Salary */}
          {itr1.TDSonOthThanSals?.TDSonOthThanSal && itr1.TDSonOthThanSals.TDSonOthThanSal.length > 0 && (
            <>
              <SubHeader label="TDS on Other Than Salary" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Deductor Name</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">TAN</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">Amount</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">TDS Claimed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itr1.TDSonOthThanSals.TDSonOthThanSal.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5">{t.EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.EmployerOrDeductorOrCollectDetl.TAN}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.AmtForTaxDeduct)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.ClaimOutOfTotTDSOnAmtPaid)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="px-3 py-1.5 text-right">Total TDS on Other</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(itr1.TDSonOthThanSals.TotalTDSonOthThanSals)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TCS */}
          {itr1.ScheduleTCS?.TCS && itr1.ScheduleTCS.TCS.length > 0 && (
            <>
              <SubHeader label="Tax Collected at Source (TCS)" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Collector Name</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">TAN</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">Tax Collected</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">Claimed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itr1.ScheduleTCS.TCS.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5">{t.EmployerOrDeductorOrCollectDetl.EmployerOrDeductorOrCollecterName}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.EmployerOrDeductorOrCollectDetl.TAN}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.TotalTCS)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.AmtTCSClaimedThisYear)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="px-3 py-1.5 text-right">Total TCS</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(itr1.ScheduleTCS.TotalSchTCS)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Advance Tax / Self-Assessment Tax */}
          {itr1.TaxPayments?.TaxPayment && itr1.TaxPayments.TaxPayment.length > 0 && (
            <>
              <SubHeader label="Advance Tax / Self-Assessment Tax" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">BSR Code</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Date</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Challan No.</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itr1.TaxPayments.TaxPayment.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.BSRCode}</td>
                        <td className="px-3 py-1.5">{fmtDate(t.DateDep)}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.SrlNoOfChaln}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.Amt)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="px-3 py-1.5 text-right">Total Advance/Self-Assessment Tax</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(itr1.TaxPayments.TotalTaxPayments)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <SubHeader label="Tax Summary" />
          <Row label="Advance Tax" value={paid.TaxesPaid.AdvanceTax} />
          <Row label="TDS" value={paid.TaxesPaid.TDS} />
          <Row label="TCS" value={paid.TaxesPaid.TCS} />
          <Row label="Self Assessment Tax" value={paid.TaxesPaid.SelfAssessmentTax} />
          <div className="bg-blue-50 border-t-2 border-blue-200">
            <Row label="TOTAL TAXES PAID" value={paid.TaxesPaid.TotalTaxesPaid} bold highlight />
          </div>

          {/* Balance Tax / Refund */}
          {paid.BalTaxPayable > 0 ? (
            <div className="bg-red-50 border-t-2 border-red-200">
              <Row label="BALANCE TAX PAYABLE" value={paid.BalTaxPayable} bold highlight />
            </div>
          ) : refund.RefundDue > 0 ? (
            <div className="bg-green-50 border-t-2 border-green-200">
              <Row label="REFUND DUE" value={refund.RefundDue} bold highlight />
            </div>
          ) : null}
        </div>

        {/* ═══════════════════════════════════════════════════════
            BANK ACCOUNT DETAILS
           ═══════════════════════════════════════════════════════ */}
        {refund.BankAccountDtls.AddtnlBankDetails && refund.BankAccountDtls.AddtnlBankDetails.length > 0 && (
          <div className="bg-white border-x border-b border-gray-300 rounded-b-lg overflow-hidden">
            <SectionHeader title="BANK ACCOUNT DETAILS" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">Bank Name</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">IFSC</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">Account Number</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">Type</th>
                    <th className="text-center px-3 py-1.5 border-b border-gray-200">Refund A/c</th>
                  </tr>
                </thead>
                <tbody>
                  {refund.BankAccountDtls.AddtnlBankDetails.map((b, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{b.BankName || '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{b.IFSCCode || '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{b.BankAccountNo || '—'}</td>
                      <td className="px-3 py-1.5">{b.AccountType}</td>
                      <td className="px-3 py-1.5 text-center">{b.UseForRefund === 'true' ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            VERIFICATION
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300 rounded-b-lg overflow-hidden">
          <SectionHeader title="VERIFICATION" />
          <Row label="Name" value={safe(itr1.Verification.Declaration.AssesseeVerName)} />
          <Row label="Father&apos;s Name" value={safe(itr1.Verification.Declaration.FatherName)} />
          <Row label="PAN" value={safe(itr1.Verification.Declaration.AssesseeVerPAN)} />
          <Row label="Capacity" value={itr1.Verification.Capacity === 'S' ? 'Self' : 'Representative'} />
          <Row label="Place" value={safe(itr1.Verification.Place)} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            EXEMPT INCOME
           ═══════════════════════════════════════════════════════ */}
        {inc.ExemptIncAgriOthUs10 && inc.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total > 0 && (
          <div className="bg-white border-x border-b border-gray-300">
            <SectionHeader title="EXEMPT INCOME (Agricultural & Others u/s 10)" />
            {inc.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Dtls?.map((d, i) => (
              <Row key={i} label={d.NatureDesc || `Exempt Income ${i + 1}`} value={d.OthAmount} />
            ))}
            <div className="bg-blue-50 border-t-2 border-blue-200">
              <Row label="Total Exempt Income" value={inc.ExemptIncAgriOthUs10.ExemptIncAgriOthUs10Total} bold highlight />
            </div>
          </div>
        )}

        {/* Schedule 80G — Donations */}
        {itr1.Schedule80G && itr1.Schedule80G.TotalDonationsUs80G > 0 && (
          <div className="bg-white border-x border-b border-gray-300">
            <SectionHeader title="SCHEDULE 80G — DONATIONS" />
            {itr1.Schedule80G.Don100Percent?.DoneeWithPan?.map((d, i) => (
              <Row key={`100-${i}`} label={`${d.DoneeWithPanName} (100%)`} value={d.EligibleDonationAmt} />
            ))}
            {itr1.Schedule80G.Don50PercentNoApprReqd?.DoneeWithPan?.map((d, i) => (
              <Row key={`50na-${i}`} label={`${d.DoneeWithPanName} (50% No Appr)`} value={d.EligibleDonationAmt} />
            ))}
            {itr1.Schedule80G.Don100PercentApprReqd?.DoneeWithPan?.map((d, i) => (
              <Row key={`100a-${i}`} label={`${d.DoneeWithPanName} (100% Appr)`} value={d.EligibleDonationAmt} />
            ))}
            {itr1.Schedule80G.Don50PercentApprReqd?.DoneeWithPan?.map((d, i) => (
              <Row key={`50a-${i}`} label={`${d.DoneeWithPanName} (50% Appr)`} value={d.EligibleDonationAmt} />
            ))}
            <div className="bg-blue-50 border-t-2 border-blue-200">
              <Row label="Total Eligible Donations u/s 80G" value={itr1.Schedule80G.TotalEligibleDonationsUs80G} bold highlight />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
