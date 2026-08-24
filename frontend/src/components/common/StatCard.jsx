import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({ title, value, formattedValue, previousValue, pctChange, isPositiveTrend, status, subtitle, icon: Icon }) {
  const isUp = pctChange > 0;
  const isZero = pctChange === 0;

  // Determine badge color based on status (good, warning, danger, neutral)
  let badgeColor = 'bg-slate-100 text-slate-700';
  let TrendIcon = Minus;

  if (status === 'good') {
    badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;
  } else if (status === 'danger') {
    badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
    TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;
  } else if (status === 'warning') {
    badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
    TrendIcon = isUp ? ArrowUpRight : ArrowDownRight;
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-fintech-50 text-fintech-600 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {formattedValue || value}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-semibold ${badgeColor}`}>
            <TrendIcon className="w-3 h-3" />
            {pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`}
          </span>
          <span className="text-slate-500 text-[11px]">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
