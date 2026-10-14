import { useEffect, useState, useCallback } from 'react';
import { formatMoney } from '../Utils/Index';
import { getDashboardInsights } from '../api/DashboardApis';
import { RefreshIcon } from '../Assets/icons';

export default function Dashboard() {
  const GROUPS = [
    { key: 'byCountry', label: 'Country' },
    { key: 'byDepartment', label: 'Department' },
    { key: 'byJobTitle', label: 'Job title' },
  ];

  const [group, setGroup] = useState('byCountry');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('headcount');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchInsights = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getDashboardInsights();
      if (response?.success && response?.data) {
        setData(response.data);
      } else if (response?.data) {
        setData(response.data);
      } else {
        throw new Error(
          response?.message || 'Invalid data received from server'
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);

      setError(
        err.message ||
        'Unable to load dashboard insights. Please check connection to server.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const active = GROUPS.find((item) => item.key === group) || GROUPS[0];
  const d = data || {};

  const rows = d[group] || [];
  const buckets = d.distribution || [];

  const filteredRows = rows.filter((row) => String(row.label || '')
    .toLowerCase()
    .includes(searchTerm.trim().toLowerCase()))
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = String(valB ?? '').toLowerCase();

        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;

      return sortOrder === 'asc'
        ? valA - valB
        : valB - valA;
    });

  const maxAvg = Math.max(...rows.map((row) => Number(row.avg) || 0), 1);
  const highestDept = [...(d.byDepartment || [])].sort((a, b) => (Number(b.avg) || 0) - (Number(a.avg) || 0))[0];
  const topCountry = [...(d.byCountry || [])].sort((a, b) => (Number(b.headcount) || 0) - (Number(a.headcount) || 0))[0];
  const highestJob = [...(d.byJobTitle || [])].sort((a, b) => (Number(b.avg) || 0) - (Number(a.avg) || 0))[0];
  const salarySpread = (Number(d.maxSalary) || 0) - (Number(d.minSalary) || 0);
  const maxBucketCount = Math.max(...buckets.map((bucket) => Number(bucket.count) || 0), 1);
  const totalCount = buckets.reduce((total, bucket) => total + (Number(bucket.count) || 0), 0);
  const formatBucketRange = (range) => (range ? String(range).replace(/\$/g, '₹') : '');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((previous) => previous === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-8 w-24 rounded bg-slate-200" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-24 rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="mt-3 h-7 w-28 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        <div className="h-64 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 h-6 w-40 rounded bg-slate-200" />
          <div className="h-44 rounded bg-slate-100" />
        </div>

        <div className="h-72 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 h-6 w-40 rounded bg-slate-200" />
          <div className="h-52 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center">
        <h3 className="text-base font-semibold text-rose-800">
          Failed to load Dashboard data
        </h3>

        <p className="mt-1 text-sm text-rose-600">
          {error}
        </p>

        <button
          onClick={() => fetchInsights(false)}
          className="mt-4 inline-flex items-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Salary Insights & Analytics
          </h1>

          {error && (
            <p className="mt-1 text-sm text-rose-600">
              Refresh failed: {error}
            </p>
          )}
        </div>

        <button
          onClick={() => fetchInsights(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-60"
        >
          <RefreshIcon
            className={`h-4 w-4 ${refreshing
              ? 'animate-spin text-accent-600'
              : 'text-slate-500'
              }`}
          />

          <span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: 'Total Headcount',
            value: (Number(d.totalHeadcount) || 0).toLocaleString(),
          },
          {
            label: 'Average Salary',
            value: formatMoney(d.avgSalary || 0),
          },
          {
            label: 'Median Salary',
            value: formatMoney(d.medianSalary || 0),
          },
          {
            label: 'Lowest Salary',
            value: formatMoney(d.minSalary || 0),
          },
          {
            label: 'Highest Salary',
            value: formatMoney(d.maxSalary || 0),
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {card.label}
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Highest Avg Dept
          </span>

          <p className="mt-1 text-base font-semibold text-slate-800">
            {highestDept?.label || 'N/A'}
          </p>

          <p className="text-xs text-slate-500">
            {highestDept
              ? `${formatMoney(highestDept.avg)} avg`
              : '—'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Top Country Headcount
          </span>

          <p className="mt-1 text-base font-semibold text-slate-800">
            {topCountry?.label || 'N/A'}
          </p>

          <p className="text-xs text-slate-500">
            {topCountry
              ? `${(Number(topCountry.headcount) || 0).toLocaleString()} employees`
              : '—'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Salary Spread
          </span>

          <p className="mt-1 text-base font-semibold text-slate-800">
            {formatMoney(salarySpread)}
          </p>

          <p className="text-xs text-slate-500">
            Max vs Min gap
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Highest Avg Role
          </span>

          <p
            className="mt-1 truncate text-base font-semibold text-slate-800"
            title={highestJob?.label || ''}
          >
            {highestJob?.label || 'N/A'}
          </p>

          <p className="text-xs text-slate-500">
            {highestJob
              ? `${formatMoney(highestJob.avg)} avg`
              : '—'}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Salaries by {active.label}
            </h2>
          </div>

          <div
            className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
            role="tablist"
          >
            {GROUPS.map((item) => (
              <button
                key={item.key}
                role="tab"
                aria-selected={group === item.key}
                onClick={() => {
                  setGroup(item.key);
                  setSearchTerm('');
                  setSortField('headcount');
                  setSortOrder('desc');
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${group === item.key
                  ? 'bg-accent-50 text-accent-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No grouping data available.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-xs">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder={`Filter by ${active.label.toLowerCase()}...`}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {filteredRows.length}
                </span>{' '}
                of {rows.length}{' '}
                {active.label.toLowerCase()}s
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    {[
                      {
                        field: 'label',
                        label: active.label,
                        align: 'left',
                      },
                      {
                        field: 'headcount',
                        label: 'Headcount',
                        align: 'right',
                      },
                      {
                        field: 'avg',
                        label: 'Average',
                        align: 'left',
                      },
                      {
                        field: 'median',
                        label: 'Median',
                        align: 'right',
                      },
                      {
                        field: 'min',
                        label: 'Min',
                        align: 'right',
                      },
                      {
                        field: 'max',
                        label: 'Max',
                        align: 'right',
                      },
                    ].map((column) => (
                      <th
                        key={column.field}
                        onClick={() =>
                          handleSort(column.field)
                        }
                        className={`cursor-pointer select-none px-4 py-3 font-medium transition hover:text-slate-900 ${column.align === 'right'
                          ? 'text-right'
                          : ''
                          }`}
                      >
                        <div
                          className={`flex items-center gap-1 ${column.align === 'right'
                            ? 'justify-end'
                            : ''
                            }`}
                        >
                          <span>{column.label}</span>

                          {sortField === column.field && (
                            <span className="text-xs">
                              {sortOrder === 'asc'
                                ? '↑'
                                : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-6 text-center text-sm text-slate-500"
                      >
                        No matching{' '}
                        {active.label.toLowerCase()}{' '}
                        found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr
                        key={row.label}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {row.label}
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                            {(Number(row.headcount) || 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                              <div
                                className="h-2 rounded bg-accent-500 transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(
                                      4,
                                      ((Number(row.avg) || 0) /
                                        maxAvg) *
                                      100
                                    )
                                  )}%`,
                                }}
                              />
                            </div>

                            <span className="w-20 text-right font-medium tabular-nums text-slate-900">
                              {formatMoney(row.avg || 0)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {formatMoney(row.median || 0)}
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                          {formatMoney(row.min || 0)}
                        </td>

                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                          {formatMoney(row.max || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Salary Distribution
          </h2>

          <p className="text-xs text-slate-500">
            Workforce distribution across salary brackets.
          </p>
        </div>

        {buckets.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No distribution data available.
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>
                Headcount Frequency Distribution
              </span>

              <span>
                Total: {totalCount.toLocaleString()} employees
              </span>
            </div>

            <div
              className="flex h-52 items-end gap-3"
              role="img"
              aria-label="Salary distribution by range"
            >
              {buckets.map((bucket) => {
                const count = Number(bucket.count) || 0;
                const percentage =
                  totalCount > 0
                    ? ((count / totalCount) * 100).toFixed(1)
                    : '0.0';

                return (
                  <div
                    key={bucket.range}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="text-xs font-medium tabular-nums text-slate-600 transition-colors group-hover:text-accent-600">
                      {count.toLocaleString()}
                    </span>

                    <div
                      className="w-full rounded-t bg-accent-500 shadow-sm transition-all duration-300 group-hover:bg-accent-600"
                      style={{
                        height: `${Math.max(
                          6,
                          Math.round(
                            (count / maxBucketCount) *
                            85
                          )
                        )}%`,
                      }}
                      title={`${formatBucketRange(bucket.range)}: ${count.toLocaleString()} employees (${percentage}%)`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex gap-3 border-t border-slate-100 pt-2.5">
              {buckets.map((bucket) => (
                <span
                  key={bucket.range}
                  className="flex-1 truncate text-center text-xs font-medium text-slate-600"
                  title={formatBucketRange(bucket.range)}
                >
                  {formatBucketRange(bucket.range)}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
