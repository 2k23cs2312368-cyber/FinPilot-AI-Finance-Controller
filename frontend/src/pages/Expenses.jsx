import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton, EmptyState } from '../components/common/Feedback';

const CATEGORIES = [
  'Infrastructure',
  'Marketing',
  'Salaries',
  'Software',
  'Operations',
  'Travel',
  'Office',
  'Other'
];

export function Expenses({ addToast }) {
  const [expenses, setExpenses] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  // Add/Edit Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form fields
  const [vendor, setVendor] = useState('');
  const [formCategory, setFormCategory] = useState('Infrastructure');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Corporate Card');
  const [description, setDescription] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const [expData, catData] = await Promise.all([
        api.getExpenses({ page, limit: 15, search, category, status }),
        api.getExpenseCategoriesSummary()
      ]);
      setExpenses(expData.items);
      setTotal(expData.total);
      setCategoriesSummary(catData);
    } catch (err) {
      addToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [page, category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadExpenses();
  };

  const handleOpenAdd = () => {
    setVendor('');
    setFormCategory('Infrastructure');
    setAmount('');
    setPaymentMethod('Corporate Card');
    setDescription('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExp(exp);
    setVendor(exp.vendor);
    setFormCategory(exp.category);
    setAmount(exp.amount.toString());
    setPaymentMethod(exp.payment_method);
    setDescription(exp.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveNewExpense = async (e) => {
    e.preventDefault();
    if (!vendor || !amount || Number(amount) <= 0) {
      addToast('Please enter a valid vendor name and amount', 'warning');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await api.createExpense({
        vendor,
        category: formCategory,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        status: 'PAID',
        description
      });
      addToast(`Expense logged! AI Risk Flag: ${res.ai_risk}`, 'success');
      setIsAddModalOpen(false);
      loadExpenses();
    } catch (err) {
      addToast(err.message || 'Failed to create expense', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingExp) return;

    try {
      setFormSubmitting(true);
      await api.updateExpense(editingExp.id, {
        vendor,
        category: formCategory,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        description
      });
      addToast(`Expense ${editingExp.id} updated!`, 'success');
      setIsEditModalOpen(false);
      loadExpenses();
    } catch (err) {
      addToast(err.message || 'Failed to update expense', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm(`Are you sure you want to delete expense ${expId}?`)) return;
    try {
      await api.deleteExpense(expId);
      addToast('Expense deleted and audit entry logged.', 'success');
      loadExpenses();
    } catch (err) {
      addToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Expense Management & Controller</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated budget tracking, duplicate invoice prevention, and vendor disbursement monitoring.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          icon={Plus}
          className="text-xs"
        >
          Add Expense
        </Button>
      </div>

      {/* Category Budgets Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categoriesSummary.slice(0, 4).map((cat) => {
          const isOver = cat.status === 'OVER_BUDGET';
          return (
            <div
              key={cat.category}
              className={`p-3.5 rounded-xl border bg-white shadow-card flex flex-col justify-between ${
                isOver ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">{cat.category}</span>
                <StatusBadge status={cat.status} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  ₹{cat.actual_amount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Budget: ₹{cat.budget_amount.toLocaleString('en-IN')} ({cat.variance_pct > 0 ? `+${cat.variance_pct}%` : `${cat.variance_pct}%`})
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expenses by vendor, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-fintech-500 focus:bg-white"
          />
        </form>

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="w-full md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="ALL">Category: All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={6} height="h-12" />
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description="Log your first operating expense or modify filter parameters."
            onAction={handleOpenAdd}
            actionText="Add New Expense"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Expense ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">AI Risk Flag</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {expenses.map((exp) => {
                  const dateFormatted = new Date(exp.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        {exp.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {dateFormatted}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {exp.vendor}
                        {exp.description && (
                          <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs">
                            {exp.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{exp.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {exp.payment_method}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={exp.ai_risk} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors mr-1"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Operating Expense"
        subtitle="Expense Controller Agent will automatically run budget checks."
      >
        <form onSubmit={handleSaveNewExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Vendor / Beneficiary</label>
            <input
              type="text"
              required
              placeholder="e.g. Amazon Web Services India"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-fintech-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="₹ 50,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="Corporate Card">Corporate Card</option>
              <option value="NetBanking">NetBanking / NEFT</option>
              <option value="UPI">UPI Corporate</option>
              <option value="Bank Transfer">RTGS Transfer</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Invoice Reference</label>
            <textarea
              rows="2"
              placeholder="e.g. Monthly cloud server infrastructure compute charge"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-fintech-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={formSubmitting}>
              Save & Analyze
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Expense ${editingExp?.id}`}
        subtitle="Modifications are tracked in the immutable audit trail."
      >
        <form onSubmit={handleUpdateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Vendor</label>
            <input
              type="text"
              required
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={formSubmitting}>
              Update Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
