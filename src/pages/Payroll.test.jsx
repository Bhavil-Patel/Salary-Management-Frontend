import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Payroll from './Payroll';
import { getPayrollList } from '../api/PayrollApis';
import { getDepartments } from '../api/DepartmentApis';

jest.mock('../api/PayrollApis');
jest.mock('../api/DepartmentApis');

describe('pages/Payroll', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockPayrolls = [
    {
      id: 1,
      month: 10,
      year: 2026,
      gross_salary: 100000,
      total_deductions: 15000,
      net_salary: 85000,
      status: 'PAID',
      employee: {
        id: 1,
        full_name: 'Diana Prince',
        department: { department_name: 'Security' },
      },
    },
  ];

  test('renders payroll processing dashboard and displays entries', async () => {
    getPayrollList.mockResolvedValueOnce({
      success: true,
      data: mockPayrolls,
      pagination: { totalRecords: 1, currentPage: 1, limit: 10, totalPages: 1 },
      summary: {
        totalGross: 100000,
        totalDeductions: 15000,
        totalNet: 85000,
        totalCount: 1,
        paidCount: 1,
        processedCount: 0,
      },
    });
    getDepartments.mockResolvedValueOnce({ data: [{ id: 1, department_name: 'Security' }] });

    render(<Payroll />);

    expect(screen.getByRole('heading', { name: /Payroll Management/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    });
  });

  test('renders action buttons and filter bar', async () => {
    getPayrollList.mockResolvedValueOnce({
      data: [],
      pagination: {},
      summary: {},
    });
    getDepartments.mockResolvedValueOnce({ data: [] });

    render(<Payroll />);

    expect(screen.getByRole('button', { name: /Generate Monthly Payroll/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
  });

  test('updates page limit and fetches data with selected limit', async () => {
    getPayrollList.mockResolvedValueOnce({
      success: true,
      data: mockPayrolls,
      pagination: { totalRecords: 30, currentPage: 1, limit: 10, totalPages: 3 },
      summary: {},
    });
    getPayrollList.mockResolvedValueOnce({
      success: true,
      data: mockPayrolls,
      pagination: { totalRecords: 30, currentPage: 1, limit: 25, totalPages: 2 },
      summary: {},
    });
    getDepartments.mockResolvedValue({ data: [] });

    render(<Payroll />);

    await waitFor(() => {
      expect(getPayrollList).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, page: 1 })
      );
    });

    const limitSelect = screen.getByTestId('payroll-page-limit-filter');
    expect(limitSelect).toBeInTheDocument();
    expect(limitSelect.value).toBe('10');

    fireEvent.change(limitSelect, { target: { value: '25' } });

    await waitFor(() => {
      expect(getPayrollList).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25, page: 1 })
      );
    });
  });

  test('updates page limit from bottom table footer dropdown', async () => {
    getPayrollList.mockResolvedValueOnce({
      success: true,
      data: mockPayrolls,
      pagination: { totalRecords: 50, currentPage: 1, limit: 10, totalPages: 5 },
      summary: {},
    });
    getPayrollList.mockResolvedValueOnce({
      success: true,
      data: mockPayrolls,
      pagination: { totalRecords: 50, currentPage: 1, limit: 50, totalPages: 1 },
      summary: {},
    });
    getDepartments.mockResolvedValue({ data: [] });

    render(<Payroll />);

    await waitFor(() => {
      expect(screen.getByText('Diana Prince')).toBeInTheDocument();
    });

    const bottomLimitSelect = screen.getByTestId('payroll-page-limit-bottom');
    expect(bottomLimitSelect).toBeInTheDocument();
    expect(bottomLimitSelect.value).toBe('10');

    fireEvent.change(bottomLimitSelect, { target: { value: '50' } });

    await waitFor(() => {
      expect(getPayrollList).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, page: 1 })
      );
    });
  });
});


