import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Scale,
  Wallet,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/Feedback';

export function CashFlow({ addToast }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getCashFlowForecast();
      setForecast(res);
    } catch (err) {
      addToast(err.message || 'Failed to load cash flow forecast', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  if (loading || !forecast) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} height="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Autonomous Cash Flow Forecast</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            30-day forward-looking predictive liquidity modeling based on historical ledger run-rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {forecast.disclaimer}
          </span>
        </div>
      </div>

      {/* AI Cash Reserve Warning Banner */}
      <div
        className={`p-5 rounded-2xl border shadow-card flex items-start gap-3.5 ${
          forecast.reserve_breach_expected
            ? 'bg-amber-50/80 border-amber-300 text-amber-900'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
        }`}
      >
        {forecast.reserve_breach_expected ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <h4 className="text-xs font-extrabold uppercase tracking-wider">
            {forecast.reserve_breach_expected ? 'Cash Runway Alert: Reserve Breach Projected' : 'Liquidity Status: Robust Runway'}
          </h4>
          <p className="text-xs leading-relaxed font-medium">
            {forecast.ai_recommendation}
          </p>
        </div>
      </div>

      {/* Cash Flow Equation Breakdown (Opening + Revenue - Expenses - Refunds = Closing) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          30-Day Liquidity Equation Reconciliation
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-center">
          {/* Opening */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Opening Cash</span>
            <span className="text-sm font-extrabold text-slate-900 mt-1 block">
              ₹{forecast.opening_cash.toLocaleString('en-IN')}
            </span>
          </div>

          <span className="text-slate-400 font-bold text-lg hidden sm:block">+</span>

          {/* Revenue */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Expected Revenue</span>
            <span className="text-sm font-extrabold text-emerald-900 mt-1 block">
              ₹{forecast.total_expected_revenue_30d.toLocaleString('en-IN')}
            </span>
          </div>

          <span className="text-slate-400 font-bold text-lg hidden sm:block">-</span>

          {/* Expenses & Refunds */}
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Expected Outflow & Refunds</span>
            <span className="text-sm font-extrabold text-rose-900 mt-1 block">
              ₹{(forecast.total_expected_expenses_30d + forecast.total_expected_refunds_30d).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Projected 30D Closing Balance:</span>
            <span className="text-base font-black text-indigo-700">
              ₹{forecast.projected_closing_cash_30d.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-slate-500">
            Minimum Configured Reserve: <strong className="text-slate-800">₹{forecast.minimum_cash_reserve.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* 30-Day Forward Forecast Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">30-Day Trajectory Projection</h3>
            <p className="text-xs text-slate-500">Closing balance curve vs configured minimum cash reserve threshold</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Projected Cash
            </span>
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-2.5 h-0.5 bg-rose-500"></span> Min Reserve (₹5,00,000)
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecast.forecast_points} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val, name) => [
                  `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
                  name
                ]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <ReferenceLine
                y={forecast.minimum_cash_reserve}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: 'Min Reserve Threshold', fill: '#f43f5e', fontSize: 10, position: 'top' }}
              />
              <Bar dataKey="projected_inflow" name="Inflow (₹)" fill="#10b981" opacity={0.3} radius={[4, 4, 0, 0]} />
              <Bar dataKey="projected_outflow" name="Outflow (₹)" fill="#f43f5e" opacity={0.2} radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="closing_cash"
                name="Closing Cash Balance"
                stroke="#4338ca"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
