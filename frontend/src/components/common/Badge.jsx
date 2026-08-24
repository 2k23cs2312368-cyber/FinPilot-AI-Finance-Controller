import React from 'react';

export function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  let dot = 'bg-slate-400';

  if (s === 'SUCCESS' || s === 'PAID' || s === 'APPROVED' || s === 'COMPLIANT' || s === 'ON_TRACK') {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dot = 'bg-emerald-500';
  } else if (s === 'FAILED' || s === 'BLOCKED' || s === 'CRITICAL' || s === 'OVER_BUDGET' || s === 'NON_COMPLIANT' || s === 'REJECTED') {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
    dot = 'bg-rose-500';
  } else if (s === 'REFUNDED' || s === 'HIGH' || s === 'AT_RISK' || s === 'FLAGGED' || s === 'NEEDS_REVIEW') {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500';
  } else if (s === 'PENDING' || s === 'MONITOR' || s === 'MEDIUM' || s === 'UNDER_REVIEW') {
    color = 'bg-blue-50 text-blue-700 border-blue-200';
    dot = 'bg-blue-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {status}
    </span>
  );
}

export function RiskBadge({ score, level }) {
  const lvl = level || (score > 80 ? 'CRITICAL' : score > 60 ? 'HIGH' : score > 30 ? 'MEDIUM' : 'LOW');
  
  let styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (lvl === 'CRITICAL') {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (lvl === 'HIGH') {
    styles = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (lvl === 'MEDIUM') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles}`}>
      {score !== undefined && <span className="font-mono">{score}/100</span>}
      <span>{lvl}</span>
    </span>
  );
}
