import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingSkeleton, EmptyState } from '../components/common/Feedback';
import { TransactionAnalyzerModal } from './TransactionAnalyzerModal';

export function Transactions({ addToast }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal State
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.getTransactions({
        page,
        limit: 15,
        search,
        status,
        risk_level: riskLevel,
        category,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      addToast(err.message || 'Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, status, riskLevel, category, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const openAnalyzer = (txn) => {
    setSelectedTxn(txn);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Transaction Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous ledger monitoring with automated anomaly flags and risk scoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Total Records: <strong className="text-slate-800 font-bold">{total}</strong>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, customer name, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-fintech-500 focus:bg-white transition-all"
            />
          </form>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="PENDING">PENDING</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskLevel}
            onChange={(e) => { setRiskLevel(e.target.value); setPage(1); }}
            className="w-full md:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Risk: All</option>
            <option value="LOW">LOW (0-30)</option>
            <option value="MEDIUM">MEDIUM (31-60)</option>
            <option value="HIGH">HIGH (61-80)</option>
            <option value="CRITICAL">CRITICAL (81-100)</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [col, ord] = e.target.value.split('_');
              setSortBy(col);
              setSortOrder(ord);
            }}
            className="w-full md:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
            <option value="risk_score_desc">Risk Score: Highest</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={6} height="h-12" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No transactions match query"
            description="Clear filters or search for another customer or transaction ID."
            onAction={() => { setSearch(''); setStatus('ALL'); setRiskLevel('ALL'); setCategory('ALL'); }}
            actionText="Reset Filters"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Risk Score</th>
                  <th className="py-3.5 px-4">AI Flag</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {items.map((txn) => {
                  const dateFormatted = new Date(txn.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr
                      key={txn.id}
                      onClick={() => openAnalyzer(txn)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-fintech-700 group-hover:text-fintech-800">
                        {txn.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {dateFormatted}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 truncate max-w-[180px]">
                        {txn.customer_name || 'Standard Client'}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{txn.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {txn.payment_method}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={txn.status} />
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge score={txn.risk_score} level={txn.risk_level} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {txn.ai_flag}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAnalyzer(txn);
                          }}
                          icon={Sparkles}
                          className="text-xs text-fintech-600 hover:bg-fintech-50"
                        >
                          Analyze
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                icon={ChevronLeft}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs flex-row-reverse"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Analyzer Modal */}
      <TransactionAnalyzerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTxn}
        onActionComplete={fetchTransactions}
        addToast={addToast}
      />
    </div>
  );
}
