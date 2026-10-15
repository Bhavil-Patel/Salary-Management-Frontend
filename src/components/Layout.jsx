import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../Assets/icons';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-accent-500 ${isActive
    ? 'bg-accent-50 text-accent-700 shadow-sm ring-1 ring-accent-200/60'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8" />
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900">Salary Management</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1" aria-label="Main Navigation">
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            <NavLink to="/payroll" className={linkClass}>Payroll</NavLink>
            <NavLink to="/payslips" className={linkClass}>Payslips</NavLink>
            <NavLink to="/salary-revisions" className={linkClass}>Revisions</NavLink>
            <NavLink to="/employees" className={linkClass}>Employees</NavLink>
            <NavLink to="/departments" className={linkClass}>Departments</NavLink>
            <NavLink to="/jobs" className={linkClass}>Jobs</NavLink>
            <NavLink to="/countries" className={linkClass}>Countries</NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
