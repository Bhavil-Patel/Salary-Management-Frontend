import { useState } from 'react';
import { formatMoneyExact, getMonthName, numberToWords } from '../Utils/Index';
import useBodyScrollLock from '../Utils/useBodyScrollLock';
import { CloseIcon } from '../Assets/icons';
import html2pdf from 'html2pdf.js';

export default function PayslipModal({ payroll, isOpen, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false);
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

  const handleDownload = async () => {
    const element = document.getElementById('printable-payslip');
    if (!element) return;

    const scrollContainer = element.closest('.overflow-x-auto');
    const prevScrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
    if (scrollContainer) {
      scrollContainer.scrollLeft = 0;
    }

    setIsDownloading(true);
    const cleanName = (emp.full_name || 'Employee').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Salary_Slip_${cleanName}_${getMonthName(payroll.month)}_${payroll.year}.pdf`;

    const opt = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to download salary slip PDF', err);
    } finally {
      if (scrollContainer) {
        scrollContainer.scrollLeft = prevScrollLeft;
      }
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-2 sm:p-6 backdrop-blur-sm !m-0"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center py-4 sm:py-8">
        <div
          className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 sm:px-6 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent-600 animate-pulse" />
              <h3 className="text-base font-semibold text-slate-900">
                Official Salary Slip
              </h3>
              <span
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPaid
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
              >
                {payroll.status || 'PROCESSED'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-60"
              >
                {isDownloading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Salary Slip
                  </>
                )}
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

          <div className="sm:hidden bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <svg className="w-3.5 h-3.5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>Swipe horizontally to view full payslip preview</span>
          </div>

          <div className="overflow-x-auto bg-slate-100/80 p-3 sm:p-6">
            <div className="mx-auto w-[680px] min-w-[680px] shadow-lg border border-slate-200 bg-white rounded-md">
              <div
                id="printable-payslip"
                className="w-[680px] min-w-[680px] bg-white p-6 sm:p-7 text-slate-900 box-border mx-auto"
              >
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-5 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-600 font-bold text-white shadow-sm text-base">
                      SM
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-snug">
                        Salary Management System
                      </h1>
                      <p className="text-xs text-slate-500 leading-normal mt-0.5">
                        Enterprise Payroll & Compensation Portal
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="inline-block rounded bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 leading-none">
                      PAYSLIP
                    </span>
                    <p className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                      {getMonthName(payroll.month)} {payroll.year}
                    </p>
                    <p className="text-xs text-slate-500 leading-normal mt-0.5 font-medium">
                      Slip Ref: #PAY-{payroll.id.toString().padStart(6, '0')}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5">
                  <div className="grid grid-cols-4 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Employee ID:</span>
                      <p className="font-semibold text-slate-900 leading-5">EMP-#{emp.id || payroll.employee_id}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Employee Name:</span>
                      <p className="font-semibold text-slate-900 leading-5">{emp.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Designation:</span>
                      <p className="font-semibold text-slate-900 leading-5">{job}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Department:</span>
                      <p className="font-semibold text-slate-900 leading-5">{dept}</p>
                    </div>

                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Email Address:</span>
                      <p className="font-semibold text-slate-900 leading-5 break-all">{emp.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Country & Currency:</span>
                      <p className="font-semibold text-slate-900 leading-5">{country} ({currency})</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Payment Status:</span>
                      <p className={`font-semibold leading-5 ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {payroll.status}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">Payment Method:</span>
                      <p className="font-semibold text-slate-900 leading-5">
                        {payroll.payment_method?.replace(/_/g, ' ') || 'BANK TRANSFER'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[11px] font-medium mb-1 leading-4">
                        {payroll.payment_date ? 'Payment Date:' : 'Slip Reference:'}
                      </span>
                      <p className="font-semibold text-slate-900 leading-5">
                        {payroll.payment_date || `#PAY-${payroll.id.toString().padStart(6, '0')}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-200">
                    <div className="bg-slate-100/90 px-3.5 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 flex justify-between">
                      <span>Earnings</span>
                      <span>Amount ({currency})</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">Basic Salary (50%)</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(basic, currency)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">House Rent Allowance (HRA)</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(hra, currency)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">Conveyance Allowance</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(conveyance, currency)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">Medical Allowance</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(medical, currency)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">Special Allowance</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(special, currency)}
                          </td>
                        </tr>
                        {bonus > 0 && (
                          <tr className="bg-emerald-50/50">
                            <td className="px-3.5 py-2 text-emerald-800 font-medium">Performance Bonus</td>
                            <td className="px-3.5 py-2 text-right font-semibold tabular-nums text-emerald-800">
                              {formatMoneyExact(bonus, currency)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t border-slate-200">
                          <td className="px-3.5 py-2 text-slate-800">Total Gross Earnings</td>
                          <td className="px-3.5 py-2 text-right tabular-nums text-slate-900">
                            {formatMoneyExact(gross, currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="rounded-lg border border-slate-200">
                    <div className="bg-slate-100/90 px-3.5 py-2 font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 flex justify-between">
                      <span>Deductions</span>
                      <span>Amount ({currency})</span>
                    </div>
                    <table className="w-full text-xs">
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">Provident Fund (PF - 12%)</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(pf, currency)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">Professional Tax (PT)</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(pt, currency)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3.5 py-2 text-slate-600">TDS / Income Tax</td>
                          <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                            {formatMoneyExact(tds, currency)}
                          </td>
                        </tr>
                        {otherDeductions > 0 && (
                          <tr>
                            <td className="px-3.5 py-2 text-slate-600">Other / Unpaid Leave Deductions</td>
                            <td className="px-3.5 py-2 text-right font-medium tabular-nums text-slate-800">
                              {formatMoneyExact(otherDeductions, currency)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 font-bold border-t border-slate-200">
                          <td className="px-3.5 py-2 text-rose-800">Total Deductions</td>
                          <td className="px-3.5 py-2 text-right tabular-nums text-rose-800">
                            {formatMoneyExact(totalDeductions, currency)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-accent-200 bg-accent-50/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-accent-700 block">
                        Total Net Payable Amount
                      </span>
                      <p className="mt-1 text-xs italic text-slate-600 font-medium">
                        In Words: {numberToWords(netSalary)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black tracking-tight text-accent-700 font-mono">
                        {formatMoneyExact(netSalary, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {payroll.remarks && (
                  <div className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded px-3.5 py-2">
                    <span className="font-semibold text-slate-700">Remarks: </span>
                    {payroll.remarks}
                  </div>
                )}

                <div className="mt-10 pt-6 border-t border-slate-200 flex items-end justify-between text-xs text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 w-48 mb-2" />
                    <p className="font-semibold text-slate-800">Employer Signature & Seal</p>
                    <p className="text-[11px] text-slate-500">Salary Management System</p>
                  </div>

                  <div className="text-right">
                    <div className="border-b border-slate-400 w-48 mb-2 ml-auto" />
                    <p className="font-semibold text-slate-800">Employee Signature</p>
                    <p className="text-[11px] text-slate-500">Acknowledged Receipt</p>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-3 text-center text-[10px] text-slate-400">
                  This is a computer-generated salary slip and does not require an ink signature. Generated on {new Date().toLocaleDateString()}.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
