import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SalaryRevisions from './SalaryRevisions';
import { getSalaryRevisions } from '../api/SalaryRevisionApis';
import { getEmployees } from '../api/EmployeeApis';

jest.mock('../api/SalaryRevisionApis');
jest.mock('../api/EmployeeApis');

describe('pages/SalaryRevisions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockRevisions = [
    {
      id: 1,
      effective_date: '2026-04-01',
      old_salary: 80000,
      new_salary: 92000,
      revision_type: 'Annual Appraisal',
      remarks: 'Excellent performance review',
      employee: {
        id: 1,
        full_name: 'Natasha Romanoff',
      },
    },
  ];

  test('renders salary revisions audit table and loads revisions', async () => {
    getSalaryRevisions.mockResolvedValueOnce({
      success: true,
      data: mockRevisions,
      pagination: { totalRecords: 1, currentPage: 1, limit: 10, totalPages: 1 },
    });
    getEmployees.mockResolvedValueOnce({ data: [] });

    render(<SalaryRevisions />);

    expect(screen.getByRole('heading', { name: /Salary Revisions & Appraisals/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Natasha Romanoff')).toBeInTheDocument();
      expect(screen.getByText('Annual Appraisal')).toBeInTheDocument();
    });
  });

  test('opens record salary revision modal when button is clicked', async () => {
    getSalaryRevisions.mockResolvedValueOnce({
      success: true,
      data: [],
      pagination: { totalRecords: 0, currentPage: 1, limit: 10, totalPages: 1 },
    });
    getEmployees.mockResolvedValueOnce({ data: [] });

    render(<SalaryRevisions />);

    const addBtn = screen.getByRole('button', { name: /Record Salary Revision/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(screen.getByText(/Record Salary Revision/i)).toBeInTheDocument();
  });
});
