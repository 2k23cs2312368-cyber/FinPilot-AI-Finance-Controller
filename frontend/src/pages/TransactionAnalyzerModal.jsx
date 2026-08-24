import React, { useState } from 'react';
import {
  ShieldAlert,
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { RiskBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export function TransactionAnalyzerModal({
  isOpen,
  onClose,
  transaction,
  onActionComplete,
  addToast
}) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [escalating, setEscalating] = useState(false);

  // Run deep AI analysis
  const runAnalysis = async () => {
    if (!transaction) return;
    try {
      setAnalyzing(true);
      const res = await api.analyzeTransaction(transaction.id);
      setAnalysis(res);
      addToast(`AI Risk Analysis Complete: Score ${res.risk_score}/100`, 'success');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      addToast(err.message || 'Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Trigger simulated action
  const handleApplyAction = async (actionName) => {
    try {
      setActionLoading(true);
      await api.updateTransactionAction(transaction.id, actionName);
      addToast(`Simulated Action: Applied ${actionName} to ${transaction.id}`, 'success');
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      addToast(err.message || 'Action update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Escalate to Approval Center
  const handleSendToApproval = async () => {
    try {
      setEscalating(true);
      await api.createApproval({
        title: `Pre-settlement Hold for ${transaction.id} (₹${transaction.amount.toLocaleString('en-IN')})`,
        reason: analysis ? analysis.explanation : `High risk transaction flag on customer ${transaction.customer_name}`,
        risk_level: analysis ? analysis.risk_level : transaction.risk_level,
        entity_type: 'transaction',
        entity_id: transaction.id,
        proposed_action: analysis ? analysis.recommended_action : 'MANUAL_REVIEW',
        ai_agent: 'Financial Risk Agent'
      });
      addToast(`Sent to Approval Center as high-risk recommendation!`, 'success');
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      addToast(err.message || 'Escalation failed', 'error');
    } finally {
      setEscalating(false);
    }
  };

  if (!transaction) return null;

  const currentScore = analysis ? analysis.risk_score : transaction.risk_score;
  const currentLevel = analysis ? analysis.risk_level : transaction.risk_level;
  const signals = analysis
    ? analysis.signals
    : (transaction.signals ? JSON.parse(transaction.signals) : []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Transaction Intelligence & Risk Analyzer"
      subtitle={`Detailed telemetry for Transaction ID: ${transaction.id}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Core Transaction Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount</span>
            <span className="text-sm font-extrabold text-slate-900">
              ₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
            <span className="font-semibold text-slate-800 truncate block">{transaction.customer_name || 'Standard'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Method</span>
            <span className="font-medium text-slate-700">{transaction.payment_method}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
            <StatusBadge status={transaction.status} />
          </div>
        </div>

        {/* AI Analysis Trigger Banner if not analyzed yet */}
        {!analysis && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold text-indigo-900">Deep Risk Diagnostic Available</h4>
                <p className="text-[11px] text-indigo-700">Runs multi-variable statistical anomaly detection across velocity & history.</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={runAnalysis}
              loading={analyzing}
              icon={Sparkles}
              className="text-xs"
            >
              Analyze with AI
            </Button>
          </div>
        )}

        {/* Risk Score & Diagnosis Result */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Risk Assessment</span>
            </div>
            <RiskBadge score={currentScore} level={currentLevel} />
          </div>

          {/* Explanation */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              AI Diagnostic Reason
            </span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              {analysis
                ? analysis.explanation
                : transaction.ai_explanation || "Nominal transaction risk. Transaction aligns with expected customer behavior."}
            </p>
          </div>

          {/* Detected Signals */}
          {signals.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Detected Telemetry Signals ({signals.length})
              </span>
              <div className="space-y-1.5">
                {signals.map((sig, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-rose-50/60 border border-rose-100 px-3 py-1.5 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Engine attribution */}
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Engine: {analysis ? analysis.ai_engine : 'FinPilot Risk Engine'}</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Factual DB Anchored
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Simulated Action:</span>
            <button
              onClick={() => handleApplyAction('ALLOW')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Allow
            </button>
            <button
              onClick={() => handleApplyAction('MONITOR')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Monitor
            </button>
            <button
              onClick={() => handleApplyAction('BLOCK')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              Simulated Block
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendToApproval}
            loading={escalating}
            icon={Send}
            className="text-xs font-bold border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            Escalate to Approval Center
          </Button>
        </div>

        <p className="text-[10px] text-slate-400 text-center italic">
          * Note: 'BLOCK' updates local application demo risk state and does not alter live payment gateway funds.
        </p>
      </div>
    </Modal>
  );
}
