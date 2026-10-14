import { useEffect, useState, useCallback } from 'react';
import { formatMoney, formatMoneyExact } from '../Utils/Index';
import {
  getSalaryRevisions,
  addSalaryRevision,
  deleteSalaryRevision,
} from '../api/SalaryRevisionApis';
import { getEmployees } from '../api/EmployeeApis';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import useBodyScrollLock from '../Utils/useBodyScrollLock';
import {
  RefreshIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  CloseIcon,
} from '../Assets/icons';

const REVISION_TYPES = [
  'Annual Appraisal',
  'Promotion',
  'Market Correction',
  'Performance Bonus',
  'Retention Adjustment',
  'Probation Confirmation',
];

export default function SalaryRevisions() {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isSearchingEmp, setIsSearchingEmp] = useState(false);

  const [formData, setFormData] = useState({
    new_salary: '',
    increment_percentage: '',
    effective_date: new Date().toISOString().split('T')[0],
    revision_type: 'Annual Appraisal',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Prevent background scroll when modal is open
  useBodyScrollLock(isModalOpen || Boolean(deletingId));

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Debounce revision search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Revisions
  const fetchRevisions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getSalaryRevisions({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
      });

      if (res?.success) {
        setRevisions(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch revisions.', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, debouncedSearch]);

  useEffect(() => {
    fetchRevisions(1);
  }, [fetchRevisions]);

  // Employee search for modal
  useEffect(() => {
    if (!employeeSearch.trim()) {
      setEmployeeList([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingEmp(true);
      try {
        const res = await getEmployees({ name: employeeSearch, limit: 6 });
        if (res?.data) {
          setEmployeeList(res.data);
        }
      } catch (err) {
        console.error('Failed to search employee', err);
      } finally {
        setIsSearchingEmp(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  // Two-way calculation between new_salary and increment_percentage
  const handleNewSalaryChange = (newSal) => {
    const currentSal = Number(selectedEmp?.salary) || 0;
    const val = Number(newSal);
    let pct = '';
    if (currentSal > 0 && val > 0) {
      pct = (((val - currentSal) / currentSal) * 100).toFixed(2);
    }
    setFormData((prev) => ({
      ...prev,
      new_salary: newSal,
      increment_percentage: pct,
    }));
  };

  const handlePercentageChange = (pct) => {
    const currentSal = Number(selectedEmp?.salary) || 0;
    const percentage = Number(pct);
    let newSal = '';
    if (currentSal > 0 && !isNaN(percentage)) {
      newSal = Math.round(currentSal * (1 + percentage / 100));
    }
    setFormData((prev) => ({
      ...prev,
      increment_percentage: pct,
      new_salary: newSal,
    }));
  };

  // Submit revision
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmp) {
      showToast('Please select an employee.', 'error');
      return;
    }
    if (!formData.new_salary || Number(formData.new_salary) <= 0) {
      showToast('Please specify a valid new salary.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addSalaryRevision({
        employee_id: selectedEmp.id,
        new_salary: formData.new_salary,
        effective_date: formData.effective_date,
        revision_type: formData.revision_type,
        remarks: formData.remarks,
      });

      if (res?.success) {
        showToast('Salary revision recorded & employee salary updated!', 'success');
        setIsModalOpen(false);
        setSelectedEmp(null);
        setEmployeeSearch('');
        setFormData({
          new_salary: '',
          increment_percentage: '',
          effective_date: new Date().toISOString().split('T')[0],
          revision_type: 'Annual Appraisal',
          remarks: '',
        });
        fetchRevisions(1);
      } else {
        showToast(res?.message || 'Failed to record revision.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to record revision.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete revision
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await deleteSalaryRevision(deletingId);
      if (res?.success) {
        showToast('Revision log deleted.', 'success');
        setDeletingId(null);
        fetchRevisions(pagination.currentPage);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete revision.', 'error');
    }
  };

  // Computed summary metrics
  const avgIncrement =
    revisions.length > 0
      ? (
          revisions.reduce((acc, r) => acc + (Number(r.increment_percentage) || 0), 0) /
          revisions.length
        ).toFixed(1)
      : '0.0';

  const maxIncrement =
    revisions.length > 0
      ? Math.max(...revisions.map((r) => Number(r.increment_percentage) || 0)).toFixed(1)
      : '0.0';

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

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Salary Revisions & Appraisals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Log annual increments, promotions, and base salary modifications with historical audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchRevisions(pagination.currentPage)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <RefreshIcon className="h-4 w-4 text-slate-500" />
            Refresh
          </button>

          <button
            onClick={() => {
              setSelectedEmp(null);
              setEmployeeSearch('');
              setFormData({
                new_salary: '',
                increment_percentage: '',
                effective_date: new Date().toISOString().split('T')[0],
                revision_type: 'Annual Appraisal',
                remarks: '',
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
          >
            <PlusIcon className="h-4 w-4" />
            Record Salary Revision
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revisions Recorded" value={pagination.totalRecords} />
        <StatCard label="Average Increment" value={`+${avgIncrement}%`} />
        <StatCard label="Highest Increment" value={`+${maxIncrement}%`} />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Auto-Update Status</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live Sync with Employee CTC
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full max-w-md">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter revisions by employee name..."
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

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
              title="Clear search filter"
            >
              <CloseIcon className="h-3.5 w-3.5" />
              Clear Filter
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500">
          Showing <strong>{revisions.length}</strong> of <strong>{pagination.totalRecords}</strong> revisions
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th className="px-4 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Department & Job</th>
                <th className="px-4 py-3.5 text-right">Previous CTC</th>
                <th className="px-4 py-3.5 text-right">New CTC</th>
                <th className="px-4 py-3.5 text-center">Increment</th>
                <th className="px-4 py-3.5">Revision Type</th>
                <th className="px-4 py-3.5">Effective Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3.5"><div className="h-4 w-32 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="ml-auto h-4 w-16 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="ml-auto h-4 w-16 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-center"><div className="mx-auto h-5 w-14 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5"><div className="h-4 w-20 rounded bg-slate-200" /></td>
                    <td className="px-4 py-3.5 text-right"><div className="ml-auto h-5 w-8 rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : revisions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-3xl mb-2">{searchQuery ? '🔍' : '📈'}</span>
                      <p className="font-semibold text-slate-800 text-sm">
                        {searchQuery
                          ? `No salary revisions matching "${searchQuery}"`
                          : 'No salary revisions recorded yet.'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 max-w-md">
                        {searchQuery
                          ? 'Try searching by a different employee name.'
                          : 'Click "Record Salary Revision" above to apply appraisal increments to employees.'}
                      </p>
                      {searchQuery && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery('');
                              setDebouncedSearch('');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                          >
                            <CloseIcon className="h-3.5 w-3.5 text-slate-500" />
                            Clear search filter
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                revisions.map((rev) => {
                  const emp = rev.employee || {};
                  const currency = emp.country?.currency_code || 'INR';
                  const pct = Number(rev.increment_percentage) || 0;
                  const isPositive = pct >= 0;

                  return (
                    <tr key={rev.id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{emp.full_name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{emp.email || '—'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{emp.job?.job_title || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500">{emp.department?.department_name || 'N/A'}</div>
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums text-slate-500 line-through">
                        {formatMoneyExact(rev.previous_salary, currency)}
                      </td>

                      <td className="px-4 py-3.5 text-right tabular-nums font-bold text-slate-900">
                        {formatMoneyExact(rev.new_salary, currency)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPositive ? `+${pct}%` : `${pct}%`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {rev.revision_type}
                        </span>
                        {rev.remarks && (
                          <div className="mt-0.5 text-[10px] text-slate-400 italic truncate max-w-[160px]">
                            {rev.remarks}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">{rev.effective_date}</td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDeletingId(rev.id)}
                          title="Delete Revision"
                          className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
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
            Showing Page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchRevisions(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => fetchRevisions(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL: Record Salary Revision --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm !m-0"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center py-6">
            <div
              className="relative w-full max-w-lg rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Record Employee Salary Revision
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="rounded p-1 text-slate-400">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs">
                {/* Employee Picker */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    1. Select Employee
                  </label>
                  {selectedEmp ? (
                    <div className="flex items-center justify-between rounded-lg border border-accent-300 bg-accent-50/40 p-3">
                      <div>
                        <div className="font-bold text-slate-900">{selectedEmp.full_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {selectedEmp.job_title || selectedEmp.job?.job_title} • {selectedEmp.department?.department_name || selectedEmp.department}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-accent-700">
                          Current Base CTC: {formatMoneyExact(selectedEmp.salary, selectedEmp.country?.currency_code)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedEmp(null)}
                        className="text-xs text-rose-600 font-medium hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        placeholder="Type employee name to search..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                      />
                      {isSearchingEmp && <div className="mt-1 text-slate-400 text-[11px]">Searching employees...</div>}

                      {employeeList.length > 0 && (
                        <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                          {employeeList.map((emp) => (
                            <div
                              key={emp.id}
                              onClick={() => {
                                setSelectedEmp(emp);
                                setEmployeeList([]);
                                setEmployeeSearch('');
                                setFormData((prev) => ({
                                  ...prev,
                                  new_salary: '',
                                  increment_percentage: '',
                                }));
                              }}
                              className="cursor-pointer p-2.5 hover:bg-slate-50 transition flex justify-between items-center"
                            >
                              <div>
                                <div className="font-semibold text-slate-800">{emp.full_name}</div>
                                <div className="text-[11px] text-slate-400">{emp.email}</div>
                              </div>
                              <span className="font-semibold text-slate-700">
                                {formatMoney(emp.salary, emp.country?.currency_code)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Reactive Salary Calculation Fields */}
                {selectedEmp && (
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        New Salary (CTC)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formData.new_salary}
                        onChange={(e) => handleNewSalaryChange(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 font-semibold text-slate-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Increment %
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.increment_percentage}
                        onChange={(e) => handlePercentageChange(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full rounded-lg border border-slate-300 bg-white p-2 font-semibold text-emerald-700 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                      />
                    </div>

                    {formData.new_salary && (
                      <div className="col-span-2 text-[11px] text-slate-600 font-medium">
                        Difference: {formatMoney(Number(formData.new_salary) - Number(selectedEmp.salary), selectedEmp.country?.currency_code)} ({formData.increment_percentage}% increment)
                      </div>
                    )}
                  </div>
                )}

                {/* Effective Date & Revision Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Effective Date</label>
                    <input
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Revision Type</label>
                    <select
                      value={formData.revision_type}
                      onChange={(e) => setFormData({ ...formData, revision_type: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                    >
                      {REVISION_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Remarks / Justification</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="e.g. Promotion to Senior Lead, consistent high appraisals in Q3..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 p-2 text-slate-800"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedEmp || !formData.new_salary}
                    className="rounded-lg bg-accent-600 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-accent-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Recording...' : 'Record & Update CTC'}
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
              <h3 className="text-base font-semibold text-slate-900">Delete Revision Log?</h3>
              <p className="mt-2 text-xs text-slate-500">
                Are you sure you want to remove this revision entry from the audit history?
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
