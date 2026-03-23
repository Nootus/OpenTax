'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  PencilSquareIcon,
  TrashIcon,
  UserIcon,
  IdentificationIcon,
  EnvelopeIcon,
  HomeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import IconButton from '@/filing/ui/IconButton';
import Button from '@/filing/ui/Button';
import AddButton from '@/filing/ui/AddButton';
import Input from '@/filing/ui/Input';
import Select from '@/filing/ui/Select';
import Checkbox from '@/filing/ui/Checkbox';
import DatePicker from '@/filing/ui/DatePicker';
import PhoneInput from '@/filing/ui/PhoneInput';
import { useFilingContext } from '@/filing/context/FilingContext';
import { PersonDetailsModel } from '@/filing/models/person/person-details-model';
import { AddressModel } from '@/filing/models/person/person-address-model';
import { BankAccountModel } from '@/filing/models/person/bank-account-model';
import { useMasterData } from '@/filing/context/MasterDataContext';

const EMPTY_PERSON: PersonDetailsModel = {
  firstName: '',
  middleName: '',
  lastName: '',
  fatherName: '',
  panNumber: '',
  aadhaarNumber: '',
  dateOfBirth: null,
  residentialStatus: 'RES',
  email: '',
  mobileNumber: '',
  countryCode: '+91',
};

const EMPTY_ADDRESS: AddressModel = {
  flatDoorNo: '',
  premiseName: '',
  street: '',
  areaLocality: '',
  city: '',
  pincode: '',
  state: '',
  country: 'IN',
};

const EMPTY_BANK: BankAccountModel = {
  bankAccountId: -Date.now(),
  accountNumber: '',
  ifscCode: '',
  bankName: '',
  accountType: 'SB',
  isPrimary: true,
};

export default function PersonalDetailsTab() {
  const { filing, updateSection } = useFilingContext();
  const { states: STATES, countries: COUNTRIES, residentialStatuses: RESIDENTIAL_STATUSES, accountTypes: ACCOUNT_TYPES } = useMasterData();

  // Edit modes
  const [editModePersonal, setEditModePersonal] = useState(false);
  const [editModeAddress, setEditModeAddress] = useState(false);
  const [editModeBankAccounts, setEditModeBankAccounts] = useState(false);

  // Validation errors
  const [errorsPersonal, setErrorsPersonal] = useState<Record<string, string>>({});
  const [errorsAddress, setErrorsAddress] = useState<Record<string, string>>({});
  const [errorsBankAccounts, setErrorsBankAccounts] = useState<Record<number, Record<string, string>>>({});

  // Editable (working) copies — only used while in edit mode
  const [editablePersonalDetails, setEditablePersonalDetails] = useState<PersonDetailsModel>(
    filing.person ?? EMPTY_PERSON
  );
  const [editableAddress, setEditableAddress] = useState<AddressModel>(
    filing.personAddress ?? EMPTY_ADDRESS
  );
  const [editableBankAccounts, setEditableBankAccounts] = useState<BankAccountModel[]>(() => {
    const accts = filing.bankAccount.length > 0 ? filing.bankAccount : [{ ...EMPTY_BANK }];
    return accts.map((a, i) => a.bankAccountId != null ? a : { ...a, bankAccountId: -(Date.now() + i) });
  });

  // Inject compact styles
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'personal-details-compact-style';
    style.textContent = `
      .personal-details-compact input,
      .personal-details-compact select {
        padding: 0.75rem 0.5rem 0.375rem 0.5rem !important;
      }
      .personal-details-compact .flex-shrink-0 {
        width: 3.5rem !important;
      }
      .personal-details-compact .flex-shrink-0 select {
        padding-left: 0.25rem !important;
        padding-right: 0.25rem !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById('personal-details-compact-style')?.remove();
    };
  }, []);

  // ── Master data options ──────────────────────────────────────────────────
  const stateOptions = useMemo(
    () => [{ value: '', label: 'Select state' }, ...STATES],
    []
  );
  const countryOptions = useMemo(
    () => [{ value: '', label: 'Select country' }, ...COUNTRIES],
    []
  );
  const residentialStatusOptions = useMemo(
    () => [{ value: '', label: 'Select residential status' }, ...RESIDENTIAL_STATUSES],
    []
  );
  const accountTypeOptions = useMemo(() => ACCOUNT_TYPES, []);

  // ── Validation ───────────────────────────────────────────────────────────
  const validatePersonal = (d: PersonDetailsModel): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!d.lastName?.trim()) e.lastName = 'Last name is required';
    if (!d.residentialStatus?.trim()) e.residentialStatus = 'Residential status is required';
    if (d.dateOfBirth === null || d.dateOfBirth === undefined) {
      e.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(d.dateOfBirth as any);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dob > today) e.dateOfBirth = 'Date of birth cannot be in the future';
    }
    if (!d.panNumber?.trim()) {
      e.panNumber = 'PAN number is required';
    } else if (
      !d.panNumber.startsWith('X') &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(d.panNumber)
    ) {
      e.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }
    if (d.aadhaarNumber?.trim() && d.aadhaarNumber.replace(/\D/g, '').length !== 12) {
      e.aadhaarNumber = 'Aadhaar must be 12 digits';
    }
    if (!d.email?.trim()) {
      e.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
      e.email = 'Invalid email format';
    }
    if (!d.mobileNumber?.trim()) {
      e.mobileNumber = 'Mobile number is required';
    } else if (d.mobileNumber.replace(/\D/g, '').length !== 10) {
      e.mobileNumber = 'Mobile number must be 10 digits';
    }
    if (!d.fatherName?.trim()) e.fatherName = "Father's name is required";
    return e;
  };

  const validateAddress = (d: AddressModel): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!d.flatDoorNo?.trim()) e.flatDoorNo = 'Flat/Door No is required';
    if (!d.areaLocality?.trim()) e.areaLocality = 'Area/Locality is required';
    if (!d.city?.trim()) e.city = 'City is required';
    if (!d.state?.trim()) e.state = 'State is required';
    if (!d.country?.trim()) e.country = 'Country is required';
    if (!d.pincode?.trim()) {
      e.pincode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(d.pincode)) {
      e.pincode = 'PIN code must be 6 digits';
    }
    return e;
  };

  const validateBankAccount = (b: BankAccountModel): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!b.bankName?.trim()) e.bankName = 'Bank name is required';
    if (!b.accountNumber?.trim()) e.accountNumber = 'Account number is required';
    if (!b.ifscCode?.trim()) {
      e.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(b.ifscCode)) {
      e.ifscCode = 'Invalid IFSC code format (e.g., SBIN0001234)';
    }
    if (!b.accountType?.trim()) e.accountType = 'Account type is required';
    return e;
  };

  // ── Save handlers (sync — no API calls) ─────────────────────────────────
  const savePersonalDetails = () => {
    const errs = validatePersonal(editablePersonalDetails);
    setErrorsPersonal(errs);
    if (Object.keys(errs).length > 0) return;
    updateSection('person', { ...editablePersonalDetails });
    setEditModePersonal(false);
    setErrorsPersonal({});
  };

  const saveAddress = () => {
    const errs = validateAddress(editableAddress);
    setErrorsAddress(errs);
    if (Object.keys(errs).length > 0) return;
    updateSection('personAddress', { ...editableAddress });
    setEditModeAddress(false);
    setErrorsAddress({});
  };

  const saveBankAccounts = () => {
    const allErrs: Record<number, Record<string, string>> = {};
    editableBankAccounts.forEach((b, i) => {
      const e = validateBankAccount(b);
      if (Object.keys(e).length > 0) allErrs[i] = e;
    });
    setErrorsBankAccounts(allErrs);
    if (Object.keys(allErrs).length > 0) return;
    updateSection('bankAccount', [...editableBankAccounts]);
    setEditModeBankAccounts(false);
    setErrorsBankAccounts({});
  };

  // ── Cancel handlers ──────────────────────────────────────────────────────
  const cancelPersonalDetails = () => {
    setEditablePersonalDetails(filing.person ?? EMPTY_PERSON);
    setEditModePersonal(false);
    setErrorsPersonal({});
  };

  const cancelAddress = () => {
    setEditableAddress(filing.personAddress ?? EMPTY_ADDRESS);
    setEditModeAddress(false);
    setErrorsAddress({});
  };

  const cancelBankAccounts = () => {
    setEditableBankAccounts(
      filing.bankAccount.length > 0 ? filing.bankAccount : [{ ...EMPTY_BANK }]
    );
    setEditModeBankAccounts(false);
    setErrorsBankAccounts({});
  };

  // Sync editable copies when edit mode opens
  useEffect(() => {
    if (editModePersonal) {
      setEditablePersonalDetails(filing.person ?? EMPTY_PERSON);
      setErrorsPersonal({});
    }
  }, [editModePersonal]);

  useEffect(() => {
    if (editModeAddress) {
      setEditableAddress(filing.personAddress ?? EMPTY_ADDRESS);
      setErrorsAddress({});
    }
  }, [editModeAddress]);

  // ── Bank account helpers ─────────────────────────────────────────────────
  const addBankAccount = () => {
    setEditableBankAccounts([
      ...editableBankAccounts,
      { bankAccountId: -Date.now(), accountNumber: '', ifscCode: '', bankName: '', accountType: 'SB', isPrimary: false },
    ]);
  };

  const handleAddBankAccount = () => {
    if (!editModeBankAccounts) {
      setEditModeBankAccounts(true);
      setEditableBankAccounts([
        ...(filing.bankAccount.length > 0 ? filing.bankAccount : [{ ...EMPTY_BANK }]),
        { bankAccountId: -Date.now(), accountNumber: '', ifscCode: '', bankName: '', accountType: 'SB', isPrimary: false },
      ]);
    } else {
      addBankAccount();
    }
  };

  const removeBankAccount = (index: number) => {
    setEditableBankAccounts(editableBankAccounts.filter((_, i) => i !== index));
  };

  const updateBankAccount = (
    index: number,
    key: keyof BankAccountModel,
    value: string | boolean
  ) => {
    setEditableBankAccounts(
      editableBankAccounts.map((account, i) =>
        i === index ? { ...account, [key]: value } : account
      )
    );
  };

  const setPrimaryBankAccount = (index: number) => {
    setEditableBankAccounts(
      editableBankAccounts.map((account, i) => ({ ...account, isPrimary: i === index }))
    );
  };

  // ── Derived display values ───────────────────────────────────────────────
  const person = filing.person ?? EMPTY_PERSON;
  const address = filing.personAddress ?? EMPTY_ADDRESS;
  const bankAccounts =
    filing.bankAccount.length > 0 ? filing.bankAccount : [{ ...EMPTY_BANK }];

  return (
    <div className="personal-details-compact space-y-4">
      {/* Three Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Column 1: Personal Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </span>
                Personal Details
              </h3>
              {!editModePersonal ? (
                <IconButton label="Edit" onClick={() => setEditModePersonal(true)}>
                  <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                </IconButton>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelPersonalDetails}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={savePersonalDetails}>Save</Button>
                </div>
              )}
            </div>
            <div className="bg-bg-tertiary rounded-lg p-3">
              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-x-4 gap-y-3">
                <Input
                  label="First Name"
                  value={editModePersonal ? (editablePersonalDetails.firstName || '') : (person.firstName || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, firstName: e.target.value }))}
                  maxLength={25}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.firstName : undefined}
                />
                <Input
                  label="Middle Name"
                  value={editModePersonal ? (editablePersonalDetails.middleName || '') : (person.middleName || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, middleName: e.target.value }))}
                  disabled={!editModePersonal}
                />
              </div>
              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                <Input
                  label="Last Name"
                  required
                  value={editModePersonal ? (editablePersonalDetails.lastName || '') : (person.lastName || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.lastName : undefined}
                />
                <Input
                  label="Father's Name"
                  required
                  value={editModePersonal ? (editablePersonalDetails.fatherName || '') : (person.fatherName || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, fatherName: e.target.value }))}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.fatherName : undefined}
                />
              </div>
              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-x-4 gap-y-3 mt-3">
                <DatePicker
                  label="Date of Birth *"
                  value={editModePersonal ? (editablePersonalDetails.dateOfBirth || null) : (person.dateOfBirth || null)}
                  onChange={(date) => setEditablePersonalDetails(prev => ({ ...prev, dateOfBirth: date ?? null }))}
                  maxDate={new Date()}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.dateOfBirth : undefined}
                />
                <Select
                  label="Residential Status"
                  required
                  value={editModePersonal ? (editablePersonalDetails.residentialStatus || '') : (person.residentialStatus || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, residentialStatus: e.target.value }))}
                  options={residentialStatusOptions}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.residentialStatus : undefined}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Input
                  label="PAN No."
                  required
                  value={editModePersonal ? (editablePersonalDetails.panNumber || '') : (person.panNumber || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  icon={<IdentificationIcon className="w-5 h-5 text-text-muted" />}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.panNumber : undefined}
                />
                <Input
                  label="Aadhaar No."
                  value={editModePersonal ? (editablePersonalDetails.aadhaarNumber || '') : (person.aadhaarNumber || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, aadhaarNumber: e.target.value.replace(/[^\d]/g, '') }))}
                  placeholder="123456789012"
                  maxLength={12}
                  icon={<IdentificationIcon className="w-5 h-5 text-text-muted" />}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.aadhaarNumber : undefined}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Input
                  label="Email"
                  required
                  type="email"
                  value={editModePersonal ? (editablePersonalDetails.email || '') : (person.email || '')}
                  onChange={(e) => setEditablePersonalDetails(prev => ({ ...prev, email: e.target.value }))}
                  icon={<EnvelopeIcon className="w-5 h-5 text-text-muted" />}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.email : undefined}
                />
                <PhoneInput
                  label="Mobile Number"
                  required
                  phoneValue={editModePersonal ? (editablePersonalDetails.mobileNumber || '') : (person.mobileNumber || '')}
                  countryCode={editModePersonal ? (editablePersonalDetails.countryCode || '+91') : (person.countryCode || '+91')}
                  onPhoneChange={(value) => setEditablePersonalDetails(prev => ({ ...prev, mobileNumber: value }))}
                  onCountryCodeChange={(value) => setEditablePersonalDetails(prev => ({ ...prev, countryCode: value }))}
                  countryCodes={[
                    { value: '+91', label: '+91' },
                    { value: '+1', label: '+1' },
                    { value: '+44', label: '+44' },
                  ]}
                  disabled={!editModePersonal}
                  error={editModePersonal ? errorsPersonal.mobileNumber : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Address */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <HomeIcon className="w-4 h-4" />
                </span>
                Residential Address
              </h3>
              {!editModeAddress ? (
                <IconButton label="Edit" onClick={() => setEditModeAddress(true)}>
                  <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                </IconButton>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelAddress}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={saveAddress}>Save</Button>
                </div>
              )}
            </div>
            <div className="bg-bg-tertiary rounded-lg p-3">
              <div className="space-y-3">
                <Input
                  label="Flat/Door No"
                  required
                  icon={<HomeIcon className="w-4 h-4 text-gray-400" />}
                  value={editModeAddress ? (editableAddress.flatDoorNo || '') : (address.flatDoorNo || '')}
                  onChange={(e) => setEditableAddress(prev => ({ ...prev, flatDoorNo: e.target.value }))}
                  disabled={!editModeAddress}
                  error={editModeAddress ? errorsAddress.flatDoorNo : undefined}
                />
                <Input
                  label="Building/Apartment"
                  icon={<BuildingOfficeIcon className="w-4 h-4 text-gray-400" />}
                  value={editModeAddress ? (editableAddress.premiseName || '') : (address.premiseName || '')}
                  onChange={(e) => setEditableAddress(prev => ({ ...prev, premiseName: e.target.value }))}
                  disabled={!editModeAddress}
                />
                <Input
                  label="Street/Road"
                  value={editModeAddress ? (editableAddress.street || '') : (address.street || '')}
                  onChange={(e) => setEditableAddress(prev => ({ ...prev, street: e.target.value }))}
                  disabled={!editModeAddress}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Area/Locality"
                    required
                    value={editModeAddress ? (editableAddress.areaLocality || '') : (address.areaLocality || '')}
                    onChange={(e) => setEditableAddress(prev => ({ ...prev, areaLocality: e.target.value }))}
                    disabled={!editModeAddress}
                    error={editModeAddress ? errorsAddress.areaLocality : undefined}
                  />
                  <Input
                    label="PIN Code"
                    required
                    value={editModeAddress ? (editableAddress.pincode || '') : (address.pincode || '')}
                    onChange={(e) => setEditableAddress(prev => ({ ...prev, pincode: e.target.value }))}
                    maxLength={6}
                    disabled={!editModeAddress}
                    error={editModeAddress ? errorsAddress.pincode : undefined}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="City"
                    required
                    icon={<MapPinIcon className="w-4 h-4 text-gray-400" />}
                    value={editModeAddress ? (editableAddress.city || '') : (address.city || '')}
                    onChange={(e) => setEditableAddress(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!editModeAddress}
                    error={editModeAddress ? errorsAddress.city : undefined}
                  />
                  <Select
                    label="State"
                    required
                    value={editModeAddress ? (editableAddress.state || '') : (address.state || '')}
                    onChange={(e) => setEditableAddress(prev => ({ ...prev, state: e.target.value }))}
                    options={stateOptions}
                    disabled={!editModeAddress}
                    error={editModeAddress ? errorsAddress.state : undefined}
                  />
                </div>
                <Select
                  label="Country"
                  required
                  value={editModeAddress ? (editableAddress.country || '') : (address.country || '')}
                  onChange={(e) => setEditableAddress(prev => ({ ...prev, country: e.target.value }))}
                  options={countryOptions}
                  disabled={!editModeAddress}
                  error={editModeAddress ? errorsAddress.country : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Bank Accounts */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                  <BuildingLibraryIcon className="w-4 h-4" />
                </span>
                Bank Accounts
              </h3>
              <div className="flex gap-1">
                {!editModeBankAccounts ? (
                  <IconButton
                    label="Edit"
                    onClick={() => {
                      setEditableBankAccounts(
                        filing.bankAccount.length > 0 ? filing.bankAccount : [{ ...EMPTY_BANK }]
                      );
                      setErrorsBankAccounts({});
                      setEditModeBankAccounts(true);
                    }}
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-blue-600" />
                  </IconButton>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={cancelBankAccounts}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={saveBankAccounts}>Save</Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {(editModeBankAccounts ? editableBankAccounts : bankAccounts).map((account, index) => (
                <div key={account.bankAccountId ?? `bank-${index}`} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-medium text-gray-700">Account {index + 1}</h4>
                      {!editModeBankAccounts && account.isPrimary && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                          Primary
                        </span>
                      )}
                    </div>
                    {editModeBankAccounts && (
                      <IconButton label="Remove" size="xs" onClick={() => removeBankAccount(index)}>
                        <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                      </IconButton>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Input
                      label="Bank Name"
                      required
                      icon={<BuildingLibraryIcon className="w-4 h-4" />}
                      value={account.bankName as string}
                      onChange={(e) => updateBankAccount(index, 'bankName', e.target.value)}
                      disabled={!editModeBankAccounts}
                      error={editModeBankAccounts ? errorsBankAccounts[index]?.bankName : undefined}
                    />
                    <Input
                      label="Account Number"
                      required
                      icon={<CreditCardIcon className="w-4 h-4" />}
                      value={account.accountNumber as string}
                      onChange={(e) => updateBankAccount(index, 'accountNumber', e.target.value)}
                      disabled={!editModeBankAccounts}
                      error={editModeBankAccounts ? errorsBankAccounts[index]?.accountNumber : undefined}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="IFSC Code"
                        required
                        icon={<CreditCardIcon className="w-4 h-4" />}
                        value={account.ifscCode as string}
                        onChange={(e) => updateBankAccount(index, 'ifscCode', e.target.value.toUpperCase())}
                        disabled={!editModeBankAccounts}
                        error={editModeBankAccounts ? errorsBankAccounts[index]?.ifscCode : undefined}
                      />
                      <Select
                        label="Account Type"
                        required
                        value={account.accountType as string}
                        onChange={(e) => updateBankAccount(index, 'accountType', e.target.value)}
                        options={accountTypeOptions}
                        disabled={!editModeBankAccounts}
                        error={editModeBankAccounts ? errorsBankAccounts[index]?.accountType : undefined}
                      />
                    </div>
                    {editModeBankAccounts && (
                      <div className="flex items-center gap-2 pt-1">
                        <Checkbox
                          checked={account.isPrimary ?? false}
                          onChange={(e) => { if (e.target.checked) setPrimaryBankAccount(index); }}
                          id={`isPrimary-${index}`}
                        />
                        <label
                          htmlFor={`isPrimary-${index}`}
                          className="text-xs cursor-pointer select-none text-gray-600"
                        >
                          Set as primary account for refund
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <AddButton label="Add Bank Account" onClick={handleAddBankAccount} colorScheme="teal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
