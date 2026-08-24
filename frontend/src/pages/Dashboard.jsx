import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Receipt,
  Scale,
  Wallet,
  Clock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { DateFilter, LoadingSkeleton } from '../components/common/Feedback';
import { Button } from '../components/common/Button';

const PIE_COLORS = ['#0c5eed', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#eab308', '#10b981', '#64748b'];

export function Dashboard({ onNavigate, addToast }) {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadDashboardData = async (selectedDays) => {
    try {
      setLoading(true);
      const res = await api.getDashboard(selectedDays);
      setData(res);
    } catch (err) {
      addToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(days);
  }, [days]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <LoadingSkeleton count={3} height="h-64" />
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous multi-agent financial metrics and ledger analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateFilter selectedDays={days} onChange={setDays} />
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('reports')}
            icon={FileSpreadsheet}
            className="text-xs"
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={kpis.revenue.title}
          formattedValue={kpis.revenue.formatted_value}
          pctChange={kpis.revenue.pct_change}
          status={kpis.revenue.status}
          subtitle={kpis.revenue.subtitle}
          icon={TrendingUp}
        />
        <StatCard
          title={kpis.expenses.title}
          formattedValue={kpis.expenses.formatted_value}
          pctChange={kpis.expenses.pct_change}
          status={kpis.expenses.status}
          subtitle={kpis.expenses.subtitle}
          icon={Receipt}
        />
        <StatCard
          title={kpis.net_profit.title}
          formattedValue={kpis.net_profit.formatted_value}
          pctChange={kpis.net_profit.pct_change}
          status={kpis.net_profit.status}
          subtitle={kpis.net_profit.subtitle}
          icon={Scale}
        />
        <StatCard
          title={kpis.cash_balance.title}
          formattedValue={kpis.cash_balance.formatted_value}
          pctChange={kpis.cash_balance.pct_change}
          status={kpis.cash_balance.status}
          subtitle={kpis.cash_balance.subtitle}
          icon={Wallet}
        />
        <StatCard
          title={kpis.receivables.title}
          formattedValue={kpis.receivables.formatted_value}
          pctChange={kpis.receivables.pct_change}
          status={kpis.receivables.status}
          subtitle={kpis.receivables.subtitle}
          icon={Clock}
        />
        <StatCard
          title={kpis.risk_score.title}
          formattedValue={kpis.risk_score.formatted_value}
          pctChange={kpis.risk_score.pct_change}
          status={kpis.risk_score.status}
          subtitle={kpis.risk_score.subtitle}
          icon={ShieldAlert}
        />
      </div>

      {/* Prominent AI Insights Banner */}
      {data.recent_insights && data.recent_insights.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>AI Financial Insights Engine</span>
            </div>
            <button
              onClick={() => onNavigate('insights')}
              className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
            >
              View all insights <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recent_insights.slice(0, 2).map((ins) => (
              <div key={ins.id} className="bg-white/5 hover:bg-white/10 p-3.5 rounded-xl border border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-200">{ins.agent_name}</span>
                  <StatusBadge status={ins.severity} />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">{ins.title}</h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{ins.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Revenue vs Expenses Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue vs Expenses</h3>
              <p className="text-xs text-slate-500">Daily financial inflow vs operating burn</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-fintech-600"></span> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expenses
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_expense_chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c5eed" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0c5eed" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0c5eed" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Net Profit Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Net Profit Trend</h3>
              <p className="text-xs text-slate-500">Margin trajectory post refunds & costs</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Profitable
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.profit_trend_chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Net Profit']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="net_profit" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Expense Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Expense Breakdown by Category</h3>
              <p className="text-xs text-slate-500">Operational cost distribution</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('expenses')} className="text-xs">
              Manage Expenses
            </Button>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.expense_breakdown_chart}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.expense_breakdown_chart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Spend']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Payment Success vs Failure & Refund Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payment Status Distribution</h3>
              <p className="text-xs text-slate-500">Transaction integrity and failure volumes</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('transactions')} className="text-xs">
              View Transactions
            </Button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.payment_status_breakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val, name, item) => [
                    `${val} transactions (₹${(item.payload.total_amount || 0).toLocaleString('en-IN')})`,
                    'Count'
                  ]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {data.payment_status_breakdown.map((entry, index) => {
                    let color = '#10b981';
                    if (entry.status === 'FAILED') color = '#f43f5e';
                    else if (entry.status === 'REFUNDED') color = '#f59e0b';
                    else if (entry.status === 'PENDING') color = '#0c5eed';
                    return <Cell key={`bar-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
