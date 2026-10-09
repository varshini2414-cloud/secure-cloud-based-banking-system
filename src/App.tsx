import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BankAccountProfile,
  TransactionInput,
  RiskFactorWeights,
  RiskThresholds,
  SecurityPolicyMode,
  LedgerTransaction,
  CloudWatchLogEvent,
  SecurityIncidentAlert,
  AIRiskPolicyRecommendation,
  ThreatScenarioPreset,
} from './types';
import {
  INITIAL_ACCOUNTS,
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
  INITIAL_LEDGER_TRANSACTIONS,
  INITIAL_SECURITY_ALERTS,
  INITIAL_CLOUDWATCH_LOGS,
  THREAT_SCENARIO_PRESETS,
} from './data/awsBankingData';
import {
  evaluateTransactionRisk,
  generateKmsCiphertextPreview,
  generateCloudWatchStreamEvent,
} from './services/riskScoringEngine';
import { Header, ActiveWorkspaceView } from './components/Header';
import { TransactionRiskSandbox } from './components/TransactionRiskSandbox';
import { CognitoAccountDirectory } from './components/CognitoAccountDirectory';
import { AWSArchitectureTopology } from './components/AWSArchitectureTopology';
import { DynamoDBLedgerInspector } from './components/DynamoDBLedgerInspector';
import { CloudWatchMonitoring } from './components/CloudWatchMonitoring';
import { AIRiskPolicyAdvisor } from './components/AIRiskPolicyAdvisor';
import { ThreatSimulationModal } from './components/ThreatSimulationModal';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveWorkspaceView>('sandbox');
  const [policyMode, setPolicyMode] = useState<SecurityPolicyMode>('dynamic_adaptive');

  // Accounts & Selected Account
  const [accounts, setAccounts] = useState<BankAccountProfile[]>(INITIAL_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ACC-9041');

  // 6-Factor Weights & Thresholds
  const [weights, setWeights] = useState<RiskFactorWeights>(DEFAULT_RISK_WEIGHTS);
  const [thresholds, setThresholds] = useState<RiskThresholds>(DEFAULT_RISK_THRESHOLDS);

  // Live Transaction Input State
  const [transactionInput, setTransactionInput] = useState<TransactionInput>(
    THREAT_SCENARIO_PRESETS[1].input
  );

  // DynamoDB Encrypted Ledger, CloudWatch Logs, and Security Alerts
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(
    INITIAL_LEDGER_TRANSACTIONS
  );
  const [cloudWatchLogs, setCloudWatchLogs] = useState<CloudWatchLogEvent[]>(
    INITIAL_CLOUDWATCH_LOGS
  );
  const [securityAlerts, setSecurityAlerts] = useState<SecurityIncidentAlert[]>(
    INITIAL_SECURITY_ALERTS
  );
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);

  // Threat Simulator Modal
  const [isThreatModalOpen, setIsThreatModalOpen] = useState<boolean>(false);

  // Dynamic Risk Policy Recommendation
  const [aiRecommendation, setAiRecommendation] =
    useState<AIRiskPolicyRecommendation | null>({
      source: 'SafeBank Dynamic Risk Policy Engine',
      executiveSummary:
        'All accounts are currently protected by our 6-signal safety system. Giving extra priority to recognizing saved devices and verified recipients stops scammers with stolen passwords, while letting you pay normal daily bills without any delay.',
      iamAndKmsHardeningAdvice:
        'Always ask for a fresh 1-time text code on payments over ₹50,000, and keep all customer balances scrambled with bank-grade digital keys.',
      estimatedFraudReductionPct: 98.4,
      falsePositiveReductionPct: 67.2,
      recommendedWeights: {
        amountWeight: 22,
        deviceWeight: 22,
        beneficiaryWeight: 21,
        locationWeight: 16,
        frequencyWeight: 10,
        anomalyWeight: 9,
      },
      thresholdRecommendations: {
        allowMaxScore: 32,
        stepUpMaxScore: 66,
        rationale:
          'Lowering the verification cutoff from 69 to 66 catches new unrecognized devices and first-time foreign accounts earlier.',
      },
      factorInsights: [
        {
          factorName: 'Payment Amount & Daily Spending Limit',
          currentWeight: 25,
          recommendedWeight: 22,
          vulnerabilityAddressed:
            'Prevents sneaky medium-sized transfers from slipping through solely because the rupee amount is moderate.',
        },
        {
          factorName: 'Trusted Phone, Computer, or Browser',
          currentWeight: 20,
          recommendedWeight: 22,
          vulnerabilityAddressed:
            'Checks if the device was previously verified to neutralize stolen passwords from stranger devices.',
        },
        {
          factorName: 'Recipient Trust & Previous Payment History',
          currentWeight: 20,
          recommendedWeight: 21,
          vulnerabilityAddressed:
            'Checks if the recipient has a clean history or is an unfamiliar, first-time foreign account.',
        },
        {
          factorName: 'Location & Travel Speed',
          currentWeight: 15,
          recommendedWeight: 16,
          vulnerabilityAddressed:
            'Catches impossible fast travel between distant cities and hidden internet connections.',
        },
        {
          factorName: 'Fast Repeated Payments in Short Time',
          currentWeight: 10,
          recommendedWeight: 10,
          vulnerabilityAddressed:
            'Stops automated bots trying to drain funds through rapid back-to-back transfers.',
        },
        {
          factorName: 'Unusual Time of Night & Pasted Account Numbers',
          currentWeight: 10,
          recommendedWeight: 9,
          vulnerabilityAddressed:
            'Notices strange middle-of-the-night timing and transfers right after a password change.',
        },
      ],
    });
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || accounts[0],
    [accounts, selectedAccountId]
  );

  // Real-time 6-factor risk evaluation
  const evaluation = useMemo(
    () =>
      evaluateTransactionRisk(
        transactionInput,
        selectedAccount,
        weights,
        thresholds,
        policyMode
      ),
    [transactionInput, selectedAccount, weights, thresholds, policyMode]
  );

  // Refs for background CloudWatch telemetry stream
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;
  const isStreamPausedRef = useRef(isStreamPaused);
  isStreamPausedRef.current = isStreamPaused;

  useEffect(() => {
    const timer = setInterval(() => {
      if (isStreamPausedRef.current) return;
      const evt = generateCloudWatchStreamEvent(accountsRef.current);
      setCloudWatchLogs((prev) => [evt, ...prev.slice(0, 79)]);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Trigger AI Risk Policy Audit from backend
  const handleRefreshAiPolicy = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/optimize-risk-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWeights: weights,
          thresholds,
          recentTransactions: transactions.slice(0, 5),
          activeAlerts: securityAlerts,
          policyMode,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: AIRiskPolicyRecommendation = await response.json();
      setAiRecommendation(data);
    } catch (_err) {
      // Keep deterministic recommendation on network error
    } finally {
      setIsAiLoading(false);
    }
  }, [weights, thresholds, transactions, securityAlerts, policyMode]);

  // Execute Transaction through simulated AWS API Gateway -> Lambda -> KMS -> DynamoDB -> CloudWatch
  const handleExecuteTransaction = useCallback(
    (
      mfaVerified: boolean = false
    ): {
      status: 'executed' | 'step_up_required' | 'blocked';
      message: string;
      txId?: string;
    } => {
      const now = new Date();
      const timeStr =
        now.toTimeString().split(' ')[0] +
        '.' +
        String(now.getMilliseconds()).padStart(3, '0');
      const txId = `TXN-${Math.floor(894125 + Math.random() * 9000)}`;
      const reqId = `req-${Math.random().toString(16).slice(2, 10)}-${Math.random()
        .toString(16)
        .slice(2, 6)}`;

      const finalDecision =
        evaluation.decision === 'STEP_UP_MFA' && !mfaVerified
          ? 'STEP_UP_MFA'
          : evaluation.decision;

      if (finalDecision === 'STEP_UP_MFA' && !mfaVerified) {
        return {
          status: 'step_up_required',
          message:
            'Amazon Cognito Adaptive Authentication Challenge issued. Complete MFA verification to settle transfer.',
        };
      }

      const kmsArn = `arn:aws:kms:us-east-1:492019482110:key/${selectedAccount.kmsKeyId}`;
      const newLedgerEntry: LedgerTransaction = {
        id: txId,
        timestamp: timeStr,
        accountId: selectedAccount.id,
        holderName: selectedAccount.holderName,
        beneficiaryName: transactionInput.beneficiaryName,
        beneficiaryIban: transactionInput.beneficiaryIban,
        amountUsd: transactionInput.amountUsd,
        riskScore: evaluation.totalRiskScore,
        decision: finalDecision,
        fixedAuthWouldHave: evaluation.traditionalFixedAuthDecision,
        verificationMethod:
          finalDecision === 'ALLOW'
            ? 'Auto-Approved (Low Risk Score) · Cognito JWT + KMS Encrypted'
            : finalDecision === 'STEP_UP_MFA'
            ? 'Cognito Step-Up TOTP / WebAuthn Passkey Verified'
            : 'Blocked by Lambda Risk Engine · IAM Session Quarantined',
        deviceInfo: transactionInput.deviceName,
        locationInfo: `${transactionInput.locationLabel} (${transactionInput.ipAddress})`,
        frequencyInfo: transactionInput.frequencyLevel.replace(/_/g, ' '),
        anomalyInfo: transactionInput.anomalyLevel.replace(/_/g, ' '),
        kmsKeyArn: kmsArn,
        kmsCiphertextPreview: generateKmsCiphertextPreview(
          txId,
          selectedAccount.id,
          transactionInput.amountUsd,
          transactionInput.beneficiaryIban
        ),
        dynamoDbPartitionKey: `PK#ACCT#${selectedAccount.id} :: SK#TXN#${now.toISOString()}`,
        lambdaRequestId: reqId,
        factors: evaluation.factors,
      };

      setTransactions((prev) => [newLedgerEntry, ...prev]);

      if (finalDecision === 'ALLOW' || (finalDecision === 'STEP_UP_MFA' && mfaVerified)) {
        // Deduct from account balance
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === selectedAccount.id
              ? {
                  ...a,
                  balanceUsd: Math.max(0, a.balanceUsd - transactionInput.amountUsd),
                }
              : a
          )
        );

        const cwEvent: CloudWatchLogEvent = {
          id: `CW-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: timeStr,
          service: mfaVerified ? 'Amazon Cognito' : 'Amazon DynamoDB',
          logGroup: '/aws/lambda/aegis-dynamic-risk-engine',
          level: mfaVerified ? 'WARN' : 'INFO',
          eventType: mfaVerified ? 'STEP_UP_VERIFIED_COMMIT' : 'LOW_RISK_AUTO_COMMIT',
          message: `Committed ${txId} (₹${transactionInput.amountUsd.toLocaleString('en-IN')}) to DynamoDB under KMS CMK key/${
            selectedAccount.kmsKeyId
          } · Score ${evaluation.totalRiskScore}/100`,
          requestId: reqId,
          riskScore: evaluation.totalRiskScore,
        };
        setCloudWatchLogs((prev) => [cwEvent, ...prev]);

        return {
          status: 'executed',
          txId,
          message: `Risk Score ${evaluation.totalRiskScore}/100. Payload encrypted with AWS KMS (${selectedAccount.kmsKeyId}) and committed to Amazon DynamoDB (${reqId}).`,
        };
      } else {
        // BLOCK_AND_ALERT: Quarantine account session & dispatch CloudWatch alarm
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === selectedAccount.id ? { ...a, sessionStatus: 'quarantined' } : a
          )
        );

        const newAlert: SecurityIncidentAlert = {
          id: `ALRT-${Math.floor(9930 + Math.random() * 900)}`,
          timestamp: 'Just now',
          accountId: selectedAccount.id,
          holderName: selectedAccount.holderName,
          severity: 'critical',
          title: `Dangerous Transfer Stopped (${txId} · ₹${transactionInput.amountUsd.toLocaleString('en-IN')})`,
          description: `Safety system calculated a danger score of ${evaluation.totalRiskScore}/100 for payment to ${transactionInput.beneficiaryName} from ${transactionInput.locationLabel} (${transactionInput.deviceName}).`,
          awsTriggerSource:
            'Safety Brain -> Live Alarm -> Automatic Account Lock',
          recommendedRemediation:
            'Lock account for safety, ask customer to confirm password, and verify recipient bank details.',
          riskScore: evaluation.totalRiskScore,
          status: 'active',
        };
        setSecurityAlerts((prev) => [newAlert, ...prev]);

        const cwCrit: CloudWatchLogEvent = {
          id: `CW-${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: timeStr,
          service: 'Amazon CloudWatch',
          logGroup: '/aws/lambda/aegis-dynamic-risk-engine',
          level: 'CRITICAL',
          eventType: 'FRAUD_BLOCK_AND_QUARANTINE',
          message: `Blocked ${txId} (₹${transactionInput.amountUsd.toLocaleString('en-IN')}) for ${
            selectedAccount.id
          } · Score ${
            evaluation.totalRiskScore
          }/100 exceeded safety limit ${thresholds.stepUpMaxScore} · Account Locked for Safety`,
          requestId: reqId,
          riskScore: evaluation.totalRiskScore,
        };
        setCloudWatchLogs((prev) => [cwCrit, ...prev]);

        return {
          status: 'blocked',
          txId,
          message: `Safety Score ${evaluation.totalRiskScore}/100 exceeded the safe limit (${thresholds.stepUpMaxScore}). Transfer stopped immediately, account locked for your safety, and security team alerted.`,
        };
      }
    },
    [evaluation, selectedAccount, transactionInput, thresholds]
  );

  const handleRestoreAccountSession = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId ? { ...a, sessionStatus: 'active_verified' } : a
      )
    );
  };

  const handleToggleAccountQuarantine = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              sessionStatus:
                a.sessionStatus === 'quarantined' ? 'active_verified' : 'quarantined',
            }
          : a
      )
    );
  };

  const handleMitigateAlert = (alertId: string) => {
    setSecurityAlerts((prev) =>
      prev.map((al) => (al.id === alertId ? { ...al, status: 'mitigated' } : al))
    );
  };

  const handleApplyAiRecommendation = (rec: AIRiskPolicyRecommendation) => {
    setWeights(rec.recommendedWeights);
    setThresholds({
      allowMaxScore: rec.thresholdRecommendations.allowMaxScore,
      stepUpMaxScore: rec.thresholdRecommendations.stepUpMaxScore,
    });
  };

  const handleLaunchScenarioFromModal = (
    preset: ThreatScenarioPreset,
    autoExecute: boolean
  ) => {
    setSelectedAccountId(preset.input.accountId);
    setTransactionInput({ ...preset.input });
    setActiveView('sandbox');
    if (autoExecute) {
      setTimeout(() => {
        const targetAcct =
          accounts.find((a) => a.id === preset.input.accountId) || accounts[0];
        const evalRes = evaluateTransactionRisk(
          preset.input,
          targetAcct,
          weights,
          thresholds,
          policyMode
        );
        if (evalRes.decision !== 'STEP_UP_MFA') {
          handleExecuteTransaction(false);
        }
      }, 60);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* 3-Zone Top Bar */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        policyMode={policyMode}
        onSelectPolicyMode={setPolicyMode}
        onOpenThreatModal={() => setIsThreatModalOpen(true)}
      />

      {/* Main 1440px Workspace Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeView === 'sandbox' && (
          <TransactionRiskSandbox
            accounts={accounts}
            selectedAccount={selectedAccount}
            onSelectAccount={setSelectedAccountId}
            transactionInput={transactionInput}
            onChangeInput={setTransactionInput}
            evaluation={evaluation}
            policyMode={policyMode}
            thresholds={thresholds}
            onExecuteTransaction={handleExecuteTransaction}
            onRestoreAccountSession={handleRestoreAccountSession}
            onOpenAccountDirectory={() => setActiveView('directory')}
          />
        )}

        {activeView === 'directory' && (
          <CognitoAccountDirectory
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccountForSandbox={(accId) => {
              const target = accounts.find((a) => a.id === accId) || accounts[0];
              setSelectedAccountId(accId);
              setTransactionInput((prev) => ({
                ...prev,
                accountId: accId,
                deviceName: target.registeredDevice,
                locationLabel: target.homeLocation,
              }));
              setActiveView('sandbox');
            }}
            onToggleAccountQuarantine={handleToggleAccountQuarantine}
          />
        )}

        {activeView === 'architecture' && (
          <AWSArchitectureTopology
            evaluation={evaluation}
            selectedAccount={selectedAccount}
            transactionInput={transactionInput}
            onJumpToSandbox={() => setActiveView('sandbox')}
          />
        )}

        {activeView === 'ledger' && (
          <DynamoDBLedgerInspector
            transactions={transactions}
            onOpenSandbox={() => setActiveView('sandbox')}
          />
        )}

        {activeView === 'cloudwatch' && (
          <CloudWatchMonitoring
            logs={cloudWatchLogs}
            alerts={securityAlerts}
            transactions={transactions}
            isStreamPaused={isStreamPaused}
            onToggleStreamPause={() => setIsStreamPaused((p) => !p)}
            onClearLogs={() => setCloudWatchLogs([])}
            onMitigateAlert={handleMitigateAlert}
          />
        )}

        {activeView === 'advisor' && (
          <AIRiskPolicyAdvisor
            weights={weights}
            onChangeWeights={setWeights}
            thresholds={thresholds}
            onChangeThresholds={setThresholds}
            aiRecommendation={aiRecommendation}
            isAiLoading={isAiLoading}
            onRefreshAiRecommendation={handleRefreshAiPolicy}
            onApplyAiRecommendation={handleApplyAiRecommendation}
          />
        )}
      </main>

      {/* Threat & Attack Vector Simulator Modal */}
      <ThreatSimulationModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
        onLaunchScenario={handleLaunchScenarioFromModal}
      />

      {/* Clean Human Engineered Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 py-5 mt-12 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            SafeBank India · Cloud-Based Banking System With Dynamic Transaction Risk Scoring | Designed &amp; Developed by Varshini
          </div>
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <span>Amazon Cognito</span>
            <span>·</span>
            <span>Amazon API Gateway</span>
            <span>·</span>
            <span>AWS Lambda</span>
            <span>·</span>
            <span>Amazon DynamoDB</span>
            <span>·</span>
            <span>AWS KMS</span>
            <span>·</span>
            <span>AWS IAM</span>
            <span>·</span>
            <span>Amazon CloudWatch</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
