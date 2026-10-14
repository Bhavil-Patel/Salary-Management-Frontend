import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent-500 ${isActive ? 'bg-accent-50 text-accent-700' : 'text-slate-600 hover:bg-slate-100'
    }`;

export default function Layout() {
    return (
        <div className="min-h-screen">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <span className="text-base font-semibold tracking-tight">Salary Management</span>
                    <nav className="flex flex-wrap gap-1" aria-label="Main">
                        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                        <NavLink to="/employees" className={linkClass}>Employees</NavLink>
                        <NavLink to="/departments" className={linkClass}>Departments</NavLink>
                        <NavLink to="/jobs" className={linkClass}>Jobs</NavLink>
                        <NavLink to="/countries" className={linkClass}>Countries</NavLink>
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
