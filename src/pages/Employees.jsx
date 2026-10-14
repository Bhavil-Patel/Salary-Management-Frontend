import { useEffect, useState, useCallback, useRef } from 'react';
import { formatMoney } from '../Utils/Index';
import { addEmployee, deleteEmployee, getEmployees, updateEmployee } from '../api/EmployeeApis';
import { getDepartments } from '../api/DepartmentApis';
import { getJobs } from '../api/JobApis';
import { getCountries } from '../api/CountryApis';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import { RefreshIcon, PlusIcon, SearchIcon, UsersIcon, EyeIcon, EditIcon, TrashIcon, WarningIcon } from '../Assets/icons';

const BADGE_COLOR_PALETTES = [
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-slate-100 text-slate-700 border-slate-200',
];

const getDepartmentBadgeClass = (deptName) => {
  if (!deptName || deptName === 'General') return 'bg-slate-100 text-slate-700 border-slate-200';
  let hash = 0;
  for (let i = 0; i < deptName.length; i++) {
    hash = (hash << 5) - hash + deptName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BADGE_COLOR_PALETTES.length;
  return BADGE_COLOR_PALETTES[index];
};

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDeptName = (dept) => {
  if (!dept) return 'General';
  if (typeof dept === 'object') {
    return dept.department_name || dept.name || 'General';
  }
  return String(dept) || 'General';
};

const getJobName = (jobData, fallbackTitle) => {
  if (jobData && typeof jobData === 'object') {
    return jobData.job_title || jobData.title || jobData.name || fallbackTitle || 'N/A';
  }
  return fallbackTitle || (typeof jobData === 'string' ? jobData : '') || 'N/A';
};

const getCountryInfo = (countryData, fallbackCurrency) => {
  if (countryData && typeof countryData === 'object') {
    const code = countryData.country_code || countryData.code || countryData.country?.country_code || '—';
    const name = countryData.country_name || countryData.name || countryData.country?.country_name || 'N/A';
    const currency = countryData.currency_code || countryData.currency || countryData.country?.currency_code || fallbackCurrency || 'USD';
    const id = countryData.id || countryData.country?.id || 1;
    return { code, name, currency, id };
  }
  return {
    code: typeof countryData === 'string' ? countryData : '—',
    name: typeof countryData === 'string' ? countryData : 'N/A',
    currency: fallbackCurrency || 'USD',
    id: 1,
  };
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [departmentList, setDepartmentList] = useState([]);
  const [jobList, setJobList] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [nameFilter, setNameFilter] = useState('');
  const [debouncedName, setDebouncedName] = useState('');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    job_title: '',
    department: '',
    country_id: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);

  const debounceTimerRef = useRef(null);
  const handleNameChange = (val) => {
    setNameFilter(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedName(val);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    }, 350);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDropdownOptions = useCallback(async () => {
    try {
      const [deptRes, jobRes, countryRes] = await Promise.allSettled([
        getDepartments({ all: true }),
        getJobs({ all: true }),
        getCountries({ all: true }),
      ]);

      if (deptRes.status === 'fulfilled' && deptRes.value?.data?.length > 0) {
        setDepartmentList(deptRes.value.data);
      }
      if (jobRes.status === 'fulfilled' && jobRes.value?.data?.length > 0) {
        setJobList(jobRes.value.data);
      }
      if (countryRes.status === 'fulfilled' && countryRes.value?.data?.length > 0) {
        setCountryList(countryRes.value.data);
      }
    } catch (err) {
      console.warn('Failed to load dynamic options from APIs:', err);
    }
  }, []);

  useEffect(() => {
    loadDropdownOptions();
  }, [loadDropdownOptions]);

  const loadEmployees = useCallback(
    async (page, limit, name, job, department) => {
      setLoading(true);
      try {
        const res = await getEmployees({ page, limit, name, job, department, });
        setEmployees(res.data);
        setPagination(res.pagination);
      } catch (err) {
        console.error('Failed to load employees:', err);
        showToast('Error loading employees', 'error');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadEmployees(pagination.currentPage, pagination.limit, debouncedName, jobFilter, departmentFilter);
  }, [loadEmployees, pagination.currentPage, pagination.limit, debouncedName, jobFilter, departmentFilter]);

  const handleJobFilterChange = (val) => {
    setJobFilter(val);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleDepartmentFilterChange = (val) => {
    setDepartmentFilter(val);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleClearAllFilters = () => {
    setNameFilter('');
    setDebouncedName('');
    setJobFilter('ALL');
    setDepartmentFilter('ALL');
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = Boolean(
    debouncedName || (jobFilter && jobFilter !== 'ALL') || (departmentFilter && departmentFilter !== 'ALL')
  );

  const handleOpenAddModal = () => {
    setSelectedEmployee(null);
    setFormData({
      full_name: '',
      email: '',
      job_title: jobList[0]?.job_title || '',
      department: departmentList[0]?.department_name || '',
      country_id: countryList[0]?.id || '',
      salary: '',
      hire_date: new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    const countryInfo = getCountryInfo(emp.country, emp.currency);
    const dept = getDeptName(emp.department);
    const job = getJobName(emp.job, emp.job_title || emp.jobTitle);

    setFormData({
      full_name: emp.full_name || emp.name || '',
      email: emp.email || '',
      job_title: job !== 'N/A' ? job : (jobList[0]?.job_title || ''),
      department: dept !== 'General' ? dept : (departmentList[0]?.department_name || ''),
      country_id: emp.country_id || countryInfo.id || (countryList[0]?.id || ''),
      salary: emp.salary || '',
      hire_date: emp.hire_date || emp.hireDate || new Date().toISOString().split('T')[0],
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenDetailsModal = (emp) => {
    setSelectedEmployee(emp);
    setIsDetailsModalOpen(true);
  };

  const handleOpenDeleteModal = (emp) => {
    setSelectedEmployee(emp);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (!formData.full_name || !formData.email || !formData.salary) {
        throw new Error('Please fill in all required fields');
      }

      if (selectedEmployee) {
        const empId = selectedEmployee.id || selectedEmployee.employee_id;
        await updateEmployee(empId, formData);
        showToast('Employee updated successfully!');
      } else {
        await addEmployee(formData);
        showToast('Employee created successfully!');
      }

      setIsFormModalOpen(false);
      loadEmployees(
        pagination.currentPage,
        pagination.limit,
        debouncedName,
        jobFilter,
        departmentFilter
      );
    } catch (err) {
      console.error('Save failed:', err);
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    setFormSubmitting(true);
    try {
      const empId = selectedEmployee.id || selectedEmployee.employee_id;
      await deleteEmployee(empId);
      showToast('Employee deleted successfully');
      setIsDeleteModalOpen(false);
      loadEmployees(
        pagination.currentPage,
        pagination.limit,
        debouncedName,
        jobFilter,
        departmentFilter
      );
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(err.response?.data?.message || 'Failed to delete employee', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Employees Directory</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadEmployees(
                pagination.currentPage,
                pagination.limit,
                debouncedName,
                jobFilter,
                departmentFilter
              );
              loadDropdownOptions();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh records"
          >
            <RefreshIcon className={`h-4 w-4 ${loading ? 'animate-spin text-accent-500' : 'text-slate-500'}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-accent-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
          >
            <PlusIcon className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Matching Records"
          value={pagination.totalRecords !== undefined ? pagination.totalRecords.toLocaleString() : employees.length}
        />
        <StatCard
          label="Current Page"
          value={
            <>
              {pagination.currentPage} <span className="text-sm font-normal text-slate-400">/ {pagination.totalPages || 1}</span>
            </>
          }
        />
        <StatCard
          label="Selected Department"
          value={departmentFilter === 'ALL' ? 'All Departments' : departmentFilter}
        />
        <StatCard
          label="Selected Job Title"
          value={jobFilter === 'ALL' ? 'All Job Titles' : jobFilter}
        />
      </div>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Filter by employee name on server..."
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-8 text-sm placeholder-slate-400 transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
            {nameFilter && (
              <button
                onClick={() => handleNameChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">Job:</label>
              <select
                value={jobFilter}
                onChange={(e) => handleJobFilterChange(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="ALL">All Job Titles</option>
                {jobList.map((job) => {
                  const title = job.job_title;
                  return (
                    <option key={job.id} value={job.id}>
                      {title}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">Dept:</label>
              <select
                value={departmentFilter}
                onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="ALL">All Departments</option>
                {departmentList.map((dept) => {
                  const name = dept.department_name || dept;
                  return (
                    <option key={dept.id || name} value={dept.id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">Rows:</label>
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({ ...prev, limit: Number(e.target.value), currentPage: 1 }))
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
            <span className="text-xs font-medium text-slate-500">Active server filters:</span>
            {debouncedName && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
                Name: "{debouncedName}"
                <button
                  onClick={() => handleNameChange('')}
                  className="hover:text-accent-900"
                >
                  ✕
                </button>
              </span>
            )}
            {jobFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
                Job: {jobFilter}
                <button
                  onClick={() => handleJobFilterChange('ALL')}
                  className="hover:text-accent-900"
                >
                  ✕
                </button>
              </span>
            )}
            {departmentFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
                Department: {departmentFilter}
                <button
                  onClick={() => handleDepartmentFilterChange('ALL')}
                  className="hover:text-accent-900"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-4 py-3.5">Job Title</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Country</th>
                <th className="px-4 py-3.5 text-right">Salary</th>
                <th className="px-4 py-3.5">Hire Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(pagination.limit > 10 ? 10 : pagination.limit)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 rounded bg-slate-200" />
                          <div className="h-3 w-44 rounded bg-slate-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="ml-auto h-4 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="ml-auto h-6 w-20 rounded bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UsersIcon className="h-10 w-10 text-slate-300" />
                      <p className="mt-2 text-sm font-medium text-slate-900">No matching employees found on server</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {hasActiveFilters
                          ? 'No database records match your active server filters.'
                          : 'No employee records are available in the database.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearAllFilters}
                          className="mt-3 rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const name = emp.full_name || emp.name || 'Unnamed Employee';
                  const job = getJobName(emp.job, emp.job_title || emp.jobTitle);
                  const deptName = getDeptName(emp.department);
                  const countryInfo = getCountryInfo(emp.country, emp.currency);
                  const deptBadge = getDepartmentBadgeClass(deptName);
                  const rawSalary = Number(emp.salary) || 0;

                  return (
                    <tr key={emp.id || emp.email} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 font-semibold text-accent-700">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{name}</p>
                            <p className="truncate text-xs text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700">{job}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${deptBadge}`}
                        >
                          {deptName}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-slate-500">
                            {countryInfo.code}
                          </span>
                          <span className="text-xs text-slate-600">{countryInfo.name}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-slate-900">
                        {formatMoney(rawSalary, countryInfo.currency)}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {emp.hire_date || emp.hireDate || '—'}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailsModal(emp)}
                            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(emp)}
                            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-accent-600"
                            title="Edit employee"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(emp)}
                            className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete employee"
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

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {employees.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords || employees.length)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700">
              {(pagination.totalRecords !== undefined ? pagination.totalRecords : employees.length).toLocaleString()}
            </span>{' '}
            employees
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <span className="px-2 text-xs font-medium text-slate-600">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>

            <button
              onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm !m-0">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedEmployee ? 'Edit Employee Record' : 'Add New Employee'}
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 px-6 py-5">
              {formError && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Maya Lin"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="maya.lin@example.com"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  >
                    {!formData.department && <option value="">Select Department</option>}
                    {departmentList.map((dept) => {
                      const name = dept.department_name || dept;
                      return (
                        <option key={dept.id || name} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Job Title</label>
                  <select
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  >
                    {!formData.job_title && <option value="">Select Job Title</option>}
                    {jobList.map((job) => {
                      const title = job.job_title || job;
                      return (
                        <option key={job.id || title} value={title}>
                          {title}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Country / Currency</label>
                  <select
                    value={formData.country_id}
                    onChange={(e) => setFormData({ ...formData, country_id: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  >
                    {!formData.country_id && <option value="">Select Country</option>}
                    {countryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.country_name || c.name} ({c.currency_code || c.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Salary Amount *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. 95000"
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Hire Date</label>
                <input
                  type="date"
                  required
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 disabled:opacity-50"
                >
                  {formSubmitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {selectedEmployee ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm !m-0">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-lg font-bold text-accent-700">
                  {getInitials(selectedEmployee.full_name || selectedEmployee.name)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedEmployee.full_name || selectedEmployee.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedEmployee.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-3 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Record ID</span>
                <span className="font-mono font-medium text-slate-900">
                  #{selectedEmployee.id || selectedEmployee.employee_id}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Job Title</span>
                <span className="font-medium text-slate-900">
                  {getJobName(selectedEmployee.job, selectedEmployee.job_title || selectedEmployee.jobTitle)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-900">
                  {getDeptName(selectedEmployee.department)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Country</span>
                <span className="font-medium text-slate-900">
                  {getCountryInfo(selectedEmployee.country, selectedEmployee.currency).name}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Salary</span>
                <span className="font-semibold tabular-nums text-emerald-600">
                  {formatMoney(
                    Number(selectedEmployee.salary),
                    getCountryInfo(selectedEmployee.country, selectedEmployee.currency).currency
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Hire Date</span>
                <span className="font-medium text-slate-900">
                  {selectedEmployee.hire_date || selectedEmployee.hireDate || '—'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleOpenEditModal(selectedEmployee);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm !m-0">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <WarningIcon className="h-6 w-6" />
            </div>

            <h3 className="mt-3 text-base font-semibold text-slate-900">Delete Employee</h3>
            <p className="mt-1.5 text-xs text-slate-500">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-800">
                {selectedEmployee.full_name || selectedEmployee.name}
              </span>
              ? This action will remove the record from the database.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={formSubmitting}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={formSubmitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {formSubmitting && (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
