import { useEffect, useState, useCallback } from 'react';
import { formatMoney, formatMoneyExact, MONTHS, getMonthName } from '../Utils/Index';
import {
  getPayrollList,
  generateMonthlyPayroll,
  updatePayroll,
  markPayrollPaid,
  bulkMarkPaid,
  deletePayroll,
} from '../api/PayrollApis';
import { getDepartments } from '../api/DepartmentApis';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import PayslipModal from '../components/PayslipModal';
import useBodyScrollLock from '../Utils/useBodyScrollLock';
import {
  RefreshIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  PlusIcon,
} from '../Assets/icons';

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'UPI', label: 'UPI / Direct Deposit' },
  { value: 'CHEQUE', label: 'Company Cheque' },
  { value: 'CASH', label: 'Cash' },
];

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [payrollList, setPayrollList] = useState([]);
  const [summary, setSummary] = useState({
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    totalCount: 0,
    paidCount: 0,
    processedCount: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [toast, setToast] = useState(null);

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateData, setGenerateData] = useState({
    month: 10,
    year: 2026,
    department_id: 'ALL',
    bonus_percentage: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const [isBulkPayModalOpen, setIsBulkPayModalOpen] = useState(false);
  const [bulkPayData, setBulkPayData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
  });
  const [isBulkPaying, setIsBulkPaying] = useState(false);

  const [activePayslip, setActivePayslip] = useState(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  const [editingPayroll, setEditingPayroll] = useState(null);
  const [editFormData, setEditFormData] = useState({ bonus: 0, other_deductions: 0, remarks: '' });

  const [markingPaidItem, setMarkingPaidItem] = useState(null);
  const [singlePayData, setSinglePayData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'BANK_TRANSFER',
  });

  const [deletingId, setDeletingId] = useState(null);

  // Prevent background scroll when any modal is open
  useBodyScrollLock(
    isGenerateModalOpen ||
    isBulkPayModalOpen ||
    Boolean(markingPaidItem) ||
    Boolean(editingPayroll) ||
    Boolean(deletingId)
  );

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isFilterActive =
    searchQuery.trim() !== '' ||
    selectedDept !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedMonth !== 10 ||
    selectedYear !== 2026;

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedDept('ALL');
    setSelectedStatus('ALL');
    setSelectedMonth(10);
    setSelectedYear(2026);
  };

  // Fetch departments for filter
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await getDepartments({ all: true });
        if (res?.data) setDepartments(res.data);
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };
    loadDepts();
  }, []);

  // Fetch payroll list
  const fetchPayroll = useCallback(
    async (page = 1, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await getPayrollList({
          page,
          limit: pagination.limit,
          month: selectedMonth,
          year: selectedYear,
          status: selectedStatus,
          department_id: selectedDept,
          search: debouncedSearch,
        });

        if (res?.success) {
          setPayrollList(res.data);
          setPagination(res.pagination);
          if (res.summary) setSummary(res.summary);
        }
      } catch (err) {
        showToast(err.message || 'Failed to fetch payroll list.', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.limit, selectedMonth, selectedYear, selectedStatus, selectedDept, debouncedSearch]
  );

  useEffect(() => {
    fetchPayroll(1);
  }, [fetchPayroll]);

  // Handle Generate Monthly Payroll
  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await generateMonthlyPayroll(generateData);
      if (res?.success) {
        showToast(res.message || 'Payroll generated successfully!', 'success');
        setIsGenerateModalOpen(false);
        fetchPayroll(1);
      } else {
        showToast(res?.message || 'Failed to generate payroll.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate payroll.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Bulk Disburse
  const handleBulkPay = async (e) => {
    e.preventDefault();
    setIsBulkPaying(true);
    try {
      const res = await bulkMarkPaid({
        month: selectedMonth,
        year: selectedYear,
        payment_date: bulkPayData.payment_date,
        payment_method: bulkPayData.payment_method,
      });
      if (res?.success) {
        showToast(res.message || 'Payroll disbursed successfully!', 'success');
        setIsBulkPayModalOpen(false);
        fetchPayroll(pagination.currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to disburse payroll.', 'error');
    } finally {
      setIsBulkPaying(false);
    }
  };

  // Handle Single Mark as Paid
  const handleSinglePay = async (e) => {
    e.preventDefault();
    if (!markingPaidItem) return;
    try {
      const res = await markPayrollPaid(markingPaidItem.id, singlePayData);
      if (res?.success) {
        showToast('Payroll marked as PAID.', 'success');
        setMarkingPaidItem(null);
        fetchPayroll(pagination.currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to mark as paid.', 'error');
    }
  };

  // Handle Edit Payroll
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPayroll) return;
    try {
      const res = await updatePayroll(editingPayroll.id, editFormData);
      if (res?.success) {
        showToast('Payroll record updated successfully.', 'success');
        setEditingPayroll(null);
        fetchPayroll(pagination.currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update payroll.', 'error');
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await deletePayroll(deletingId);
      if (res?.success) {
        showToast('Payroll record deleted.', 'success');
        setDeletingId(null);
        fetchPayroll(pagination.currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete payroll.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Payslip Modal */}
      <PayslipModal
        payroll={activePayslip}
        isOpen={isPayslipModalOpen}
        onClose={() => {
          setIsPayslipModalOpen(false);
          setActivePayslip(null);
        }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Payroll Management
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fetchPayroll(pagination.currentPage, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-60"
          >
            <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin text-accent-600' : 'text-slate-500'}`} />
            Refresh
          </button>

          <button
            onClick={() => {
              setBulkPayData({
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'BANK_TRANSFER',
              });
              setIsBulkPayModalOpen(true);
            }}
            disabled={summary.processedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <CheckIcon className="h-4 w-4 text-emerald-600" />
            Bulk Disburse ({summary.processedCount})
          </button>

          <button
            onClick={() => {
              setGenerateData({
                month: selectedMonth,
                year: selectedYear,
                department_id: selectedDept,
                bonus_percentage: 0,
              });
              setIsGenerateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <PlusIcon className="h-4 w-4" />
            Generate Monthly Payroll
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Gross Payroll (${getMonthName(selectedMonth)} ${selectedYear})`}
          value={formatMoney(summary.totalGross)}
        />
        <StatCard
          label="Total Deductions (PF/Tax)"
          value={formatMoney(summary.totalDeductions)}
        />
        <StatCard
          label="Total Net Payable"
          value={formatMoney(summary.totalNet)}
        />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Disbursement Status</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-emerald-700">{summary.paidCount} Paid</span>
            <span className="text-xs text-slate-400">/ {summary.totalCount} Total</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PROCESSED">Processed</option>
              <option value="PAID">Paid</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFilterActive && (
            <div className="self-end pb-0.5">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 hover:text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                title="Reset all filters and search"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Search Employee
          </label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or email address..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                title="Clear search"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Role & Department</th>
                <th className="px-4 py-3.5 text-right">Gross Salary</th>
                <th className="px-4 py-3.5 text-right">Deductions</th>
                <th className="px-4 py-3.5 text-right">Net Payable</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5">Payment Details</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5"><div className="h-4 w-32 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="ml-auto h-4 w-16 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="ml-auto h-4 w-14 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="ml-auto h-4 w-16 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="mx-auto h-5 w-16 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="ml-auto h-5 w-20 rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : payrollList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                        {isFilterActive ? '🔍' : '📄'}
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {searchQuery
                          ? `No payroll records matching "${searchQuery}"`
                          : isFilterActive
                          ? 'No payroll records matching the selected filters.'
                          : 'No payroll records found for this period.'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-md">
                        {isFilterActive
                          ? 'Try adjusting your search query, department, or status filters.'
                          : `Click "Generate Monthly Payroll" to compute salaries for ${getMonthName(selectedMonth)} ${selectedYear}.`}
                      </p>
                      {isFilterActive && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                          >
                            <CloseIcon className="h-3.5 w-3.5 text-slate-500" />
                            Reset all filters
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                payrollList.map((row) => {
                  const emp = row.employee || {};
                  const currency = emp.country?.currency_code || 'INR';
                  const isPaid = row.status === 'PAID';

                  return (
                    <tr key={row.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{emp.full_name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{emp.email || '—'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{emp.job?.job_title || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500">{emp.department?.department_name || 'N/A'}</div>
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums font-medium text-slate-700">
                        {formatMoneyExact(row.gross_salary, currency)}
                        {Number(row.bonus) > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            +{formatMoneyExact(row.bonus, currency)} bonus
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums text-rose-700">
                        {formatMoneyExact(row.total_deductions, currency)}
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-slate-900 text-sm">
                        {formatMoneyExact(row.net_salary, currency)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-[11px]">
                        {isPaid ? (
                          <div>
                            <span className="font-semibold text-slate-700">
                              {row.payment_method?.replace(/_/g, ' ') || 'Bank Transfer'}
                            </span>
                            <div className="text-slate-400 text-[10px]">{row.payment_date || 'Paid'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unpaid</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Payslip */}
                          <button
                            onClick={() => {
                              setActivePayslip(row);
                              setIsPayslipModalOpen(true);
                            }}
                            title="View / Download Official Payslip"
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {/* Mark Paid (if not already paid) */}
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setMarkingPaidItem(row);
                                setSinglePayData({
                                  payment_date: new Date().toISOString().split('T')[0],
                                  payment_method: 'BANK_TRANSFER',
                                });
                              }}
                              title="Mark as Paid"
                              className="rounded p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 transition"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingPayroll(row);
                              setEditFormData({
                                bonus: row.bonus || 0,
                                other_deductions: row.other_deductions || 0,
                                remarks: row.remarks || '',
                              });
                            }}
                            title="Adjust Bonus / Deductions"
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingId(row.id)}
                            title="Delete Record"
                            className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-800">
              {payrollList.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{pagination.totalRecords}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchPayroll(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchPayroll(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL: Generate Payroll --- */}
      {isGenerateModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm !m-0"
          onClick={() => setIsGenerateModalOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div
              className="relative w-full max-w-md rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Generate Monthly Payroll
                </h3>
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="rounded p-1 text-slate-400 hover:text-slate-600"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleGeneratePayroll} className="space-y-4 p-6 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Month</label>
                  <select
                    value={generateData.month}
                    onChange={(e) => setGenerateData({ ...generateData, month: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={generateData.year}
                    onChange={(e) => setGenerateData({ ...generateData, year: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Target Department</label>
                  <select
                    value={generateData.department_id}
                    onChange={(e) => setGenerateData({ ...generateData, department_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  >
                    <option value="ALL">All Departments (Entire Company)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Performance Bonus % (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={generateData.bonus_percentage}
                    onChange={(e) => setGenerateData({ ...generateData, bonus_percentage: e.target.value })}
                    placeholder="e.g. 5 for 5% festive/performance bonus"
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>

                <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600">
                  ⚡ <strong>Automated Calculations:</strong> Computes 50% Basic, 20% HRA, Conveyance, Medical, Special Allowance, and applies PF (12%), Professional Tax, and Income Tax deductions.
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="rounded-lg bg-accent-600 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-accent-700 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Start Generation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Bulk Disburse --- */}
      {isBulkPayModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm !m-0"
          onClick={() => setIsBulkPayModalOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div
              className="relative w-full max-w-md rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Bulk Disburse Payroll
                </h3>
                <button onClick={() => setIsBulkPayModalOpen(false)} className="rounded p-1 text-slate-400">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleBulkPay} className="space-y-4 p-6 text-xs">
                <p className="text-slate-600">
                  Disburse salaries for all <strong>{summary.processedCount}</strong> processed employees for{' '}
                  <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>.
                </p>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    value={bulkPayData.payment_date}
                    onChange={(e) => setBulkPayData({ ...bulkPayData, payment_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={bulkPayData.payment_method}
                    onChange={(e) => setBulkPayData({ ...bulkPayData, payment_method: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsBulkPayModalOpen(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkPaying}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isBulkPaying ? 'Disbursing...' : 'Confirm & Disburse'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Single Mark Paid --- */}
      {markingPaidItem && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm !m-0"
          onClick={() => setMarkingPaidItem(null)}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div
              className="relative w-full max-w-sm rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Mark as Paid</h3>
                <button onClick={() => setMarkingPaidItem(null)} className="rounded p-1 text-slate-400">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSinglePay} className="space-y-4 p-6 text-xs">
                <p className="text-slate-600">
                  Mark payment for <strong>{markingPaidItem.employee?.full_name}</strong> (
                  {formatMoneyExact(markingPaidItem.net_salary, markingPaidItem.employee?.country?.currency_code)})
                </p>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={singlePayData.payment_date}
                    onChange={(e) => setSinglePayData({ ...singlePayData, payment_date: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={singlePayData.payment_method}
                    onChange={(e) => setSinglePayData({ ...singlePayData, payment_method: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setMarkingPaidItem(null)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    Mark Paid
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Edit Payroll --- */}
      {editingPayroll && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm !m-0"
          onClick={() => setEditingPayroll(null)}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div
              className="relative w-full max-w-md rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Adjust Payroll Components</h3>
                <button onClick={() => setEditingPayroll(null)} className="rounded p-1 text-slate-400">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 p-6 text-xs">
                <p className="text-slate-600 font-medium">
                  Employee: {editingPayroll.employee?.full_name} ({editingPayroll.employee?.job?.job_title})
                </p>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bonus Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormData.bonus}
                    onChange={(e) => setEditFormData({ ...editFormData, bonus: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Additional Deductions</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editFormData.other_deductions}
                    onChange={(e) => setEditFormData({ ...editFormData, other_deductions: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Remarks / Note</label>
                  <textarea
                    value={editFormData.remarks}
                    onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingPayroll(null)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-accent-600 px-4 py-1.5 font-semibold text-white hover:bg-accent-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm !m-0"
          onClick={() => setDeletingId(null)}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div
              className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-slate-900">Delete Payroll Record?</h3>
              <p className="mt-2 text-xs text-slate-500">
                Are you sure you want to delete this payroll entry? This action can be undone by regenerating.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
