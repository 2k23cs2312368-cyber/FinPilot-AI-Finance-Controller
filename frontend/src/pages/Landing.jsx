import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Receipt,
  Scale,
  ShieldAlert,
  ArrowRight,
  Bot,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/common/Button';

export function Landing({ onLogin }) {
  const agents = [
    {
      name: "Revenue Intelligence Agent",
      desc: "Forecasts short-term growth, identifies top ARR drivers, and detects abrupt velocity drops.",
      icon: TrendingUp,
      color: "from-blue-500 to-indigo-600"
    },
    {
      name: "Expense Controller Agent",
      desc: "Monitors category burn rates, catches duplicate invoices, and prevents budget overruns.",
      icon: Receipt,
      color: "from-purple-500 to-indigo-600"
    },
    {
      name: "Cash Flow Forecast Agent",
      desc: "Computes daily liquidity burn and triggers predictive alerts before minimum reserve breaches.",
      icon: Scale,
      color: "from-emerald-500 to-teal-600"
    },
    {
      name: "Financial Risk Agent",
      desc: "Scores transactions 0-100, detects high-value anomalies, and flags mandate failure bursts.",
      icon: ShieldAlert,
      color: "from-rose-500 to-amber-600"
    },
    {
      name: "Compliance & Audit Agent",
      desc: "Scans relational integrity and logs immutable audit trails for every controller event.",
      icon: ShieldCheck,
      color: "from-sky-500 to-blue-600"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-fintech-600 selection:text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-fintech-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fintech-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-fintech-500/25">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight">FinPilot <span className="text-fintech-400">AI</span></span>
              <span className="bg-fintech-900/80 text-fintech-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-fintech-700">Track 4</span>
            </div>
            <p className="text-[10px] text-slate-400">Razorpay AI Builder Internship 2026</p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={onLogin}
          icon={ArrowRight}
          className="bg-fintech-500 hover:bg-fintech-600 font-semibold text-xs px-4 py-2"
        >
          Demo Portal
        </Button>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-fintech-300 font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous AI Multi-Agent Controller Architecture</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Autonomous Financial Intelligence for <span className="text-transparent bg-clip-text bg-gradient-to-r from-fintech-400 via-indigo-300 to-cyan-300">Modern Businesses</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed">
          FinPilot AI replaces reactive spreadsheets with an active multi-agent intelligence layer.
          Continuously monitoring revenue, expenses, cash runways, refund anomalies, and budget variances in real time.
        </p>

        {/* CTA Login Box */}
        <div className="mt-8 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md max-w-md w-full">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Evaluator Quick Access</div>
          <p className="text-xs text-slate-300 mb-5">
            Log in directly with our pre-configured Controller profile and live Indian fintech demo dataset (₹).
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={onLogin}
            icon={ArrowRight}
            className="w-full bg-gradient-to-r from-fintech-500 to-indigo-600 hover:from-fintech-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-fintech-500/25 py-3"
          >
            Continue with Demo Account
          </Button>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Zero Hallucinations</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Human-in-the-Loop</span>
          </div>
        </div>

        {/* Specialized Agents Grid */}
        <div className="mt-16 w-full text-left">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-200">5 Specialized AI Financial Agents</h2>
            <p className="text-xs text-slate-400 mt-1">Orchestrated by the Central FinPilot AI Controller</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all duration-200"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${agent.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{agent.name}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{agent.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 z-10">
        FinPilot AI — Built for Razorpay AI Builder Internship 2026 • Track 4: AI Finance Controller
      </footer>
    </div>
  );
}
