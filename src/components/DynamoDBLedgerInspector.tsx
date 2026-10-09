import React, { useState } from 'react';
import {
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Database,
} from 'lucide-react';
import { LedgerTransaction, SecurityDecision } from '../types';

interface DynamoDBLedgerInspectorProps {
  transactions: LedgerTransaction[];
  onOpenSandbox: () => void;
}

export const DynamoDBLedgerInspector: React.FC<DynamoDBLedgerInspectorProps> = ({
  transactions,
  onOpenSandbox,
}) => {
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | SecurityDecision>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxId, setSelectedTxId] = useState<string>(
    transactions[0]?.id || ''
  );
  const [kmsViewMode, setKmsViewMode] = useState<'encrypted_at_rest' | 'kms_decrypted'>(
    'encrypted_at_rest'
  );

  const filteredTransactions = transactions.filter((tx) => {
    if (decisionFilter !== 'ALL' && tx.decision !== decisionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.accountId.toLowerCase().includes(q) ||
        tx.holderName.toLowerCase().includes(q) ||
        tx.beneficiaryName.toLowerCase().includes(q) ||
        tx.beneficiaryIban.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedTx =
    filteredTransactions.find((t) => t.id === selectedTxId) ||
    filteredTransactions[0] ||
    transactions[0];

  return (
    <div className="space-y-6">
      {/* Header & KMS Storage Telemetry */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Protected Bank Records &amp; Digital Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Every payment is recorded permanently and scrambled with bank-grade encryption so no unauthorized person can read or alter it
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-amber-400" /> Vault: Live &amp; Tamper-Proof</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Master Key Lock: Active</span>
          <span>·</span>
          <span>Automatic Backup: 35 Days</span>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter transactions by security decision"
          className="inline-flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto"
        >
          {(
            [
              { id: 'ALL', label: `All Payments (${transactions.length})` },
              {
                id: 'ALLOW',
                label: `Approved (${transactions.filter((t) => t.decision === 'ALLOW').length})`,
              },
              {
                id: 'STEP_UP_MFA',
                label: `Needed 1-Time Code (${
                  transactions.filter((t) => t.decision === 'STEP_UP_MFA').length
                })`,
              },
              {
                id: 'BLOCK_AND_ALERT',
                label: `Blocked (${
                  transactions.filter((t) => t.decision === 'BLOCK_AND_ALERT').length
                })`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDecisionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                decisionFilter === tab.id
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            aria-label="Search payment records"
            placeholder="Search payment ID, customer, recipient, IBAN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </section>

      {/* Main 12-Col Grid: Ledger Table + KMS Envelope Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: High-Density Ledger Table */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="text-sm font-semibold text-slate-200">
                No payment records match your search or filter
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Clear your search or try sending a new transfer in the Payment Security Checker to create new records.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setDecisionFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  onClick={onOpenSandbox}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-slate-950 cursor-pointer"
                >
                  Test New Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-semibold text-slate-400">
                    <th className="py-3 px-3.5">Payment ID &amp; Time</th>
                    <th className="py-3 px-3.5">Sender &amp; Recipient</th>
                    <th className="py-3 px-3.5 text-right">Amount</th>
                    <th className="py-3 px-3.5 text-right">Safety Score</th>
                    <th className="py-3 px-3.5">SafeBank vs Old Bank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {filteredTransactions.map((tx) => {
                    const isSelected = selectedTx?.id === tx.id;
                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTxId(tx.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800/80'
                            : 'hover:bg-slate-950/60'
                        }`}
                      >
                        <td className="py-3 px-3.5 font-mono tabular-nums align-top">
                          <div className="font-semibold text-amber-400">{tx.id}</div>
                          <div className="text-[11px] text-slate-500">{tx.timestamp}</div>
                        </td>
                        <td className="py-3 px-3.5 align-top">
                          <div className="font-medium text-white">
                            {tx.holderName}{' '}
                            <span className="text-slate-500 font-mono">({tx.accountId})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[210px]">
                            To: {tx.beneficiaryName}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono tabular-nums font-semibold text-white align-top">
                          ₹{tx.amountUsd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono tabular-nums align-top">
                          <span
                            className={`font-bold ${
                              tx.riskScore <= 34
                                ? 'text-emerald-400'
                                : tx.riskScore <= 69
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {tx.riskScore}/100
                          </span>
                        </td>
                        <td className="py-3 px-3.5 align-top">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            {tx.decision === 'ALLOW' && (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span className="text-emerald-400 font-semibold">Approved</span>
                              </>
                            )}
                            {tx.decision === 'STEP_UP_MFA' && (
                              <>
                                <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-amber-400 font-semibold">1-Time Code</span>
                              </>
                            )}
                            {tx.decision === 'BLOCK_AND_ALERT' && (
                              <>
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="text-rose-400 font-semibold">Blocked</span>
                              </>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Old Bank: {tx.fixedAuthWouldHave === 'ALLOW' ? 'Would have approved (weak!)' : 'Blocked'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 5 Columns: AWS KMS Envelope Encryption & DynamoDB Item Inspector */}
        {selectedTx && (
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-mono text-amber-400">
                  Payment Record · {selectedTx.id}
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Bank Vault Padlock &amp; Encryption Inspector
                </h2>
              </div>

              {/* Interactive Toggle between At-Rest Ciphertext and KMS Decrypted */}
              <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setKmsViewMode('encrypted_at_rest')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    kmsViewMode === 'encrypted_at_rest'
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Scrambled (On Disk)</span>
                </button>
                <button
                  onClick={() => setKmsViewMode('kms_decrypted')}
                  className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    kmsViewMode === 'kms_decrypted'
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Unlock className="w-3 h-3" />
                  <span>Unlocked (Readable)</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono space-y-1">
                <div className="text-slate-400">Vault Account &amp; Record Keys:</div>
                <div className="text-cyan-300 break-all">{selectedTx.dynamoDbPartitionKey}</div>
                <div className="text-slate-400 pt-1">Master Lock Key ID:</div>
                <div className="text-amber-300 break-all">{selectedTx.kmsKeyArn}</div>
              </div>

              {kmsViewMode === 'encrypted_at_rest' ? (
                <div className="space-y-1.5">
                  <div className="text-slate-300 font-semibold">
                    How This Record Looks on Disk (Unreadable Gibberish to Hackers)
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify(
                      {
                        VaultAccountKey: `ACCT#${selectedTx.accountId}`,
                        PaymentRecordKey: `TXN#${selectedTx.id}`,
                        LockStandard: 'AES-256 Military Grade Master Padlock',
                        MasterKeyId: selectedTx.kmsKeyArn,
                        CalculatedSafetyScore: selectedTx.riskScore,
                        FinalDecision: selectedTx.decision,
                        ScrambledProtectedData: selectedTx.kmsCiphertextPreview,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-emerald-400 font-semibold">
                    How Verified Bank Staff See This Record (Unlocked with Security Key)
                  </div>
                  <pre className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/40 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                    {JSON.stringify(
                      {
                        PaymentNumber: selectedTx.id,
                        CustomerSendingMoney: selectedTx.holderName,
                        RecipientName: selectedTx.beneficiaryName,
                        RecipientBankNumber: selectedTx.beneficiaryIban,
                        AmountSentRupees: `₹${selectedTx.amountUsd.toLocaleString('en-IN')}`,
                        SafetyScore: `${selectedTx.riskScore} / 100`,
                        SafetyDecision: selectedTx.decision,
                        HowCustomerVerified: selectedTx.verificationMethod,
                        DeviceUsed: selectedTx.deviceInfo,
                        WhereSentFrom: selectedTx.locationInfo,
                        TransferPace: selectedTx.frequencyInfo,
                        TimingAndBehavior: selectedTx.anomalyInfo,
                        InspectionId: selectedTx.lambdaRequestId,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
