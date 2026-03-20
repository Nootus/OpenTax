'use client'

import { useFilingContext } from '@/filing/context/FilingContext'
import { STATES, COUNTRIES, ACCOUNT_TYPES, PROPERTY_TYPES, EMPLOYER_TYPES, LENDER_TYPES, DEDUCTION_80C_TYPES, DISABILITY_TYPES, DONATION_TYPES, DISEASES_80DDB } from '@/utils/master-data'

// ─── Helpers ─────────────────────────────────────────────

const fc = (v: any): string => '₹' + Math.round(Number(v) || 0).toLocaleString('en-IN')
const safe = (v: any): string => {
  if (v == null) return '—'
  if (typeof v === 'object') return '—'
  return String(v)
}
const fmtDate = (d: string | Date | null | undefined): string => {
  if (!d) return '—'
  try {
    const dt = d instanceof Date ? d : new Date(d)
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return String(d) }
}

const lookupLabel = (list: { value: string; label: string }[], val: string | null | undefined): string => {
  if (!val) return '—'
  return list.find(o => o.value === val)?.label ?? val
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
  label: string; value?: string | number; indent?: boolean; highlight?: boolean; bold?: boolean
}) {
  const displayVal = typeof value === 'number' ? fc(value) : (value ?? '—')
  return (
    <div className={`flex items-center border-b border-gray-200 text-sm ${highlight ? 'bg-blue-50' : ''} ${indent ? 'pl-8' : ''}`}>
      <div className={`flex-1 px-3 py-1.5 ${bold ? 'font-semibold' : ''}`}>{label}</div>
      <div className={`w-48 text-right px-3 py-1.5 border-l border-gray-200 font-mono text-sm ${bold ? 'font-bold' : ''}`}>
        {displayVal}
      </div>
    </div>
  )
}

function SubHeader({ label }: { label: string }) {
  return <div className="bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide border-b border-gray-200">{label}</div>
}

// ─── Main Component ──────────────────────────────────────

interface ITRPreviewProps {
  onClose: () => void
}

export default function ITRPreview({ onClose }: ITRPreviewProps) {
  const { filing } = useFilingContext()

  const person = filing.person
  const address = filing.personAddress
  const name = [person?.firstName, person?.middleName, person?.lastName].filter(Boolean).join(' ') || '—'

  // ── Income helpers ──
  const getGrossSalary = (sal: any) =>
    (sal.salarySection171?.reduce((t: number, c: any) => t + (Number(c.amount) || 0), 0) ?? 0) +
    (sal.salarySection172?.reduce((t: number, c: any) => t + (Number(c.amount) || 0), 0) ?? 0) +
    (sal.salarySection173?.reduce((t: number, c: any) => t + (Number(c.amount) || 0), 0) ?? 0)
  const getStdDeduction = (sal: any) => Number(sal.salaryDeduction16?.standardDeduction) || 0
  const getProfTax = (sal: any) => Number(sal.salaryDeduction16?.professionalTax) || 0
  const getNetSalary = (sal: any) => getGrossSalary(sal) - getStdDeduction(sal) - getProfTax(sal)

  const getNetHP = (prop: any) => {
    const rent = Number(prop.property?.annualRentReceived) || 0
    const tax = Number(prop.property?.municipalTaxesPaid) || 0
    const interest = Number(prop.propertyLoan?.interestPaid) || 0
    const nav = rent - tax
    const stdDed = Math.round(nav * 0.30)
    return nav - stdDed - interest
  }

  // ── Income Calculations ──
  const salaryIncome = filing.salary?.reduce((s, e) => s + getNetSalary(e), 0) ?? 0
  const housePropertyIncome = filing.houseProperty?.reduce((s, p) => s + getNetHP(p), 0) ?? 0
  const interestIncome = filing.interestIncome?.reduce((s, i) => s + (Number(i.amount) || 0), 0) ?? 0
  const dividendIncome = (filing.dividendIncome as any)?.totalDividendAmount || 0
  const grossTotalIncome = salaryIncome + housePropertyIncome + interestIncome + dividendIncome

  // ── Deduction Calculations ──
  const section80C = filing.section80C?.reduce((s, i) => s + (i.amount || 0), 0) ?? 0
  const nps80Ccc = filing.section80Ccc?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0
  const nps80Ccd1 = filing.section80Ccd1?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0
  const nps80Ccd1B = filing.section80Ccd1B?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0
  const nps80Ccd2 = filing.section80Ccd2?.reduce((s, i) => s + ((i as any).amount || 0), 0) ?? 0
  const npsTotal = nps80Ccc + nps80Ccd1 + nps80Ccd1B + nps80Ccd2

  const section80D = ((filing.section80D as any)?.healthInsurance?.reduce((s: number, i: any) => s + (i.healthInsurancePremium || 0), 0) ?? 0) +
    ((filing.section80D as any)?.preventiveCheckup?.reduce((s: number, i: any) => s + (i.checkupAmount || 0), 0) ?? 0) +
    ((filing.section80D as any)?.medicalExpenditure?.reduce((s: number, i: any) => s + (i.expenditureAmount || 0), 0) ?? 0)
  const section80DD = (filing.section80Dd as any)?.expenditureIncurred || 0
  const section80DDB = (filing.section80Ddb as any)?.expenditureIncurred || 0
  const section80U = (filing.section80U as any)?.expenditureIncurred || 0
  const medicalTotal = section80D + section80DD + section80DDB + section80U

  const loansE = filing.section80E?.reduce((s, i) => s + ((i as any).interestOnLoan || 0), 0) ?? 0
  const loanEE = (filing.section80Ee as any)?.interestOnLoan || 0
  const loanEEA = (filing.section80Eea as any)?.interestOnLoan || 0
  const loanEEB = (filing.section80Eeb as any)?.interestOnLoan || 0
  const loanTotal = loansE + loanEE + loanEEA + loanEEB

  const donations80G = filing.section80G?.reduce((s, i) => s + ((i as any).donationAmount || 0), 0) ?? 0
  const donations80GGA = filing.section80Gga?.reduce((s, i) => s + ((i as any).totalDonationAmount || 0), 0) ?? 0
  const donations80GGC = filing.section80Ggc?.reduce((s, i) => s + ((i as any).totalContribution || 0), 0) ?? 0
  const donationTotal = donations80G + donations80GGA + donations80GGC

  const otherTTA = (filing.section80Tta as any)?.interestAmount || 0
  const otherTTB = (filing.section80Ttb as any)?.interestAmount || 0
  const otherCCH = (filing.section80Cch as any)?.contributionAmount || 0
  const otherGG = (filing.section80Gg as any)?.rentPaidAmount || 0
  const otherTotal = otherTTA + otherTTB + otherCCH + otherGG
  const totalDeductions = section80C + npsTotal + medicalTotal + loanTotal + donationTotal + otherTotal

  // ── Tax Credits ──
  const tdsTotal = filing.tds?.reduce((s, e) => s + (e.taxDeducted || 0), 0) ?? 0
  const tcsTotal = filing.tcs?.reduce((s, e) => s + (e.taxCollected || 0), 0) ?? 0
  const advanceTaxTotal = filing.advanceTax?.reduce((s, e) => s + (e.taxPaidAmount || 0), 0) ?? 0
  const totalTaxesPaid = tdsTotal + tcsTotal + advanceTaxTotal

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-300 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors text-lg">← Back</button>
            <h1 className="text-lg font-bold text-gray-800">ITR‑1 SAHAJ — Preview</h1>
            <span className="text-xs text-gray-500">Assessment Year {filing.assessmentYear}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${filing.regime === 'old' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {filing.regime === 'old' ? 'Old Tax Regime' : 'New Tax Regime'}
            </span>
            <button onClick={() => window.print()} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              🖨 Print
            </button>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-0 print:py-0 print:px-0">
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
              <p className="font-semibold">{filing.assessmentYear || '—'}</p>
            </div>
            <div className="px-3 py-2 border-r border-gray-200">
              <p className="text-xs text-gray-500">PAN</p>
              <p className="font-semibold font-mono">{person?.panNumber || '—'}</p>
            </div>
            <div className="px-3 py-2 border-r border-gray-200">
              <p className="text-xs text-gray-500">Aadhaar Number</p>
              <p className="font-semibold font-mono">{person?.aadhaarNumber ? `XXXX XXXX ${String(person.aadhaarNumber).slice(-4)}` : '—'}</p>
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
          <Row label="First Name" value={safe(person?.firstName)} />
          <Row label="Middle Name" value={safe(person?.middleName)} />
          <Row label="Last Name" value={safe(person?.lastName)} />
          <Row label="Father's Name" value={safe(person?.fatherName)} />
          <Row label="Date of Birth" value={fmtDate(person?.dateOfBirth)} />
          <Row label="PAN" value={safe(person?.panNumber)} />
          <Row label="Aadhaar Number" value={safe(person?.aadhaarNumber)} />
          <Row label="Residential Status" value={safe(person?.residentialStatus)} />
          <Row label="Email" value={safe(person?.email)} />
          <Row label="Mobile" value={person?.mobileNumber ? `${person.countryCode || '+91'}-${person.mobileNumber}` : '—'} />

          <SubHeader label="Address" />
          <Row label="Flat/Door/Block No." value={safe(address?.flatDoorNo)} />
          <Row label="Name of Premises/Building" value={safe(address?.premiseName)} />
          <Row label="Road/Street" value={safe(address?.street)} />
          <Row label="Area/Locality" value={safe(address?.areaLocality)} />
          <Row label="Town/City/District" value={safe(address?.city)} />
          <Row label="State" value={lookupLabel(STATES, address?.state)} />
          <Row label="Country" value={lookupLabel(COUNTRIES, address?.country)} />
          <Row label="Pin Code" value={safe(address?.pincode)} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART B — GROSS TOTAL INCOME
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="GROSS TOTAL INCOME" partLabel="Part B" />

          {/* B1 — Salary */}
          <SubHeader label="B1 — Income from Salary / Pension" />
          {filing.salary && filing.salary.length > 0 ? (
            <>
              {filing.salary.map((sal: any, idx: number) => (
                <div key={idx}>
                  {filing.salary!.length > 1 && <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">Employer {idx + 1}: {sal.employer?.employerName || '—'}</div>}
                  <Row label="Gross Salary" value={getGrossSalary(sal)} indent />
                  <Row label="Standard Deduction u/s 16(ia)" value={getStdDeduction(sal)} indent />
                  <Row label="Professional Tax u/s 16(iii)" value={getProfTax(sal)} indent />
                </div>
              ))}
              <Row label="Total Income from Salary" value={salaryIncome} bold highlight />
            </>
          ) : (
            <Row label="Income from Salary" value={0} />
          )}

          {/* B2 — House Property */}
          <SubHeader label="B2 — Income from House Property" />
          {filing.houseProperty && filing.houseProperty.length > 0 ? (
            <>
              {filing.houseProperty.map((prop: any, idx: number) => (
                <div key={idx}>
                  {filing.houseProperty!.length > 1 && <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">Property {idx + 1}: {lookupLabel(PROPERTY_TYPES, prop.property?.propertyType)}</div>}
                  <Row label="Gross Rent Received" value={Number(prop.property?.annualRentReceived) || 0} indent />
                  <Row label="Tax Paid to Local Authority" value={Number(prop.property?.municipalTaxesPaid) || 0} indent />
                  <Row label="Interest on Housing Loan" value={Number(prop.propertyLoan?.interestPaid) || 0} indent />
                  <Row label="Net Income from Property" value={getNetHP(prop)} indent bold />
                </div>
              ))}
              <Row label="Total Income from House Property" value={housePropertyIncome} bold highlight />
            </>
          ) : (
            <Row label="Income from House Property" value={0} />
          )}

          {/* B3 — Other Sources */}
          <SubHeader label="B3 — Income from Other Sources" />
          {filing.interestIncome && filing.interestIncome.length > 0 && (
            <>
              <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">Interest Income</div>
              {filing.interestIncome.map((int: any, idx: number) => (
                <Row key={idx} label={int.description || int.interestTypeName || `Interest ${idx + 1}`} value={Number(int.amount) || 0} indent />
              ))}
              <Row label="Total Interest Income" value={interestIncome} bold />
            </>
          )}
          {dividendIncome > 0 && <Row label="Dividend Income" value={dividendIncome} />}
          <Row label="Total Income from Other Sources" value={interestIncome + dividendIncome} bold highlight />

          {/* Gross Total */}
          <div className="bg-blue-50 border-t-2 border-blue-200">
            <Row label="GROSS TOTAL INCOME (B1 + B2 + B3)" value={grossTotalIncome} bold highlight />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART C — DEDUCTIONS UNDER CHAPTER VI-A
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="DEDUCTIONS UNDER CHAPTER VI-A" partLabel="Part C" />

          {section80C > 0 && <Row label="Section 80C — Life Insurance, PPF, ELSS, etc." value={Math.min(section80C, 150000)} />}
          {nps80Ccc > 0 && <Row label="Section 80CCC — Pension Fund" value={nps80Ccc} indent />}
          {nps80Ccd1 > 0 && <Row label="Section 80CCD(1) — Employee NPS" value={nps80Ccd1} indent />}
          {nps80Ccd1B > 0 && <Row label="Section 80CCD(1B) — Additional NPS" value={Math.min(nps80Ccd1B, 50000)} indent />}
          {nps80Ccd2 > 0 && <Row label="Section 80CCD(2) — Employer NPS" value={nps80Ccd2} indent />}

          {section80D > 0 && <Row label="Section 80D — Health Insurance" value={section80D} />}
          {section80DD > 0 && <Row label="Section 80DD — Disabled Dependent" value={section80DD} />}
          {section80DDB > 0 && <Row label="Section 80DDB — Medical Treatment" value={section80DDB} />}
          {section80U > 0 && <Row label="Section 80U — Self Disability" value={section80U} />}

          {loansE > 0 && <Row label="Section 80E — Education Loan Interest" value={loansE} />}
          {loanEE > 0 && <Row label="Section 80EE — Home Loan Interest" value={Math.min(loanEE, 50000)} />}
          {loanEEA > 0 && <Row label="Section 80EEA — Affordable Housing Loan" value={Math.min(loanEEA, 150000)} />}
          {loanEEB > 0 && <Row label="Section 80EEB — Electric Vehicle Loan" value={Math.min(loanEEB, 150000)} />}

          {donations80G > 0 && <Row label="Section 80G — Donations" value={donations80G} />}
          {donations80GGA > 0 && <Row label="Section 80GGA — Scientific Research" value={donations80GGA} />}
          {donations80GGC > 0 && <Row label="Section 80GGC — Political Contributions" value={donations80GGC} />}

          {otherTTA > 0 && <Row label="Section 80TTA — Savings Interest" value={Math.min(otherTTA, 10000)} />}
          {otherTTB > 0 && <Row label="Section 80TTB — Sr. Citizen Interest" value={Math.min(otherTTB, 50000)} />}
          {otherGG > 0 && <Row label="Section 80GG — Rent Paid" value={otherGG} />}
          {otherCCH > 0 && <Row label="Section 80CCH — Agnipath Contribution" value={otherCCH} />}

          <div className="bg-blue-50 border-t-2 border-blue-200">
            <Row label="TOTAL DEDUCTIONS UNDER CHAPTER VI-A" value={totalDeductions} bold highlight />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART D — TAX COMPUTATION
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="TAX COMPUTATION" partLabel="Part D" />
          <Row label="Gross Total Income" value={grossTotalIncome} />
          <Row label="Less: Deductions under Chapter VI-A" value={totalDeductions} />
          <Row label="Total Taxable Income" value={Math.max(0, grossTotalIncome - totalDeductions)} bold highlight />
        </div>

        {/* ═══════════════════════════════════════════════════════
            PART E — TAX PAYMENTS
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border-x border-b border-gray-300">
          <SectionHeader title="TAX PAYMENTS" partLabel="Part E" />

          {/* TDS */}
          {filing.tds && filing.tds.length > 0 && (
            <>
              <SubHeader label="Tax Deducted at Source (TDS)" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Deductor Name</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">TAN</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">Tax Deducted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filing.tds.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5">{t.deductorName || '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.tan || '—'}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.taxDeducted || 0)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-3 py-1.5 text-right">Total TDS</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(tdsTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TCS */}
          {filing.tcs && filing.tcs.length > 0 && (
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
                    </tr>
                  </thead>
                  <tbody>
                    {filing.tcs.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5">{t.collectorName || '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.tan || '—'}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.taxCollected || 0)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={3} className="px-3 py-1.5 text-right">Total TCS</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(tcsTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Advance Tax / Self-Assessment Tax */}
          {filing.advanceTax && filing.advanceTax.length > 0 && (
            <>
              <SubHeader label="Advance Tax / Self-Assessment Tax" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">BSR Code</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Date of Payment</th>
                      <th className="text-left px-3 py-1.5 border-b border-gray-200">Challan No.</th>
                      <th className="text-right px-3 py-1.5 border-b border-gray-200">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filing.advanceTax.map((t, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.bsrCode || '—'}</td>
                        <td className="px-3 py-1.5">{fmtDate(t.dateOfPayment)}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{t.challanNumber || '—'}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{fc(t.taxPaidAmount || 0)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={4} className="px-3 py-1.5 text-right">Total Advance/Self-Assessment Tax</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(advanceTaxTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="bg-blue-50 border-t-2 border-blue-200">
            <Row label="TOTAL TAXES PAID" value={totalTaxesPaid} bold highlight />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            BANK ACCOUNT DETAILS
           ═══════════════════════════════════════════════════════ */}
        {filing.bankAccount && filing.bankAccount.length > 0 && (
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
                    <th className="text-center px-3 py-1.5 border-b border-gray-200">Primary</th>
                  </tr>
                </thead>
                <tbody>
                  {filing.bankAccount.map((b, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{b.bankName || '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{b.ifscCode || '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{b.accountNumber || '—'}</td>
                      <td className="px-3 py-1.5">{lookupLabel(ACCOUNT_TYPES, b.accountType)}</td>
                      <td className="px-3 py-1.5 text-center">{b.isPrimary ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Donation Schedule (80G) */}
        {filing.section80G && filing.section80G.length > 0 && (
          <div className="bg-white border-x border-b border-gray-300">
            <SectionHeader title="SCHEDULE 80G — DONATIONS" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">Donee Name</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">PAN</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">Type</th>
                    <th className="text-right px-3 py-1.5 border-b border-gray-200">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filing.section80G.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{d.doneeName || '—'}</td>
                      <td className="px-3 py-1.5 font-mono text-xs">{d.doneePan || '—'}</td>
                      <td className="px-3 py-1.5">{lookupLabel(DONATION_TYPES, d.donationType)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(d.donationAmount || 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-3 py-1.5 text-right">Total Donations (80G)</td>
                    <td className="px-3 py-1.5 text-right font-mono">{fc(donations80G)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 80C Schedule */}
        {filing.section80C && filing.section80C.length > 0 && (
          <div className="bg-white border-x border-b border-gray-300">
            <SectionHeader title="SCHEDULE 80C — DEDUCTIONS" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-600 font-semibold">
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">#</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">Type</th>
                    <th className="text-left px-3 py-1.5 border-b border-gray-200">Description</th>
                    <th className="text-right px-3 py-1.5 border-b border-gray-200">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filing.section80C.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{lookupLabel(DEDUCTION_80C_TYPES, d.typeId)}</td>
                      <td className="px-3 py-1.5">{d.description || '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{fc(d.amount || 0)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3} className="px-3 py-1.5 text-right">Total 80C (max ₹1,50,000)</td>
                    <td className="px-3 py-1.5 text-right font-mono">{fc(Math.min(section80C, 150000))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Print-only footer */}
        <div className="hidden print:block text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-4">
          Generated by OpenTax — Free &amp; Open-Source ITR Filing
        </div>
      </div>
    </div>
  )
}
