import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Departments from './Departments';
import { getDepartments, addDepartment } from '../api/DepartmentApis';

jest.mock('../api/DepartmentApis');

describe('pages/Departments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockDepts = [
    { id: 1, department_name: 'Engineering', employee_count: 15 },
    { id: 2, department_name: 'Human Resources', employee_count: 4 },
  ];

  test('renders department directory heading and loads departments', async () => {
    getDepartments.mockResolvedValueOnce({ data: mockDepts });

    render(<Departments />);

    expect(screen.getByRole('heading', { name: /Departments/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Human Resources')).toBeInTheDocument();
    });
  });

  test('opens add department modal when Add Department button is clicked', async () => {
    getDepartments.mockResolvedValueOnce({ data: [] });

    render(<Departments />);

    const addBtn = screen.getByRole('button', { name: /Add Department/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Add Department/i })).toBeInTheDocument();
  });
});
