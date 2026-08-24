import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Building2,
  Bell,
  CheckCircle2,
  Bot,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Button } from '../common/Button';

export function Header({
  aiEngineStatus = "Demo AI Mode (Deterministic)",
  businessName = "Saroha Cloud Innovations Pvt Ltd",
  onSeedData,
  onOpenNotifications,
  isSeeding = false,
  pendingApprovalsCount = 0
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Entity & AI status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[220px]">{businessName}</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-bold">DEMO</span>
        </div>

        {/* AI Engine Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 border border-indigo-200/80 rounded-lg text-xs">
          <Bot className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="text-indigo-900 font-semibold">{aiEngineStatus}</span>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Seed Data Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSeedData}
          loading={isSeeding}
          icon={RefreshCw}
          className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
        >
          {isSeeding ? 'Seeding Ledger...' : 'Load Demo Data'}
        </Button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          )}
        </button>

        {/* Controller Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-fintech-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            AS
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">Aarav Saroha</div>
            <div className="text-[10px] text-slate-400">Finance Controller</div>
          </div>
        </div>
      </div>
    </header>
  );
}
