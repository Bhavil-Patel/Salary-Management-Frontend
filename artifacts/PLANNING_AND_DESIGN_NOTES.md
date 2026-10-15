# 📋 Planning and Design Notes: Frontend Client

**Project**: Enterprise Employee Salary Management System (Frontend Client)  
**Target Organization**: Enterprise with 10,000 Employees across multiple international regions  
**Primary Persona**: Human Resources (HR) Manager & Compensation Director  
**Framework & Stack**: React 19.3.0, React Router DOM v7.18.4, Tailwind CSS v3, Axios v1.20.0, html2pdf.js  
**Status**: Production Ready & Fully Tested (25 Test Suites, 158 Tests Passing)  

---

## 1. Executive Summary & Product Framing

### 1.1 The Operational Problem
Managing compensation, payroll disbursement, statutory withholdings, and salary revisions for **10,000 employees** across multiple operating countries in spreadsheets (Microsoft Excel / Google Sheets) creates unacceptable operational risk for the HR Manager:
- **Catastrophic Formula Corruption**: Accidental cell overwrites, broken range references in lookups, and inconsistent copy-pasting lead to incorrect paychecks and legal exposure.
- **Audit Deficits**: No immutable historical record of salary changes, dates of appraisal, or payment methods.
- **Disbursement Lag**: Processing monthly disbursements via manual bank file exports without an operational status board leads to duplicate transfers or missed payments.
- **Reporting Paralysis**: When executive leadership asks *"What is our total net payroll liability for Engineering this month?"* or *"How does median compensation in the UK compare to India?"*, the HR team spends days wrangling pivot tables.
- **Employee Dispute Inefficiency**: Without automated payslips, HR spends hundreds of hours every month manually drafting and emailing salary slips upon employee request.

### 1.2 The Product Solution
The **Enterprise Salary Management Frontend Client** provides a centralized, reactive Single Page Application (SPA) designed specifically for the HR Manager. It transforms spreadsheet chaos into an intuitive, high-performance command center:
1. **Executive Compensation Dashboard**: Instant high-level metrics (headcount, monthly gross, disbursed vs. pending) and distribution histograms.
2. **Monthly Batch Payroll Portal**: One-click generation for 10,000 employees with optional bonus percentages, inline adjustments (leaves, penalties), and bulk disbursement.
3. **Employee Directory & Lifecycle**: Instant search across 10,000 staff, department/job assignments, multi-currency support, and full CRUD.
4. **Salary Revisions & Appraisal Console**: Bidirectional increment calculator (`+X.XX%` ↔ `New CTC`), revision audit trail, and automatic base salary synchronization.
5. **Direct Payslip PDF Generation**: Client-side, pixel-perfect A4 salary slip PDF generation with itemized statutory earnings, deductions, and Indian number-to-words conversion—requiring zero backend rendering overhead.

---

## 2. Target User Persona & Core User Journeys

### 2.1 Persona Profile: Elena Vance (HR Director / Payroll Lead)
- **Primary Goal**: Ensure all 10,000 employees are paid accurately and on time every month, comply with statutory tax deductions, track annual appraisal budgets, and provide instant compensation analytics to C-level leadership.
- **Pain Points**: Information overload, complex tax rules, slow-loading web tables, accidental double-clicks causing duplicate payments, spreadsheet version conflicts.
- **Key UX Expectations**: Fast loading, deterministic calculations, prominent status feedback (toasts, badges), no modal layout jumps, instant search with zero flicker.

---

### 2.2 Primary User Journeys

#### Journey 1: Monthly Batch Payroll Processing & Disbursement
```
[Select Month & Year] 
        ↓
[Click "Generate Payroll"] → [Modal: Select Department & Bonus %] → [Execute Batch]
        ↓
[Real-time Summary Strip Updates: Gross, Deductions, Net, Processed Count]
        ↓
[Review & Inline Adjustments: Edit Bonus or Loss-of-Pay Deductions per Employee]
        ↓
[Click "Disburse All" / Individual "Pay"] → [Select Date & Payment Method: Bank/UPI/Cheque]
        ↓
[Status transitions from PROCESSED to PAID with Timestamp & Confirmation Toast]
```

#### Journey 2: Employee Appraisal & Salary Revision
```
[Open /salary-revisions] 
        ↓
[Click "Record Revision"] → [Select Employee from Directory]
        ↓
[Interactive Calculator]:
   • Enter Increment % (e.g., 12.5%) → Auto-computes New CTC Salary
     OR
   • Enter New CTC Salary → Auto-computes Increment %
        ↓
[Select Revision Type: Annual Appraisal / Promotion / Market Correction / Retention]
        ↓
[Submit] → [Records Historical Audit Log] & [Auto-updates Employee Master Base Salary]
```

#### Journey 3: Instant Employee Payslip Inspection & PDF Download
```
[Open /payslips] 
        ↓
[Debounced Search or Department Filter] → [Locate Employee Card]
        ↓
[Click "View Slip"] → [Modal Opens: Official Company Header, Reference #, Itemized Tables]
        ↓
[Inspect Statutory Breakdown]:
   • Earnings: Basic, HRA, Conveyance, Medical, Special, Bonus
   • Deductions: PF, PT, TDS, Loss of Pay
   • Net Payable in Bold Digits & Written English Words
        ↓
[Click "Download PDF"] → [html2pdf.js captures element at 2x resolution, generates standardized A4 PDF]
```

#### Journey 4: Executive Inquiries on Organization Compensation
```
[Open /dashboard] 
        ↓
[Inspect High-Level StatCards: Headcount, Total Monthly Payroll, Disbursed vs. Pending]
        ↓
[Review Compensation Histograms & Range Buckets: e.g. $20k-$40k, $40k-$60k]
        ↓
[Review Cross-Department & Cross-Country Median vs. Mean Compensation]
```

---

## 3. UI/UX Design System & Ergonomics

### 3.1 Color Palette & Visual Hierarchy
To convey authority, financial clarity, and institutional trust, the application avoids basic web colors in favor of a tailored, high-contrast palette:

| Token / Role | Tailwind Classes | Purpose & Application |
| :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-50` / `bg-slate-100` | Clean, neutral backdrop preventing eye fatigue |
| **Card Surface** | `bg-white border-slate-200` | High-contrast elevated panels with subtle border lines |
| **Primary Brand** | `bg-accent-600 hover:bg-accent-700` (`#0284c7` / `#2563eb`) | Action buttons, active navigation indicators, key metrics |
| **Paid / Success** | `bg-emerald-50 text-emerald-700 border-emerald-200` | Processed disbursements, successful revisions, positive toast |
| **Pending / Warning** | `bg-amber-50 text-amber-700 border-amber-200` | Pending payroll, draft items, cautious actions |
| **Danger / Destructive** | `bg-rose-50 text-rose-700 border-rose-200` | Delete employee, delete revision, error alerts |
| **Typography Base** | `text-slate-900` (headings), `text-slate-600` (subtext) | Crisp legibility conforming to WCAG 2.1 AA standards |

### 3.2 Modal & Viewport Ergonomics (`useBodyScrollLock`)
A common usability bug in enterprise single-page applications is "scroll jump" when modals open (such as the detailed Salary Slip or Batch Generation dialogs). When the background document's `overflow: hidden` is applied, the scrollbar disappears, causing the entire layout to shift horizontally by 15–17px.

**Our Engineered Solution**:
The custom hook `useBodyScrollLock` dynamically measures the viewport's scrollbar width prior to locking:
```javascript
const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
document.body.style.paddingRight = `${scrollbarWidth}px`;
document.body.style.overflow = 'hidden';
```
When the modal is dismissed, the original inline styles are restored cleanly, ensuring zero visual layout displacement.

### 3.3 Zero-Flicker Debounced Search
When managing 10,000 employee records, querying the backend on every individual keystroke causes server thrashing and UI jitter.
- The UI incorporates a **400ms debounce timer** on search inputs across `/employees`, `/payroll`, `/payslips`, and `/salary-revisions`.
- Loading indicators appear during async resolution without destroying table structures, preventing Content Layout Shift (CLS = 0).
- Dedicated "Clear Filters" action buttons instantly reset search query, status, and department states to their clean baseline in one click.

---

## 4. Statutory Compensation & Number-to-Words Logic

### 4.1 Earnings Breakdown Engine
The frontend client displays and verifies the statutory compensation structure computed by the system:
1. **Basic Salary**: $50\%$ of Base CTC.
2. **House Rent Allowance (HRA)**: $20\%$ of Base CTC.
3. **Conveyance Allowance**: $5\%$ of Base CTC.
4. **Medical Allowance**: $5\%$ of Base CTC.
5. **Special Allowance**: Balance component ($\approx 20\%$) ensuring allowances sum exactly to base CTC.
6. **Performance / Festive Bonus**: Additive incentive component.
7. **Gross Salary**: $\sum(\text{All Earnings}) + \text{Bonus}$.

### 4.2 Statutory Deductions Engine
1. **Provident Fund (PF)**: $12\%$ of Basic Salary.
2. **Professional Tax (PT)**: Flat ₹200 if Base Salary $> 15,000$; otherwise ₹0.
3. **Tax Deducted at Source (TDS)**:
   - Annual CTC $> 1,000,000 \implies 10\%$ of Gross.
   - Annual CTC $> 500,000 \implies 5\%$ of Gross.
   - Annual CTC $\le 500,000 \implies 0\%$.
4. **Other Deductions**: Custom unpaid leave, loss of pay, or loan recoveries.
5. **Total Deductions**: $\text{PF} + \text{PT} + \text{TDS} + \text{Other Deductions}$.
6. **Net Salary**: $\max(0, \text{Gross Salary} - \text{Total Deductions})$.

### 4.3 Indian Numbering System Translation (`numberToWords`)
For formal financial instruments and salary slips, monetary values must be rendered in written English words under the Indian financial numbering system (Crores, Lakhs, Thousands, Hundreds):
- Example: `₹92,800.00` $\implies$ **"Ninety Two Thousand Eight Hundred Only"**
- Handled via pure recursive numeric parsing handling single units, teens, tens, and scalable order magnitudes.

---

## 5. Deliberate Scope Exclusions & Rationale

| Feature Omitted | Architectural & Product Reasoning |
| :--- | :--- |
| **Self-Service Employee Login Portal** | The prompt strictly defines the user persona as the **HR Manager of the organization**. Adding multi-role authentication (OAuth, 10,000 individual employee logins) would dilute engineering focus from core compensation analytics, bulk batch processing, and audit rigor. |
| **Automated Bank Gateway Webhook Integration** | Live ACH / NEFT bank API protocols (e.g., Stripe Treasury, RazorpayX) require KYC credentials and commercial banking sandboxes. Supporting payment method logging (`BANK_TRANSFER`, `UPI`, `CHEQUE`, `CASH`) and bulk state transitions satisfies operational requirements without external sandbox dependencies. |
| **Complex Multi-Tier Benefit Administration (401k/HSA/ESOPs)** | Organizations with 10,000 employees typically integrate specialized benefit providers (Workday, Carta). Conflating basic salary management with equity vesting would create unnecessary bloat. |
| **Client-Side Heavy 10k Row Virtualization** | Rather than downloading all 10,000 employee objects into browser RAM (consuming 15MB+ of JSON memory), the frontend delegates dataset slicing to server-side pagination with limit/offset and server aggregates. |

---

## 6. Verification & Quality Assurance Summary
- **Test Suites**: 25 passed out of 25.
- **Unit & Integration Tests**: 158 passed out of 158.
- **Execution Time**: ~6.3 seconds.
- **Frameworks**: Jest, React Testing Library, React Router DOM v7, Axios Mocking.
- **Coverage Surface**: Route navigation, page view rendering, modal lifecycle, PDF download mock, currency formatting, number-to-words edge cases, and API error boundary handling.
