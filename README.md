# Enterprise Salary Management System

[![React](https://img.shields.io/badge/React-19.3.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v24.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-ORM-52B0E7?style=flat-square&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)

A modern, full-stack enterprise web application designed for automated payroll generation, statutory salary breakdowns, one-click bulk salary disbursement, direct PDF salary slip downloads, salary revision audit tracking, and real-time compensation analytics.

---

## Table of Contents

- [Engineering Artifacts & Architecture Documentation](#engineering-artifacts--architecture-documentation)
- [Key Features](#key-features)
- [Salary Computation & Statutory Deductions](#salary-computation--statutory-deductions)
- [Application Architecture](#application-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [API Endpoints Reference](#api-endpoints-reference)
- [UI & UX Highlights](#ui--ux-highlights)

---

## Engineering Artifacts & Architecture Documentation

For in-depth architectural analysis, product framing, and technical decision records designed for an organization with 10,000 employees, refer to the dedicated **[artifacts/](./artifacts/README.md)** directory:

| Document | Description |
| :--- | :--- |
| **[Requirements Specification](./FRONTEND_REQUIREMENTS.txt)** | Official Frontend Software Requirements Specification (SRS) |
| **[Planning & Design Notes](./artifacts/PLANNING_AND_DESIGN_NOTES.md)** | Product framing, HR Manager persona, user journeys, statutory breakdown logic, design system, and deliberate exclusions |
| **[Architecture Diagrams](./artifacts/ARCHITECTURE_DIAGRAMS.md)** | Mermaid diagrams of high-level architecture, React Router v7 layout, payroll batch flow, client-side PDF pipeline, and debounced search |
| **[AI Prompts & Instructions](./artifacts/AI_PROMPTS_AND_INSTRUCTIONS.md)** | Intentional agentic AI engineering log, prompt sets, human-in-the-loop review, and course corrections |
| **[Trade-off Explanations](./artifacts/TRADE_OFF_EXPLANATIONS.md)** | Comprehensive trade-off evaluations (SPA vs. SSR, client PDF vs. server Puppeteer, server pagination vs. 10k virtualization, Tailwind vs. component libraries) |
| **[Performance Considerations](./artifacts/PERFORMANCE_CONSIDERATIONS.md)** | Optimizing for 10,000 employees: network payload (< 15KB), 400ms search debouncing, CLS = 0 layout shift prevention, and canvas memory tuning |

---

## Key Features

### 1. Automated Monthly Payroll Processing (`/payroll`)
- **One-Click Batch Generation:** Automatically computes monthly salaries for all active employees across the company or filtered by a specific department.
- **Dynamic Bonus Ingestion:** Optional percentage-based bonus or fixed bonus adjustments during batch or manual generation.
- **Bulk Salary Disbursement:** Mark an entire month's payroll as paid in a single click with payment method (`BANK_TRANSFER`, `UPI`, `CHEQUE`, `CASH`) and disbursement date recording.
- **Per-Employee Adjustments:** Inline editing for custom bonuses, unpaid leave deductions, and payroll remarks before disbursement.
- **Summary Metric Cards:** Real-time calculation of Gross Payroll, Statutory Deductions, Net Payable, and Disbursed vs. Pending employee counts.

### 2. Employee Payslips & Direct PDF Download (`/payslips`)
- **Directory Grid:** Visual payslip cards with employee information, department, job designation, salary breakdown, and payment status badge.
- **Direct PDF Download:** Direct client-side PDF generation via `html2pdf.js` with 2x canvas resolution, clean letter spacing, and auto-generated filenames (e.g., `Salary_Slip_Isabella_Perez_October_2026.pdf`).
- **Official Payslip Format:** Includes company branding, unique slip reference number, employee metadata, itemized earnings vs. deductions, net payable in words, and signature blocks.

### 3. Salary Revisions & Appraisal Tracking (`/salary-revisions`)
- **Two-Way Calculation Engine:** Live bidirectional calculation between New CTC amount and Increment Percentage (`+X.XX%`).
- **Live Employee CTC Sync:** Recording a salary revision immediately updates the base salary in the Employee Master record.
- **Audit History:** Detailed historical logs tracking effective dates, appraisal types (*Annual Appraisal*, *Promotion*, *Market Correction*, *Retention Adjustment*), previous vs. new CTC, and remarks.

### 4. Advanced Search, Filtering & Reset Engine
- **Multi-Criteria Filters:** Filter payroll and payslips by Month, Year, Department, Payment Status (`PROCESSED`, `PAID`, `DRAFT`), and search queries.
- **Debounced Instant Search:** 400ms debounced search matching employee full names and email addresses.
- **One-Click Clear Filters:** Prominent "Clear Filters" button in toolbars and inline `✕` clear buttons within search inputs that reset all active queries back to default in one click.

### 5. Master Data Management
- **Employees (`/employees`):** Full employee profile management with base salary, department, job title, and country assignment.
- **Departments (`/departments`):** Department directory with employee count aggregations.
- **Jobs (`/jobs`):** Job title and role classifications.
- **Countries & Currencies (`/countries`):** Multi-currency support with dynamic currency symbols (`INR`, `USD`, `CAD`, `EUR`, `GBP`, etc.).

---

## Salary Computation & Statutory Deductions

The system implements the standard enterprise statutory compensation structure:

### Earnings Breakdown
| Component | Formula / Percentage | Description |
| :--- | :--- | :--- |
| **Basic Salary** | $50\%$ of Base CTC | Base taxable earnings component |
| **House Rent Allowance (HRA)** | $20\%$ of Base CTC | Statutory housing accommodation allowance |
| **Conveyance Allowance** | $5\%$ of Base CTC | Standard transit and travel allowance |
| **Medical Allowance** | $5\%$ of Base CTC | Medical reimbursement component |
| **Special Allowance** | Remaining balance ($\approx 20\%$) | Balancing component so allowances sum to Base CTC |
| **Bonus** | Custom input ($\%$) | Performance or festive incentive added to Gross |
| **Total Gross Salary** | $\sum(\text{All Earnings}) + \text{Bonus}$ | Total earnings before deductions |

### Deductions Breakdown
| Component | Formula / Rule | Description |
| :--- | :--- | :--- |
| **Provident Fund (PF)** | $12\%$ of Basic Salary | Statutory retirement contribution |
| **Professional Tax (PT)** | Flat ₹200 if Gross $> 15,000$ (₹0 otherwise) | State employment tax |
| **TDS / Income Tax** | Slab-based on annual projection: <br>• Annual $> 1,000,000 \implies 10\%$ of Gross <br>• Annual $> 500,000 \implies 5\%$ of Gross <br>• Annual $\le 500,000 \implies 0\%$ | Estimated monthly income tax withholding |
| **Other Deductions** | Custom input | Unpaid leave, loan recovery, or loss of pay |
| **Total Deductions** | $\text{PF} + \text{PT} + \text{TDS} + \text{Other}$ | Total monthly statutory withholdings |

$$\mathbf{Net\ Salary\ Payable} = \mathbf{Gross\ Salary} - \mathbf{Total\ Deductions}$$

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 Frontend (SPA)                     │
│   Tailwind CSS  •  React Router v7  •  html2pdf.js  •  Axios │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST APIs (Port 5000)
┌──────────────────────────────▼──────────────────────────────┐
│                  Node.js / Express Backend                  │
│       Controllers  •  Services  •  Sequelize CLI  •  MySQL2 │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL
┌──────────────────────────────▼──────────────────────────────┐
│                    MySQL Database                           │
│   employees • payrolls • salary_revisions • departments ... │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Framework:** React 19.3.0 (with functional components & hooks)
- **Routing:** React Router v7.18.4
- **Styling:** Tailwind CSS v3
- **PDF Generation:** `html2pdf.js` v0.14.0 (client-side high-resolution rendering)
- **HTTP Client:** Axios v1.20.0
- **Icons:** Custom SVG icon design system

### Backend
- **Runtime:** Node.js (v18+ / v20+ / v24+)
- **Server:** Express.js 5.3.0
- **ORM:** Sequelize v6.37.8 (MySQL2 dialect)
- **Database:** MySQL 8.x
- **Development:** Nodemon, Dotenv, Sequelize CLI

---

## Project Structure

```text
surprise assessment/
├── backend/
│   ├── config/             # Database connection credentials
│   ├── migrations/         # Sequelize schema migrations
│   ├── models/             # Sequelize models (Employee, Payroll, SalaryRevision, etc.)
│   ├── seeders/            # Database mock data seeders
│   ├── src/
│   │   ├── payroll/        # Payroll controllers, services, and route definitions
│   │   ├── salaryRevision/ # Salary revision controllers, services, and routes
│   │   ├── employee/       # Employee master API
│   │   ├── department/     # Department master API
│   │   ├── job/            # Job master API
│   │   ├── country/        # Country & currency master API
│   │   └── server.js       # Express application entry point
│   ├── .env                # Backend environment configuration
│   └── package.json
│
└── frontend/
    ├── public/             # Static HTML template & assets
    ├── src/
    │   ├── api/            # API client services (PayrollApis, EmployeeApis, etc.)
    │   ├── Assets/         # Shared SVG icon library
    │   ├── components/     # Reusable UI (PayslipModal, Toast, StatCard, Layout)
    │   ├── pages/          # Application views (Payroll, Payslips, SalaryRevisions, etc.)
    │   ├── Utils/          # Currency formatters, month helpers, useBodyScrollLock
    │   ├── App.js          # App routing configuration
    │   ├── index.css       # Tailwind base styles
    │   └── index.js
    ├── package.json
    └── tailwind.config.js
```

---

## Getting Started

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Yarn:** v1.22.x or npm v9+
- **MySQL:** v8.0+ running locally on port 3306

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd "d:/surprise assessment/backend"
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=salary_management
   DB_DIALECT=mysql
   ```

4. Create the MySQL database and run migrations:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS salary_management;"
   yarn db:migrate
   ```

5. Start the backend development server:
   ```bash
   yarn dev
   ```
   *The backend will be available at `http://localhost:5000`.*

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd "d:/surprise assessment/frontend"
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the React development server:
   ```bash
   yarn start
   ```
   *The application will open automatically at `http://localhost:3000`.*

---

## API Endpoints Reference

### Payroll Endpoints (`/api/payroll`)
| Method | Endpoint | Description | Query / Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payroll` | Fetch paginated payroll records with summary | `page`, `limit`, `month`, `year`, `department_id`, `status`, `search` |
| `GET` | `/api/payroll/:id` | Fetch single payroll record by ID | `id` (URL param) |
| `POST` | `/api/payroll/generate` | Batch generate monthly payroll | `{ month, year, department_id, bonus_percentage }` |
| `POST` | `/api/payroll/create` | Create single manual payroll entry | `{ employee_id, month, year, bonus, ... }` |
| `PUT` | `/api/payroll/:id` | Update bonus, other deductions, remarks | `{ bonus, other_deductions, remarks }` |
| `POST` | `/api/payroll/:id/pay` | Mark individual payroll as PAID | `{ payment_date, payment_method }` |
| `POST` | `/api/payroll/bulk-pay` | Mark all month's payroll as PAID | `{ month, year, payment_date, payment_method }` |
| `DELETE`| `/api/payroll/:id` | Soft delete payroll entry | `id` (URL param) |

### Salary Revision Endpoints (`/api/salary-revisions`)
| Method | Endpoint | Description | Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/salary-revisions` | Get revision audit trail with search | `page`, `limit`, `employee_id`, `search` |
| `POST` | `/api/salary-revisions` | Record revision & auto-update employee CTC | `{ employee_id, new_salary, effective_date, revision_type, remarks }` |
| `DELETE`| `/api/salary-revisions/:id` | Remove salary revision record | `id` (URL param) |

---

## UI & UX Highlights

- **Direct PDF Download:** Eliminates the need for browser print dialogs by generating and downloading high-fidelity PDF salary slips directly.
- **Scroll Lock on Modals (`useBodyScrollLock`):** Dynamically locks the background viewport when dialogs or payslip modals are open, preventing jarring page displacement.
- **Zero-Flicker Debounce:** Instant search filtering with smooth loading skeletons and zero layout shift.
- **Responsive Layout:** Optimized for mobile phones, tablets, and wide desktop screens.