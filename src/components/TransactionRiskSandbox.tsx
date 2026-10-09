import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  Sliders,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  BankAccountProfile,
  TransactionInput,
  RiskEvaluationResult,
  SecurityPolicyMode,
  RiskThresholds,
  ThreatScenarioPreset,
} from '../types';
import { THREAT_SCENARIO_PRESETS } from '../data/awsBankingData';

interface TransactionRiskSandboxProps {
  accounts: BankAccountProfile[];
  selectedAccount: BankAccountProfile;
  onSelectAccount: (accountId: string) => void;
  transactionInput: TransactionInput;
  onChangeInput: (updated: TransactionInput) => void;
  evaluation: RiskEvaluationResult;
  policyMode: SecurityPolicyMode;
  thresholds: RiskThresholds;
  onExecuteTransaction: (mfaVerified?: boolean) => {
    status: 'executed' | 'step_up_required' | 'blocked';
    message: string;
    txId?: string;
  };
  onRestoreAccountSession: (accountId: string) => void;
  onOpenAccountDirectory: () => void;
}

export const TransactionRiskSandbox: React.FC<TransactionRiskSandboxProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  transactionInput,
  onChangeInput,
  evaluation,
  policyMode,
  thresholds,
  onExecuteTransaction,
  onRestoreAccountSession,
  onOpenAccountDirectory,
}) => {
  const [stepUpChallengeOpen, setStepUpChallengeOpen] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('482910');
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [executionFeedback, setExecutionFeedback] = useState<{
    type: 'allow' | 'step_up' | 'block';
    title: string;
    detail: string;
  } | null>(null);

  const matchingAccounts = React.useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) {
      return accounts.slice(0, 60);
    }
    const filtered = accounts
      .filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.holderName.toLowerCase().includes(q) ||
          a.homeLocation.toLowerCase().includes(q) ||
          a.tier.toLowerCase().includes(q)
      )
      .slice(0, 60);
    if (!filtered.some((a) => a.id === selectedAccount.id)) {
      return [selectedAccount, ...filtered];
    }
    return filtered;
  }, [accounts, accountSearch, selectedAccount]);

  const handleApplyPreset = (preset: ThreatScenarioPreset) => {
    setStepUpChallengeOpen(false);
    setExecutionFeedback(null);
    if (preset.input.accountId !== selectedAccount.id) {
      onSelectAccount(preset.input.accountId);
    }
    onChangeInput({ ...preset.input });
  };

  const handlePrimarySubmit = () => {
    if (evaluation.decision === 'STEP_UP_MFA') {
      setStepUpChallengeOpen(true);
      setExecutionFeedback({
        type: 'step_up',
        title: 'Quick Verification Needed: Confirm It’s Really You',
        detail: `Safety score is ${evaluation.totalRiskScore}/100 (in the check zone). Please enter your 6-digit passcode or use fingerprint confirmation to release the payment.`,
      });
      return;
    }

    const res = onExecuteTransaction(false);
    if (res.status === 'executed') {
      setStepUpChallengeOpen(false);
      setExecutionFeedback({
        type: 'allow',
        title: `Payment ${res.txId} Approved & Safely Sent!`,
        detail: res.message,
      });
    } else if (res.status === 'blocked') {
      setStepUpChallengeOpen(false);
      setExecutionFeedback({
        type: 'block',
        title: `Payment ${res.txId} Blocked to Protect Your Money!`,
        detail: res.message,
      });
    }
  };

  const handleCompleteStepUpMfa = () => {
    const res = onExecuteTransaction(true);
    setStepUpChallengeOpen(false);
    setExecutionFeedback({
      type: 'allow',
      title: `Verification Successful · Payment ${res.txId} Sent!`,
      detail: res.message,
    });
  };

  const handleFailStepUpMfa = () => {
    setStepUpChallengeOpen(false);
    setExecutionFeedback({
      type: 'block',
      title: 'Verification Failed · Payment Cancelled & Account Protected',
      detail:
        'The passcode or fingerprint was not confirmed. The transfer was halted immediately to keep your balance safe.',
    });
  };

  const scoreColorClass =
    evaluation.totalRiskScore <= thresholds.allowMaxScore
      ? 'text-emerald-400'
      : evaluation.totalRiskScore <= thresholds.stepUpMaxScore
      ? 'text-amber-400'
      : 'text-rose-400';

  const decisionBorderClass =
    evaluation.decision === 'ALLOW'
      ? 'border-emerald-500/50 bg-emerald-950/20'
      : evaluation.decision === 'STEP_UP_MFA'
      ? 'border-amber-500/50 bg-amber-950/20'
      : 'border-rose-500/60 bg-rose-950/25';

  return (
    <div className="space-y-6">
      {/* Top Customer Session & Quick Scenario Presets */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Live Payment Safety Check
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Checks 6 safety signals in real time to stop scammers before money leaves the account
            </p>
          </div>

          {/* Account Switcher across 1,000 Sample Accounts */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              aria-label="Filter customer accounts"
              placeholder="Search accounts (name, city, card)..."
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 sm:w-56"
            />
            <select
              id="cognito-account-select"
              aria-label="Customer Account"
              value={selectedAccount.id}
              onChange={(e) => {
                const nextId = e.target.value;
                onSelectAccount(nextId);
                onChangeInput({ ...transactionInput, accountId: nextId });
                setExecutionFeedback(null);
                setStepUpChallengeOpen(false);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-amber-500 max-w-xs"
            >
              {matchingAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.holderName} · ₹{acc.balanceUsd.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({acc.tier})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onOpenAccountDirectory}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-400 whitespace-nowrap cursor-pointer"
            >
              Browse All {accounts.length.toLocaleString()} Accounts
            </button>
          </div>
        </div>

        {/* Selected Account Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90">
            <div className="text-xs text-slate-400">Available Balance</div>
            <div className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
              ₹{selectedAccount.balanceUsd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              Usual payment: ₹{selectedAccount.avgTransactionUsd.toLocaleString('en-IN')} · Daily limit: ₹
              {selectedAccount.dailyLimitUsd.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90">
            <div className="text-xs text-slate-400">Trusted Personal Device</div>
            <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
              {selectedAccount.registeredDevice}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Extra check: {selectedAccount.mfaEnrolled}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90">
            <div className="text-xs text-slate-400">Home Location</div>
            <div className="text-sm font-semibold text-slate-200 mt-1">
              {selectedAccount.homeLocation}
            </div>
            <div className="text-xs text-emerald-400 mt-1">
              Digital Bank Vault: Locked & Protected
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Account Safety Status</span>
              {selectedAccount.sessionStatus === 'quarantined' && (
                <button
                  onClick={() => onRestoreAccountSession(selectedAccount.id)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Unlock Account
                </button>
              )}
            </div>
            <div className="text-sm font-semibold mt-1 flex items-center gap-1.5">
              {selectedAccount.sessionStatus === 'active_verified' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">Safe & Active</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="text-rose-400">Locked for Safety</span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Account ID: {selectedAccount.id} · {selectedAccount.accountNumberMasked}
            </div>
          </div>
        </div>

        {/* One-Click Scenario Presets Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400 shrink-0">
            Try a Test Scenario:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {THREAT_SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                id={`preset-btn-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-800 hover:border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Execution Status / Step-Up Challenge Banner */}
      {executionFeedback && (
        <section
          className={`p-4 rounded-xl border ${
            executionFeedback.type === 'allow'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
              : executionFeedback.type === 'step_up'
              ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
              : 'bg-rose-950/35 border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                {executionFeedback.type === 'allow' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {executionFeedback.type === 'step_up' && (
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                {executionFeedback.type === 'block' && (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{executionFeedback.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {executionFeedback.detail}
              </p>
            </div>

            {stepUpChallengeOpen && (
              <div className="flex flex-wrap items-center gap-2 shrink-0 bg-slate-950/90 p-2.5 rounded-lg border border-amber-500/40">
                <label htmlFor="cognito-otp-input" className="text-xs text-slate-300">
                  Enter 6-digit phone code:
                </label>
                <input
                  id="cognito-otp-input"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-center"
                />
                <button
                  id="confirm-stepup-mfa-btn"
                  onClick={handleCompleteStepUpMfa}
                  className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  Confirm &amp; Send Money
                </button>
                <button
                  id="fail-stepup-mfa-btn"
                  onClick={handleFailStepUpMfa}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-medium border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Test Wrong Code
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main 12-Column Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: 6-Factor Transaction Parameters Configurator */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">
                01. Payment Details &amp; Safety Signals
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Change any payment detail below to test how our safety system responds in real time
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">
              Live Bank Guard
            </span>
          </div>

          {/* Factor 1: Transaction Amount & Beneficiary Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="tx-amount-input" className="font-semibold text-slate-200">
                  1. How Much Money? (₹ Rupees)
                </label>
                <span className="font-mono text-amber-400 tabular-nums">
                  {(transactionInput.amountUsd / selectedAccount.avgTransactionUsd).toFixed(1)}x
                  Usual Size
                </span>
              </div>
              <input
                id="tx-amount-input"
                type="number"
                min={100}
                max={10000000}
                step={500}
                value={transactionInput.amountUsd}
                onChange={(e) =>
                  onChangeInput({
                    ...transactionInput,
                    amountUsd: Math.max(10, Number(e.target.value) || 0),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {[1450, 5000, 25000, 45000, 85000, 250000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onChangeInput({ ...transactionInput, amountUsd: amt })}
                    className={`px-2 py-0.5 rounded text-xs font-mono tabular-nums border transition-colors cursor-pointer ${
                      transactionInput.amountUsd === amt
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tx-beneficiary-name" className="block text-xs font-semibold text-slate-200">
                Recipient Name &amp; IFSC / Account / UPI ID
              </label>
              <input
                id="tx-beneficiary-name"
                type="text"
                placeholder="Person / Business Name (e.g. Tata Power Mumbai)"
                value={transactionInput.beneficiaryName}
                onChange={(e) =>
                  onChangeInput({ ...transactionInput, beneficiaryName: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                id="tx-beneficiary-iban"
                type="text"
                placeholder="IFSC Code · Account Number or UPI ID (e.g. HDFC0001892 · 918274019283)"
                aria-label="Beneficiary IFSC Account or UPI"
                value={transactionInput.beneficiaryIban}
                onChange={(e) =>
                  onChangeInput({ ...transactionInput, beneficiaryIban: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Factor 2 & Factor 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/70">
            <div className="space-y-1.5">
              <label htmlFor="factor-device-select" className="block text-xs font-semibold text-slate-200">
                2. What Device is Being Used?
              </label>
              <select
                id="factor-device-select"
                value={transactionInput.deviceTrust}
                onChange={(e) => {
                  const val = e.target.value as TransactionInput['deviceTrust'];
                  const labelMap: Record<TransactionInput['deviceTrust'], string> = {
                    trusted_biometric: selectedAccount.registeredDevice,
                    known_browser: 'MacBook Air · Safari (Recognized Browser)',
                    unrecognized_device: 'New Windows Laptop · Chrome (Never Seen Before)',
                    emulator_tor_proxy: 'Automated Hacker Program · Hidden Network',
                  };
                  onChangeInput({
                    ...transactionInput,
                    deviceTrust: val,
                    deviceName: labelMap[val],
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="trusted_biometric">
                  Customer's trusted phone / laptop with Face ID (Safest)
                </option>
                <option value="known_browser">
                  Known regular web browser on customer's computer (Low Risk)
                </option>
                <option value="unrecognized_device">
                  Brand-new computer never seen before (Needs Check)
                </option>
                <option value="emulator_tor_proxy">
                  Automated hacker tool or hideout network (High Danger)
                </option>
              </select>
              <div className="text-xs text-slate-500 truncate">
                Current Device: {transactionInput.deviceName}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="factor-beneficiary-select" className="block text-xs font-semibold text-slate-200">
                3. Who is Receiving the Money?
              </label>
              <select
                id="factor-beneficiary-select"
                value={transactionInput.beneficiaryStatus}
                onChange={(e) =>
                  onChangeInput({
                    ...transactionInput,
                    beneficiaryStatus: e.target.value as TransactionInput['beneficiaryStatus'],
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="verified_recurring">
                  Regular trusted bill or friend (Safest)
                </option>
                <option value="existing_domestic">
                  Normal bank account in the same country (Low Risk)
                </option>
                <option value="newly_added_unverified">
                  Brand-new recipient added just now (Needs Verification)
                </option>
                <option value="high_risk_offshore">
                  Suspicious unverified overseas account (High Danger)
                </option>
              </select>
              <div className="text-xs text-slate-500">
                Checked against customer's trusted recipient history
              </div>
            </div>
          </div>

          {/* Factor 4 & Factor 5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/70">
            <div className="space-y-1.5">
              <label htmlFor="factor-location-select" className="block text-xs font-semibold text-slate-200">
                4. Where is the Transfer Sent From?
              </label>
              <select
                id="factor-location-select"
                value={transactionInput.locationStatus}
                onChange={(e) => {
                  const val = e.target.value as TransactionInput['locationStatus'];
                  const locMap: Record<
                    TransactionInput['locationStatus'],
                    { label: string; ip: string }
                  > = {
                    home_geofence: {
                      label: `${selectedAccount.homeLocation} (Airtel Fiber / Jio)`,
                      ip: '106.51.78.214',
                    },
                    domestic_regional: {
                      label: 'Pune, Maharashtra (Domestic Business Travel)',
                      ip: '49.207.52.19',
                    },
                    foreign_unannounced: {
                      label: 'London, UK (Overseas Trip without Travel Notice)',
                      ip: '81.134.202.44',
                    },
                    impossible_travel_vpn: {
                      label: 'Frankfurt, Germany (4,800 km away in 14 minutes)',
                      ip: '185.220.101.47',
                    },
                  };
                  onChangeInput({
                    ...transactionInput,
                    locationStatus: val,
                    locationLabel: locMap[val].label,
                    ipAddress: locMap[val].ip,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="home_geofence">
                  Home city &amp; usual home internet (Safest)
                </option>
                <option value="domestic_regional">
                  Nearby city in same country (Normal domestic travel)
                </option>
                <option value="foreign_unannounced">
                  Overseas country without travel notice (Suspicious)
                </option>
                <option value="impossible_travel_vpn">
                  Impossible location jump across the world in 14 min (High Danger)
                </option>
              </select>
              <div className="text-xs text-slate-500 truncate">
                Detected Place: {transactionInput.locationLabel}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="factor-frequency-select" className="block text-xs font-semibold text-slate-200">
                5. How Fast Are Transfers Happening?
              </label>
              <select
                id="factor-frequency-select"
                value={transactionInput.frequencyLevel}
                onChange={(e) =>
                  onChangeInput({
                    ...transactionInput,
                    frequencyLevel: e.target.value as TransactionInput['frequencyLevel'],
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="normal_1_per_hr">
                  1 transfer today (Normal relaxed pace · Safest)
                </option>
                <option value="elevated_3_per_15m">
                  3 transfers in 15 minutes (Somewhat busy pace)
                </option>
                <option value="rapid_burst_6_per_5m">
                  6 rapid transfers in 5 minutes (Rushing money out quickly)
                </option>
                <option value="automated_structuring_12_per_m">
                  Non-stop transfers every second (Robotic drain attack)
                </option>
              </select>
              <div className="text-xs text-slate-500">
                Monitors how quickly multiple transfers leave the account
              </div>
            </div>
          </div>

          {/* Factor 6 & Execution Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/70">
            <div className="space-y-1.5">
              <label htmlFor="factor-anomaly-select" className="block text-xs font-semibold text-slate-200">
                6. Any Unusual Habits or Timing?
              </label>
              <select
                id="factor-anomaly-select"
                value={transactionInput.anomalyLevel}
                onChange={(e) =>
                  onChangeInput({
                    ...transactionInput,
                    anomalyLevel: e.target.value as TransactionInput['anomalyLevel'],
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="normal_hygiene">
                  Normal daytime banking habits (Safest)
                </option>
                <option value="off_hours_3am">
                  Unusual middle-of-the-night transfer (03:18 AM)
                </option>
                <option value="recent_credential_reset">
                  Password was changed less than 10 minutes ago! (Warning)
                </option>
                <option value="session_hijack_paste_pattern">
                  Bank details quickly pasted in + location shifted (High Danger)
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tx-channel-select" className="block text-xs font-semibold text-slate-200">
                Payment Channel
              </label>
              <select
                id="tx-channel-select"
                value={transactionInput.channel}
                onChange={(e) =>
                  onChangeInput({
                    ...transactionInput,
                    channel: e.target.value as TransactionInput['channel'],
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Mobile Banking Enclave">Mobile Banking App (Safest)</option>
                <option value="Web Commercial Portal">Bank Website</option>
                <option value="OpenBanking REST API">Connected Financial App</option>
              </select>
            </div>
          </div>

          {/* Primary Action Bar */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Security: Digital Bank Vault Encryption · Tamper-Proof Record
            </div>
            <button
              id="execute-transaction-btn"
              onClick={handlePrimarySubmit}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                evaluation.decision === 'ALLOW'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  : evaluation.decision === 'STEP_UP_MFA'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {evaluation.decision === 'ALLOW'
                  ? 'Send Payment (Instant Approval)'
                  : evaluation.decision === 'STEP_UP_MFA'
                  ? 'Ask Customer for One-Time Passcode'
                  : 'Test Payment Block (Keep Money Safe)'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Real-Time Risk Score Decomposition & Fixed vs. Dynamic Comparison */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Real-Time Score Readout */}
          <div className={`rounded-xl border p-5 space-y-4 ${decisionBorderClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-300">
                  Live Safety Score
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-4xl font-extrabold font-mono tabular-nums ${scoreColorClass}`}
                  >
                    {evaluation.totalRiskScore}
                  </span>
                  <span className="text-sm text-slate-400 font-mono">/ 100</span>
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Protection Mode:{' '}
                  <strong className="text-white">
                    {policyMode === 'dynamic_adaptive'
                      ? 'Smart Safety (Recommended)'
                      : policyMode === 'strict_zero_trust'
                      ? 'Extra Strict'
                      : 'Old Password Only'}
                  </strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Safety Decision</div>
                <div
                  className={`text-sm font-bold mt-1 ${
                    evaluation.decision === 'ALLOW'
                      ? 'text-emerald-400'
                      : evaluation.decision === 'STEP_UP_MFA'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {evaluation.decision === 'ALLOW'
                    ? 'SAFE: APPROVED INSTANTLY'
                    : evaluation.decision === 'STEP_UP_MFA'
                    ? 'NEEDS QUICK 1-TIME CODE'
                    : 'BLOCKED: DANGEROUS SCAM'}
                </div>
                <div className="text-xs text-slate-400 tabular-nums mt-1">
                  Checked in {evaluation.awsPipelineTrace.lambdaComputeMs} milliseconds
                </div>
              </div>
            </div>

            {/* Segmented Risk Band Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>0–{thresholds.allowMaxScore} Safe</span>
                <span>
                  {thresholds.allowMaxScore + 1}–{thresholds.stepUpMaxScore} Needs 1-Time Code
                </span>
                <span>{thresholds.stepUpMaxScore + 1}–100 Blocked</span>
              </div>
              <div className="w-full h-3 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden relative flex">
                <div
                  className="h-full bg-emerald-500/35 border-r border-slate-800"
                  style={{ width: `${thresholds.allowMaxScore}%` }}
                />
                <div
                  className="h-full bg-amber-500/35 border-r border-slate-800"
                  style={{
                    width: `${thresholds.stepUpMaxScore - thresholds.allowMaxScore}%`,
                  }}
                />
                <div
                  className="h-full bg-rose-500/35"
                  style={{ width: `${100 - thresholds.stepUpMaxScore}%` }}
                />
                {/* Live Indicator Marker */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-white shadow transition-all duration-200"
                  style={{ left: `calc(${Math.min(98, evaluation.totalRiskScore)}% - 3px)` }}
                />
              </div>
              <div className="text-xs text-slate-200 font-medium pt-1">
                Next Step: {evaluation.requiredActionLabel}
              </div>
            </div>

            {/* Comparison: Old Password Only vs Smart Safety */}
            <div className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800/90 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">What Old Password Banks Would Do:</span>
                <span
                  className={`font-semibold ${
                    evaluation.traditionalFixedAuthDecision === 'ALLOW' &&
                    evaluation.totalRiskScore > thresholds.allowMaxScore
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {evaluation.traditionalFixedAuthDecision === 'ALLOW' ? 'Approved' : 'Blocked'}
                  {evaluation.traditionalFixedAuthDecision === 'ALLOW' &&
                    evaluation.totalRiskScore > thresholds.allowMaxScore &&
                    ' (Vulnerable to Scams!)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {evaluation.traditionalFixedAuthFlaw}
              </p>
            </div>
          </div>

          {/* Card 2: 6-Factor Weighted Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white">
                02. The 6 Safety Signals Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                Total Score: {evaluation.totalRiskScore}/100
              </span>
            </div>

            <div className="space-y-3">
              {evaluation.factors.map((f) => {
                const barColor =
                  f.severity === 'critical'
                    ? 'bg-rose-500'
                    : f.severity === 'elevated'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500';

                return (
                  <div
                    key={f.factorKey}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{f.label}</span>
                      <span className="tabular-nums text-slate-300">
                        Signal: {f.rawRiskNormalized}/100 · Adds{' '}
                        <strong className="text-white">+{f.weightedContribution} pts</strong>
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${barColor}`}
                        style={{ width: `${f.rawRiskNormalized}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2">
                      <span className="truncate">{f.telemetryDetail}</span>
                      <span className="text-slate-500 shrink-0">
                        {f.awsServiceEvaluator}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
