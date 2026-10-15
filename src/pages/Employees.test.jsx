import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Employees from './Employees';
import { getEmployees } from '../api/EmployeeApis';
import { getDepartments } from '../api/DepartmentApis';
import { getJobs } from '../api/JobApis';
import { getCountries } from '../api/CountryApis';

jest.mock('../api/EmployeeApis');
jest.mock('../api/DepartmentApis');
jest.mock('../api/JobApis');
jest.mock('../api/CountryApis');

describe('pages/Employees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockEmployees = [
    {
      id: 1,
      full_name: 'John Doe',
      email: 'john@example.com',
      salary: 75000,
      department: { id: 1, department_name: 'Engineering' },
      job: { id: 1, job_title: 'Software Engineer' },
      country: { id: 1, country_name: 'India', currency_code: 'INR' },
      hire_date: '2025-01-10',
    },
  ];

  test('renders employee directory heading and loads employee list', async () => {
    getEmployees.mockResolvedValueOnce({
      data: mockEmployees,
      pagination: { totalRecords: 1, currentPage: 1, limit: 10, totalPages: 1 },
    });
    getDepartments.mockResolvedValueOnce({ data: [{ id: 1, department_name: 'Engineering' }] });
    getJobs.mockResolvedValueOnce({ data: [{ id: 1, job_title: 'Software Engineer' }] });
    getCountries.mockResolvedValueOnce({ data: [{ id: 1, country_name: 'India', currency_code: 'INR' }] });

    render(<Employees />);

    expect(screen.getByRole('heading', { name: /Employees/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  test('opens add employee modal on click', async () => {
    getEmployees.mockResolvedValueOnce({ data: [], pagination: {} });
    getDepartments.mockResolvedValueOnce({ data: [] });
    getJobs.mockResolvedValueOnce({ data: [] });
    getCountries.mockResolvedValueOnce({ data: [] });

    render(<Employees />);

    const addBtn = screen.getByRole('button', { name: /Add Employee/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Add New Employee/i })).toBeInTheDocument();
  });
});
