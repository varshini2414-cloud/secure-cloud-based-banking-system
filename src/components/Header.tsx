import React from 'react';
import { SecurityPolicyMode } from '../types';

export type ActiveWorkspaceView =
  | 'sandbox'
  | 'directory'
  | 'architecture'
  | 'ledger'
  | 'cloudwatch'
  | 'advisor';

interface HeaderProps {
  activeView: ActiveWorkspaceView;
  onSelectView: (view: ActiveWorkspaceView) => void;
  policyMode: SecurityPolicyMode;
  onSelectPolicyMode: (mode: SecurityPolicyMode) => void;
  onOpenThreatModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  policyMode,
  onSelectPolicyMode,
  onOpenThreatModal,
}) => {
  const navItems: Array<{ id: ActiveWorkspaceView; label: string }> = [
    { id: 'sandbox', label: 'Payment Safety Check' },
    { id: 'directory', label: 'Customer Accounts' },
    { id: 'architecture', label: 'How Security Works' },
    { id: 'ledger', label: 'Transaction History' },
    { id: 'cloudwatch', label: 'Live Security Monitor' },
    { id: 'advisor', label: 'Smart Safety Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectView('sandbox');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
          >
            SafeBank India
          </a>
          <span className="hidden xl:inline-block text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
            AWS ap-south-1 (Mumbai) · INR (₹)
          </span>
        </div>

        {/* Zone 2: 6 clean text navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden lg:flex items-center gap-5 text-sm font-medium"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-xs xl:text-sm ${
                  isActive
                    ? 'border-amber-500 text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Interactive Security Policy Mode Segmented Control */}
          <div
            role="group"
            aria-label="Safety Protection Level"
            className="hidden sm:flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800"
          >
            <button
              id="policy-dynamic-btn"
              onClick={() => onSelectPolicyMode('dynamic_adaptive')}
              title="Smart Protection: Checks 6 real safety signals before approving money transfers"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                policyMode === 'dynamic_adaptive'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Smart Safety
            </button>
            <button
              id="policy-zerotrust-btn"
              onClick={() => onSelectPolicyMode('strict_zero_trust')}
              title="Extra Strict: Asks for verification on nearly any unfamiliar activity"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                policyMode === 'strict_zero_trust'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Extra Strict
            </button>
            <button
              id="policy-fixed-btn"
              onClick={() => onSelectPolicyMode('fixed_legacy')}
              title="Old Password Only: Only checks if the password matched once (Weak)"
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                policyMode === 'fixed_legacy'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Old Password Only
            </button>
          </div>

          <button
            id="open-threat-simulator-btn"
            onClick={onOpenThreatModal}
            className="px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Try Scam Scenarios
          </button>

          <a
            id="download-html-project-btn"
            href="/secure-banking-system.html"
            download="secure-cloud-banking-system.html"
            title="Download complete standalone HTML project file"
            className="px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>📥</span>
            <span>Download .HTML</span>
          </a>
        </div>
      </div>

      {/* Mobile Navigation Bar (visible only below lg) */}
      <div className="flex lg:hidden items-center gap-2 px-4 py-2 border-t border-slate-900 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
