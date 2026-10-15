# 🏛️ Architecture and System Design Diagrams: Frontend Client

**Project**: Enterprise Employee Salary Management System (Frontend Client)  
**Target Organization**: Organization with 10,000 Employees across Multiple Regions  
**Primary User**: Human Resources (HR) Manager  
**Architecture Pattern**: Single Page Application (SPA) with Modular Layered Architecture  

---

## 1. High-Level Frontend System Architecture

The frontend application adopts a clean, layered architecture separating user interface presentation, application routing, state management, API services, and rendering utilities:

```mermaid
flowchart TB
    subgraph Browser_Client ["Browser Client Environment (V8 / Chromium / WebKit)"]
        subgraph Presentation_Layer ["Presentation Tier (React 19 & Tailwind CSS v3)"]
            LayoutShell["Layout Shell (Header, Navigation, Brand)"]
            
            subgraph Views ["Page Views & Route Controllers"]
                V_Dash["Dashboard (/dashboard)"]
                V_Pay["Payroll (/payroll)"]
                V_Slip["Payslips (/payslips)"]
                V_Rev["Salary Revisions (/salary-revisions)"]
                V_Emp["Employees (/employees)"]
                V_Dept["Departments (/departments)"]
                V_Job["Jobs (/jobs)"]
                V_Ctry["Countries (/countries)"]
            end
            
            subgraph Reusable_Components ["Shared Presentation Components"]
                Modal_Slip["PayslipModal (Print View & PDF)"]
                Toast_UI["Toast Notifications (Success/Error/Warning)"]
                StatCard_UI["StatCard Metric Tiles"]
            end
        end

        subgraph Hook_Util_Layer ["State, Hooks & Transformation Utilities"]
            H_Scroll["useBodyScrollLock (CLS Prevention)"]
            U_Curr["formatMoney & formatMoneyExact"]
            U_Words["numberToWords (Indian Numbering Format)"]
            U_Month["Month Helpers & Date Formatters"]
        end

        subgraph Client_PDF_Engine ["Client-Side PDF Generation Engine"]
            H2P["html2pdf.js (Scale: 2x, Canvas Render, A4 Portrait)"]
        end

        subgraph API_Client_Layer ["API Service Tier (Axios v1.20)"]
            AxiosInstance["ApiConfig.js (BaseURL, 30s Timeout, Standard JSON)"]
            APIs_Emp["EmployeeApis"]
            APIs_Pay["PayrollApis"]
            APIs_Rev["SalaryRevisionApis"]
            APIs_Dash["DashboardApis"]
            APIs_Master["Department / Job / Country Apis"]
            ErrHandler["handleApiError (Unified Network/Timeout Classification)"]
        end
    end

    subgraph Backend_Gateway ["Backend Server & Persistence Tier"]
        REST_API["Express 5 REST API (Port 5000 / Render Cloud)"]
        DB["MySQL 8.0 (10,000 Employees Relational Store)"]
    end

    LayoutShell --> Views
    Views --> Reusable_Components
    Views --> Hook_Util_Layer
    Modal_Slip --> Client_PDF_Engine
    Views --> API_Client_Layer
    API_Client_Layer --> AxiosInstance
    AxiosInstance --> ErrHandler
    AxiosInstance -- "HTTP/HTTPS JSON (CORS)" --> REST_API
    REST_API --> DB
```

---

## 2. Application Routing & Layout Outlet Architecture (React Router v7)

The application utilizes React Router DOM v7's nested route architecture with an persistent layout shell:

```mermaid
flowchart TD
    RootRoute["/ (Root Index)"] --> Redirect["Navigate to /dashboard (replace: true)"]
    
    AppShell["<App />"] --> ShellLayout["<Layout /> (Header, Nav, Toast Root)"]
    
    ShellLayout --> Outlet["<Outlet /> (Dynamic Viewport)"]
    
    Outlet --> R_Dash["/dashboard (Executive Analytics)"]
    Outlet --> R_Pay["/payroll (Batch Payroll & Bulk Pay)"]
    Outlet --> R_Slip["/payslips (Visual Directory & PDF Generation)"]
    Outlet --> R_Rev["/salary-revisions (Appraisals & Live CTC Sync)"]
    Outlet --> R_Emp["/employees (10,000 Staff Master Directory)"]
    Outlet --> R_Dept["/departments (Organizational Units)"]
    Outlet --> R_Job["/jobs (Job Titles & Designations)"]
    Outlet --> R_Ctry["/countries (Multi-Currency & Regional Settings)"]
```

---

## 3. End-to-End Monthly Payroll Processing & Disbursement Flow

This workflow illustrates how the HR Manager runs monthly payroll for 10,000 employees, adjusts bonuses/deductions, and marks records as paid:

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Manager
    participant UI as Payroll Page (/payroll)
    participant Modal as Batch Generate Modal
    participant API as PayrollApis.js
    participant Server as Express REST API
    participant DB as MySQL Database

    HR->>UI: Selects Month (e.g., October) & Year (2026)
    UI->>API: getPayrollList(month=10, year=2026, page=1, limit=10)
    API->>Server: GET /api/payroll?month=10&year=2026
    Server->>DB: Query Payrolls & Aggregate Financial Summary
    DB-->>Server: Return 10 rows + Aggregates (Gross, Net, Deductions)
    Server-->>API: 200 OK (data, summary, pagination)
    API-->>UI: Render Summary Strip & Data Table

    opt Payroll Not Yet Generated for Month
        HR->>UI: Click "Generate Monthly Payroll"
        UI->>Modal: Open Modal (Select Department='ALL', Bonus %=0)
        HR->>Modal: Confirm Generation
        Modal->>API: generateMonthlyPayroll({ month: 10, year: 2026, ... })
        API->>Server: POST /api/payroll/generate
        Server->>DB: Fetch Active Employees (10,000) & Skip existing records
        Server->>DB: Bulk insert calculated payroll records
        DB-->>Server: Confirmation (Records Created)
        Server-->>API: 201 Created
        API-->>UI: Trigger Toast ("Generated payroll successfully") & Refresh List
    end

    opt Inline Compensation Adjustment
        HR->>UI: Click "Edit" on employee row
        HR->>UI: Adjust Bonus (+₹5,000) or Loss of Pay (-₹2,000)
        UI->>API: updatePayroll(id, { bonus, other_deductions, remarks })
        API->>Server: PUT /api/payroll/:id
        Server->>DB: Recalculate Gross, Deductions, Net & Save
        Server-->>UI: Return updated row & refreshed summary
    end

    HR->>UI: Click "Disburse All" (Bulk Pay)
    UI->>Modal: Open Bulk Pay Modal (Method: BANK_TRANSFER, Date: Today)
    HR->>Modal: Confirm Disbursement
    Modal->>API: bulkMarkPaid({ month: 10, year: 2026, payment_method, ... })
    API->>Server: POST /api/payroll/bulk-pay
    Server->>DB: Update all PROCESSED rows -> PAID for month 10, 2026
    DB-->>Server: Rows affected count
    Server-->>API: 200 OK ({ count, message })
    API-->>UI: Toast Success & update UI status badges to emerald "PAID"
```

---

## 4. Client-Side PDF Generation Engine (`html2pdf.js`)

Unlike traditional web applications that generate PDFs on the server (which bottlenecks CPU, requires Puppeteer / headless Chrome, and adds server storage costs), the frontend performs high-fidelity client-side rendering directly in browser memory:

```mermaid
flowchart TD
    UserTrigger["HR Manager clicks 'Download PDF' on Payslip Modal"]
    
    subgraph Step_1 ["1. Viewport & Scroll Normalization"]
        DetectScroll["Check if printable container is scrolled horizontally"]
        ResetScroll["Temporarily reset container scrollLeft = 0"]
        SetDownloadState["Set isDownloading = true (Disable buttons, show spinner)"]
    end

    subgraph Step_2 ["2. Target Element Isolation"]
        DOMQuery["Query #printable-payslip DOM node"]
        ApplyStyles["Verify inline printable CSS (Page-break rules, borders, colors)"]
        BuildFilename["Generate standard filename: Salary_Slip_<CleanName>_<Month>_<Year>.pdf"]
    end

    subgraph Step_3 ["3. Canvas Rasterization (html2canvas)"]
        CanvasConfig["Configure html2canvas: scale: 2 (Hi-DPI), useCORS: true, logging: false"]
        RenderCanvas["Rasterize target HTML element to High-Resolution Canvas"]
    end

    subgraph Step_4 ["4. PDF Composition (jsPDF)"]
        PDFConfig["Configure jsPDF: format: 'a4', orientation: 'portrait', unit: 'mm'"]
        SliceCanvas["Position canvas bitmap onto standard A4 printable margins [10mm]"]
        PageBreakMode["Enforce pagebreak: ['avoid-all', 'css', 'legacy'] to prevent row slicing"]
    end

    subgraph Step_5 ["5. Browser Direct Download & State Restoration"]
        SavePDF["Invoke browser native blob download (Zero browser print prompt)"]
        RestoreScroll["Restore original scrollLeft position"]
        ClearDownloadState["Set isDownloading = false"]
    end

    UserTrigger --> Step_1
    Step_1 --> Step_2
    Step_2 --> Step_3
    Step_3 --> Step_4
    Step_4 --> Step_5
```

---

## 5. Bidirectional Reactive State Flow: Salary Revision Calculator

When the HR Manager conducts performance appraisals or market corrections, they can enter either the desired percentage increment or the target monetary salary. The two inputs stay perfectly synchronized in real time:

```mermaid
flowchart LR
    subgraph Inputs ["User Input Fields"]
        In_Pct["Increment % Input (+X.XX%)"]
        In_NewSal["New Salary Amount (₹ / $)"]
    end

    subgraph Base_State ["Employee Base CTC"]
        PrevSal["Previous Base Salary (e.g. ₹50,000)"]
    end

    subgraph Reactive_Engines ["Two-Way Reactive Handlers"]
        Calc_From_Pct["handleIncrementPctChange(pct):<br/>newSalary = prevSalary * (1 + pct / 100)"]
        Calc_From_Sal["handleNewSalaryChange(newSal):<br/>pct = ((newSal - prevSalary) / prevSalary) * 100"]
    end

    subgraph Final_State ["Validated Form State"]
        FormState["{ previous_salary, new_salary, increment_percentage, effective_date, revision_type }"]
    end

    In_Pct -- "User Types 10%" --> Calc_From_Pct
    PrevSal --> Calc_From_Pct
    Calc_From_Pct --> In_NewSal
    Calc_From_Pct --> FormState

    In_NewSal -- "User Types ₹60,000" --> Calc_From_Sal
    PrevSal --> Calc_From_Sal
    Calc_From_Sal --> In_Pct
    Calc_From_Sal --> FormState
```

---

## 6. Debounced Search & Query Pipeline (400ms Window)

To protect the backend from being hammered while the HR Manager searches through 10,000 employee records, a debounce pipeline sits between the raw input and the API query:

```mermaid
sequenceDiagram
    autonumber
    actor User as HR Manager
    participant Input as Search Input Field
    participant State as Local State (searchQuery)
    participant Timer as 400ms Debounce Timer
    participant DebouncedState as debouncedSearch
    participant API as Backend REST API

    User->>Input: Types "A" (t=0ms)
    Input->>State: setSearchQuery("A")
    State->>Timer: Start 400ms Timer

    User->>Input: Types "l" (t=120ms)
    Input->>State: setSearchQuery("Al")
    State->>Timer: Clear old timer & restart 400ms

    User->>Input: Types "e" (t=220ms)
    Input->>State: setSearchQuery("Ale")
    State->>Timer: Clear old timer & restart 400ms

    User->>Input: Types "x" (t=310ms)
    Input->>State: setSearchQuery("Alex")
    State->>Timer: Clear old timer & restart 400ms

    Note over Timer: User stops typing. 400ms elapses without input (t=710ms)
    Timer->>DebouncedState: setDebouncedSearch("Alex")
    DebouncedState->>API: GET /api/employees?search=Alex&page=1&limit=10
    API-->>User: Renders matching employee records without UI flicker
```

---

## 7. Modal Scroll Lock & Layout Shift Prevention Mechanism

```mermaid
flowchart TD
    ModalOpen["Modal Opens (isOpen = true)"] --> Measure["Calculate window.innerWidth - document.documentElement.clientWidth"]
    Measure --> ApplyPadding["Set document.body.style.paddingRight = scrollbarWidth + 'px'"]
    ApplyPadding --> LockScroll["Set document.body.style.overflow = 'hidden'"]
    LockScroll --> StableUI["UI Remains Perfectly Centered (CLS = 0)"]

    ModalDismiss["Modal Closes (isOpen = false / Unmount)"] --> RestoreOverflow["document.body.style.overflow = originalOverflow"]
    RestoreOverflow --> RestorePadding["document.body.style.paddingRight = originalPaddingRight"]
    RestorePadding --> NormalUI["Native Window Scroll Restored Cleanly"]
```

---

## 8. Summary of Architectural Decisions

| Aspect | Architectural Choice | Benefit |
| :--- | :--- | :--- |
| **Framework** | React 19 SPA + React Router v7 | Instant client navigation, component composition, zero SSR latency for authenticated internal tools. |
| **Styling** | Tailwind CSS v3 | Highly maintainable utility tokens, zero runtime style injection, micro-bundle size (< 50KB). |
| **PDF Generation** | Direct Client `html2pdf.js` | Zero server CPU load, no Puppeteer dependencies, instant user file downloads. |
| **Data Fetching** | Axios Client with Centralized Error Interceptor | Deterministic 30s timeouts, unified user-friendly network error toasts. |
| **Scale Strategy** | Server-Side Slicing + Aggregates | Seamless UX on 10,000 employees without browser memory exhaustion. |
