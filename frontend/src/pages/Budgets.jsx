import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Target,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Edit3,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/Feedback';

export function Budgets({ addToast }) {
  const [overview, setOverview] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Budget Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [newAllocatedAmount, setNewAllocatedAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const [overviewData, listData] = await Promise.all([
        api.getBudgetOverview(),
        api.getBudgets()
      ]);
      setOverview(overviewData);
      setBudgets(listData);
    } catch (err) {
      addToast(err.message || 'Failed to load budget data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  const handleOpenEdit = (b) => {
    setSelectedBudget(b);
    setNewAllocatedAmount(b.allocated_amount.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!selectedBudget) return;

    try {
      setSaving(true);
      await api.updateBudget(selectedBudget.id, parseFloat(newAllocatedAmount));
      addToast(`Budget allocation for ${selectedBudget.category} updated!`, 'success');
      setIsEditModalOpen(false);
      loadBudgetData();
    } catch (err) {
      addToast(err.message || 'Failed to update budget', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={4} height="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Budget Controller & Variance Guard</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Proactive variance analytics comparing targets with real ledger disbursements.
        </p>
      </div>

      {/* AI Budget Assessment Box */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-indigo-900 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Expense Controller Agent • Monthly Synthesis</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {overview.ai_budget_assessment}
        </p>
      </div>

      {/* Top 3 High-Level Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Target */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Monthly Revenue Target</span>
            <Target className="w-4 h-4 text-fintech-600" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{overview.current_revenue.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Goal: ₹{overview.monthly_revenue_target.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Progress</span>
              <span className="text-fintech-600">{overview.revenue_target_progress_pct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-fintech-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, overview.revenue_target_progress_pct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expense Budget Ceiling */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Expense Budget Limit</span>
            <PieChart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{overview.current_expense.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Cap: ₹{overview.monthly_expense_budget.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-600">Budget Utilized</span>
              <span className={overview.expense_budget_used_pct > 100 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                {overview.expense_budget_used_pct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overview.expense_budget_used_pct > 100 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, overview.expense_budget_used_pct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Minimum Cash Reserve */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Configured Minimum Reserve</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{overview.min_cash_reserve.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Strict liquidity lower bound
            </div>
          </div>
          <div className="text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
            Autonomous guard triggers warning if 30-day forecast falls below.
          </div>
        </div>
      </div>

      {/* Category Budgets Variance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Category Budgets vs Actual Spend</h3>
            <p className="text-xs text-slate-500">Live variance breakdown computed from verified expenses</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-4">Allocated Budget</th>
                <th className="py-3.5 px-4">Actual Spend</th>
                <th className="py-3.5 px-4">Variance (₹)</th>
                <th className="py-3.5 px-4">Variance %</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6">AI Assessment Note</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {overview.category_comparisons.map((item) => {
                const isOver = item.status === 'OVER_BUDGET';
                const bObj = budgets.find((b) => b.category === item.category);

                return (
                  <tr key={item.category} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {item.category}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      ₹{item.budget_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900">
                      ₹{item.actual_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 font-semibold whitespace-nowrap">
                      <span className={item.variance_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {item.variance_amount > 0 ? `+₹${item.variance_amount.toLocaleString('en-IN')}` : `₹${item.variance_amount.toLocaleString('en-IN')}`}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${isOver ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.variance_pct > 0 ? `+${item.variance_pct}%` : `${item.variance_pct}%`}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-6 text-slate-600 max-w-sm">
                      {item.ai_note}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {bObj && (
                        <button
                          onClick={() => handleOpenEdit(bObj)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Edit Target"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Allocation Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Adjust Budget: ${selectedBudget?.category}`}
        subtitle="Changes are logged in the immutable controller audit trail."
      >
        <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Monthly Allocated Amount (₹)</label>
            <input
              type="number"
              step="1000"
              required
              value={newAllocatedAmount}
              onChange={(e) => setNewAllocatedAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-fintech-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              Save Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
