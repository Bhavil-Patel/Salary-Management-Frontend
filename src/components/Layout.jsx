import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Logo, CloseIcon } from '../Assets/icons';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-accent-500 ${isActive
    ? 'bg-accent-50 text-accent-700 shadow-sm ring-1 ring-accent-200/60'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const mobileLinkClass = ({ isActive }) =>
  `flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive
    ? 'bg-accent-50 text-accent-700 ring-1 ring-accent-200/60'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/payroll', label: 'Payroll' },
    { to: '/payslips', label: 'Payslips' },
    { to: '/salary-revisions', label: 'Revisions' },
    { to: '/employees', label: 'Employees' },
    { to: '/departments', label: 'Departments' },
    { to: '/jobs', label: 'Jobs' },
    { to: '/countries', label: 'Countries' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <NavLink to="/dashboard" className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Logo className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
              <span className="min-w-0 truncate font-bold tracking-tight text-slate-700 text-base sm:text-lg md:text-xl">Salary Management</span>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent-500"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            className="md:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg"
            aria-label="Mobile Navigation"
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileLinkClass}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
