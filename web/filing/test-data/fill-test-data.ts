import { FilingModel } from '../models/filing-model'

// Test data for development purposes only — populated from test JSON
export const TEST_FILING: Partial<FilingModel> = {
  assessmentYear: '2026-27',
  regime: 'new',

  // ── Personal Details ──────────────────────────────────────────
  person: {
    firstName: 'UDAYA ADITYA KUMAR',
    middleName: '',
    lastName: 'BHANDARU',
    fatherName: 'Bhandaru Mohan Prasad',
    panNumber: 'AWRPB1698J',
    aadhaarNumber: '354354353454',
    dateOfBirth: new Date('1984-05-08'),
    residentialStatus: 'RES',
    email: 'udayveryrich@nootus.ai',
    mobileNumber: '2222222222',
    countryCode: '+91',
  },

  personAddress: {
    flatDoorNo: '4P105',
    premiseName: 'Sai Shakthi Sadan',
    street: 'Road number2',
    areaLocality: 'Bandla Guda',
    city: 'Hyderabad',
    pincode: '506302',
    state: '36',
    country: 'India',
  },

  bankAccount: [
    {
      bankAccountId: null,
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      accountType: 'SB',
      isPrimary: true,
    },
    {
      bankAccountId: null,
      accountNumber: '45435435435',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC bank',
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
        employerName: 'Nootus AI',
        employerType: 'OTH',
        tanNumber: 'HYDC14035A',
        panNumber: null,
      },
      employerAddress: {
        employerAddressId: null,
        employerId: null,
        addressLine1: 'Hyderabad',
        city: 'Hyderabad',
        state: '36',
        pincode: '500081',
        country: 'India',
      },
      employmentPeriod: {
        employmentPeriodId: null,
        filingId: 0,
        employerId: null,
        employmentFrom: new Date('2024-04-01'),
        employmentTo: new Date('2025-03-31'),
      },
      salaryDeduction16: {
        salaryDeductionId: null,
        filingId: 0,
        employerId: null,
        standardDeduction: 50000,
        entertainmentAllowance: 2000,
        professionalTax: 2400,
      },
      salarySection171: [
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 1, amount: 1200000, exemptionAmount: 0 },
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 2, amount: 300000, exemptionAmount: 0 },
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 3, amount: 200000, exemptionAmount: 0 },
      ],
      salarySection172: [],
      salarySection173: [],
    },
    {
      employer: {
        employerId: null,
        filingId: 0,
        employerName: 'S&P Global',
        employerType: 'OTH',
        tanNumber: 'HYDC14035B',
        panNumber: null,
      },
      employerAddress: {
        employerAddressId: null,
        employerId: null,
        addressLine1: 'Hyderabad',
        city: 'Hyderabad',
        state: '36',
        pincode: '500032',
        country: 'India',
      },
      employmentPeriod: {
        employmentPeriodId: null,
        filingId: 0,
        employerId: null,
        employmentFrom: new Date('2024-04-01'),
        employmentTo: new Date('2024-09-30'),
      },
      salaryDeduction16: {
        salaryDeductionId: null,
        filingId: 0,
        employerId: null,
        standardDeduction: 50000,
        entertainmentAllowance: 0,
        professionalTax: 2400,
      },
      salarySection171: [
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 1, amount: 1800000, exemptionAmount: 0 },
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 2, amount: 100000, exemptionAmount: 0 },
        { salaryDetailId: null, filingId: 0, employerId: null, componentId: 3, amount: 200000, exemptionAmount: 0 },
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
        addressLine1: 'Plot 45, Sector 12',
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
        { tenantId: null, filingId: 0, propertyId: null, tenantName: 'Priya Reddy', identifierType: 'PAN', identifierValue: 'XYZPQ5678R' },
        { tenantId: null, filingId: 0, propertyId: null, tenantName: 'Keerthi Reddy', identifierType: 'PAN', identifierValue: 'AJJPA2996F' },
      ],
      propertyCoowners: [
        { coownerId: null, filingId: 0, propertyId: null, coownerName: 'Priya Sharma', coownerPan: 'XYZPQ5678R', ownershipShare: 25 },
        { coownerId: null, filingId: 0, propertyId: null, coownerName: 'Ravi Reddy', coownerPan: 'YYZPQ5678R', ownershipShare: 25 },
      ],
    },
  ],

  // ── Interest Income ───────────────────────────────────────────
  interestIncome: [
    { interestId: null, filingId: 0, interestTypeId: 1, interestTypeName: 'Savings Account', providentFundType: null, amount: 80000, description: 'Bank savings interest' },
  ],

  // ── TDS ───────────────────────────────────────────────────────
  tds: [
    { tdsId: null, filingId: 0, deductorName: 'Tech Solutions Pvt Ltd', tan: 'HYDT12345D', pan: null, incomeSource: 'Salary', tdsSection: '192', amountPaid: 1200000, taxDeducted: 120000 },
    { tdsId: null, filingId: 0, deductorName: 'NootusAI', tan: 'HYDT12345D', pan: null, incomeSource: 'Salary', tdsSection: '192', amountPaid: 1800000, taxDeducted: 55000 },
  ],

  // ── TCS ───────────────────────────────────────────────────────
  tcs: [
    { tcsId: null, filingId: 0, collectorName: 'Amazon Seller Services', tan: 'MUMZ98765F', natureOfCollection: null, amountCollected: null, taxCollected: 5000 },
    { tcsId: null, filingId: 0, collectorName: 'FlipCart', tan: 'HYDT12345D', natureOfCollection: null, amountCollected: null, taxCollected: 6500 },
  ],

  // ── Advance Tax ───────────────────────────────────────────────
  advanceTax: [
    { taxPaidId: null, filingId: 0, bsrCode: '0123456', challanNumber: '12345', dateOfPayment: '2025-06-15', taxPaidAmount: 25000, taxType: 'advance' },
  ],

  // ── Deductions ────────────────────────────────────────────────
  section80C: [
    { deductionId: null, filingId: 0, description: 'Life Insurance Premium', amount: 150000 },
  ],
  section80Ccc: [
    { deductionId: null, filingId: 0, pranNumber: '', amount: 20000 },
  ],
  section80Ccd1B: [
    { deductionId: null, filingId: 0, pranNumber: '', amount: 50000 },
  ],
  section80D: {
    deductionId: null,
    filingId: 0,
    healthInsurance: [],
    preventiveCheckup: [],
    medicalExpenditure: [],
  },
  section80Dd: {
    deductionId: null,
    filingId: 0,
    dependantName: 'Dependent Person',
    dependantPan: null,
    relationToDependant: 'SPOUSE',
    disabilityType: 'Disabled',
    natureOfDisability: null,
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
    { deductionId: null, filingId: 0, lenderType: 'bank', lenderName: 'HDFC Bank', loanAccountNumber: null, loanSanctionDate: null, totalLoanAmount: null, loanOutstanding: null, interestOnLoan: 95000 },
  ],
  section80Ee: {
    deductionId: null,
    filingId: 0,
    lenderType: 'bank',
    lenderName: 'SBI',
    loanAccountNumber: null,
    loanSanctionDate: null,
    totalLoanAmount: null,
    loanOutstanding: null,
    interestOnLoan: 50000,
  },
  section80Eea: {
    deductionId: null,
    filingId: 0,
    lenderType: 'bank',
    lenderName: 'ICICI Bank',
    loanAccountNumber: null,
    loanSanctionDate: null,
    totalLoanAmount: null,
    loanOutstanding: null,
    interestOnLoan: 35000,
  },
  section80Eeb: {
    deductionId: null,
    filingId: 0,
    vehicleMakeModel: 'Tata Nexon EV',
    vehicleRegistrationNumber: 'TS09AB1234',
    lenderType: 'bank',
    lenderName: 'HDFC Bank',
    loanAccountNumber: null,
    loanSanctionDate: null,
    totalLoanAmount: null,
    loanOutstanding: null,
    interestOnLoan: 150000,
  },
  section80G: [
    { deductionId: null, filingId: 0, doneeName: 'PM Relief Fund', doneePan: null, donationType: null, donationAmountCash: 0, donationAmountNonCash: 45000, donationAmount: 45000, qualifyingPercentage: null, limitOnDeduction: null, addressLine1: null, city: null, state: null },
  ],
  section80Gga: [
    { deductionId: null, filingId: 0, doneeName: 'Scientific Research Fund', donationAmountCash: 0, donationAmountNonCash: 95000, totalDonationAmount: 95000 },
  ],
  section80Gg: {
    deductionId: null,
    filingId: 0,
    rentPaidAmount: 5000,
    acknowledgementNo10Ba: null,
  },
  section80Ggc: [
    { deductionId: null, filingId: 0, politicalPartyName: 'Local Party', contributionAmountCash: 0, contributionAmountNonCash: 55000, totalContribution: 55000 },
  ],
  section80Tta: {
    deductionId: null,
    filingId: 0,
    interestAmount: 10000,
  },
  section80Ttb: {
    deductionId: null,
    filingId: 0,
    interestAmount: 5000,
  },
  section80U: {
    deductionId: null,
    filingId: 0,
    disabilityType: 'Disabled',
    expenditureIncurred: 75000,
  },
}
