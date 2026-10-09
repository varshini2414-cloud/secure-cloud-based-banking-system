import {
  TransactionInput,
  BankAccountProfile,
  RiskFactorWeights,
  RiskThresholds,
  SecurityPolicyMode,
  RiskEvaluationResult,
  RiskFactorBreakdown,
  SecurityDecision,
  CloudWatchLogEvent,
} from '../types';

/**
 * Evaluates a banking transaction across 6 real-time contextual risk factors
 * inside the simulated AWS Lambda Dynamic Risk Scoring Engine.
 */
export function evaluateTransactionRisk(
  input: TransactionInput,
  account: BankAccountProfile,
  weights: RiskFactorWeights,
  thresholds: RiskThresholds,
  policyMode: SecurityPolicyMode
): RiskEvaluationResult {
  const totalWeightSum = Math.max(
    1,
    weights.amountWeight +
      weights.deviceWeight +
      weights.beneficiaryWeight +
      weights.locationWeight +
      weights.frequencyWeight +
      weights.anomalyWeight
  );

  // 1. Transaction Amount Factor (0 - 100)
  const ratioToAvg = input.amountUsd / Math.max(100, account.avgTransactionUsd);
  const ratioToLimit = input.amountUsd / Math.max(1000, account.dailyLimitUsd);

  let amountRaw = 10;
  if (ratioToLimit >= 1.0) {
    amountRaw = Math.min(100, 88 + Math.round((ratioToLimit - 1.0) * 25));
  } else if (ratioToAvg >= 6.0) {
    amountRaw = Math.min(92, 70 + Math.round((ratioToAvg - 6.0) * 4));
  } else if (ratioToAvg >= 2.5) {
    amountRaw = 38 + Math.round((ratioToAvg - 2.5) * 9);
  } else if (ratioToAvg >= 1.2) {
    amountRaw = 16 + Math.round((ratioToAvg - 1.2) * 14);
  } else {
    amountRaw = Math.max(4, Math.round(ratioToAvg * 12));
  }

  const amountDetail = `₹${input.amountUsd.toLocaleString('en-IN')} is ${ratioToAvg.toFixed(1)}x customer's usual transfer (₹${account.avgTransactionUsd.toLocaleString('en-IN')}) and ${Math.round(
    ratioToLimit * 100
  )}% of daily limit`;

  // 2. Device Information Factor (0 - 100)
  const deviceScoreMap: Record<
    TransactionInput['deviceTrust'],
    { score: number; detail: string }
  > = {
    trusted_biometric: {
      score: 4,
      detail: `Customer's enrolled phone / laptop (${account.registeredDevice}) · Biometric match`,
    },
    known_browser: {
      score: 24,
      detail: `Recognized browser used before (${input.deviceName})`,
    },
    unrecognized_device: {
      score: 68,
      detail: `Brand-new device never used on this account before (${input.deviceName})`,
    },
    emulator_tor_proxy: {
      score: 96,
      detail: `Automated hacker program or hidden proxy network detected`,
    },
  };

  // 3. Beneficiary Status Factor (0 - 100)
  const beneficiaryScoreMap: Record<
    TransactionInput['beneficiaryStatus'],
    { score: number; detail: string }
  > = {
    verified_recurring: {
      score: 5,
      detail: `Regular trusted bill or friend (${input.beneficiaryName})`,
    },
    existing_domestic: {
      score: 26,
      detail: `Standard domestic bank account (${input.beneficiaryIban})`,
    },
    newly_added_unverified: {
      score: 72,
      detail: `Brand-new recipient added less than 10 minutes ago (${input.beneficiaryName})`,
    },
    high_risk_offshore: {
      score: 95,
      detail: `Unverified overseas account in high-risk foreign jurisdiction`,
    },
  };

  // 4. Location & Geo-Velocity Factor (0 - 100)
  const locationScoreMap: Record<
    TransactionInput['locationStatus'],
    { score: number; detail: string }
  > = {
    home_geofence: {
      score: 5,
      detail: `At home or usual city (${account.homeLocation})`,
    },
    domestic_regional: {
      score: 28,
      detail: `Another city in same country (${input.locationLabel}) · Normal travel`,
    },
    foreign_unannounced: {
      score: 74,
      detail: `Foreign country without travel notice (${input.locationLabel})`,
    },
    impossible_travel_vpn: {
      score: 98,
      detail: `Impossible travel speed: jumped across the world in just 14 minutes`,
    },
  };

  // 5. Transaction Frequency / Velocity Factor (0 - 100)
  const frequencyScoreMap: Record<
    TransactionInput['frequencyLevel'],
    { score: number; detail: string }
  > = {
    normal_1_per_hr: {
      score: 6,
      detail: `1 transfer today · Normal relaxed pace`,
    },
    elevated_3_per_15m: {
      score: 46,
      detail: `3 transfers in 15 minutes · Somewhat busy pace`,
    },
    rapid_burst_6_per_5m: {
      score: 82,
      detail: `6 rapid transfers in 5 minutes · Rushing money out quickly`,
    },
    automated_structuring_12_per_m: {
      score: 99,
      detail: `Non-stop automated transfers every few seconds · Robotic drain attack`,
    },
  };

  // 6. Unusual Activity & Behavioral Hygiene Factor (0 - 100)
  const anomalyScoreMap: Record<
    TransactionInput['anomalyLevel'],
    { score: number; detail: string }
  > = {
    normal_hygiene: {
      score: 5,
      detail: `Normal daytime banking habits · Clean session`,
    },
    off_hours_3am: {
      score: 44,
      detail: `Unusual middle-of-the-night transfer (03:18 AM)`,
    },
    recent_credential_reset: {
      score: 78,
      detail: `Password was reset just 6 minutes before this transfer`,
    },
    session_hijack_paste_pattern: {
      score: 96,
      detail: `Bank details pasted in instantly + location changed mid-session`,
    },
  };

  const rawFactors: Array<{
    key: RiskFactorBreakdown['factorKey'];
    label: string;
    raw: number;
    weight: number;
    service: string;
    detail: string;
  }> = [
    {
      key: 'amount',
      label: '1. Transfer Amount',
      raw: amountRaw,
      weight: (weights.amountWeight / totalWeightSum) * 100,
      service: 'Account Spending History Check',
      detail: amountDetail,
    },
    {
      key: 'device',
      label: '2. Device Recognized',
      raw: deviceScoreMap[input.deviceTrust].score,
      weight: (weights.deviceWeight / totalWeightSum) * 100,
      service: 'Phone & Laptop Hardware Check',
      detail: deviceScoreMap[input.deviceTrust].detail,
    },
    {
      key: 'beneficiary',
      label: '3. Recipient Trust',
      raw: beneficiaryScoreMap[input.beneficiaryStatus].score,
      weight: (weights.beneficiaryWeight / totalWeightSum) * 100,
      service: 'Trusted Payee History Check',
      detail: beneficiaryScoreMap[input.beneficiaryStatus].detail,
    },
    {
      key: 'location',
      label: '4. Location & Travel Speed',
      raw: locationScoreMap[input.locationStatus].score,
      weight: (weights.locationWeight / totalWeightSum) * 100,
      service: 'City & Internet Provider Check',
      detail: locationScoreMap[input.locationStatus].detail,
    },
    {
      key: 'frequency',
      label: '5. Transfer Speed & Pace',
      raw: frequencyScoreMap[input.frequencyLevel].score,
      weight: (weights.frequencyWeight / totalWeightSum) * 100,
      service: 'Live Speed & Repetition Counter',
      detail: frequencyScoreMap[input.frequencyLevel].detail,
    },
    {
      key: 'anomaly',
      label: '6. Unusual Habits & Time',
      raw: anomalyScoreMap[input.anomalyLevel].score,
      weight: (weights.anomalyWeight / totalWeightSum) * 100,
      service: 'Behavior & Nighttime Watch',
      detail: anomalyScoreMap[input.anomalyLevel].detail,
    },
  ];

  const factors: RiskFactorBreakdown[] = rawFactors.map((f) => {
    const contribution = Math.round(f.raw * (f.weight / 100) * 10) / 10;
    let severity: RiskFactorBreakdown['severity'] = 'nominal';
    if (f.raw >= 70) severity = 'critical';
    else if (f.raw >= 35) severity = 'elevated';

    return {
      factorKey: f.key,
      label: f.label,
      rawRiskNormalized: f.raw,
      weightPct: Math.round(f.weight * 10) / 10,
      weightedContribution: contribution,
      awsServiceEvaluator: f.service,
      telemetryDetail: f.detail,
      severity,
    };
  });

  // Base weighted sum
  let totalScore = factors.reduce((sum, f) => sum + f.weightedContribution, 0);

  // Compound risk correlation boost (when 2+ critical vectors co-occur)
  const criticalCount = factors.filter((f) => f.rawRiskNormalized >= 70).length;
  if (criticalCount >= 3) {
    totalScore = Math.min(100, totalScore + 12);
  } else if (criticalCount === 2) {
    totalScore = Math.min(100, totalScore + 6);
  }

  const finalRiskScore = Math.max(1, Math.min(100, Math.round(totalScore)));

  // Effective thresholds based on policyMode
  const effectiveAllowMax =
    policyMode === 'strict_zero_trust'
      ? Math.max(15, thresholds.allowMaxScore - 10)
      : thresholds.allowMaxScore;
  const effectiveStepUpMax =
    policyMode === 'strict_zero_trust'
      ? Math.max(45, thresholds.stepUpMaxScore - 12)
      : thresholds.stepUpMaxScore;

  // Traditional Fixed Authentication Decision:
  // Static password/session systems only check if session token is valid and amount <= hard limit
  const traditionalFixedAuthDecision: SecurityDecision =
    input.amountUsd > account.dailyLimitUsd * 1.25 ? 'BLOCK_AND_ALERT' : 'ALLOW';

  let decision: SecurityDecision = 'ALLOW';
  if (policyMode === 'fixed_legacy') {
    decision = traditionalFixedAuthDecision;
  } else {
    if (finalRiskScore <= effectiveAllowMax) {
      decision = 'ALLOW';
    } else if (finalRiskScore <= effectiveStepUpMax) {
      decision = 'STEP_UP_MFA';
    } else {
      decision = 'BLOCK_AND_ALERT';
    }
  }

  const traditionalFixedAuthFlaw =
    finalRiskScore > effectiveAllowMax && traditionalFixedAuthDecision === 'ALLOW'
      ? `The old password-only system would have blindly approved this because the password matched, completely ignoring ${criticalCount > 0 ? `${criticalCount} major danger signs` : 'elevated risk signs'} (Danger Score ${finalRiskScore}/100)!`
      : 'Both the old password check and the smart safety system agree this is a safe, normal transfer.';

  const requiredActionLabel =
    decision === 'ALLOW'
      ? 'Instant Approval · Safe to transfer immediately'
      : decision === 'STEP_UP_MFA'
      ? 'Quick Verification: Customer is asked for a 6-digit passcode or fingerprint'
      : 'Stop & Protect: Payment blocked immediately and customer account locked';

  return {
    totalRiskScore: finalRiskScore,
    decision,
    traditionalFixedAuthDecision,
    traditionalFixedAuthFlaw,
    requiredActionLabel,
    factors,
    awsPipelineTrace: {
      cognitoAuthStatus:
        decision === 'ALLOW'
          ? 'Login Safe & Verified (Low Risk)'
          : decision === 'STEP_UP_MFA'
          ? 'Verification Required: One-Time Passcode Sent'
          : 'Access Suspended: Account Locked for Safety',
      apiGatewayLatencyMs: 11 + (finalRiskScore % 7),
      lambdaComputeMs: 18 + (finalRiskScore % 11),
      kmsKeyArn: `key/${account.kmsKeyId}`,
      dynamoDbWriteStatus:
        decision === 'ALLOW'
          ? 'Securely Recorded in Vault (Encrypted)'
          : decision === 'STEP_UP_MFA'
          ? 'Holding: Waiting for Customer Verification'
          : 'Blocked: Saved to Safety Audit Log',
      cloudWatchLogStream: `security-monitor/${new Date().toISOString().slice(0, 10)}`,
    },
  };
}

/**
 * Generates realistic AWS KMS Envelope Encryption ciphertext preview for DynamoDB inspection
 */
export function generateKmsCiphertextPreview(
  txId: string,
  accountId: string,
  amountUsd: number,
  iban: string
): string {
  const payloadSeed = `${txId}:${accountId}:${amountUsd}:${iban}:AES256GCM`;
  const base64Body = typeof btoa === 'function' ? btoa(payloadSeed) : payloadSeed;
  return `AQICAHh8f3K9mN2pL5vR8xQ1wZ4yT7uJ0cV6bN3mK9pL2qW5eR8tY1uI4oP7aS0dF3gH6jK9lZ2xC5vB8nM1qW4eR7tY0uI3oP==.${base64Body}`;
}

/**
 * Generates a realistic streaming Amazon CloudWatch log event
 */
export function generateCloudWatchStreamEvent(
  accounts: BankAccountProfile[]
): CloudWatchLogEvent {
  const account = accounts[Math.floor(Math.random() * accounts.length)];
  const now = new Date();
  const timeStr =
    now.toTimeString().split(' ')[0] +
    '.' +
    String(now.getMilliseconds()).padStart(3, '0');
  const reqId = `${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}`;

  const templates: Array<Omit<CloudWatchLogEvent, 'id' | 'timestamp' | 'requestId'>> = [
    {
      service: 'AWS Lambda',
      logGroup: '/aws/lambda/aegis-dynamic-risk-engine',
      level: 'INFO',
      eventType: 'RISK_SCORE_COMPUTED',
      message: `Safety check passed for ${account.holderName} (${account.id}): Score 12/100 · Clean habits, safe device · Approved in 18ms`,
      riskScore: 12,
    },
    {
      service: 'Amazon Cognito',
      logGroup: '/aws/cognito/userpool-us-east-1-aegis',
      level: 'INFO',
      eventType: 'JWT_AUTHORIZER_VALIDATED',
      message: `Verified login for ${account.holderName} · Recognized device (${account.registeredDevice})`,
    },
    {
      service: 'AWS KMS',
      logGroup: '/aws/kms/cmk-envelope-audit',
      level: 'INFO',
      eventType: 'GENERATE_DATA_KEY_AES256',
      message: `Digital bank vault locked account data for ${account.id} with secure encryption key`,
    },
    {
      service: 'Amazon DynamoDB',
      logGroup: '/aws/dynamodb/aegis-prod-banking-ledger',
      level: 'INFO',
      eventType: 'PUT_ITEM_ENCRYPTED',
      message: `Saved approved transfer record to tamper-proof vault for ${account.holderName}`,
    },
    {
      service: 'Amazon API Gateway',
      logGroup: '/aws/apigateway/aegis-banking-v2-prod',
      level: 'WARN',
      eventType: 'STEP_UP_CHALLENGE_ISSUED',
      message: `Safety check asked for 1-time text code for ${account.holderName} · Transfer sent from an unfamiliar browser`,
      riskScore: 52,
    },
    {
      service: 'AWS IAM',
      logGroup: '/aws/iam/sts-session-guard',
      level: 'INFO',
      eventType: 'ASSUME_ROLE_LEAST_PRIVILEGE',
      message: `Bank permission check verified: only authorized banking services can access ${account.id}'s balance`,
    },
  ];

  const chosen = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: timeStr,
    requestId: reqId,
    ...chosen,
  };
}
