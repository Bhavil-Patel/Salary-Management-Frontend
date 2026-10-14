import { formatMoneyExact, getMonthName, numberToWords } from '../Utils/Index';
import useBodyScrollLock from '../Utils/useBodyScrollLock';
import { CloseIcon } from '../Assets/icons';

export default function PayslipModal({ payroll, isOpen, onClose }) {
  // Prevent background scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen || !payroll) return null;

  const emp = payroll.employee || {};
  const dept = emp.department?.department_name || emp.department || 'N/A';
  const job = emp.job?.job_title || emp.job || 'N/A';
  const country = emp.country?.country_name || 'N/A';
  const currency = emp.country?.currency_code || 'INR';

  const basic = Number(payroll.basic_salary) || 0;
  const hra = Number(payroll.hra) || 0;
  const conveyance = Number(payroll.conveyance_allowance) || 0;
  const medical = Number(payroll.medical_allowance) || 0;
  const special = Number(payroll.special_allowance) || 0;
  const bonus = Number(payroll.bonus) || 0;
  const gross = Number(payroll.gross_salary) || 0;

  const pf = Number(payroll.pf_deduction) || 0;
  const pt = Number(payroll.professional_tax) || 0;
  const tds = Number(payroll.tds_tax) || 0;
  const otherDeductions = Number(payroll.other_deductions) || 0;
  const totalDeductions = Number(payroll.total_deductions) || 0;
  const netSalary = Number(payroll.net_salary) || 0;

  const isPaid = payroll.status === 'PAID';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm !m-0 print:p-0 print:bg-white print:static"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center py-6 sm:py-10">
        <div
          className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl print:max-w-none print:shadow-none print:rounded-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md rounded-t-xl print:hidden">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent-600 animate-pulse" />
              <h3 className="text-base font-semibold text-slate-900">
                Official Salary Slip
              </h3>
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {payroll.status || 'PROCESSED'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <svg className="h-4 w-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div id="printable-payslip" className="p-8 text-slate-900 print:p-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between border-b-2 border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600 font-bold text-white shadow-sm">
                    SM
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      Salary Management System
                    </h1>
                    <p className="text-xs text-slate-500">
                      Enterprise Payroll & Compensation Portal
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  PAYSLIP
                </span>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {getMonthName(payroll.month)} {payroll.year}
                </p>
                <p className="text-xs text-slate-500">
                  Slip Ref: #PAY-{payroll.id.toString().padStart(6, '0')}
                </p>
              </div>
            </div>

            {/* Employee & Payment Metadata Grid */}
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-slate-500">Employee ID:</span>
                  <p className="font-semibold text-slate-800">EMP-#{emp.id || payroll.employee_id}</p>
                </div>
                <div>
                  <span className="text-slate-500">Employee Name:</span>
                  <p className="font-semibold text-slate-800">{emp.full_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Designation:</span>
                  <p className="font-semibold text-slate-800">{job}</p>
                </div>
                <div>
                  <span className="text-slate-500">Department:</span>
                  <p className="font-semibold text-slate-800">{dept}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email Address:</span>
                  <p className="font-semibold text-slate-800 truncate" title={emp.email}>{emp.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Country & Currency:</span>
                  <p className="font-semibold text-slate-800">{country} ({currency})</p>
                </div>
                <div>
                  <span className="text-slate-500">Payment Status:</span>
                  <p className={`font-semibold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {payroll.status}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Payment Method:</span>
                  <p className="font-semibold text-slate-800">
                    {payroll.payment_method?.replace(/_/g, ' ') || 'BANK TRANSFER'}
                  </p>
                </div>
                {payroll.payment_date && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Payment Date:</span>
                    <p className="font-semibold text-slate-800">{payroll.payment_date}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Earnings vs Deductions Tables */}
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Earnings Column */}
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-100 px-4 py-2 font-semibold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Earnings</span>
                  <span>Amount ({currency})</span>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 text-slate-600">Basic Salary (50%)</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(basic, currency)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-600">House Rent Allowance (HRA)</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(hra, currency)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-600">Conveyance Allowance</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(conveyance, currency)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-600">Medical Allowance</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(medical, currency)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-600">Special Allowance</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(special, currency)}
                      </td>
                    </tr>
                    {bonus > 0 && (
                      <tr className="bg-emerald-50/50">
                        <td className="px-4 py-2 text-emerald-800 font-medium">Performance Bonus</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums text-emerald-800">
                          {formatMoneyExact(bonus, currency)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                      <td className="px-4 py-2.5 text-slate-800">Total Gross Earnings</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                        {formatMoneyExact(gross, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Deductions Column */}
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="bg-slate-100 px-4 py-2 font-semibold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Deductions</span>
                  <span>Amount ({currency})</span>
                </div>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 text-slate-600">Provident Fund (PF - 12%)</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(pf, currency)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-600">Professional Tax (PT)</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(pt, currency)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-slate-600">TDS / Income Tax</td>
                      <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                        {formatMoneyExact(tds, currency)}
                      </td>
                    </tr>
                    {otherDeductions > 0 && (
                      <tr>
                        <td className="px-4 py-2 text-slate-600">Other / Unpaid Leave Deductions</td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums text-slate-800">
                          {formatMoneyExact(otherDeductions, currency)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-semibold border-t border-slate-200">
                      <td className="px-4 py-2.5 text-rose-800">Total Deductions</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-rose-800">
                        {formatMoneyExact(totalDeductions, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Net Salary Summary Callout */}
            <div className="mt-6 rounded-xl border border-accent-200 bg-gradient-to-r from-accent-50/60 to-indigo-50/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent-700">
                    Total Net Payable Amount
                  </span>
                  <p className="mt-1 text-xs italic text-slate-600">
                    In Words: {numberToWords(netSalary)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold tracking-tight text-accent-700">
                    {formatMoneyExact(netSalary, currency)}
                  </span>
                </div>
              </div>
            </div>

            {payroll.remarks && (
              <div className="mt-4 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Remarks: </span>
                {payroll.remarks}
              </div>
            )}

            {/* Signatures & Footer */}
            <div className="mt-12 flex items-end justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
              <div>
                <div className="h-10 border-b border-dashed border-slate-300 w-48 mb-1" />
                <p className="font-medium text-slate-700">Employer Signature & Seal</p>
                <p className="text-[10px]">Salary Management System</p>
              </div>

              <div className="text-right">
                <div className="h-10 border-b border-dashed border-slate-300 w-48 mb-1 ml-auto" />
                <p className="font-medium text-slate-700">Employee Signature</p>
                <p className="text-[10px]">Acknowledged Receipt</p>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400">
              This is a computer-generated salary slip and does not require an ink signature. Generated on {new Date().toLocaleDateString()}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
