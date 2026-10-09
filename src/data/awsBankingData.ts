import {
  BankAccountProfile,
  RiskFactorWeights,
  RiskThresholds,
  LedgerTransaction,
  SecurityIncidentAlert,
  ThreatScenarioPreset,
  CloudWatchLogEvent,
} from '../types';
import { generateKmsCiphertextPreview } from '../services/riskScoringEngine';

export const DEFAULT_RISK_WEIGHTS: RiskFactorWeights = {
  amountWeight: 25,
  deviceWeight: 20,
  beneficiaryWeight: 20,
  locationWeight: 15,
  frequencyWeight: 10,
  anomalyWeight: 10,
};

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  allowMaxScore: 34,
  stepUpMaxScore: 69,
};

const CORE_FEATURED_ACCOUNTS: BankAccountProfile[] = [
  {
    id: 'ACC-9041',
    holderName: 'Priya Sharma',
    tier: 'Priority Savings Account',
    accountNumberMasked: '****-****-8841',
    balanceUsd: 485600.5,
    avgTransactionUsd: 12500,
    dailyLimitUsd: 100000,
    homeLocation: 'Bengaluru, Karnataka (AWS ap-south-1 Mumbai)',
    registeredDevice: 'iPhone 16 Pro · FaceID Enclave',
    cognitoSub: 'a84c91e0-3f2b-4d91-9b12-7748291048a1',
    iamRoleArn: 'arn:aws:iam::492019482110:role/CognitoAuth_RetailTier1Role',
    kmsKeyId: 'mrk-8841a9c02f8b41d39e71',
    mfaEnrolled: 'Aadhaar OTP + Biometric Passkey',
    sessionStatus: 'active_verified',
  },
  {
    id: 'ACC-3108',
    holderName: 'Rajesh Kumar',
    tier: 'Corporate Current Account',
    accountNumberMasked: '****-****-3108',
    balanceUsd: 1875000.0,
    avgTransactionUsd: 45000,
    dailyLimitUsd: 500000,
    homeLocation: 'Mumbai, Maharashtra (AWS ap-south-1 Mumbai)',
    registeredDevice: 'MacBook Pro M4 · TouchID Secure Enclave',
    cognitoSub: 'c91f44b2-8a11-4c70-8e42-1190482310b2',
    iamRoleArn: 'arn:aws:iam::492019482110:role/CognitoAuth_CommercialTreasuryRole',
    kmsKeyId: 'mrk-3108b7d91e4c49a28f04',
    mfaEnrolled: 'Corporate FIDO2 Token + Mobile OTP',
    sessionStatus: 'active_verified',
  },
  {
    id: 'ACC-7724',
    holderName: 'Dr. Ananya Iyer',
    tier: 'Premier Wealth Account',
    accountNumberMasked: '****-****-7724',
    balanceUsd: 840250.75,
    avgTransactionUsd: 18000,
    dailyLimitUsd: 200000,
    homeLocation: 'Chennai, Tamil Nadu (AWS ap-south-1 Mumbai)',
    registeredDevice: 'Pixel 9 Pro · Titan M2 Biometric',
    cognitoSub: 'f32d18c4-5e90-4a12-b781-9938172635c3',
    iamRoleArn: 'arn:aws:iam::492019482110:role/CognitoAuth_PremierGlobalRole',
    kmsKeyId: 'mrk-7724f5e19a3b48c19d22',
    mfaEnrolled: 'UPI MPIN + Biometric Push',
    sessionStatus: 'active_verified',
  },
  {
    id: 'ACC-5519',
    holderName: 'Vikramaditya Verma',
    tier: 'Standard Savings Account',
    accountNumberMasked: '****-****-5519',
    balanceUsd: 165400.0,
    avgTransactionUsd: 4200,
    dailyLimitUsd: 50000,
    homeLocation: 'New Delhi, Delhi (AWS ap-south-1 Mumbai)',
    registeredDevice: 'Samsung Galaxy S25 · Knox Vault',
    cognitoSub: 'd19a77e6-2b44-4f08-9c33-4481920394d4',
    iamRoleArn: 'arn:aws:iam::492019482110:role/CognitoAuth_StandardRetailRole',
    kmsKeyId: 'mrk-5519c2a84d1e47b08e15',
    mfaEnrolled: 'Bank Mobile App Passkey',
    sessionStatus: 'active_verified',
  },
];

const FIRST_NAMES = [
  'Aarav', 'Aditya', 'Aishwarya', 'Akash', 'Amit', 'Ananya', 'Anil', 'Anirudh',
  'Ankita', 'Anushka', 'Arjun', 'Arun', 'Ashok', 'Bhavna', 'Chetan', 'Deepak',
  'Deepika', 'Dev', 'Dhruv', 'Divya', 'Gaurav', 'Gayatri', 'Geeta', 'Harish',
  'Harsh', 'Isha', 'Ishaan', 'Jaya', 'Kalyani', 'Karan', 'Karthik', 'Kavita',
  'Kiran', 'Krishna', 'Lakshmi', 'Madhav', 'Manish', 'Manoj', 'Meera', 'Mohan',
  'Mukesh', 'Naveen', 'Neha', 'Nikhil', 'Nisha', 'Nitin', 'Pallavi', 'Pooja',
  'Pradeep', 'Prakash', 'Pranav', 'Prashant', 'Priya', 'Rahul', 'Rajesh', 'Rakesh',
  'Ram', 'Ramesh', 'Rashmi', 'Ravi', 'Ritu', 'Rohan', 'Rohit', 'Sachin',
  'Sameer', 'Sandhya', 'Sanjay', 'Santosh', 'Sarita', 'Shalini', 'Shashi', 'Shikha',
  'Shiv', 'Shreya', 'Shruti', 'Siddharth', 'Sneha', 'Soniya', 'Soumya', 'Subhash',
  'Sudhir', 'Sujata', 'Suman', 'Sunil', 'Sunita', 'Suresh', 'Swati', 'Tarun',
  'Umesh', 'Varun', 'Vidya', 'Vijay', 'Vikas', 'Vikram', 'Vinay', 'Vishal', 'Vivek'
];

const LAST_NAMES = [
  'Agarwal', 'Banerjee', 'Bhat', 'Bhatia', 'Chakraborty', 'Chatterjee', 'Chauhan', 'Chopra',
  'Choudhury', 'Das', 'Desai', 'Deshmukh', 'Doshi', 'Dutta', 'Gandhi', 'Ghosh',
  'Gill', 'Gopal', 'Gowda', 'Gupta', 'Hegde', 'Iyer', 'Jadhav', 'Jain',
  'Jha', 'Joshi', 'Kapoor', 'Kaur', 'Khan', 'Khanna', 'Khatri', 'Kulkarni',
  'Kumar', 'Mahajan', 'Malhotra', 'Mehta', 'Menon', 'Mishra', 'Mukherjee', 'Murthy',
  'Naidu', 'Nair', 'Nambiar', 'Pandey', 'Patel', 'Patil', 'Pillai', 'Prasad',
  'Puri', 'Radhakrishnan', 'Rao', 'Reddy', 'Roy', 'Sarin', 'Saxena', 'Sen',
  'Sengupta', 'Seth', 'Shah', 'Sharma', 'Shetty', 'Shinde', 'Singh', 'Singhania',
  'Sinha', 'Soni', 'Srinivasan', 'Subramanian', 'Swaminathan', 'Tandon', 'Thakur', 'Trivedi',
  'Upadhyay', 'Varma', 'Verma', 'Vyas', 'Yadav'
];

const TIERS: Array<{
  name: string;
  iamRole: string;
  minBal: number;
  maxBal: number;
  avgTx: number;
  dailyLimit: number;
}> = [
  {
    name: 'Standard Savings Account',
    iamRole: 'arn:aws:iam::492019482110:role/CognitoAuth_StandardRetailRole',
    minBal: 10000,
    maxBal: 250000,
    avgTx: 4200,
    dailyLimit: 50000,
  },
  {
    name: 'Priority Savings Account',
    iamRole: 'arn:aws:iam::492019482110:role/CognitoAuth_RetailTier1Role',
    minBal: 250000,
    maxBal: 1200000,
    avgTx: 15000,
    dailyLimit: 200000,
  },
  {
    name: 'Premier Wealth Account',
    iamRole: 'arn:aws:iam::492019482110:role/CognitoAuth_PremierGlobalRole',
    minBal: 500000,
    maxBal: 3500000,
    avgTx: 28000,
    dailyLimit: 400000,
  },
  {
    name: 'Corporate Current Account',
    iamRole: 'arn:aws:iam::492019482110:role/CognitoAuth_CommercialTreasuryRole',
    minBal: 1200000,
    maxBal: 9500000,
    avgTx: 65000,
    dailyLimit: 1000000,
  },
  {
    name: 'Smart Fixed Deposit Vault',
    iamRole: 'arn:aws:iam::492019482110:role/CognitoAuth_SavingsVaultRole',
    minBal: 50000,
    maxBal: 800000,
    avgTx: 8500,
    dailyLimit: 100000,
  },
];

const HOME_LOCATIONS = [
  'Bengaluru, Karnataka (AWS ap-south-1 Mumbai)',
  'Mumbai, Maharashtra (AWS ap-south-1 Mumbai)',
  'New Delhi, Delhi (AWS ap-south-1 Mumbai)',
  'Hyderabad, Telangana (AWS ap-south-2 Hyderabad)',
  'Chennai, Tamil Nadu (AWS ap-south-1 Mumbai)',
  'Pune, Maharashtra (AWS ap-south-1 Mumbai)',
  'Kolkata, West Bengal (AWS ap-south-1 Mumbai)',
  'Ahmedabad, Gujarat (AWS ap-south-1 Mumbai)',
  'Jaipur, Rajasthan (AWS ap-south-1 Mumbai)',
  'Kochi, Kerala (AWS ap-south-1 Mumbai)',
  'Chandigarh, Punjab (AWS ap-south-1 Mumbai)',
  'Lucknow, Uttar Pradesh (AWS ap-south-1 Mumbai)',
  'Indore, Madhya Pradesh (AWS ap-south-1 Mumbai)',
  'Coimbatore, Tamil Nadu (AWS ap-south-1 Mumbai)',
  'Visakhapatnam, Andhra Pradesh (AWS ap-south-2 Hyderabad)',
  'Surat, Gujarat (AWS ap-south-1 Mumbai)',
  'Bhubaneswar, Odisha (AWS ap-south-1 Mumbai)',
  'Nagpur, Maharashtra (AWS ap-south-1 Mumbai)',
  'Goa (AWS ap-south-1 Mumbai)',
  'Guwahati, Assam (AWS ap-south-1 Mumbai)',
];

const REGISTERED_DEVICES = [
  'iPhone 16 Pro · FaceID Enclave',
  'MacBook Pro M4 · TouchID Secure Enclave',
  'Pixel 9 Pro · Titan M2 Biometric',
  'iPad Air M2 · TouchID Bound',
  'Samsung Galaxy S25 Ultra · Knox Vault',
  'Windows 11 Enterprise · TPM 2.0 Hello',
  'MacBook Air M3 · TouchID Enclave',
  'iPhone 15 Pro Max · FaceID Bound',
  'ThinkPad X1 Carbon · FIDO2 Biometric',
  'Surface Laptop 7 · Pluton TPM Enclave',
];

const MFA_METHODS = [
  'WebAuthn Passkey + Authenticator TOTP',
  'Hardware FIDO2 YubiKey + TOTP',
  'Biometric Push + SMS Fallback',
  'Cognito TOTP Authenticator',
  'Platform Passkey (FaceID / TouchID)',
];

function capitalizeName(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Deterministically generates 1,000 realistic AWS Cognito & DynamoDB customer accounts
 * (4 primary featured accounts + 996 generated accounts).
 */
function buildThousandSampleAccounts(): BankAccountProfile[] {
  const result: BankAccountProfile[] = [...CORE_FEATURED_ACCOUNTS];
  const reservedIds = new Set(CORE_FEATURED_ACCOUNTS.map((a) => a.id));

  let seq = 1001;
  while (result.length < 1000) {
    const candidateId = `ACC-${seq}`;
    seq++;
    if (reservedIds.has(candidateId)) continue;

    const idx = result.length;
    const fName = capitalizeName(FIRST_NAMES[(idx * 7 + 3) % FIRST_NAMES.length]);
    const lName = LAST_NAMES[(idx * 13 + 11) % LAST_NAMES.length];
    const tierSpec = TIERS[(idx * 3) % TIERS.length];

    // Deterministic pseudo-random factor in [0, 1)
    const hashSeed = ((idx * 2654435761) >>> 0) % 10000;
    const norm = hashSeed / 10000;

    const balanceRaw = tierSpec.minBal + norm * (tierSpec.maxBal - tierSpec.minBal);
    const balanceUsd = Math.round(balanceRaw * 100) / 100;
    const avgTransactionUsd = Math.max(
      120,
      Math.round((tierSpec.avgTx * (0.75 + norm * 0.55)) / 10) * 10
    );

    const last4 = String(1000 + ((idx * 73 + 19) % 9000));
    const hexPart = (10000000 + idx * 48271).toString(16).slice(0, 8);

    let sessionStatus: BankAccountProfile['sessionStatus'] = 'active_verified';
    if (idx % 47 === 0) sessionStatus = 'quarantined';
    else if (idx % 23 === 0) sessionStatus = 'step_up_pending';

    result.push({
      id: candidateId,
      holderName: `${fName} ${lName}`,
      tier: tierSpec.name,
      accountNumberMasked: `****-****-${last4}`,
      balanceUsd,
      avgTransactionUsd,
      dailyLimitUsd: tierSpec.dailyLimit,
      homeLocation: HOME_LOCATIONS[(idx * 5) % HOME_LOCATIONS.length],
      registeredDevice: REGISTERED_DEVICES[(idx * 9) % REGISTERED_DEVICES.length],
      cognitoSub: `${hexPart}-${(1000 + (idx % 8999)).toString(16)}-4b2a-9c1d-${(
        100000000000 +
        idx * 918273
      )
        .toString(16)
        .slice(0, 12)}`,
      iamRoleArn: tierSpec.iamRole,
      kmsKeyId: `mrk-${last4}${hexPart}49a28f`,
      mfaEnrolled: MFA_METHODS[(idx * 11) % MFA_METHODS.length],
      sessionStatus,
    });
  }

  return result;
}

export const INITIAL_ACCOUNTS: BankAccountProfile[] = buildThousandSampleAccounts();

export const THREAT_SCENARIO_PRESETS: ThreatScenarioPreset[] = [
  {
    id: 'SCEN-ROUTINE',
    name: '1. Everyday Electric Bill (₹1,450)',
    category: 'Safe & Normal',
    description:
      'Priya pays her regular ₹1,450 Tata Power Mumbai electricity bill from her trusted phone with Face ID from home in Bengaluru.',
    attackVector: 'Zero risk — Normal utility payment from home mobile phone',
    fixedAuthOutcome: 'Approved (Password matched)',
    dynamicRiskOutcome: 'Instant Approval (Score 6/100 · Safe & smooth)',
    input: {
      accountId: 'ACC-9041',
      amountUsd: 1450,
      beneficiaryName: 'Tata Power Mumbai (Electricity Bill)',
      beneficiaryIban: 'ICIC0000104 · TATAPOWER@icici',
      beneficiaryStatus: 'verified_recurring',
      deviceTrust: 'trusted_biometric',
      deviceName: 'Priya’s iPhone 16 Pro · Face ID Enrolled',
      locationStatus: 'home_geofence',
      locationLabel: 'Bengaluru, Karnataka (Home Airtel Fiber)',
      ipAddress: '106.51.78.214',
      frequencyLevel: 'normal_1_per_hr',
      anomalyLevel: 'normal_hygiene',
      channel: 'Mobile Banking Enclave',
    },
  },
  {
    id: 'SCEN-STEPUP-DEVICE',
    name: '2. New Computer + New Contractor (₹45,000)',
    category: 'Needs Quick Check',
    description:
      'Someone logs in from a brand-new Windows laptop in another city and tries to send ₹45,000 to a newly added home renovation contractor.',
    attackVector: 'Brand-new laptop + new recipient + transfer is 3.6x larger than usual',
    fixedAuthOutcome: 'Old bank would blindly approve (Password was correct)',
    dynamicRiskOutcome: 'Quick Verification Needed (Score 54/100 · Asks for 1-time text code)',
    input: {
      accountId: 'ACC-9041',
      amountUsd: 45000,
      beneficiaryName: 'Sharma Interior Works (New Contractor)',
      beneficiaryIban: 'HDFC0001892 · 918274019283',
      beneficiaryStatus: 'newly_added_unverified',
      deviceTrust: 'unrecognized_device',
      deviceName: 'Windows 11 Laptop · New Chrome Browser',
      locationStatus: 'domestic_regional',
      locationLabel: 'Pune, Maharashtra (Business Travel)',
      ipAddress: '49.207.52.19',
      frequencyLevel: 'normal_1_per_hr',
      anomalyLevel: 'normal_hygiene',
      channel: 'Web Commercial Portal',
    },
  },
  {
    id: 'SCEN-STEPUP-TRAVEL',
    name: '3. Late-Night Transfer from Overseas (₹85,000)',
    category: 'Needs Quick Check',
    description:
      'Dr. Ananya is traveling in London and sends ₹85,000 at 3:15 AM India time from her laptop to an existing mutual fund account.',
    attackVector: 'Transfer sent from overseas late at night without prior travel notice',
    fixedAuthOutcome: 'Old bank would approve (Doesn\'t check travel or time of day)',
    dynamicRiskOutcome: 'Quick Verification Needed (Score 47/100 · Asks for quick biometric confirmation)',
    input: {
      accountId: 'ACC-7724',
      amountUsd: 85000,
      beneficiaryName: 'Nippon India Mutual Fund',
      beneficiaryIban: 'SBIN0000412 · 004122918830',
      beneficiaryStatus: 'existing_domestic',
      deviceTrust: 'known_browser',
      deviceName: 'Ananya’s MacBook Air · Safari Browser',
      locationStatus: 'foreign_unannounced',
      locationLabel: 'London, UK (Airport Wi-Fi)',
      ipAddress: '81.134.202.44',
      frequencyLevel: 'elevated_3_per_15m',
      anomalyLevel: 'off_hours_3am',
      channel: 'Web Commercial Portal',
    },
  },
  {
    id: 'SCEN-ATTACK-HIJACK',
    name: '4. Stolen Password Used Overseas (₹2,50,000)',
    category: 'Dangerous Scam',
    description:
      'A scammer stole Priya\'s netbanking login and tries to transfer ₹2,50,000 to an offshore shell account in Europe just 14 minutes after she logged in at home in Bengaluru.',
    attackVector: 'Impossible travel (across the world in 14 minutes) + hacker tool + unknown foreign account',
    fixedAuthOutcome: 'DANGER! Old bank would lose all ₹2,50,000 because the password matched',
    dynamicRiskOutcome: 'BLOCKED! (Score 94/100 · Money protected immediately & account locked)',
    input: {
      accountId: 'ACC-9041',
      amountUsd: 250000,
      beneficiaryName: 'Global Apex Offshore Shell Holdings Ltd',
      beneficiaryIban: 'CY17-0020-0128-0000-0012-0052-7600',
      beneficiaryStatus: 'high_risk_offshore',
      deviceTrust: 'emulator_tor_proxy',
      deviceName: 'Automated Hacker Program · Hidden Network',
      locationStatus: 'impossible_travel_vpn',
      locationLabel: 'Frankfurt, Germany (4,800 km away in 14 min)',
      ipAddress: '185.220.101.47',
      frequencyLevel: 'rapid_burst_6_per_5m',
      anomalyLevel: 'session_hijack_paste_pattern',
      channel: 'OpenBanking REST API',
    },
  },
  {
    id: 'SCEN-ATTACK-STRUCTURING',
    name: '5. Fast Money Drain After Password Reset (₹95,000)',
    category: 'Dangerous Scam',
    description:
      'A scammer resets the account password, then fires rapid automated UPI/IMPS transfers every few seconds to empty the customer\'s balance.',
    attackVector: 'Multiple rapid transfers in seconds immediately after password reset',
    fixedAuthOutcome: 'DANGER! Old bank would allow it because each payment is under the daily limit',
    dynamicRiskOutcome: 'BLOCKED! (Score 86/100 · System halts all transfers to protect money)',
    input: {
      accountId: 'ACC-3108',
      amountUsd: 95000,
      beneficiaryName: 'Suspicious Forex Crypto Bridge',
      beneficiaryIban: 'EE38-2200-2210-2014-5685',
      beneficiaryStatus: 'high_risk_offshore',
      deviceTrust: 'unrecognized_device',
      deviceName: 'Automated Script · Unregistered Computer',
      locationStatus: 'foreign_unannounced',
      locationLabel: 'Tallinn, Estonia (Unknown Datacenter)',
      ipAddress: '91.198.174.192',
      frequencyLevel: 'automated_structuring_12_per_m',
      anomalyLevel: 'recent_credential_reset',
      channel: 'OpenBanking REST API',
    },
  },
];

export const INITIAL_LEDGER_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: 'TXN-894120',
    timestamp: '22:58:14.209',
    accountId: 'ACC-9041',
    holderName: 'Priya Sharma',
    beneficiaryName: 'Global Apex Offshore Shell Holdings Ltd',
    beneficiaryIban: 'CY17-0020-0128-0000-0012-0052-7600',
    amountUsd: 250000,
    riskScore: 94,
    decision: 'BLOCK_AND_ALERT',
    fixedAuthWouldHave: 'ALLOW',
    verificationMethod: 'Blocked automatically · Account locked for safety',
    deviceInfo: 'Automated Hacker Program · Hidden Network',
    locationInfo: 'Frankfurt, Germany (Impossible Travel in 14m)',
    frequencyInfo: '6 rapid transfers in 5 mins',
    anomalyInfo: 'Copied bank details + sudden location switch',
    kmsKeyArn: 'arn:aws:kms:ap-south-1:492019482110:key/mrk-8841a9c02f8b41d39e71',
    kmsCiphertextPreview: generateKmsCiphertextPreview(
      'TXN-894120',
      'ACC-9041',
      250000,
      'CY17-0020-0128-0000-0012-0052-7600'
    ),
    dynamoDbPartitionKey: 'PK#ACCT#ACC-9041 :: SK#TXN#2026-10-07T22:58:14Z',
    lambdaRequestId: 'req-9941a8c2-71b4-4e11-9d02-88371625a1',
    factors: [],
  },
  {
    id: 'TXN-894115',
    timestamp: '22:54:02.618',
    accountId: 'ACC-9041',
    holderName: 'Priya Sharma',
    beneficiaryName: 'Sharma Interior Works (New Contractor)',
    beneficiaryIban: 'HDFC0001892 · 918274019283',
    amountUsd: 45000,
    riskScore: 54,
    decision: 'STEP_UP_MFA',
    fixedAuthWouldHave: 'ALLOW',
    verificationMethod: 'Customer entered Aadhaar OTP to confirm',
    deviceInfo: 'Windows 11 Laptop · New Browser',
    locationInfo: 'Pune, Maharashtra (Domestic Travel)',
    frequencyInfo: '1 transfer per hour (Normal)',
    anomalyInfo: 'Clean regular habits',
    kmsKeyArn: 'arn:aws:kms:ap-south-1:492019482110:key/mrk-8841a9c02f8b41d39e71',
    kmsCiphertextPreview: generateKmsCiphertextPreview(
      'TXN-894115',
      'ACC-9041',
      45000,
      'HDFC0001892 · 918274019283'
    ),
    dynamoDbPartitionKey: 'PK#ACCT#ACC-9041 :: SK#TXN#2026-10-07T22:54:02Z',
    lambdaRequestId: 'req-7721c4b9-12a8-4f01-8c33-66192837b2',
    factors: [],
  },
  {
    id: 'TXN-894108',
    timestamp: '22:49:39.104',
    accountId: 'ACC-3108',
    holderName: 'Rajesh Kumar',
    beneficiaryName: 'Infosys Cloud Infrastructure Vendor',
    beneficiaryIban: 'SBIN0001290 · 119284710291',
    amountUsd: 65000,
    riskScore: 9,
    decision: 'ALLOW',
    fixedAuthWouldHave: 'ALLOW',
    verificationMethod: 'Instant Approval · Trusted laptop + regular vendor bill',
    deviceInfo: 'MacBook Pro M4 · Touch ID Enrolled',
    locationInfo: 'Mumbai, Maharashtra (Head Office)',
    frequencyInfo: '1 transfer per hour (Normal)',
    anomalyInfo: 'Clean regular habits',
    kmsKeyArn: 'arn:aws:kms:ap-south-1:492019482110:key/mrk-3108b7d91e4c49a28f04',
    kmsCiphertextPreview: generateKmsCiphertextPreview(
      'TXN-894108',
      'ACC-3108',
      65000,
      'SBIN0001290 · 119284710291'
    ),
    dynamoDbPartitionKey: 'PK#ACCT#ACC-3108 :: SK#TXN#2026-10-07T22:49:39Z',
    lambdaRequestId: 'req-5519e2d1-90c4-4a88-b122-33491827c3',
    factors: [],
  },
  {
    id: 'TXN-894099',
    timestamp: '22:41:18.882',
    accountId: 'ACC-7724',
    holderName: 'Dr. Ananya Iyer',
    beneficiaryName: 'Nippon India Mutual Fund',
    beneficiaryIban: 'SBIN0000412 · 004122918830',
    amountUsd: 85000,
    riskScore: 47,
    decision: 'STEP_UP_MFA',
    fixedAuthWouldHave: 'ALLOW',
    verificationMethod: 'Customer confirmed via quick phone notification',
    deviceInfo: 'Ananya’s MacBook Air · Safari Browser',
    locationInfo: 'London, UK (Overseas Trip)',
    frequencyInfo: '3 transfers in 15 mins',
    anomalyInfo: 'Sent at 3:15 AM home time',
    kmsKeyArn: 'arn:aws:kms:ap-south-1:492019482110:key/mrk-7724f5e19a3b48c19d22',
    kmsCiphertextPreview: generateKmsCiphertextPreview(
      'TXN-894099',
      'ACC-7724',
      85000,
      'SBIN0000412 · 004122918830'
    ),
    dynamoDbPartitionKey: 'PK#ACCT#ACC-7724 :: SK#TXN#2026-10-07T22:41:18Z',
    lambdaRequestId: 'req-3301f8a4-44e2-4b19-9a77-11293847d4',
    factors: [],
  },
  {
    id: 'TXN-894091',
    timestamp: '22:32:50.412',
    accountId: 'ACC-5519',
    holderName: 'Vikramaditya Verma',
    beneficiaryName: 'BESCOM Bengaluru Electricity Bill',
    beneficiaryIban: 'HDFC0000055 · BESCOM@hdfcbank',
    amountUsd: 2400,
    riskScore: 7,
    decision: 'ALLOW',
    fixedAuthWouldHave: 'ALLOW',
    verificationMethod: 'Instant Approval · Normal routine utility bill',
    deviceInfo: 'Samsung Galaxy S25 · Knox Vault',
    locationInfo: 'New Delhi, Delhi (Home Wi-Fi)',
    frequencyInfo: '1 transfer per hour (Normal)',
    anomalyInfo: 'Clean regular habits',
    kmsKeyArn: 'arn:aws:kms:ap-south-1:492019482110:key/mrk-5519c2a84d1e47b08e15',
    kmsCiphertextPreview: generateKmsCiphertextPreview(
      'TXN-894091',
      'ACC-5519',
      2400,
      'HDFC0000055 · BESCOM@hdfcbank'
    ),
    dynamoDbPartitionKey: 'PK#ACCT#ACC-5519 :: SK#TXN#2026-10-07T22:32:50Z',
    lambdaRequestId: 'req-1198b3c7-66d1-4e92-8f11-99827364e5',
    factors: [],
  },
];

export const INITIAL_SECURITY_ALERTS: SecurityIncidentAlert[] = [
  {
    id: 'ALRT-9921',
    timestamp: '2 mins ago',
    accountId: 'ACC-9041',
    holderName: 'Priya Sharma',
    severity: 'critical',
    title: 'High Alert: ₹2,50,000 Scam Transfer Blocked in Germany',
    description:
      'A scammer attempted to send ₹2,50,000 to an unknown overseas account from Germany just 14 minutes after Priya logged in at home in Bengaluru. The system stopped the money and protected the account.',
    awsTriggerSource: 'Safety Brain: Danger Score 94/100 (Threshold is 70)',
    recommendedRemediation:
      'Logged out suspicious devices, required Priya to set a new password, and blocked the scammer\'s account number.',
    riskScore: 94,
    status: 'active',
  },
  {
    id: 'ALRT-9918',
    timestamp: '8 mins ago',
    accountId: 'ACC-9041',
    holderName: 'Priya Sharma',
    severity: 'medium',
    title: 'Quick Check: One-Time Code Sent for ₹45,000 Transfer',
    description:
      'Priya used a new Windows laptop in Pune to send ₹45,000 to a contractor for the first time. The system texted her a 6-digit Aadhaar OTP to verify it was really her, and she entered it successfully.',
    awsTriggerSource: 'Safety Brain: Check Score 54/100',
    recommendedRemediation:
      'Device temporarily verified for this transfer; continuing normal monitoring.',
    riskScore: 54,
    status: 'mitigated',
  },
  {
    id: 'ALRT-9912',
    timestamp: '19 mins ago',
    accountId: 'ACC-7724',
    holderName: 'Dr. Ananya Iyer',
    severity: 'medium',
    title: 'Travel Verification: ₹85,000 Sent from London at Night',
    description:
      'Dr. Ananya sent ₹85,000 while traveling in London at 3:15 AM India time. The bank asked her for quick fingerprint confirmation on her phone before letting the money go through.',
    awsTriggerSource: 'Location & Time Watch: Score 47/100',
    recommendedRemediation:
      'Verified by Ananya; temporary travel status recorded so her future trip payments run smoothly.',
    riskScore: 47,
    status: 'mitigated',
  },
];

export const INITIAL_CLOUDWATCH_LOGS: CloudWatchLogEvent[] = [
  {
    id: 'CW-901241',
    timestamp: '22:58:14.210',
    service: 'Amazon CloudWatch',
    logGroup: '/aws/lambda/safe-banking-risk-engine',
    level: 'CRITICAL',
    eventType: 'FRAUD_PREEMPTION_BLOCK',
    message:
      'Blocked suspicious payment of ₹2,50,000 for Priya Sharma. Danger score was 94/100. Money kept safe in vault and security team notified.',
    requestId: 'req-9941a8c2-71b4',
    riskScore: 94,
  },
  {
    id: 'CW-901238',
    timestamp: '22:54:02.620',
    service: 'Amazon Cognito',
    logGroup: '/aws/cognito/userpool-ap-south-1-safebank',
    level: 'WARN',
    eventType: 'ADAPTIVE_CHALLENGE_PASSED',
    message:
      'Priya Sharma entered the Aadhaar OTP on her phone and approved her ₹45,000 payment.',
    requestId: 'req-7721c4b9-12a8',
    riskScore: 54,
  },
  {
    id: 'CW-901230',
    timestamp: '22:49:39.110',
    service: 'AWS KMS',
    logGroup: '/aws/kms/cmk-envelope-audit',
    level: 'INFO',
    eventType: 'ENVELOPE_ENCRYPT_COMMIT',
    message:
      'Safely locked Rajesh Kumar\'s ₹65,000 payment with digital bank vault encryption (ap-south-1 Mumbai).',
    requestId: 'req-5519e2d1-90c4',
    riskScore: 9,
  },
];
