import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { ThreatScenarioPreset } from '../types';
import { THREAT_SCENARIO_PRESETS } from '../data/awsBankingData';

interface ThreatSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchScenario: (preset: ThreatScenarioPreset, autoExecute: boolean) => void;
}

export const ThreatSimulationModal: React.FC<ThreatSimulationModalProps> = ({
  isOpen,
  onClose,
  onLaunchScenario,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    THREAT_SCENARIO_PRESETS[3].id
  );

  if (!isOpen) return null;

  const selectedPreset =
    THREAT_SCENARIO_PRESETS.find((p) => p.id === selectedPresetId) ||
    THREAT_SCENARIO_PRESETS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="threat-sim-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 id="threat-sim-modal-title" className="text-base font-bold text-white">
              Real-World Fraud &amp; Safety Scenarios
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              See how old banks fail when a password is stolen, while SafeBank stops the scam immediately
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-2">
            {THREAT_SCENARIO_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              const isSafe = preset.category.includes('Safe') || preset.category.includes('Routine');
              const isStepUp = preset.category.includes('Check') || preset.category.includes('Step-Up') || preset.category.includes('Verification');
              const isDanger = preset.category.includes('Scam') || preset.category.includes('Attack') || preset.category.includes('High-Severity');
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`w-full p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isSafe && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isStepUp && (
                        <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      {isDanger && (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-amber-400">
                      ₹{preset.input.amountUsd.toLocaleString('en-IN')} · {preset.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Comparative Outcome Box */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-slate-400">What happened in this scenario:</span>
              <span className="text-slate-200 font-medium">{selectedPreset.attackVector}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-slate-400">Old Bank (Passcode only):</span>
              <span className="text-rose-400 font-semibold">
                {selectedPreset.fixedAuthOutcome}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-slate-400">SafeBank (6 Smart Checks):</span>
              <span className="text-emerald-400 font-semibold">
                {selectedPreset.dynamicRiskOutcome}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onLaunchScenario(selectedPreset, false);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white cursor-pointer"
          >
            Load into Payment Checker
          </button>
          <button
            id="confirm-launch-scenario-btn"
            onClick={() => {
              onLaunchScenario(selectedPreset, true);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Load &amp; Run Live Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
