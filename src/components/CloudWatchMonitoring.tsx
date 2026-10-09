import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import {
  CloudWatchLogEvent,
  SecurityIncidentAlert,
  LedgerTransaction,
} from '../types';

interface CloudWatchMonitoringProps {
  logs: CloudWatchLogEvent[];
  alerts: SecurityIncidentAlert[];
  transactions: LedgerTransaction[];
  isStreamPaused: boolean;
  onToggleStreamPause: () => void;
  onClearLogs: () => void;
  onMitigateAlert: (alertId: string) => void;
}

export const CloudWatchMonitoring: React.FC<CloudWatchMonitoringProps> = ({
  logs,
  alerts,
  transactions,
  isStreamPaused,
  onToggleStreamPause,
  onClearLogs,
  onMitigateAlert,
}) => {
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  const filteredLogs = logs.filter((l) =>
    serviceFilter === 'ALL' ? true : l.service === serviceFilter
  );

  const blockedTransactions = transactions.filter(
    (t) => t.decision === 'BLOCK_AND_ALERT'
  );
  const stepUpTransactions = transactions.filter(
    (t) => t.decision === 'STEP_UP_MFA'
  );
  const totalFraudPreventedUsd = blockedTransactions.reduce(
    (sum, t) => sum + t.amountUsd,
    0
  );

  // Hourly fraud interception vs fixed-auth vulnerability profile
  const hourlyComparison = [
    { window: '00:00', fixedFraudLossRisk: 78, dynamicResidualRisk: 8 },
    { window: '04:00', fixedFraudLossRisk: 86, dynamicResidualRisk: 9 },
    { window: '08:00', fixedFraudLossRisk: 64, dynamicResidualRisk: 6 },
    { window: '12:00', fixedFraudLossRisk: 72, dynamicResidualRisk: 7 },
    { window: '16:00', fixedFraudLossRisk: 81, dynamicResidualRisk: 8 },
    { window: '20:00', fixedFraudLossRisk: 92, dynamicResidualRisk: 9 },
    { window: '23:00', fixedFraudLossRisk: 89, dynamicResidualRisk: 7 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            24/7 Live Security Monitoring &amp; Alarm Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time safety activity feed, instant fraud alerts, and proof of why the new system protects your money better than old banks
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Live Safety Watchdog · Active 24 Hours a Day
        </div>
      </section>

      {/* Primary Quantitative KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="text-xs text-slate-400">Stolen Money Prevented</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ₹{totalFraudPreventedUsd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500">
            Stopped across {blockedTransactions.length} dangerous payment attempts (Score &ge; 70)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="text-xs text-slate-400">Scam Stopping Accuracy</div>
          <div className="flex items-baseline gap-2 font-mono tabular-nums">
            <span className="text-2xl font-bold text-white">98.4% SafeBank</span>
            <span className="text-xs text-rose-400 line-through">31.2% Old Bank</span>
          </div>
          <div className="text-xs text-slate-500">
            +67% better at stopping hackers with stolen passwords
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="text-xs text-slate-400">Quick 1-Time Code Verifications</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            {stepUpTransactions.length} Customers Verified
          </div>
          <div className="text-xs text-slate-500">
            Instant approval for normal bills, code asked only when something looks unusual
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="text-xs text-slate-400">Cost for 10,000 Safety Checks</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            ₹3.50
          </div>
          <div className="text-xs text-slate-500">
            Less than 4 rupees total for ten thousand instant payment evaluations
          </div>
        </div>
      </section>

      {/* Main Grid: CloudWatch Alarms + Live Structured Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Active CloudWatch Security Alarms & Comparative Chart */}
        <div className="lg:col-span-6 space-y-6">
          {/* CloudWatch Alarms Queue */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white">
                1. Live Security Alarms &amp; Actions ({alerts.length})
              </h2>
              <span className="text-xs font-mono text-slate-400">
                Instant Security Notification Channel
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-lg border space-y-2 text-xs ${
                    alert.status === 'active'
                      ? 'bg-rose-950/25 border-rose-500/50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {alert.status === 'active' ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span>{alert.title}</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-400 shrink-0">
                      Score {alert.riskScore}/100 · {alert.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{alert.description}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                    <span className="font-mono text-[11px] text-slate-400">
                      Account: {alert.accountId} ({alert.holderName})
                    </span>

                    {alert.status === 'active' ? (
                      <button
                        onClick={() => onMitigateAlert(alert.id)}
                        className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Lock Account &amp; Mark Resolved
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[11px]">
                        Resolved · Account Safe &amp; Password Reset
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparative Vulnerability Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  2. Risk of Losing Money: Old Bank System vs. SafeBank
                </h3>
                <p className="text-xs text-slate-400">
                  Chance of a hacker stealing money across different times of day
                </p>
              </div>
            </div>

            <div className="w-full pt-2">
              <svg viewBox="0 0 600 190" className="w-full h-auto select-none">
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = 155 - val * 1.25;
                  return (
                    <g key={val}>
                      <line
                        x1="40"
                        y1={y}
                        x2="575"
                        y2={y}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <text
                        x="32"
                        y={y + 3}
                        textAnchor="end"
                        fill="#64748b"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Fixed Auth Exposure Line */}
                <path
                  d={hourlyComparison.reduce((acc, pt, idx) => {
                    const x = 55 + (idx * 505) / (hourlyComparison.length - 1);
                    const y = 155 - pt.fixedFraudLossRisk * 1.25;
                    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                />

                {/* Dynamic Risk Scoring Residual Exposure Line */}
                <path
                  d={hourlyComparison.reduce((acc, pt, idx) => {
                    const x = 55 + (idx * 505) / (hourlyComparison.length - 1);
                    const y = 155 - pt.dynamicResidualRisk * 1.25;
                    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />

                {hourlyComparison.map((pt, idx) => {
                  const x = 55 + (idx * 505) / (hourlyComparison.length - 1);
                  const yFix = 155 - pt.fixedFraudLossRisk * 1.25;
                  const yDyn = 155 - pt.dynamicResidualRisk * 1.25;
                  return (
                    <g key={pt.window}>
                      <circle cx={x} cy={yFix} r="3.5" fill="#f43f5e" />
                      <circle cx={x} cy={yDyn} r="4" fill="#10b981" />
                      <text
                        x={x}
                        y="175"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {pt.window}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="text-rose-400">Red Dashed: Old Bank (High risk because passwords can be stolen)</span>
                <span className="text-emerald-400 font-semibold">
                  Solid Green: SafeBank (Under 10% risk by checking 6 live signals)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Live CloudWatch Log Stream Terminal */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                3. Live Safety Activity Feed
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter logs by bank security system"
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Bank Systems</option>
                <option value="AWS Lambda">Safety Brain (Lambda)</option>
                <option value="Amazon Cognito">Customer Login (Cognito)</option>
                <option value="AWS KMS">Digital Padlock (KMS)</option>
                <option value="Amazon DynamoDB">Bank Records (DynamoDB)</option>
                <option value="Amazon API Gateway">Front Door Gate</option>
                <option value="AWS IAM">Staff Permissions (IAM)</option>
              </select>

              <button
                onClick={onToggleStreamPause}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
              >
                {isStreamPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={onClearLogs}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="h-[520px] rounded-lg bg-slate-950 border border-slate-800 p-3.5 font-mono text-[11px] overflow-y-auto space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500 text-center py-16">
                Waiting for bank safety activity...
              </div>
            ) : (
              filteredLogs.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded bg-slate-900/70 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-400">
                    <span>
                      [{evt.timestamp}] <strong className="text-amber-400">{evt.service}</strong> ·{' '}
                      <span
                        className={
                          evt.level === 'CRITICAL'
                            ? 'text-rose-400 font-bold'
                            : evt.level === 'WARN'
                            ? 'text-amber-300 font-semibold'
                            : 'text-emerald-400'
                        }
                      >
                        {evt.level}
                      </span>{' '}
                      · {evt.eventType}
                    </span>
                    <span className="text-[10px] text-slate-500">{evt.requestId}</span>
                  </div>
                  <div className="text-slate-200 leading-relaxed">{evt.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
