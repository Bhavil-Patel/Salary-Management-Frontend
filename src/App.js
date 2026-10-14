import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Payroll from './pages/Payroll.jsx';
import Payslips from './pages/Payslips.jsx';
import SalaryRevisions from './pages/SalaryRevisions.jsx';
import Departments from './pages/Departments.jsx';
import Jobs from './pages/Jobs.jsx';
import Countries from './pages/Countries.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/payslips" element={<Payslips />} />
        <Route path="/salary-revisions" element={<SalaryRevisions />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/countries" element={<Countries />} />
      </Route>
    </Routes>
  );
}
