import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Receipt,
  Scale,
  ShieldAlert,
  Download,
  Loader2,
  Building2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/Feedback';

export function Reports({ addToast }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    try {
      setLoading(true);
      const res = await api.generateReport();
      setReport(res);
      addToast('Executive financial report generated!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !report) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={5} height="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar (Hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Financial Report</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive multi-agent intelligence summary and board-ready financial dossier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={generateReport}
            loading={loading}
            icon={Sparkles}
            className="text-xs"
          >
            Regenerate
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
            className="text-xs"
          >
            Export / Print PDF
          </Button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      {report && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 sm:p-12 space-y-8 max-w-5xl mx-auto">
          {/* Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-fintech-600 text-white flex items-center justify-center font-black text-sm">
                  FP
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  FinPilot AI <span className="text-fintech-600 font-extrabold">Executive Dossier</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                <strong className="text-slate-800 font-bold">{report.business_name}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
              <div>Period: <strong className="text-slate-800 font-semibold">{report.period}</strong></div>
              <div>Generated: <span className="font-mono">{report.generated_at}</span></div>
              <div className="text-emerald-700 font-bold flex items-center sm:justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Multi-Agent Certified
              </div>
            </div>
          </div>

          {/* 1. Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-l-4 border-fintech-600 pl-3">
              1. Executive Summary
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-700 font-medium">
              {report.executive_summary}
            </div>
          </div>

          {/* 2. Key High-Level Performance Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">
                {report.revenue_analysis.formatted_revenue}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {report.revenue_analysis.growth_pct > 0 ? `+${report.revenue_analysis.growth_pct}%` : `${report.revenue_analysis.growth_pct}%`} vs prior
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Expenses</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">
                {report.expense_analysis.formatted_expenses}
              </span>
              <span className="text-[11px] text-slate-600 font-semibold">
                {report.expense_analysis.growth_pct > 0 ? `+${report.expense_analysis.growth_pct}%` : `${report.expense_analysis.growth_pct}%`} vs prior
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Profit</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">
                {report.profitability_analysis.formatted_net_profit}
              </span>
              <span className="text-[11px] text-slate-600 font-semibold">
                Margin: {report.profitability_analysis.profit_margin_pct}%
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Index</span>
              <span className="text-base font-extrabold text-slate-900 mt-1 block">
                {report.risk_compliance_summary.risk_score} / 100
              </span>
              <span className="text-[11px] text-slate-600 font-semibold">
                {report.risk_compliance_summary.risk_level}
              </span>
            </div>
          </div>

          {/* 3. Deep Domain Analyses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Revenue Analysis */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-fintech-600" /> Revenue Intelligence
              </h4>
              <div className="space-y-1.5 text-slate-600">
                {report.revenue_analysis.key_findings.map((f, i) => (
                  <p key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-fintech-600 mt-1.5 flex-shrink-0" />
                    <span>{f}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Expense Analysis */}
            <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" /> Expense & Cost Variance
              </h4>
              <div className="space-y-1.5 text-slate-600">
                {report.expense_analysis.key_findings.map((f, i) => (
                  <p key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 flex-shrink-0" />
                    <span>{f}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Cash Flow & Liquidity Positioning */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" /> Cash Flow & Runway Health
            </h4>
            <p className="text-slate-700 leading-relaxed font-medium">
              {report.cash_flow_analysis.recommendation}
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              Current Treasury Balance: <strong>₹{report.cash_flow_analysis.current_cash_balance.toLocaleString('en-IN')}</strong> • Estimated Operating Runway: <strong>{report.cash_flow_analysis.runway_days} days</strong>
            </div>
          </div>

          {/* 5. Budget Variance Matrix */}
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-l-4 border-fintech-600 pl-3">
              2. Budget Allocation vs Actual Disbursements
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Budget</th>
                    <th className="py-2.5 px-4">Actual Spend</th>
                    <th className="py-2.5 px-4">Variance</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {report.budget_variance_summary.map((b) => (
                    <tr key={b.category}>
                      <td className="py-2 px-4 font-bold text-slate-900">{b.category}</td>
                      <td className="py-2 px-4">₹{b.budget_amount.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 font-bold">₹{b.actual_amount.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 font-semibold">
                        <span className={b.variance_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {b.variance_amount > 0 ? `+₹${b.variance_amount.toLocaleString('en-IN')}` : `₹${b.variance_amount.toLocaleString('en-IN')}`}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Strategic AI Recommendations */}
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-l-4 border-fintech-600 pl-3">
              3. Strategic AI Controller Directives
            </h3>
            <div className="space-y-2">
              {report.strategic_ai_recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-slate-800 font-medium">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signoff Footer */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
            <div>Authored by: <strong className="text-slate-700">{report.author}</strong></div>
            <div>FinPilot AI • Track 4: AI Finance Controller</div>
          </div>
        </div>
      )}
    </div>
  );
}
