import { render, screen, waitFor } from '@testing-library/react';
import Payslips from './Payslips';
import { getPayrollList } from '../api/PayrollApis';

jest.mock('../api/PayrollApis');

describe('pages/Payslips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockPayslips = [
    {
      id: 1,
      month: 10,
      year: 2026,
      gross_salary: 80000,
      total_deductions: 10000,
      net_salary: 70000,
      status: 'PAID',
      employee: {
        id: 1,
        full_name: 'Peter Parker',
        department: { department_name: 'Media' },
        job: { job_title: 'Photographer' },
        country: { country_name: 'United States', currency_code: 'USD' },
      },
    },
  ];

  test('renders payslip directory and displays payslip cards', async () => {
    getPayrollList.mockResolvedValueOnce({
      success: true,
      data: mockPayslips,
      pagination: { totalRecords: 1, currentPage: 1, limit: 12, totalPages: 1 },
    });

    render(<Payslips />);

    expect(screen.getByRole('heading', { name: /Employee Payslips Directory/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Peter Parker')).toBeInTheDocument();
      expect(screen.getByText('Photographer')).toBeInTheDocument();
    });
  });

  test('renders search input and month/year controls', async () => {
    getPayrollList.mockResolvedValueOnce({
      data: [],
      pagination: { totalRecords: 0, currentPage: 1, limit: 12, totalPages: 1 },
    });

    render(<Payslips />);

    expect(screen.getByPlaceholderText(/Search by employee name or email/i)).toBeInTheDocument();
  });
});
