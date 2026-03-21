'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, HomeIcon, PencilSquareIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import IconButton from '@/filing/ui/IconButton';
import AddButton from '@/filing/ui/AddButton';
import Button from '@/filing/ui/Button';
import Input from '@/filing/ui/Input';
import DatePicker from '@/filing/ui/DatePicker';
import Select from '@/filing/ui/Select';
import ConfirmModal from '@/filing/ui/ConfirmModal';
import { useFilingContext } from '@/filing/context/FilingContext';
import type { PropertyModel } from '@/filing/models/income/house-property/property-model';
import { useMasterData } from '@/filing/context/MasterDataContext';

interface HousePropertyData {
  entries: PropertyModel[];
  totalIncome: number;
}

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const calcTotalIncome = (entries: PropertyModel[]) =>
  entries.reduce((sum, e) => {
    const rent = e.property.annualRentReceived || 0;
    const municipalTax = e.property.municipalTaxesPaid || 0;
    const interest = e.propertyLoan?.interestPaid || 0;
    const isLetOut = e.property.propertyType === 'L';
    if (isLetOut) {
      const nav = rent - municipalTax;
      return sum + (nav - nav * 0.3 - interest);
    }
    return sum - Math.min(interest, 200000);
  }, 0);

const normalizePropertyType = (pt: string | undefined | null): string => {
  if (!pt) return '';
  if (pt === 'Self Occupied') return 'S';
  if (pt === 'Let Out') return 'L';
  if (pt === 'Deemed Let Out') return 'D';
  return pt;
};

const normalizeEntries = (raw: PropertyModel[]): PropertyModel[] =>
  raw.map((entry, i) => ({
    ...entry,
    property: {
      ...entry.property,
      propertyType: normalizePropertyType(entry.property.propertyType),
      propertyId: entry.property.propertyId ?? -(Date.now() + i),
    },
    propertyTenants: (entry.propertyTenants || []).map(t => ({
      ...t,
      identifierType: typeof t.identifierType === 'string' ? t.identifierType.toLowerCase() : t.identifierType,
    })),
  }));

export default function HousePropertyTab() {
  const { filing, updateSection } = useFilingContext();
  const { propertyTypes: PROPERTY_TYPES, lenderTypes: LENDER_TYPES, tenantIdentifierTypes: TENANT_IDENTIFIER_TYPES, states: STATES, countries: COUNTRIES } = useMasterData();
  const filingPan = filing.person?.panNumber?.toUpperCase();

  // ── static options ────────────────────────────────────────
  const stateOptions = useMemo(() => [{ value: '', label: 'Select state' }, ...STATES], []);
  const countryOptions = useMemo(() => [{ value: '', label: 'Select country' }, ...COUNTRIES], []);
  const propertyTypeOptions = useMemo(() => [{ value: '', label: 'Select type' }, ...PROPERTY_TYPES], []);
  const identifierTypeOptions = useMemo(() => [{ value: '', label: 'Select ID type' }, ...TENANT_IDENTIFIER_TYPES], []);
  const lenderTypeOptions = useMemo(() => [{ value: '', label: 'Select lender type' }, ...LENDER_TYPES], []);

  // ── data state ────────────────────────────────────────────
  const [data, setData] = useState<HousePropertyData>(() => {
    const entries = normalizeEntries(filing.houseProperty ?? []);
    return { entries, totalIncome: calcTotalIncome(entries) };
  });

  // ── UI state ──────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [entryErrors, setEntryErrors] = useState<Record<number, Record<string, string>>>({});
  const [expandedTenants, setExpandedTenants] = useState<Record<number, boolean>>({});
  const [expandedCoowners, setExpandedCoowners] = useState<Record<number, boolean>>({});
  const [editingEntryId, setEditingEntryId] = useState<number | null | undefined>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null | undefined>(null);

  const prevEntryCountRef = useRef(data.entries.length);
  const lastEntryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data.entries.length > prevEntryCountRef.current) {
      const lastEntry = data.entries[data.entries.length - 1];
      const lastId = lastEntry.property.propertyId as number;
      if (lastId < 0) {
        setEditingEntryId(lastId);
        setExpandedTenants(prev => ({ ...prev, [lastId]: true }));
        setExpandedCoowners(prev => ({ ...prev, [lastId]: true }));
        setTimeout(() => lastEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
      }
    }
    prevEntryCountRef.current = data.entries.length;
  }, [data.entries.length]);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'house-property-tab-compact-style';
    style.textContent = `
      .house-property-tab-compact input,
      .house-property-tab-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
        height: 40px !important;
      }
    `;
    if (!document.getElementById('house-property-tab-compact-style')) document.head.appendChild(style);
    return () => { document.getElementById('house-property-tab-compact-style')?.remove(); };
  }, []);

  // ── validation ──────────────────────────────────────────────
  const validateEntry = (entry: PropertyModel): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!entry.property.propertyType) e.propertyType = 'Property type is required';

    if (entry.property.propertyType === 'S') {
      const selfOccupiedCount = data.entries.filter(
        (other) => other.property.propertyType === 'S' && other.property.propertyId !== entry.property.propertyId
      ).length;
      if (selfOccupiedCount >= 2) e.propertyType = 'Maximum 2 self-occupied properties allowed';
    }

    if (!entry.propertyAddress?.addressLine1?.trim()) e.addressLine1 = 'Address Line 1 is required';
    if (!entry.propertyAddress?.city?.trim()) e.city = 'City is required';
    if (!entry.propertyAddress?.state?.trim()) e.state = 'State is required';
    if (!entry.propertyAddress?.postalCode?.trim()) {
      e.postalCode = 'Postal code is required';
    } else if (!/^\d{6}$/.test(entry.propertyAddress.postalCode)) {
      e.postalCode = 'Postal code must be 6 digits';
    }
    if (!entry.propertyAddress?.country?.trim()) e.country = 'Country is required';

    const ownerShare = entry.property.ownershipShare ?? 0;
    if (ownerShare < 0 || ownerShare > 100) e.ownershipShare = 'Ownership share must be between 0 and 100';
    const coownerTotal = entry.propertyCoowners.reduce((sum, c) => sum + (c.ownershipShare || 0), 0);
    if (entry.propertyCoowners.length > 0 && ownerShare + coownerTotal !== 100) {
      e.ownershipShare = `Total ownership must equal 100% (currently ${ownerShare + coownerTotal}%)`;
    } else if (ownerShare + coownerTotal > 100) {
      e.ownershipShare = `Total ownership (${ownerShare + coownerTotal}%) exceeds 100%`;
    }

    entry.propertyCoowners.forEach((c, ci) => {
      if (!c.coownerName?.trim()) e[`coowner_${ci}_name`] = `Co-owner ${ci + 1}: Name is required`;
      if (!c.coownerPan?.trim()) {
        e[`coowner_${ci}_pan`] = `Co-owner ${ci + 1}: PAN is required`;
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(c.coownerPan.trim())) {
        e[`coowner_${ci}_pan`] = `Co-owner ${ci + 1}: Invalid PAN format (e.g., ABCDE1234F)`;
      }
      const coShare = c.ownershipShare ?? 0;
      if (coShare <= 0 || coShare > 100) e[`coowner_${ci}_share`] = `Co-owner ${ci + 1}: Ownership share must be > 0 and ≤ 100%`;
    });

    const loan = entry.propertyLoan;
    if (loan) {
      const hasAnyLoanField = !!(loan.vendorType?.trim() || loan.lenderName?.trim() || loan.loanAccountNumber?.trim() ||
        loan.loanSanctionDate || (loan.totalLoanAmount && loan.totalLoanAmount > 0) ||
        (loan.loanOutstanding && loan.loanOutstanding > 0) || (loan.interestPaid && loan.interestPaid > 0));
      if (hasAnyLoanField) {
        if (!loan.vendorType?.trim()) e.loanVendorType = 'Lender type is required when loan details are entered';
        if (!loan.lenderName?.trim()) e.loanLenderName = 'Lender name is required when loan details are entered';
        if (!loan.loanAccountNumber?.trim()) e.loanAccountNumber = 'Loan account number is required when loan details are entered';
        if (!loan.loanSanctionDate) e.loanSanctionDate = 'Loan sanction date is required when loan details are entered';
        else if (new Date(loan.loanSanctionDate) > new Date()) e.loanSanctionDate = 'Loan sanction date cannot be a future date';
        if (!loan.totalLoanAmount || loan.totalLoanAmount <= 0) e.loanTotalLoanAmount = 'Total loan amount is required when loan details are entered';
        if (!loan.loanOutstanding || loan.loanOutstanding <= 0) e.loanOutstanding = 'Loan outstanding amount is required when loan details are entered';
        if (!loan.interestPaid || loan.interestPaid <= 0) e.loanInterestPaid = 'Interest paid is required when loan details are entered';
      }
    }

    const isLetOut = entry.property.propertyType === 'L';
    const isDeemedLetOut = entry.property.propertyType === 'D';
    if (isLetOut) {
      if (entry.propertyTenants.length === 0) e.tenants = 'At least one tenant is required for Let Out property';
      entry.propertyTenants.forEach((t, i) => {
        if (!t.tenantName?.trim()) e[`tenant_${i}_tenantName`] = `Tenant ${i + 1}: Name is required`;
      });
      const annualRent = entry.property.annualRentReceived || 0;
      if (annualRent > 100000) {
        entry.propertyTenants.forEach((t, i) => {
          const idTypeLower = (t.identifierType || '').toLowerCase();
          if (!idTypeLower || idTypeLower !== 'pan') e[`tenant_${i}_identifierType`] = `Tenant ${i + 1}: PAN is mandatory when annual rent exceeds ₹1L`;
          else if (!t.identifierValue?.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(t.identifierValue.trim())) e[`tenant_${i}_identifierValue`] = `Tenant ${i + 1}: Invalid PAN format`;
        });
      }
    }
    if (isLetOut || isDeemedLetOut) {
      entry.propertyTenants.forEach((t, i) => {
        const idTypeLower = (t.identifierType || '').toLowerCase();
        if (!e[`tenant_${i}_identifierValue`] && idTypeLower && t.identifierValue?.trim()) {
          if (idTypeLower === 'pan' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(t.identifierValue.trim())) {
            e[`tenant_${i}_identifierValue`] = `Tenant ${i + 1}: Invalid PAN format (e.g., ABCDE1234F)`;
          } else if (idTypeLower === 'pan' && filingPan && t.identifierValue.trim().toUpperCase() === filingPan) {
            e[`tenant_${i}_identifierValue`] = `Tenant ${i + 1}: Tenant PAN cannot be the same as your filing PAN`;
          } else if (idTypeLower === 'aadhaar' && !/^\d{12}$/.test(t.identifierValue)) {
            e[`tenant_${i}_identifierValue`] = `Tenant ${i + 1}: Aadhaar must be 12 digits`;
          }
        }
      });
    }
    return e;
  };

  // ── handlers ──────────────────────────────────────────────

  const addEntry = () => {
    const tempId = -Date.now();
    const newEntry: PropertyModel = {
      property: { propertyId: tempId, propertyType: '', ownershipShare: 100, annualRentReceived: 0, municipalTaxesPaid: 0 },
      propertyAddress: { propertyAddressId: undefined, propertyId: undefined, filingId: null as unknown as number, addressLine1: '', addressLine2: '', city: '', district: '', state: '', postalCode: '', country: 'India' },
      propertyLoan: undefined,
      propertyTenants: [],
      propertyCoowners: [],
    };
    setData(prev => ({ ...prev, entries: [...prev.entries, newEntry] }));
  };

  const updateEntry = (propertyId: number | null | undefined, field: string, value: any) => {
    setData(prev => {
      const entries = prev.entries.map(entry => {
        if (entry.property.propertyId !== propertyId) return entry;
        const updated = { ...entry };
        const parts = field.split('.');
        if (parts.length === 2) {
          const [section, subField] = parts;
          if (section === 'propertyLoan') {
            updated.propertyLoan = {
              loanId: undefined, propertyId: entry.property.propertyId,
              vendorType: '', lenderName: '', loanAccountNumber: '', loanSanctionDate: null,
              totalLoanAmount: 0, loanOutstanding: 0, interestPaid: 0, principalRepaid: 0,
              ...updated.propertyLoan,
              [subField]: value,
            };
          } else {
            (updated as any)[section] = { ...(updated as any)[section], [subField]: value };
          }
        } else if (parts.length === 3) {
          const [arraySection, idxStr, subField] = parts;
          const idx = parseInt(idxStr, 10);
          if (arraySection === 'propertyTenants' || arraySection === 'propertyCoowners') {
            const arr = [...(updated as any)[arraySection]];
            arr[idx] = { ...arr[idx], [subField]: value };
            (updated as any)[arraySection] = arr;
          }
        }
        return updated;
      });
      return { entries, totalIncome: calcTotalIncome(entries) };
    });
  };

  const saveEntry = (entry: PropertyModel) => {
    const pid = entry.property.propertyId;
    const validationErrors = validateEntry(entry);
    if (Object.keys(validationErrors).length > 0) {
      setEntryErrors(prev => ({ ...prev, [pid!]: validationErrors }));
      setSaveError(Object.values(validationErrors).join(' • '));
      return;
    }
    setEntryErrors(prev => { const next = { ...prev }; delete next[pid!]; return next; });
    setSaveError(null);
    const isNew = !pid || pid < 0;
    const stableId = isNew ? Date.now() : pid!;
    const savedEntry: PropertyModel = {
      ...entry,
      property: { ...entry.property, propertyId: stableId },
      propertyAddress: entry.propertyAddress ? { ...entry.propertyAddress, propertyId: stableId } : entry.propertyAddress,
      propertyLoan: entry.propertyLoan ? { ...entry.propertyLoan, propertyId: stableId } : entry.propertyLoan,
      propertyTenants: entry.propertyTenants.map(t => ({ ...t, propertyId: stableId })),
      propertyCoowners: entry.propertyCoowners.map(c => ({ ...c, propertyId: stableId })),
    };
    setData(prev => {
      const updatedEntries = prev.entries.map(e => e.property.propertyId === pid ? savedEntry : e);
      updateSection('houseProperty', updatedEntries);
      return { entries: updatedEntries, totalIncome: calcTotalIncome(updatedEntries) };
    });
    setEditingEntryId(null);
  };

  const deleteEntry = (propertyId: number | null | undefined) => {
    setEntryErrors(prev => { const next = { ...prev }; if (propertyId != null) delete next[propertyId as number]; return next; });
    setData(prev => {
      const entries = prev.entries.filter(e => e.property.propertyId !== propertyId);
      updateSection('houseProperty', entries);
      return { entries, totalIncome: calcTotalIncome(entries) };
    });
  };

  const cancelEdit = (propertyId: number | null | undefined) => {
    setEditingEntryId(null);
    setSaveError(null);
    if (propertyId != null) setEntryErrors(prev => { const next = { ...prev }; delete next[propertyId as number]; return next; });
    if (propertyId != null && propertyId < 0) {
      // New unsaved entry — remove from local state
      setData(prev => {
        const entries = prev.entries.filter(e => e.property.propertyId !== propertyId);
        return { entries, totalIncome: calcTotalIncome(entries) };
      });
    } else {
      // Existing entry — revert to last saved state from context
      const original = (filing.houseProperty ?? []).find(e => e.property.propertyId === propertyId);
      if (original) {
        setData(prev => {
          const entries = prev.entries.map(e => e.property.propertyId === propertyId ? original : e);
          return { entries, totalIncome: calcTotalIncome(entries) };
        });
      }
    }
  };

  const addTenant = (propertyId: number | null | undefined) => {
    setData(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.property.propertyId !== propertyId ? e : {
        ...e, propertyTenants: [...e.propertyTenants, { tenantId: undefined, propertyId, filingId: null as unknown as number, tenantName: '', identifierType: '', identifierValue: '' }],
      }),
    }));
  };

  const deleteTenant = (propertyId: number | null | undefined, tenantIndex: number) => {
    setData(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.property.propertyId !== propertyId ? e : {
        ...e, propertyTenants: e.propertyTenants.filter((_, i) => i !== tenantIndex),
      }),
    }));
  };

  const addCoowner = (propertyId: number | null | undefined) => {
    setData(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.property.propertyId !== propertyId ? e : {
        ...e, propertyCoowners: [...e.propertyCoowners, { coownerId: undefined, propertyId, filingId: null as unknown as number, coownerName: '', coownerPan: '', coownerRelationship: '', ownershipShare: 0 }],
      }),
    }));
  };

  const deleteCoowner = (propertyId: number | null | undefined, coownerIndex: number) => {
    setData(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.property.propertyId !== propertyId ? e : {
        ...e, propertyCoowners: e.propertyCoowners.filter((_, i) => i !== coownerIndex),
      }),
    }));
  };

  // ── render ────────────────────────────────────────────────
  return (
    <div className="house-property-tab-compact">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700"
            >
              {isExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                <HomeIcon className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-semibold text-gray-900">Income from House Property</h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-blue-600">{formatCurrency(data.totalIncome)}</span>
            <IconButton label="Add Property" onClick={() => { if (!isExpanded) setIsExpanded(true); addEntry(); }}>
              <PlusCircleIcon className="w-5 h-5 text-green-600" />
            </IconButton>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            {data.entries.length === 0 ? (
              <AddButton label="Add Property" onClick={addEntry} colorScheme="teal" />
            ) : (
              data.entries.map((entry, index) => {
                const propertyId = entry.property.propertyId!;
                const isLetOut = entry.property.propertyType === 'L' || entry.property.propertyType === 'D';
                const rent = entry.property.annualRentReceived || 0;
                const municipalTax = entry.property.municipalTaxesPaid || 0;
                const interest = entry.propertyLoan?.interestPaid || 0;
                let netIncome = 0;
                let nav = 0;
                let standardDeduction = 0;
                if (isLetOut) {
                  nav = rent - municipalTax;
                  standardDeduction = nav * 0.3;
                  netIncome = (nav - standardDeduction - interest) || 0;
                } else {
                  netIncome = (-Math.min(interest, 200000)) || 0;
                }

                const isEditing = editingEntryId === entry.property.propertyId;

                return (
                  <div
                    key={propertyId}
                    className="border border-gray-200 rounded-lg p-6 mb-4"
                    ref={index === data.entries.length - 1 ? lastEntryRef : null}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <h4 className="text-xl font-semibold text-gray-900">Property {index + 1}</h4>
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1">
                            <span className="text-xs text-blue-700">Net Income</span>
                            <span className="font-bold text-blue-900 ml-2">{formatCurrency(netIncome)}</span>
                          </div>
                          {isLetOut && (
                            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5 text-[11px] text-gray-600 leading-relaxed">
                              <span className="font-semibold text-gray-700 mr-2">Formula:</span>
                              Rent {formatCurrency(rent)}
                              <span className="mx-1 text-gray-400">−</span>
                              Municipal Tax {formatCurrency(municipalTax)}
                              <span className="mx-1 text-gray-400">=</span>
                              <span className="font-medium text-gray-700">NAV {formatCurrency(nav)}</span>
                              <span className="mx-1 text-gray-400">−</span>
                              30% Std Ded {formatCurrency(standardDeduction)}
                              <span className="mx-1 text-gray-400">−</span>
                              Interest {formatCurrency(interest)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isEditing ? (
                          <>
                            <IconButton label="Edit" onClick={() => setEditingEntryId(entry.property.propertyId)}>
                              <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                            </IconButton>
                            <IconButton label="Delete" onClick={() => setPendingDeleteId(entry.property.propertyId)}>
                              <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => cancelEdit(entry.property.propertyId)}>Cancel</Button>
                            <Button variant="primary" size="sm" onClick={() => saveEntry(entry)}>Save</Button>
                          </>
                        )}
                      </div>
                    </div>

                    {saveError && isEditing && (
                      <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                        {saveError.includes(' • ') ? (
                          <ul className="list-disc list-inside space-y-0.5">
                            {saveError.split(' • ').map((msg, i) => <li key={i}>{msg}</li>)}
                          </ul>
                        ) : saveError}
                      </div>
                    )}

                    {/* Property Details */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Property Details</h5>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {(() => { const errs = entryErrors[entry.property.propertyId!] || {}; return (<>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Select label="Property Type" required value={entry.property.propertyType} onChange={(e) => updateEntry(entry.property.propertyId, 'property.propertyType', e.target.value)} options={propertyTypeOptions} disabled={!isEditing} error={isEditing ? errs.propertyType : undefined} />
                          <Input label="Ownership Share %" type="number" value={entry.property.ownershipShare || 0} onChange={(e) => updateEntry(entry.property.propertyId, 'property.ownershipShare', Number(e.target.value))} disabled={!isEditing} error={isEditing ? errs.ownershipShare : undefined} />
                          <Input label="Municipal Tax Paid" type="number" value={entry.property.municipalTaxesPaid || 0} onChange={(e) => updateEntry(entry.property.propertyId, 'property.municipalTaxesPaid', Number(e.target.value))} disabled={!isEditing} />
                          <Input label="Annual Rent Received" type="number" value={entry.property.annualRentReceived || 0} onChange={(e) => updateEntry(entry.property.propertyId, 'property.annualRentReceived', Number(e.target.value))} disabled={!isEditing} />
                        </div>
                        {isEditing && errs.tenants && <p className="mt-1 text-xs text-red-600">{errs.tenants}</p>}
                        </>); })()}
                      </div>
                    </div>

                    {/* Three Column Layout: Address | Loan | Tenants & Co-owners */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Column 1: Property Address */}
                      <div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">Property Address</h6>
                          <div className="space-y-3">
                            {(() => { const errs = entryErrors[entry.property.propertyId!] || {}; return (<>
                            <div className="grid grid-cols-2 gap-3">
                              <Input label="Address Line 1" required value={entry.propertyAddress?.addressLine1 || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyAddress.addressLine1', e.target.value)} disabled={!isEditing} error={isEditing ? errs.addressLine1 : undefined} />
                              <Input label="Address Line 2" value={entry.propertyAddress?.addressLine2 || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyAddress.addressLine2', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input label="City" required value={entry.propertyAddress?.city || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyAddress.city', e.target.value)} disabled={!isEditing} error={isEditing ? errs.city : undefined} />
                              <Input label="District" value={entry.propertyAddress?.district || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyAddress.district', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Select label="State" required value={entry.propertyAddress?.state || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyAddress.state', e.target.value)} options={stateOptions} disabled={!isEditing} error={isEditing ? errs.state : undefined} />
                              <Input label="Postal Code" required value={entry.propertyAddress?.postalCode || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyAddress.postalCode', e.target.value)} disabled={!isEditing} error={isEditing ? errs.postalCode : undefined} />
                            </div>
                            <Select label="Country" required value={entry.propertyAddress?.country || 'India'} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyAddress.country', e.target.value)} options={countryOptions} disabled={!isEditing} error={isEditing ? errs.country : undefined} />
                            </>); })()}
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Loan Details */}
                      <div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h6 className="text-sm font-medium text-gray-900 mb-3">Loan Details</h6>
                          <div className="space-y-3">
                            {(() => { const errs = entryErrors[entry.property.propertyId!] || {}; return (<>
                            <div className="grid grid-cols-2 gap-3">
                              <Select label="Lender Type" value={entry.propertyLoan?.vendorType || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyLoan.vendorType', e.target.value)} options={lenderTypeOptions} disabled={!isEditing} error={isEditing ? errs.loanVendorType : undefined} />
                              <Input label="Lender Name" value={entry.propertyLoan?.lenderName || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyLoan.lenderName', e.target.value)} disabled={!isEditing} error={isEditing ? errs.loanLenderName : undefined} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input label="Loan Account No." value={entry.propertyLoan?.loanAccountNumber || ''} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyLoan.loanAccountNumber', e.target.value)} disabled={!isEditing} error={isEditing ? errs.loanAccountNumber : undefined} />
                              <DatePicker label="Sanction Date" value={entry.propertyLoan?.loanSanctionDate || null} onChange={(date) => updateEntry(entry.property.propertyId, 'propertyLoan.loanSanctionDate', date)} disabled={!isEditing} error={isEditing ? errs.loanSanctionDate : undefined} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input label="Total Loan" type="number" value={entry.propertyLoan?.totalLoanAmount || 0} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyLoan.totalLoanAmount', Number(e.target.value))} disabled={!isEditing} error={isEditing ? errs.loanTotalLoanAmount : undefined} />
                              <Input label="Outstanding" type="number" value={entry.propertyLoan?.loanOutstanding || 0} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyLoan.loanOutstanding', Number(e.target.value))} disabled={!isEditing} error={isEditing ? errs.loanOutstanding : undefined} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input label="Interest Paid" type="number" value={entry.propertyLoan?.interestPaid || 0} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyLoan.interestPaid', Number(e.target.value))} disabled={!isEditing} error={isEditing ? errs.loanInterestPaid : undefined} />
                              <Input label="Principal Repaid" type="number" value={entry.propertyLoan?.principalRepaid || 0} onChange={(e) => updateEntry(entry.property.propertyId, 'propertyLoan.principalRepaid', Number(e.target.value))} disabled={!isEditing} />
                            </div>
                            </>); })()}
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Tenants & Co-owners */}
                      <div className="space-y-4">
                        {(isLetOut || entry.property.propertyType === 'D') && (
                          <div className="border border-gray-200 rounded-lg">
                            <button
                              onClick={() => setExpandedTenants(prev => ({ ...prev, [propertyId]: !prev[propertyId] }))}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                              type="button"
                            >
                              <span className="text-sm font-medium text-gray-700">Tenants</span>
                              {expandedTenants[propertyId] ? <ChevronDownIcon className="w-4 h-4 text-gray-500" /> : <ChevronRightIcon className="w-4 h-4 text-gray-500" />}
                            </button>
                            {expandedTenants[propertyId] && (
                              <div className="p-3 border-t border-gray-200">
                                {entry.propertyTenants.length === 0 ? (
                                  <AddButton label="Add Tenant" onClick={() => addTenant(entry.property.propertyId)} colorScheme="blue" disableEdit={!isEditing} />
                                ) : (
                                  <div className="space-y-3 mb-3">
                                    {entry.propertyTenants.map((tenant, ti) => (
                                      <div key={`${propertyId}-t-${ti}`} className="border border-gray-200 rounded p-2">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-xs font-medium">Tenant {ti + 1}</span>
                                          {isEditing && <IconButton label="Remove Tenant" size="xs" onClick={() => deleteTenant(entry.property.propertyId, ti)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>}
                                        </div>
                                        {(() => { const errs = entryErrors[entry.property.propertyId!] || {}; return (
                                        <div className="space-y-2">
                                          <Input label="Tenant Name" required value={tenant.tenantName || ''} onChange={(e) => updateEntry(entry.property.propertyId, `propertyTenants.${ti}.tenantName`, e.target.value)} disabled={!isEditing} error={isEditing ? errs[`tenant_${ti}_tenantName`] : undefined} />
                                          <div className="grid grid-cols-2 gap-2">
                                            <Select label="ID Type" value={tenant.identifierType || ''} onChange={(e) => updateEntry(entry.property.propertyId, `propertyTenants.${ti}.identifierType`, e.target.value)} options={identifierTypeOptions} disabled={!isEditing} error={isEditing ? errs[`tenant_${ti}_identifierType`] : undefined} />
                                            <Input
                                              label="ID Value"
                                              value={tenant.identifierValue || ''}
                                              onChange={(e) => {
                                                let val = e.target.value;
                                                if (tenant.identifierType === 'pan') val = val.toUpperCase();
                                                else if (tenant.identifierType === 'aadhaar') val = val.replace(/[^\d]/g, '');
                                                updateEntry(entry.property.propertyId, `propertyTenants.${ti}.identifierValue`, val);
                                              }}
                                              maxLength={tenant.identifierType === 'pan' ? 10 : tenant.identifierType === 'aadhaar' ? 12 : undefined}
                                              placeholder={tenant.identifierType === 'pan' ? 'ABCDE1234F' : tenant.identifierType === 'aadhaar' ? '123456789012' : ''}
                                              disabled={!isEditing}
                                              error={isEditing ? errs[`tenant_${ti}_identifierValue`] : undefined}
                                            />
                                          </div>
                                        </div>
                                        ); })()}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {entry.propertyTenants.length > 0 && (
                                  <AddButton label="Add Tenant" onClick={() => addTenant(entry.property.propertyId)} colorScheme="blue" disableEdit={!isEditing} />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Co-owners */}
                        <div className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => setExpandedCoowners(prev => ({ ...prev, [propertyId]: !prev[propertyId] }))}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                            type="button"
                          >
                            <span className="text-sm font-medium text-gray-700">Co-owners</span>
                            {expandedCoowners[propertyId] ? <ChevronDownIcon className="w-4 h-4 text-gray-500" /> : <ChevronRightIcon className="w-4 h-4 text-gray-500" />}
                          </button>
                          {expandedCoowners[propertyId] && (
                            <div className="p-3 border-t border-gray-200">
                              {entry.propertyCoowners.length === 0 ? (
                                <AddButton label="Add Co-owner" onClick={() => addCoowner(entry.property.propertyId)} colorScheme="purple" disableEdit={!isEditing} />
                              ) : (
                                <div className="space-y-3 mb-3">
                                  {entry.propertyCoowners.map((coowner, ci) => (
                                    <div key={`${propertyId}-c-${ci}`} className="border border-gray-200 rounded p-2">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-medium">Co-owner {ci + 1}</span>
                                        {isEditing && <IconButton label="Remove Co-owner" size="xs" onClick={() => deleteCoowner(entry.property.propertyId, ci)}><TrashIcon className="w-3.5 h-3.5 text-red-600" /></IconButton>}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-3 gap-2">
                                          <Input label="Name" required value={coowner.coownerName || ''} onChange={(e) => updateEntry(entry.property.propertyId, `propertyCoowners.${ci}.coownerName`, e.target.value)} disabled={!isEditing} error={isEditing ? (entryErrors[entry.property.propertyId!] || {})[`coowner_${ci}_name`] : undefined} />
                                          <Input label="PAN" required value={coowner.coownerPan || ''} onChange={(e) => updateEntry(entry.property.propertyId, `propertyCoowners.${ci}.coownerPan`, e.target.value.toUpperCase())} maxLength={10} placeholder="ABCDE1234F" disabled={!isEditing} error={isEditing ? (entryErrors[entry.property.propertyId!] || {})[`coowner_${ci}_pan`] : undefined} />
                                          <Input label="Share %" required type="number" value={coowner.ownershipShare || 0} onChange={(e) => updateEntry(entry.property.propertyId, `propertyCoowners.${ci}.ownershipShare`, Number(e.target.value))} disabled={!isEditing} error={isEditing ? (entryErrors[entry.property.propertyId!] || {})[`coowner_${ci}_share`] : undefined} />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {entry.propertyCoowners.length > 0 && (
                                <AddButton label="Add Co-owner" onClick={() => addCoowner(entry.property.propertyId)} colorScheme="purple" disableEdit={!isEditing} />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete Property?"
        message="Are you sure you want to delete this property entry? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        onConfirm={() => { const id = pendingDeleteId; if (id != null) deleteEntry(id); setPendingDeleteId(null); }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
