import React from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  RiskFactorWeights,
  RiskThresholds,
  AIRiskPolicyRecommendation,
} from '../types';
import {
  DEFAULT_RISK_WEIGHTS,
  DEFAULT_RISK_THRESHOLDS,
} from '../data/awsBankingData';

interface AIRiskPolicyAdvisorProps {
  weights: RiskFactorWeights;
  onChangeWeights: (weights: RiskFactorWeights) => void;
  thresholds: RiskThresholds;
  onChangeThresholds: (thresholds: RiskThresholds) => void;
  aiRecommendation: AIRiskPolicyRecommendation | null;
  isAiLoading: boolean;
  onRefreshAiRecommendation: () => void;
  onApplyAiRecommendation: (rec: AIRiskPolicyRecommendation) => void;
}

export const AIRiskPolicyAdvisor: React.FC<AIRiskPolicyAdvisorProps> = ({
  weights,
  onChangeWeights,
  thresholds,
  onChangeThresholds,
  aiRecommendation,
  isAiLoading,
  onRefreshAiRecommendation,
  onApplyAiRecommendation,
}) => {
  const totalWeight =
    weights.amountWeight +
    weights.deviceWeight +
    weights.beneficiaryWeight +
    weights.locationWeight +
    weights.frequencyWeight +
    weights.anomalyWeight;

  const weightSliders: Array<{
    key: keyof RiskFactorWeights;
    label: string;
    awsSource: string;
  }> = [
    {
      key: 'amountWeight',
      label: '1. Payment Amount & Daily Spending Limit',
      awsSource: 'Customer Spending History',
    },
    {
      key: 'deviceWeight',
      label: '2. Trusted Phone, Computer, or Browser',
      awsSource: 'Saved Device Memory',
    },
    {
      key: 'beneficiaryWeight',
      label: '3. Recipient Trust & Past Transfer History',
      awsSource: 'Trusted Payee Directory',
    },
    {
      key: 'locationWeight',
      label: '4. Location & Impossible Fast Travel',
      awsSource: 'City & Country Location Check',
    },
    {
      key: 'frequencyWeight',
      label: '5. Fast Repeated Payments in a Short Time',
      awsSource: 'Sliding Speed Counter',
    },
    {
      key: 'anomalyWeight',
      label: '6. Unusual Time of Night & Pasted Bank Numbers',
      awsSource: 'Behavior & Timing Check',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Security Rules &amp; Dynamic Policy Tuning
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Customize how heavily each safety signal is counted, adjust when a one-time code is needed, or run algorithmic policy optimization
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="refresh-risk-policy-btn"
            onClick={onRefreshAiRecommendation}
            disabled={isAiLoading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isAiLoading ? 'Calculating Policy Metrics...' : 'Run Policy Optimization'}</span>
          </button>

          {aiRecommendation && (
            <button
              id="apply-ai-weights-btn"
              onClick={() => onApplyAiRecommendation(aiRecommendation)}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Use Recommended Settings</span>
            </button>
          )}
        </div>
      </section>

      {/* Main 12-Col Grid: Interactive Weight & Threshold Sliders + AI Security Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Columns: Live Lambda Risk Weight & Threshold Sliders */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                1. Safety Signal Sliders (Importance of Each Check)
              </h2>
            </div>
            <button
              onClick={() => {
                onChangeWeights(DEFAULT_RISK_WEIGHTS);
                onChangeThresholds(DEFAULT_RISK_THRESHOLDS);
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="space-y-4">
            {weightSliders.map((item) => {
              const rawVal = weights[item.key];
              const normalizedPct = Math.round((rawVal / Math.max(1, totalWeight)) * 100);
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{item.label}</span>
                    <span className="font-mono tabular-nums text-amber-400 font-semibold">
                      {rawVal} pts ({normalizedPct}% of total)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    aria-label={item.label}
                    value={rawVal}
                    onChange={(e) =>
                      onChangeWeights({
                        ...weights,
                        [item.key]: Number(e.target.value),
                      })
                    }
                    className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="text-[11px] text-slate-500">
                    Checked by: {item.awsSource}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decision Score Thresholds */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              When to Approve, Ask for a Code, or Block
            </h3>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium">
                  Instant Auto-Approval Range (Safe)
                </span>
                <span className="font-mono tabular-nums text-white font-semibold">
                  0 to {thresholds.allowMaxScore} points
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={50}
                step={1}
                aria-label="Instant Auto-Approval Range"
                value={thresholds.allowMaxScore}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeThresholds({
                    allowMaxScore: val,
                    stepUpMaxScore: Math.max(val + 15, thresholds.stepUpMaxScore),
                  });
                }}
                className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-medium">
                  Ask for 1-Time Text Code Range
                </span>
                <span className="font-mono tabular-nums text-white font-semibold">
                  {thresholds.allowMaxScore + 1} to {thresholds.stepUpMaxScore} points (Score {thresholds.stepUpMaxScore + 1}+ is Blocked)
                </span>
              </div>
              <input
                type="range"
                min={45}
                max={85}
                step={1}
                aria-label="Ask for 1-Time Text Code Range"
                value={thresholds.stepUpMaxScore}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChangeThresholds({
                    allowMaxScore: Math.min(thresholds.allowMaxScore, val - 15),
                    stepUpMaxScore: val,
                  });
                }}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Dynamic Policy Recommendation & IAM/KMS Hardening */}
        <div className="lg:col-span-6 space-y-5">
          {aiRecommendation && (
            <>
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-mono text-amber-400">
                      Optimizer: {aiRecommendation.source}
                    </div>
                    <h2 className="text-sm font-bold text-white mt-0.5">
                      2. Dynamic Policy Optimization Advice
                    </h2>
                  </div>
                  <div className="text-right font-mono tabular-nums text-xs">
                    <div className="text-emerald-400 font-bold">
                      {aiRecommendation.estimatedFraudReductionPct}% Scams Stopped
                    </div>
                    <div className="text-slate-400">
                      {aiRecommendation.falsePositiveReductionPct}% Fewer Annoyances
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  {aiRecommendation.executiveSummary}
                </p>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Security &amp; Vault Protection Advice:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {aiRecommendation.iamAndKmsHardeningAdvice}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="font-semibold text-amber-400">
                    Recommended Score Boundaries: Auto-Approve 0–{aiRecommendation.thresholdRecommendations.allowMaxScore} · 1-Time Code {aiRecommendation.thresholdRecommendations.allowMaxScore + 1}–{aiRecommendation.thresholdRecommendations.stepUpMaxScore} · Block above that
                  </div>
                  <p className="text-slate-400">
                    {aiRecommendation.thresholdRecommendations.rationale}
                  </p>
                </div>
              </div>

              {/* Per-Factor Calibration Breakdown */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2.5">
                  3. Algorithmic Optimization Rationale
                </h3>
                <div className="space-y-2.5">
                  {aiRecommendation.factorInsights.map((ins) => (
                    <div
                      key={ins.factorName}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{ins.factorName}</span>
                        <span className="font-mono tabular-nums text-amber-400">
                          Current: {ins.currentWeight}% &rarr; Recommended:{' '}
                          <strong>{ins.recommendedWeight}%</strong>
                        </span>
                      </div>
                      <p className="text-slate-400">{ins.vulnerabilityAddressed}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
