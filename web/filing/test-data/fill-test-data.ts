import { FilingModel } from '../models/filing-model'

// Test data for development purposes only — all values are randomly generated and fictitious
export const TEST_FILING: Partial<FilingModel> = {
  assessmentYear: '2026-27',
  regime: 'new',

  // ── Personal Details ──────────────────────────────────────────
  person: {
    firstName: 'ARJUN',
    middleName: '',
    lastName: 'MEHTA',
    fatherName: 'Suresh Kumar Mehta',
    panNumber: 'BVZPM4821H',
    aadhaarNumber: '728394650183',
    dateOfBirth: new Date('1985-07-14'),
    residentialStatus: 'RES',
    email: 'arjun.mehta@example.com',
    mobileNumber: '9876540123',
    countryCode: '+91',
  },

  personAddress: {
    flatDoorNo: '3B-204',
    premiseName: 'Green Valley Apartments',
    street: 'MG Road',
    areaLocality: 'Banjara Hills',
    city: 'Hyderabad',
    pincode: '500034',
    state: '36',
    country: 'India',
  },

  bankAccount: [
    {
      bankAccountId: null,
      accountNumber: '3874920156',
      ifscCode: 'SBIN0004721',
      bankName: 'State Bank of India',
      accountType: 'SB',
      isPrimary: true,
    },
    {
      bankAccountId: null,
      accountNumber: '7261038495',
      ifscCode: 'HDFC0002839',
      bankName: 'HDFC Bank',
      accountType: 'SB',
      isPrimary: false,
    },
  ],

  // ── Salary ───────────────────────────────────────────────────
  salary: [
    {
      employer: {
        employerId: null,
        filingId: 0,
        employerName: 'Meridian Tech Solutions Pvt Ltd',
        employerType: 'OTH',
        tanNumber: 'BLRM29174C',
        panNumber: 'AJJPA2996K',
      },
      employerAddress: {
        employerAddressId: null,
        employerId: null,
        addressLine1: 'Block A, Cyber Towers',
        city: 'Hyderabad',
        state: '36',
        pincode: '500081',
        country: 'India',
      },
      employmentPeriod: {
        employmentPeriodId: null,
        filingId: 0,
        employerId: null,
        employmentFrom: new Date('2025-04-01'),
        employmentTo: new Date('2026-03-30'),
      },
      salaryDeduction16: {
        salaryDeductionId: null,
        filingId: 0,
        employerId: null,
        standardDeduction: 75000,
        entertainmentAllowance: 0,
        professionalTax: 2400,
      },
      salarySection171: [
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 8, amount: 1700000, exemptionAmount: 0 },
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 11, amount: 400000, exemptionAmount: 400000 },
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 13, amount: 100000, exemptionAmount: 100000 },
      ],
      salarySection172: [],
      salarySection173: [],
    },
  ],

  // ── House Property ────────────────────────────────────────────
  houseProperty: [
    {
      property: {
        propertyId: null,
        filingId: 0,
        propertyType: 'L',
        ownershipShare: 100,
        annualRentReceived: 240000,
        municipalTaxesPaid: 12000,
      },
      propertyAddress: {
        propertyAddressId: null,
        filingId: 0,
        propertyId: null,
        addressLine1: 'Plot 12, Sector 7',
        city: 'Hyderabad',
        district: 'Hyderabad',
        state: '36',
        postalCode: '500033',
        country: 'India',
      },
      propertyLoan: {
        loanId: null,
        filingId: 0,
        propertyId: null,
        vendorType: null,
        lenderName: 'HDFC Bank',
        loanAccountNumber: null,
        loanSanctionDate: null,
        totalLoanAmount: null,
        loanOutstanding: null,
        interestPaid: 150000,
        principalRepaid: null,
      },
      propertyTenants: [
        { tenantId: null, filingId: 0, propertyId: null, tenantName: 'Kavya Sharma', identifierType: 'PAN', identifierValue: 'CKTPS7312N' },
        { tenantId: null, filingId: 0, propertyId: null, tenantName: 'Rohit Nair', identifierType: 'PAN', identifierValue: 'DXRPN4856Q' },
      ],
      propertyCoowners: [
        { coownerId: null, filingId: 0, propertyId: null, coownerName: 'Sunita Mehta', coownerPan: 'FZSPM9143R', ownershipShare: 25 },
        { coownerId: null, filingId: 0, propertyId: null, coownerName: 'Vikram Joshi', coownerPan: 'GJVPJ6278T', ownershipShare: 25 },
      ],
    },
  ],

  // ── Interest Income ───────────────────────────────────────────
  interestIncome: [
    { interestId: null, filingId: 0, interestTypeId: 1, interestTypeName: 'Savings Account', providentFundType: null, amount: 80000, description: 'Bank savings interest' },
  ],

  // ── Dividend Income ───────────────────────────────────────────
  dividendIncome: {
    filingId: 0,
    equity: [
      { filingId: 0, dividendType: 'equity', currency: 'INR', narration: '16th Mar – 31st Mar dividend income from equity, stocks, and mutual funds', amount: 50000, dateOfReceipt: new Date('2026-03-31') },
    ],
    rsu: [],
  },

  // ── TDS ───────────────────────────────────────────────────────
  tds: [
    { tdsId: null, filingId: 0, deductorName: 'Meridian Tech Solutions Pvt Ltd', tan: 'BLRM29174C', pan: null, incomeSource: 'Salary', tdsSection: '192', amountPaid: 1200000, taxDeducted: 120000 },
    { tdsId: null, filingId: 0, deductorName: 'Pinnacle Analytics Pvt Ltd', tan: 'MUMB38427K', pan: null, incomeSource: 'Salary', tdsSection: '192', amountPaid: 1800000, taxDeducted: 55000 },
  ],

  // ── TCS ───────────────────────────────────────────────────────
  tcs: [
    { tcsId: null, filingId: 0, collectorName: 'Online Marketplace Ltd', tan: 'DELZ74193P', natureOfCollection: null, amountCollected: null, taxCollected: 5000 },
    { tcsId: null, filingId: 0, collectorName: 'Retail Commerce Pvt Ltd', tan: 'BLRK58362M', natureOfCollection: null, amountCollected: null, taxCollected: 6500 },
  ],

  // ── Advance Tax ───────────────────────────────────────────────
  advanceTax: [
    { taxPaidId: null, filingId: 0, bsrCode: '4817263', challanNumber: '83921', dateOfPayment: '2025-06-15', taxPaidAmount: 25000, taxType: 'advance' },
  ],

  // ── Deductions ────────────────────────────────────────────────
  section80C: [
    { deductionId: null, filingId: 0, description: 'Life Insurance Premium', policyNumber: '34567234', amount: 150000 },
  ],
  section80Ccc: [
    { deductionId: null, filingId: 0, pranNumber: 'PRAN000123456', amount: 20000 },
  ],
  section80Ccd1B: [
    { deductionId: null, filingId: 0, pranNumber: 'NPS000123456', amount: 50000 },
  ],
  section80D: {
    deductionId: null,
    filingId: 0,
    healthInsurance: [
      { filingId: 0, takenFor: 'Self & Family', insurerName: 'Star Health', policyNumber: '563457', healthInsurancePremium: 25000, includesSeniorCitizen: false },
    ],
    preventiveCheckup: [],
    medicalExpenditure: [],
  },
  section80Dd: {
    deductionId: null,
    filingId: 0,
    dependantName: 'Priya Mehta',
    dependantPan: null,
    relationToDependant: 'SPOUSE',
    disabilityType: 'Disabled',
    natureOfDisability: 'Locomotor Disability',
    expenditureIncurred: 75000,
    form101aFilingDate: null,
    form101aAckNo: null,
    udidNo: null,
  },
  section80Ddb: {
    deductionId: null,
    filingId: 0,
    treatmentFor: 'Self',
    seniorCitizenType: null,
    disease: 'cancer',
    expenditureIncurred: 45000,
  },
  section80E: [
    { deductionId: null, filingId: 0, lenderType: 'Bank', lenderName: 'Axis Bank', loanAccountNumber: '3456782', loanSanctionDate: new Date('2025-03-01'), totalLoanAmount: 4500000, loanOutstanding: 4500000, interestOnLoan: 200000 },
  ],
  section80Eeb: {
    deductionId: null,
    filingId: 0,
    vehicleMakeModel: 'Tata Nexon EV',
    vehicleRegistrationNumber: 'TS09XY5678',
    lenderType: 'Bank',
    lenderName: 'HDFC Bank',
    loanAccountNumber: 'HDFC80EEB01234',
    loanSanctionDate: new Date('2020-04-01'),
    totalLoanAmount: 3000000,
    loanOutstanding: 2500000,
    interestOnLoan: 150000,
  },
  section80G: [
    { deductionId: null, filingId: 0, doneeName: 'Prime Minister National Relief Fund', doneePan: 'AACTP4637Q', donationType: null, donationAmountCash: 0, donationAmountNonCash: 45000, donationAmount: 45000, qualifyingPercentage: '100', limitOnDeduction: 'Without Limit', addressLine1: 'South Block, Raisina Hill', city: 'New Delhi', state: '07', pincode: '110011' },
  ],
  section80Gga: [
    { deductionId: null, filingId: 0, clauseUnderDonation: '80GGA2a', doneeName: 'Scientific Research Fund', donationAmountCash: 0, donationAmountNonCash: 82220, totalDonationAmount: 82220, doneePan: 'AAAAB0001A', addressLine1: 'Plot 5, Science Park', city: 'Mumbai', state: '27', pincode: '400001' },
  ],
  section80Ggc: [
    { deductionId: null, filingId: 0, politicalPartyName: 'Sample Political Party', contributionAmountCash: 0, contributionAmountNonCash: 55000, totalContribution: 55000, dateOfDonation: new Date('2024-08-15'), transactionId: 'TXN202408150001', donorBankIfsc: 'SBIN0001234' },
  ],
  section80Tta: {
    deductionId: null,
    filingId: 0,
    interestAmount: 0,
  },
  section80U: {
    deductionId: null,
    filingId: 0,
    disabilityType: 'Disabled',
    expenditureIncurred: 75000,
    form101aAckNo: '123456789012',
  },
}
