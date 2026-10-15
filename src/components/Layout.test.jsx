import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';

describe('components/Layout', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });
  test('renders header branding and all navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Salary Management')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();

    const expectedLinks = [
      'Dashboard',
      'Payroll',
      'Payslips',
      'Revisions',
      'Employees',
      'Departments',
      'Jobs',
      'Countries',
    ];

    expectedLinks.forEach((name) => {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    });
  });

  test('renders nested child route content inside main outlet', () => {
    render(
      <MemoryRouter initialEntries={['/test-nested']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/test-nested" element={<div data-testid="nested">Nested Child Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('nested')).toBeInTheDocument();
    expect(screen.getByText('Nested Child Page')).toBeInTheDocument();
  });

  test('highlights active link based on current route', () => {
    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/payroll" element={<div>Payroll Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const activeLink = screen.getByRole('link', { name: 'Payroll' });
    expect(activeLink).toHaveClass('bg-accent-50');

    const inactiveLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(inactiveLink).toHaveClass('text-slate-600');
  });
});
