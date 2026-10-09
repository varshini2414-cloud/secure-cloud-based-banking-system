export type SecurityPolicyMode = 'dynamic_adaptive' | 'strict_zero_trust' | 'fixed_legacy';

export type SecurityDecision = 'ALLOW' | 'STEP_UP_MFA' | 'BLOCK_AND_ALERT';

export type DeviceTrustLevel =
  | 'trusted_biometric'
  | 'known_browser'
  | 'unrecognized_device'
  | 'emulator_tor_proxy';

export type BeneficiaryTrustStatus =
  | 'verified_recurring'
  | 'existing_domestic'
  | 'newly_added_unverified'
  | 'high_risk_offshore';

export type LocationTrustStatus =
  | 'home_geofence'
  | 'domestic_regional'
  | 'foreign_unannounced'
  | 'impossible_travel_vpn';

export type VelocityFrequencyLevel =
  | 'normal_1_per_hr'
  | 'elevated_3_per_15m'
  | 'rapid_burst_6_per_5m'
  | 'automated_structuring_12_per_m';

export type ActivityAnomalyLevel =
  | 'normal_hygiene'
  | 'off_hours_3am'
  | 'recent_credential_reset'
  | 'session_hijack_paste_pattern';

export interface RiskFactorWeights {
  amountWeight: number;
  deviceWeight: number;
  beneficiaryWeight: number;
  locationWeight: number;
  frequencyWeight: number;
  anomalyWeight: number;
}

export interface RiskThresholds {
  allowMaxScore: number; // default 34 (0-34 = ALLOW)
  stepUpMaxScore: number; // default 69 (35-69 = STEP_UP_MFA, 70-100 = BLOCK_AND_ALERT)
}

export interface RiskFactorBreakdown {
  factorKey: 'amount' | 'device' | 'beneficiary' | 'location' | 'frequency' | 'anomaly';
  label: string;
  rawRiskNormalized: number; // 0 to 100
  weightPct: number;
  weightedContribution: number;
  awsServiceEvaluator: string;
  telemetryDetail: string;
  severity: 'nominal' | 'elevated' | 'critical';
}

export interface TransactionInput {
  accountId: string;
  amountUsd: number;
  beneficiaryName: string;
  beneficiaryIban: string;
  beneficiaryStatus: BeneficiaryTrustStatus;
  deviceTrust: DeviceTrustLevel;
  deviceName: string;
  locationStatus: LocationTrustStatus;
  locationLabel: string;
  ipAddress: string;
  frequencyLevel: VelocityFrequencyLevel;
  anomalyLevel: ActivityAnomalyLevel;
  channel: 'Mobile Banking Enclave' | 'Web Commercial Portal' | 'OpenBanking REST API';
}

export interface RiskEvaluationResult {
  totalRiskScore: number;
  decision: SecurityDecision;
  traditionalFixedAuthDecision: SecurityDecision;
  traditionalFixedAuthFlaw: string;
  requiredActionLabel: string;
  factors: RiskFactorBreakdown[];
  awsPipelineTrace: {
    cognitoAuthStatus: string;
    apiGatewayLatencyMs: number;
    lambdaComputeMs: number;
    kmsKeyArn: string;
    dynamoDbWriteStatus: string;
    cloudWatchLogStream: string;
  };
}

export interface BankAccountProfile {
  id: string;
  holderName: string;
  tier: string;
  accountNumberMasked: string;
  balanceUsd: number;
  avgTransactionUsd: number;
  dailyLimitUsd: number;
  homeLocation: string;
  registeredDevice: string;
  cognitoSub: string;
  iamRoleArn: string;
  kmsKeyId: string;
  mfaEnrolled: string;
  sessionStatus: 'active_verified' | 'step_up_pending' | 'quarantined';
}

export interface LedgerTransaction {
  id: string;
  timestamp: string;
  accountId: string;
  holderName: string;
  beneficiaryName: string;
  beneficiaryIban: string;
  amountUsd: number;
  riskScore: number;
  decision: SecurityDecision;
  fixedAuthWouldHave: SecurityDecision;
  verificationMethod: string;
  deviceInfo: string;
  locationInfo: string;
  frequencyInfo: string;
  anomalyInfo: string;
  kmsKeyArn: string;
  kmsCiphertextPreview: string;
  dynamoDbPartitionKey: string;
  lambdaRequestId: string;
  factors: RiskFactorBreakdown[];
}

export interface CloudWatchLogEvent {
  id: string;
  timestamp: string;
  service:
    | 'Amazon Cognito'
    | 'Amazon API Gateway'
    | 'AWS Lambda'
    | 'Amazon DynamoDB'
    | 'AWS KMS'
    | 'AWS IAM'
    | 'Amazon CloudWatch';
  logGroup: string;
  level: 'INFO' | 'WARN' | 'CRITICAL';
  eventType: string;
  message: string;
  requestId: string;
  riskScore?: number;
}

export interface SecurityIncidentAlert {
  id: string;
  timestamp: string;
  accountId: string;
  holderName: string;
  severity: 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  awsTriggerSource: string;
  recommendedRemediation: string;
  riskScore: number;
  status: 'active' | 'mitigated';
}

export interface AIRiskPolicyRecommendation {
  source: string;
  executiveSummary: string;
  iamAndKmsHardeningAdvice: string;
  estimatedFraudReductionPct: number;
  falsePositiveReductionPct: number;
  recommendedWeights: RiskFactorWeights;
  thresholdRecommendations: {
    allowMaxScore: number;
    stepUpMaxScore: number;
    rationale: string;
  };
  factorInsights: Array<{
    factorName: string;
    currentWeight: number;
    recommendedWeight: number;
    vulnerabilityAddressed: string;
  }>;
}

export interface ThreatScenarioPreset {
  id: string;
  name: string;
  category:
    | 'Routine Legitimate'
    | 'Step-Up Anomaly'
    | 'High-Severity Attack'
    | 'Safe & Normal'
    | 'Needs Quick Check'
    | 'Dangerous Scam';
  description: string;
  attackVector: string;
  fixedAuthOutcome: string;
  dynamicRiskOutcome: string;
  input: TransactionInput;
}
