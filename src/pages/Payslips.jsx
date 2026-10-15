import { useEffect, useState, useCallback } from 'react';
import { formatMoneyExact, MONTHS, getMonthName } from '../Utils/Index';
import { getPayrollList } from '../api/PayrollApis';
import PayslipModal from '../components/PayslipModal';
import Toast from '../components/Toast';
import { SearchIcon, EyeIcon, RefreshIcon, CloseIcon } from '../Assets/icons';

export default function Payslips() {
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 12,
    totalRecords: 0,
    totalPages: 1,
  });

  const [activePayslip, setActivePayslip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isFilterActive = searchQuery.trim() !== '' || selectedMonth !== 10 || selectedYear !== 2026;

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedMonth(10);
    setSelectedYear(2026);
  };

  const fetchPayslips = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getPayrollList({
        page,
        limit: 12,
        month: selectedMonth,
        year: selectedYear,
        search: debouncedSearch,
      });

      if (res?.success) {
        setPayrolls(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch payslips.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, debouncedSearch]);

  useEffect(() => {
    fetchPayslips(1);
  }, [fetchPayslips]);

  const openSlip = (payroll) => {
    setActivePayslip(payroll);
    setIsModalOpen(true);
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
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActivePayslip(null);
        }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Employee Payslips Directory
          </h1>
        </div>

        <button
          onClick={() => fetchPayslips(pagination.currentPage)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <RefreshIcon className="h-4 w-4 text-slate-500" />
          Refresh
        </button>
      </div>

      {/* Period & Search Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Select Pay Month
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

          {isFilterActive && (
            <div className="self-end pb-0.5">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 hover:text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                title="Reset month, year and search"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-sm">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Search Employee
          </label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name or email..."
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

      {/* Payslip Cards Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="h-5 w-32 rounded bg-slate-200" />
              <div className="h-4 w-48 rounded bg-slate-100" />
              <div className="h-10 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : payrolls.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <div className="flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">{isFilterActive ? '🔍' : '📄'}</span>
            <p className="font-semibold text-slate-800 text-sm">
              {searchQuery
                ? `No payslips matching "${searchQuery}"`
                : isFilterActive
                ? 'No payslips found for the selected period.'
                : 'No payslips available for this period.'}
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              {isFilterActive
                ? 'Try searching for another employee or clear active filters.'
                : `Generate the payroll first from the Payroll tab to create salary slips for ${getMonthName(selectedMonth)} ${selectedYear}.`}
            </p>
            {isFilterActive && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <CloseIcon className="h-3.5 w-3.5 text-slate-500" />
                  Clear filters & search
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payrolls.map((slip) => {
            const emp = slip.employee || {};
            const currency = emp.country?.currency_code || 'INR';
            const isPaid = slip.status === 'PAID';

            return (
              <div
                key={slip.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-accent-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        EMP-#{emp.id || slip.employee_id}
                      </span>
                      <h3 className="font-bold text-slate-900 truncate max-w-[190px]">
                        {emp.full_name || 'N/A'}
                      </h3>
                      <p className="text-xs text-slate-500 truncate max-w-[190px]">
                        {emp.job?.job_title || 'N/A'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${isPaid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                    >
                      {slip.status}
                    </span>
                  </div>

                  {/* Breakdown details */}
                  <div className="my-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Department:</span>
                      <span className="font-medium text-slate-800">{emp.department?.department_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Gross Salary:</span>
                      <span className="font-medium text-slate-800">{formatMoneyExact(slip.gross_salary, currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Deductions:</span>
                      <span className="text-rose-700">-{formatMoneyExact(slip.total_deductions, currency)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                      <span>Net Salary:</span>
                      <span className="text-accent-700">{formatMoneyExact(slip.net_salary, currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openSlip(slip)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-accent-50 hover:text-accent-700"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    View & Download Salary Slip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {payrolls.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{payrolls.length}</span> slips of{' '}
            <span className="font-semibold text-slate-700">{pagination.totalRecords}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPayslips(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="rounded border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchPayslips(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="rounded border border-slate-300 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
