import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Jobs from './Jobs';
import { getJobs } from '../api/JobApis';

jest.mock('../api/JobApis');

describe('pages/Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockJobs = [
    { id: 1, job_title: 'Full Stack Engineer', employee_count: 8 },
    { id: 2, job_title: 'Product Designer', employee_count: 3 },
  ];

  test('renders job directory heading and loads jobs list', async () => {
    getJobs.mockResolvedValueOnce({ data: mockJobs });

    render(<Jobs />);

    expect(screen.getByRole('heading', { name: /Job Titles/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument();
      expect(screen.getByText('Product Designer')).toBeInTheDocument();
    });
  });

  test('opens add job modal on click', async () => {
    getJobs.mockResolvedValueOnce({ data: [] });

    render(<Jobs />);

    const addBtn = screen.getByRole('button', { name: /Add Job Title/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Add Job Title/i })).toBeInTheDocument();
  });
});
