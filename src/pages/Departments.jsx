import { useEffect, useState, useCallback, useRef } from 'react';
import { getDepartments, getDepartmentById, addDepartment, updateDepartment, deleteDepartment, } from '../api/DepartmentApis';
import Toast from '../components/Toast';
import StatCard from '../components/StatCard';
import { RefreshIcon, PlusIcon, SearchIcon, EyeIcon, EditIcon, TrashIcon, WarningIcon } from '../Assets/icons';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({ department_name: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);

  const debounceTimerRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(val);
    }, 350);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDepartments = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const res = await getDepartments({ search, all: true });
      setDepartments(res.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
      showToast(err.message || 'Error loading departments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments(debouncedSearch);
  }, [loadDepartments, debouncedSearch]);

  const handleOpenAddModal = () => {
    setSelectedDept(null);
    setFormData({ department_name: '' });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (dept) => {
    setSelectedDept(dept);
    setFormData({ department_name: dept.department_name });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenDetailsModal = async (dept) => {
    try {
      const res = await getDepartmentById(dept.id);
      setSelectedDept(res.data || dept);
    } catch (err) {
      setSelectedDept(dept);
    }
    setIsDetailsModalOpen(true);
  };

  const handleOpenDeleteModal = (dept) => {
    setSelectedDept(dept);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      if (!formData.department_name.trim()) {
        throw new Error('Department name is required');
      }

      if (selectedDept) {
        await updateDepartment(selectedDept.id, formData);
        showToast('Department updated successfully!');
      } else {
        await addDepartment(formData);
        showToast('Department created successfully!');
      }

      setIsFormModalOpen(false);
      loadDepartments(debouncedSearch);
    } catch (err) {
      console.error('Save failed:', err);
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDept) return;
    setFormSubmitting(true);
    try {
      await deleteDepartment(selectedDept.id);
      showToast('Department deleted successfully');
      setIsDeleteModalOpen(false);
      loadDepartments(debouncedSearch);
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(err.message || 'Failed to delete department', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Departments</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadDepartments(debouncedSearch)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
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
            Add Department
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Departments" value={departments.length} />
        <StatCard
          label="Search Filter"
          value={debouncedSearch ? `"${debouncedSearch}"` : 'All Departments'}
        />
        <StatCard label="Database Table" value="departments" />
      </div>

      {/* Search Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search departments by name..."
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-8 text-sm placeholder-slate-400 transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Department Name</th>
                <th className="px-4 py-3.5">Created At</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-8 rounded bg-slate-200" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-40 rounded bg-slate-200" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                    <td className="px-5 py-4"><div className="ml-auto h-6 w-20 rounded bg-slate-200" /></td>
                  </tr>
                ))
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-sm text-slate-500">
                    No departments found matching your criteria.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">#{dept.id}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900">{dept.department_name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {dept.created_at ? new Date(dept.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetailsModal(dept)}
                          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(dept)}
                          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-accent-600"
                          title="Edit department"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(dept)}
                          className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          title="Delete department"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm !m-0">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedDept ? 'Edit Department' : 'Add Department'}
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
                <label className="block text-xs font-medium text-slate-700">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.department_name}
                  onChange={(e) => setFormData({ department_name: e.target.value })}
                  placeholder="e.g. Research & Development"
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
                  {selectedDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAILS */}
      {isDetailsModalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm !m-0">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">{selectedDept.department_name}</h3>
            <p className="text-xs text-slate-500">Department Overview</p>

            <div className="mt-4 space-y-2 divide-y divide-slate-100 text-sm">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">ID</span>
                <span className="font-mono font-medium text-slate-900">#{selectedDept.id}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Assigned Employees</span>
                <span className="font-semibold text-accent-700">
                  {selectedDept.employee_count !== undefined ? selectedDept.employee_count : '—'}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Created At</span>
                <span className="font-medium text-slate-900">
                  {selectedDept.created_at ? new Date(selectedDept.created_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {isDeleteModalOpen && selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm !m-0">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <WarningIcon className="h-6 w-6" />
            </div>

            <h3 className="mt-3 text-base font-semibold text-slate-900">Delete Department</h3>
            <p className="mt-1.5 text-xs text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{selectedDept.department_name}</span>? If employees are currently assigned, deletion will be prevented.
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
