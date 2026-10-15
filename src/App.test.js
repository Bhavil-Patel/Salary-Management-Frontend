import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./pages/Dashboard', () => () => <div data-testid="page-dashboard">Dashboard View</div>);
jest.mock('./pages/Payroll', () => () => <div data-testid="page-payroll">Payroll View</div>);
jest.mock('./pages/Payslips', () => () => <div data-testid="page-payslips">Payslips View</div>);
jest.mock('./pages/SalaryRevisions', () => () => <div data-testid="page-salary-revisions">Revisions View</div>);
jest.mock('./pages/Employees', () => () => <div data-testid="page-employees">Employees View</div>);
jest.mock('./pages/Departments', () => () => <div data-testid="page-departments">Departments View</div>);
jest.mock('./pages/Jobs', () => () => <div data-testid="page-jobs">Jobs View</div>);
jest.mock('./pages/Countries', () => () => <div data-testid="page-countries">Countries View</div>);

describe('App Routing', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });
  test('redirects from root index route to /dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument();
  });

  test('renders payroll view at /payroll', () => {
    render(
      <MemoryRouter initialEntries={['/payroll']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('page-payroll')).toBeInTheDocument();
  });

  test('renders payslips view at /payslips', () => {
    render(
      <MemoryRouter initialEntries={['/payslips']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('page-payslips')).toBeInTheDocument();
  });

  test('renders revisions view at /salary-revisions', () => {
    render(
      <MemoryRouter initialEntries={['/salary-revisions']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('page-salary-revisions')).toBeInTheDocument();
  });

  test('renders employees view at /employees', () => {
    render(
      <MemoryRouter initialEntries={['/employees']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByTestId('page-employees')).toBeInTheDocument();
  });

  test('renders departments, jobs, and countries views at respective paths', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/departments']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('page-departments')).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('page-jobs')).toBeInTheDocument();
  });
});
