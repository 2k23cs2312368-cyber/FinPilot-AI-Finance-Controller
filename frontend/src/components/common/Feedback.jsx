import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function LoadingSkeleton({ count = 4, height = "h-16" }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={`w-full ${height} bg-slate-200/80 rounded-xl`}></div>
      ))}
    </div>
  );
}

export function EmptyState({ title = "No data found", description = "Try modifying your filters or seed sample demo records.", icon: Icon = Inbox, actionText, onAction }) {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-200">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let bg = 'bg-slate-900 text-white border-slate-800';
        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bg = 'bg-emerald-900/95 text-emerald-100 border-emerald-700';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          bg = 'bg-rose-900/95 text-rose-100 border-rose-700';
        } else if (toast.type === 'warning') {
          Icon = AlertCircle;
          bg = 'bg-amber-900/95 text-amber-100 border-amber-700';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border ${bg} text-xs font-medium animate-in slide-in-from-bottom-5 duration-200`}
          >
            <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity ml-2"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function DateFilter({ selectedDays, onChange }) {
  const options = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
    { label: '6 Months', value: 180 },
    { label: '1 Year', value: 365 },
  ];

  return (
    <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
            selectedDays === opt.value
              ? 'bg-white text-fintech-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
