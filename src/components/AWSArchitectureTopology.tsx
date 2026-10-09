import React, { useState } from 'react';
import {
  RiskEvaluationResult,
  BankAccountProfile,
  TransactionInput,
} from '../types';

interface AWSArchitectureTopologyProps {
  evaluation: RiskEvaluationResult;
  selectedAccount: BankAccountProfile;
  transactionInput: TransactionInput;
  onJumpToSandbox: () => void;
}

interface AWSServiceNodeSpec {
  id:
    | 'cognito'
    | 'apigateway'
    | 'lambda'
    | 'dynamodb'
    | 'kms'
    | 'iam'
    | 'cloudwatch';
  name: string;
  awsCategory: string;
  resourceArn: string;
  latencyMs: number;
  costModel: string;
  roleInRiskScoring: string;
  liveStatus: string;
  policySnippetTitle: string;
  policyJson: string;
  x: number;
  y: number;
}

export const AWSArchitectureTopology: React.FC<AWSArchitectureTopologyProps> = ({
  evaluation,
  selectedAccount,
  transactionInput,
  onJumpToSandbox,
}) => {
  const [selectedServiceId, setSelectedServiceId] =
    useState<AWSServiceNodeSpec['id']>('lambda');

  const services: AWSServiceNodeSpec[] = [
    {
      id: 'cognito',
      name: '1. Customer Login',
      awsCategory: 'Identity & Device Check',
      resourceArn: 'Amazon Cognito (Customer Directory · ap-south-1)',
      latencyMs: 8,
      costModel: 'Under ₹0.40 per active customer each month',
      roleInRiskScoring:
        'Checks the customer\'s password, remembers their trusted phone or laptop, and sends a 6-digit text code or fingerprint challenge when a payment looks unfamiliar.',
      liveStatus: evaluation.awsPipelineTrace.cognitoAuthStatus,
      policySnippetTitle: 'Login Security Rules (Simple View)',
      policyJson: JSON.stringify(
        {
          SecurityCheck: 'Smart Adaptive Protection',
          SavedDeviceRequired: true,
          RequirePasscodeOnNewDevice: true,
          CustomerAccount: selectedAccount.holderName,
          SafetyDecision: evaluation.decision === 'ALLOW' ? 'Approved (Safe)' : evaluation.decision === 'STEP_UP_MFA' ? 'Needs 1-Time Code' : 'Blocked (Scam Alert)',
        },
        null,
        2
      ),
      x: 110,
      y: 190,
    },
    {
      id: 'apigateway',
      name: '2. Front Door Gate',
      awsCategory: 'Traffic & Bot Filter',
      resourceArn: 'Amazon API Gateway (Traffic Guard · ap-south-1)',
      latencyMs: evaluation.awsPipelineTrace.apiGatewayLatencyMs,
      costModel: '₹83 per million customer payment requests',
      roleInRiskScoring:
        'Welcomes legitimate customers, inspects where the connection came from (city & country), and stops automated hacker bots from flooding the bank.',
      liveStatus: `Connected · Sender is in ${transactionInput.locationLabel} (IP ${transactionInput.ipAddress})`,
      policySnippetTitle: 'Front Door Safety Filter Rules',
      policyJson: JSON.stringify(
        {
          GateStatus: 'Open for verified users',
          CustomerLocation: transactionInput.locationLabel,
          ConnectionChannel: transactionInput.channel,
          BotRateLimit: 'Blocked if exceeding 25 requests/sec',
        },
        null,
        2
      ),
      x: 290,
      y: 190,
    },
    {
      id: 'lambda',
      name: '3. Safety Brain',
      awsCategory: '6-Signal Risk Engine',
      resourceArn: 'AWS Lambda (Smart Safety Evaluator · ap-south-1)',
      latencyMs: evaluation.awsPipelineTrace.lambdaComputeMs,
      costModel: '₹16 per 1 million instant payment evaluations',
      roleInRiskScoring:
        'The core brain: calculates the 0–100 safety score in 18 milliseconds by evaluating payment amount, device, recipient, location, transfer speed, and timing all at once.',
      liveStatus: `Safety Score: ${evaluation.totalRiskScore}/100 -> Decision: ${evaluation.decision === 'ALLOW' ? 'Safe (Approved)' : evaluation.decision === 'STEP_UP_MFA' ? 'Needs 1-Time Code' : 'Blocked (Danger)'}`,
      policySnippetTitle: 'Live Safety Score Calculation',
      policyJson: JSON.stringify(
        {
          Customer: selectedAccount.holderName,
          PaymentAmount: `₹${transactionInput.amountUsd.toLocaleString('en-IN')}`,
          FinalSafetyScore: `${evaluation.totalRiskScore} / 100`,
          Action: evaluation.decision,
          OldPasswordSystemWouldHave: evaluation.traditionalFixedAuthDecision === 'ALLOW' ? 'Approved (Weak!)' : 'Blocked',
        },
        null,
        2
      ),
      x: 470,
      y: 190,
    },
    {
      id: 'dynamodb',
      name: '4. Bank Vault',
      awsCategory: 'Protected Records Ledger',
      resourceArn: 'Amazon DynamoDB (Secure Financial Ledger · ap-south-1)',
      latencyMs: 6,
      costModel: '₹104 per million permanent record saves',
      roleInRiskScoring:
        'Safely records every approved transaction and keeps track of spending history so future payments can be checked accurately.',
      liveStatus: evaluation.awsPipelineTrace.dynamoDbWriteStatus,
      policySnippetTitle: 'Bank Vault Storage Rules',
      policyJson: JSON.stringify(
        {
          VaultTable: 'Bank Safe Transaction Ledger',
          Encryption: 'Digital Master Key Padlock (Active)',
          AccountLockedTo: selectedAccount.holderName,
          AutomaticBackup: 'Enabled (35-day restore protection)',
        },
        null,
        2
      ),
      x: 680,
      y: 110,
    },
    {
      id: 'kms',
      name: '5. Digital Padlock',
      awsCategory: 'Master Encryption Keys',
      resourceArn: 'AWS KMS (Key Management Service · ap-south-1)',
      latencyMs: 4,
      costModel: '₹83/month master key + fraction of paisa per lock operation',
      roleInRiskScoring:
        'Scrambles every account number and rupee balance into unreadable secret code so even if a disk is stolen, no money or personal data can be seen.',
      liveStatus: `Active Master Lock · key/${selectedAccount.kmsKeyId}`,
      policySnippetTitle: 'Master Key Protection Policy',
      policyJson: JSON.stringify(
        {
          PadlockStandard: 'Bank-Grade AES-256 Military Encryption',
          WhoCanUnlock: 'Only verified internal bank safety services',
          CustomerDataProtected: true,
          KeyRotation: 'Automatic annual key renewal',
        },
        null,
        2
      ),
      x: 680,
      y: 270,
    },
    {
      id: 'iam',
      name: '6. Staff Permissions',
      awsCategory: 'Strict Need-to-Know Access',
      resourceArn: 'AWS IAM (Role & Access Controls)',
      latencyMs: 2,
      costModel: 'Always included for free (₹0.00)',
      roleInRiskScoring:
        'Strictly ensures each bank system only has access to what it strictly needs, and automatically locks customer accounts when high-risk fraud is detected.',
      liveStatus:
        evaluation.decision === 'BLOCK_AND_ALERT'
          ? 'Account locked for safety'
          : 'Strict permissions verified & active',
      policySnippetTitle: 'Permission Guard Policy',
      policyJson: JSON.stringify(
        {
          PermissionRule: 'Strict Need-to-Know Access Only',
          LargeTransfersOver50000: 'Require recent one-time code verification',
          UnauthorizedStaffBlocked: true,
        },
        null,
        2
      ),
      x: 380,
      y: 65,
    },
    {
      id: 'cloudwatch',
      name: '7. 24/7 Watchdog',
      awsCategory: 'Security Alarm Monitor',
      resourceArn: 'Amazon CloudWatch (Live Alarm & Alert Monitor · ap-south-1)',
      latencyMs: 5,
      costModel: '₹40 per GB of activity logs',
      roleInRiskScoring:
        'Monitors activity around the clock, sounds instant alarms if someone tries to steal money, and alerts security guards immediately.',
      liveStatus: 'Active & Watching 24/7',
      policySnippetTitle: 'Safety Alarm Definition',
      policyJson: JSON.stringify(
        {
          AlarmName: 'Scam & High-Risk Payment Alarm',
          TriggerCondition: 'Safety Score reaches 70 or higher',
          InstantAction: 'Halt payment & alert security team immediately',
        },
        null,
        2
      ),
      x: 470,
      y: 325,
    },
  ];

  const activeService =
    services.find((s) => s.id === selectedServiceId) || services[2];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            How Bank Security Works Behind the Scenes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Click any of the 7 security guards below to see what it does in plain language and how it keeps your money safe
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right text-xs">
            <div className="text-slate-400">Total Check Speed</div>
            <div className="text-amber-400 font-bold tabular-nums">
              {evaluation.awsPipelineTrace.apiGatewayLatencyMs +
                evaluation.awsPipelineTrace.lambdaComputeMs +
                14}
              ms (Instant)
            </div>
          </div>
          <button
            onClick={onJumpToSandbox}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
          >
            Test in Safety Check
          </button>
        </div>
      </section>

      {/* Main Interactive SVG Topology + Live Service Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Interactive AWS Architecture Blueprint */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200">
              01. Visual Security Map &amp; Payment Journey
            </span>
            <span className="tabular-nums">
              Current Payment Score: {evaluation.totalRiskScore}/100 ({evaluation.decision === 'ALLOW' ? 'Safe' : evaluation.decision === 'STEP_UP_MFA' ? 'Needs Code' : 'Blocked'})
            </span>
          </div>

          <div className="w-full rounded-xl bg-slate-950 border border-slate-800/90 overflow-hidden">
            <svg viewBox="0 0 800 390" className="w-full h-auto select-none">
              <defs>
                <pattern id="awsGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path
                    d="M 32 0 L 0 0 0 32"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="0.75"
                  />
                </pattern>
                <marker
                  id="arrowAmber"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                </marker>
                <marker
                  id="arrowCyan"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                </marker>
              </defs>

              <rect width="800" height="390" fill="url(#awsGrid)" />

              {/* AWS Cloud Region Boundary Box */}
              <rect
                x="24"
                y="20"
                width="752"
                height="350"
                rx="12"
                fill="none"
                stroke="#334155"
                strokeWidth="1.5"
                strokeDasharray="6,6"
              />
              <text
                x="40"
                y="42"
                fill="#94a3b8"
                fontSize="11"
                fontFamily="sans-serif"
                fontWeight="600"
              >
                SafeBank India Cloud Protection Network · 7 Security Guards (AWS ap-south-1 Mumbai)
              </text>

              {/* Directed Pipeline Edges */}
              {/* Cognito -> API Gateway */}
              <line
                x1="175"
                y1="190"
                x2="225"
                y2="190"
                stroke="#f59e0b"
                strokeWidth="2"
                markerEnd="url(#arrowAmber)"
              />
              {/* API Gateway -> Lambda */}
              <line
                x1="355"
                y1="190"
                x2="405"
                y2="190"
                stroke="#f59e0b"
                strokeWidth="2"
                markerEnd="url(#arrowAmber)"
              />
              {/* IAM -> API Gateway & Lambda */}
              <line
                x1="380"
                y1="95"
                x2="310"
                y2="155"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <line
                x1="380"
                y1="95"
                x2="450"
                y2="155"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              {/* Lambda -> DynamoDB */}
              <line
                x1="535"
                y1="175"
                x2="615"
                y2="125"
                stroke={evaluation.decision === 'BLOCK_AND_ALERT' ? '#f43f5e' : '#10b981'}
                strokeWidth="2"
                markerEnd="url(#arrowCyan)"
              />
              {/* Lambda -> KMS */}
              <line
                x1="535"
                y1="205"
                x2="615"
                y2="255"
                stroke="#38bdf8"
                strokeWidth="2"
                markerEnd="url(#arrowCyan)"
              />
              {/* DynamoDB <-> KMS Envelope Encryption */}
              <line
                x1="680"
                y1="145"
                x2="680"
                y2="235"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              {/* Lambda -> CloudWatch */}
              <line
                x1="470"
                y1="225"
                x2="470"
                y2="290"
                stroke="#f59e0b"
                strokeWidth="2"
                markerEnd="url(#arrowAmber)"
              />

              {/* Render All 7 AWS Service Nodes */}
              {services.map((node) => {
                const isSelected = node.id === selectedServiceId;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedServiceId(node.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x="-68"
                      y="-32"
                      width="136"
                      height="64"
                      rx="8"
                      fill={isSelected ? '#1e293b' : '#0f172a'}
                      stroke={isSelected ? '#f59e0b' : '#334155'}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                    />
                    <text
                      x="0"
                      y="-8"
                      textAnchor="middle"
                      fill={isSelected ? '#fbbf24' : '#f8fafc'}
                      fontSize="11"
                      fontWeight="700"
                    >
                      {node.name}
                    </text>
                    <text
                      x="0"
                      y="8"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="8.5"
                    >
                      {node.awsCategory}
                    </text>
                    <text
                      x="0"
                      y="22"
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="8.5"
                      fontFamily="monospace"
                    >
                      {node.latencyMs}ms · Online
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Service Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  s.id === selectedServiceId
                    ? 'bg-slate-800 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-semibold truncate">{s.name.replace('Amazon ', '').replace('AWS ', '')}</div>
                <div className="text-[11px] font-mono text-amber-400 tabular-nums mt-0.5">
                  {s.latencyMs}ms
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Selected Security Guard Details */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="text-xs text-amber-400 font-medium">
              {activeService.awsCategory} · Check Speed: {activeService.latencyMs}ms
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {activeService.name}
            </h2>
            <div className="text-xs text-slate-400 mt-1">
              Part of SafeBank's multi-layered protection system
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-slate-400 font-medium">
                What this security guard does:
              </div>
              <p className="text-slate-200 leading-relaxed mt-1 text-sm">
                {activeService.roleInRiskScoring}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-slate-400">Current Payment Check Result:</div>
              <div className="text-emerald-400 font-semibold">
                {activeService.liveStatus}
              </div>
              <div className="text-slate-400 pt-1 text-[11px]">
                Operating Cost: <span className="text-slate-200">{activeService.costModel}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-slate-300 font-semibold">
                {activeService.policySnippetTitle}
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed">
                {activeService.policyJson}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
