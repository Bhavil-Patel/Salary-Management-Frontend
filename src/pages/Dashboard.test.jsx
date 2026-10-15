import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { getDashboardInsights } from '../api/DashboardApis';

jest.mock('../api/DashboardApis');

describe('pages/Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockDashboardData = {
    totalHeadcount: 45,
    avgSalary: 60000,
    medianSalary: 55000,
    minSalary: 30000,
    maxSalary: 120000,
    byCountry: [
      { label: 'India', headcount: 30, avg: 60000, totalPayroll: 1800000 },
      { label: 'United States', headcount: 15, avg: 70000, totalPayroll: 1050000 },
    ],
    byDepartment: [
      { label: 'Engineering', headcount: 25, avg: 64000, totalPayroll: 1600000 },
    ],
    byJobTitle: [
      { label: 'Software Engineer', headcount: 15, avg: 60000, totalPayroll: 900000 },
    ],
  };

  test('renders loading skeleton initially', () => {
    getDashboardInsights.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<Dashboard />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('renders dashboard metrics after successful data fetch', async () => {
    getDashboardInsights.mockResolvedValueOnce({
      success: true,
      data: mockDashboardData,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Salary Insights & Analytics/i })).toBeInTheDocument();
      expect(screen.getAllByText('India').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('United States')).toBeInTheDocument();
    });
  });

  test('renders error state on API failure', async () => {
    getDashboardInsights.mockRejectedValueOnce(new Error('Network error loading insights'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Network error loading insights|Unable to load dashboard insights/i)
      ).toBeInTheDocument();
    });
  });
});
