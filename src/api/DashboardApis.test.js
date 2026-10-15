import apiConfig from './ApiConfig';
import { getDashboardInsights } from './DashboardApis';

jest.mock('./ApiConfig');

describe('api/DashboardApis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('returns data directly from /dashboard endpoint on success', async () => {
    const dashboardData = {
      totalEmployees: 42,
      totalPayroll: 2500000,
      departmentCount: 6,
    };
    apiConfig.get.mockResolvedValueOnce({ data: dashboardData });

    const result = await getDashboardInsights();
    expect(apiConfig.get).toHaveBeenCalledWith('/dashboard');
    expect(result).toEqual(dashboardData);
  });

  test('falls back to /employees/insights if /dashboard endpoint fails', async () => {
    const fallbackData = {
      totalEmployees: 42,
      insights: 'fallback',
    };
    apiConfig.get
      .mockRejectedValueOnce(new Error('Dashboard endpoint not found'))
      .mockResolvedValueOnce({ data: fallbackData });

    const result = await getDashboardInsights();
    expect(apiConfig.get).toHaveBeenNthCalledWith(1, '/dashboard');
    expect(apiConfig.get).toHaveBeenNthCalledWith(2, '/employees/insights');
    expect(result).toEqual(fallbackData);
  });

  test('throws error if both primary and fallback endpoints fail', async () => {
    const primaryError = {
      response: {
        status: 500,
        data: { message: 'Database connection error' },
      },
    };
    apiConfig.get
      .mockRejectedValueOnce(primaryError)
      .mockRejectedValueOnce(new Error('Fallback also failed'));

    await expect(getDashboardInsights()).rejects.toThrow('Database connection error');
  });
});
