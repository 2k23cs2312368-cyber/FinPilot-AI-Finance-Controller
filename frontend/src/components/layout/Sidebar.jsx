import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  PieChart,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  BotMessageSquare,
  CheckCircle,
  History,
  FileSpreadsheet,
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
  { id: 'risks', label: 'Risk Center', icon: ShieldAlert, badgeKey: 'critical_risks_count' },
  { id: 'insights', label: 'AI Insights', icon: Sparkles },
  { id: 'copilot', label: 'Finance Copilot', icon: BotMessageSquare, highlight: true },
  { id: 'approvals', label: 'Approval Center', icon: CheckCircle, badgeKey: 'pending_approvals_count' },
  { id: 'audit-logs', label: 'Audit Logs', icon: History },
  { id: 'reports', label: 'Financial Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ currentTab, onSelectTab, counts = {} }) {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none fixed top-0 left-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fintech-700 via-fintech-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-fintech-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-base tracking-tight text-slate-900">FinPilot <span className="text-fintech-600 font-black">AI</span></h1>
            <span className="bg-fintech-50 text-fintech-700 text-[10px] font-bold px-1.5 py-0.2 rounded border border-fintech-200">v1.0</span>
          </div>
          <p className="text-[10px] font-medium text-slate-400">Autonomous Finance Controller</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group text-left ${
                isActive
                  ? 'bg-fintech-600 text-white shadow-sm shadow-fintech-600/25'
                  : item.highlight
                  ? 'text-indigo-600 hover:bg-indigo-50/80 bg-indigo-50/40'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {badgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                    isActive
                      ? 'bg-white text-fintech-700'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Controller Mode Badge */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Controller Active
            </span>
            <span className="text-[10px] text-slate-400 uppercase">Track 4</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">5 Specialized AI Domain Agents online</p>
        </div>
      </div>
    </aside>
  );
}
