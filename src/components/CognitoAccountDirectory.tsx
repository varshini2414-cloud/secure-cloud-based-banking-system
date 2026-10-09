import React, { useState, useMemo } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { BankAccountProfile } from '../types';

interface CognitoAccountDirectoryProps {
  accounts: BankAccountProfile[];
  selectedAccountId: string;
  onSelectAccountForSandbox: (accountId: string) => void;
  onToggleAccountQuarantine: (accountId: string) => void;
}

export const CognitoAccountDirectory: React.FC<CognitoAccountDirectoryProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccountForSandbox,
  onToggleAccountQuarantine,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | BankAccountProfile['sessionStatus']
  >('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inspectedId, setInspectedId] = useState<string>(selectedAccountId);

  const pageSize = 25;

  // Aggregate stats across all 1,000 accounts
  const aggregateStats = useMemo(() => {
    let totalAssets = 0;
    let activeCount = 0;
    let stepUpCount = 0;
    let quarantinedCount = 0;

    for (const acc of accounts) {
      totalAssets += acc.balanceUsd;
      if (acc.sessionStatus === 'active_verified') activeCount++;
      else if (acc.sessionStatus === 'step_up_pending') stepUpCount++;
      else if (acc.sessionStatus === 'quarantined') quarantinedCount++;
    }

    return {
      totalAssets,
      activeCount,
      stepUpCount,
      quarantinedCount,
    };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accounts.filter((acc) => {
      if (statusFilter !== 'ALL' && acc.sessionStatus !== statusFilter) {
        return false;
      }
      if (tierFilter !== 'ALL' && acc.tier !== tierFilter) {
        return false;
      }
      if (q) {
        return (
          acc.id.toLowerCase().includes(q) ||
          acc.holderName.toLowerCase().includes(q) ||
          acc.homeLocation.toLowerCase().includes(q) ||
          acc.registeredDevice.toLowerCase().includes(q) ||
          acc.tier.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accounts, searchQuery, statusFilter, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAccounts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, safePage]);

  const inspectedAccount =
    accounts.find((a) => a.id === inspectedId) ||
    paginatedAccounts[0] ||
    accounts[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Customer Accounts Directory (1,000 Customers)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View all enrolled bank customer accounts, their saved devices, and safety protection status in plain language
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>Customer Pool: Active</span>
          <span>·</span>
          <span>Total Customers: {accounts.length.toLocaleString()}</span>
        </div>
      </section>

      {/* Aggregate KPI Cards Across All 1,000 Accounts */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Total Customer Accounts</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {accounts.length.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">
            Across 5 account types and 20 home cities
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Total Protected Deposits</div>
          <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
            ₹{(aggregateStats.totalAssets / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            ₹{Math.round(aggregateStats.totalAssets).toLocaleString('en-IN')} safely stored in digital vault
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Safe &amp; Active Accounts</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {aggregateStats.activeCount.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Ready for instant approved transfers
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Accounts Paused for Safety</div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {aggregateStats.quarantinedCount}
          </div>
          <div className="text-xs text-slate-500">
            Temporarily paused to protect balance
          </div>
        </div>
      </section>

      {/* Filter & Search Controls */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter accounts by status"
            className="inline-flex bg-slate-900 p-1 rounded-lg border border-slate-800"
          >
            {(
              [
                { id: 'ALL', label: `All Accounts (${accounts.length})` },
                {
                  id: 'active_verified',
                  label: `Safe & Active (${aggregateStats.activeCount})`,
                },
                {
                  id: 'step_up_pending',
                  label: `Needs Passcode (${aggregateStats.stepUpCount})`,
                },
                {
                  id: 'quarantined',
                  label: `Paused (${aggregateStats.quarantinedCount})`,
                },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStatusFilter(st.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter accounts by tier"
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Account Types</option>
            <option value="Standard Savings Account">Standard Savings Account</option>
            <option value="Priority Savings Account">Priority Savings Account</option>
            <option value="Premier Wealth Account">Premier Wealth Account</option>
            <option value="Corporate Current Account">Corporate Current Account</option>
            <option value="Smart Fixed Deposit Vault">Smart Fixed Deposit Vault</option>
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            aria-label="Search 1,000 customer accounts"
            placeholder="Search by name, ID, city, or device..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </section>

      {/* Main 12-Column Directory Grid + Profile Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Paginated High-Density Table */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 px-3.5">Account ID</th>
                  <th className="py-2.5 px-3.5">Customer &amp; Type</th>
                  <th className="py-2.5 px-3.5">Home City &amp; Trusted Device</th>
                  <th className="py-2.5 px-3.5 text-right">Balance</th>
                  <th className="py-2.5 px-3.5 text-right">Usual Payment / Limit</th>
                  <th className="py-2.5 px-3.5">Safety Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {paginatedAccounts.map((acc) => {
                  const isInspected = inspectedAccount?.id === acc.id;
                  return (
                    <tr
                      key={acc.id}
                      onClick={() => setInspectedId(acc.id)}
                      className={`transition-colors cursor-pointer ${
                        isInspected ? 'bg-slate-800/85' : 'hover:bg-slate-950/60'
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-mono tabular-nums font-semibold text-amber-400 whitespace-nowrap">
                        {acc.id}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-medium text-white">{acc.holderName}</div>
                        <div className="text-[11px] text-slate-400">{acc.tier}</div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="text-slate-200 truncate max-w-[190px]">
                          {acc.homeLocation}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[190px]">
                          {acc.registeredDevice}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold text-white whitespace-nowrap">
                        ₹{acc.balanceUsd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                        <div>Avg: ₹{acc.avgTransactionUsd.toLocaleString('en-IN')}</div>
                        <div>Max: ₹{acc.dailyLimitUsd.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          {acc.sessionStatus === 'active_verified' && (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-emerald-400 font-medium">Safe &amp; Active</span>
                            </>
                          )}
                          {acc.sessionStatus === 'step_up_pending' && (
                            <>
                              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="text-amber-400 font-medium">Needs Passcode</span>
                            </>
                          )}
                          {acc.sessionStatus === 'quarantined' && (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="text-rose-400 font-medium">Paused</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="tabular-nums">
              Showing{' '}
              <strong className="text-white">
                {filteredAccounts.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
              </strong>
              –
              <strong className="text-white">
                {Math.min(safePage * pageSize, filteredAccounts.length)}
              </strong>{' '}
              of <strong className="text-white">{filteredAccounts.length.toLocaleString()}</strong>{' '}
              customer accounts
            </div>

            <div className="flex items-center gap-1.5 font-mono tabular-nums">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-slate-300">
                Page {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="Next page"
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Last
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Selected Customer Profile Inspector */}
        {inspectedAccount && (
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="text-xs font-mono text-amber-400">
                {inspectedAccount.id} · {inspectedAccount.accountNumberMasked}
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {inspectedAccount.holderName}
              </h2>
              <div className="text-xs text-slate-400 mt-0.5">{inspectedAccount.tier}</div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Available Money:</span>
                  <span className="text-white font-bold">
                    ₹{inspectedAccount.balanceUsd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Usual Payment:</span>
                  <span className="text-amber-400">
                    ₹{inspectedAccount.avgTransactionUsd.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Daily Transfer Cap:</span>
                  <span className="text-slate-200">
                    ₹{inspectedAccount.dailyLimitUsd.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400">Home City:</div>
                <div className="text-slate-200 font-medium">{inspectedAccount.homeLocation}</div>
                <div className="text-slate-400 pt-1">Trusted Personal Device:</div>
                <div className="text-slate-200 font-medium">
                  {inspectedAccount.registeredDevice}
                </div>
                <div className="text-slate-400 pt-1">Two-Step Verification Method:</div>
                <div className="text-slate-300">{inspectedAccount.mfaEnrolled}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-slate-400 font-semibold">Account Protection Status</div>
                <div className="flex items-center gap-2 pt-0.5">
                  {inspectedAccount.sessionStatus === 'active_verified' ? (
                    <span className="text-emerald-400 font-medium">
                      Active · Verified with password &amp; trusted device
                    </span>
                  ) : inspectedAccount.sessionStatus === 'step_up_pending' ? (
                    <span className="text-amber-400 font-medium">
                      Verification Pending · Requires one-time phone passcode
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium">
                      Account Paused · Temporarily locked to protect savings
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  Every transaction from this account is locked with a master digital key in the bank's encrypted vault.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onSelectAccountForSandbox(inspectedAccount.id)}
                  className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Test Payments for {inspectedAccount.holderName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onToggleAccountQuarantine(inspectedAccount.id)}
                  className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  {inspectedAccount.sessionStatus === 'quarantined'
                    ? 'Unlock Account & Resume Normal Access'
                    : 'Temporarily Pause Account for Protection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
