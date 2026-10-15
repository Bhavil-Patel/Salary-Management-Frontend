import apiConfig from './ApiConfig';
import {
  getEmployees,
  getEmployeeById,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from './EmployeeApis';

jest.mock('./ApiConfig');

describe('api/EmployeeApis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getEmployees', () => {
    test('fetches employees with default pagination and formats response', async () => {
      const mockResponse = {
        data: {
          data: [{ id: 1, full_name: 'John Doe' }],
          pagination: {
            totalRecords: 1,
            currentPage: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      };

      apiConfig.get.mockResolvedValueOnce(mockResponse);

      const result = await getEmployees();

      expect(apiConfig.get).toHaveBeenCalledWith('/employees', {
        params: { page: 1, limit: 10 },
      });
      expect(result.data).toHaveLength(1);
      expect(result.pagination.totalRecords).toBe(1);
    });

    test('includes trimmed filter parameters and ignores "ALL"', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      await getEmployees({
        page: 2,
        limit: 20,
        name: ' Alice ',
        job: 'ALL',
        department: ' Engineering ',
      });

      expect(apiConfig.get).toHaveBeenCalledWith('/employees', {
        params: {
          page: 2,
          limit: 20,
          name: 'Alice',
          department: 'Engineering',
        },
      });
    });

    test('creates fallback pagination when backend does not provide one', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: {
          data: [{ id: 1 }, { id: 2 }],
        },
      });

      const result = await getEmployees({ page: 1, limit: 10 });
      expect(result.pagination.totalRecords).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    test('handles API errors properly', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };
      apiConfig.get.mockRejectedValueOnce(error);

      await expect(getEmployees()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('getEmployeeById', () => {
    test('throws error if employee ID is missing', async () => {
      await expect(getEmployeeById()).rejects.toThrow('Employee ID is required.');
      expect(apiConfig.get).not.toHaveBeenCalled();
    });

    test('fetches employee details by ID', async () => {
      const employee = { id: 5, full_name: 'Sarah Connor' };
      apiConfig.get.mockResolvedValueOnce({ data: { data: employee } });

      const result = await getEmployeeById(5);
      expect(apiConfig.get).toHaveBeenCalledWith('/employees/5');
      expect(result.data).toEqual(employee);
    });

    test('handles ECONNABORTED timeout error', async () => {
      const error = { code: 'ECONNABORTED' };
      apiConfig.get.mockRejectedValueOnce(error);

      await expect(getEmployeeById(1)).rejects.toThrow('Request timed out. Please try again.');
    });

    test('handles network failure error', async () => {
      const error = { code: 'ERR_NETWORK' };
      apiConfig.get.mockRejectedValueOnce(error);

      await expect(getEmployeeById(1)).rejects.toThrow('Unable to connect to the server.');
    });
  });

  describe('addEmployee', () => {
    test('throws error if employeeData is missing', async () => {
      await expect(addEmployee()).rejects.toThrow('Employee data is required.');
      expect(apiConfig.post).not.toHaveBeenCalled();
    });

    test('converts numeric fields and posts payload', async () => {
      const input = {
        full_name: 'Bruce Wayne',
        email: 'bruce@wayne.com',
        job_id: '3',
        department_id: '4',
        country_id: '1',
        salary: '120000',
        hire_date: '2025-01-01',
      };

      apiConfig.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await addEmployee(input);

      expect(apiConfig.post).toHaveBeenCalledWith('/employees/add', {
        data: {
          full_name: 'Bruce Wayne',
          email: 'bruce@wayne.com',
          job_id: 3,
          department_id: 4,
          country_id: 1,
          salary: 120000,
          hire_date: '2025-01-01',
        },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateEmployee', () => {
    test('throws error if ID or employeeData is missing', async () => {
      await expect(updateEmployee(null, {})).rejects.toThrow('Employee ID is required.');
      await expect(updateEmployee(1, null)).rejects.toThrow('Employee data is required.');
      expect(apiConfig.put).not.toHaveBeenCalled();
    });

    test('formats payload with employee_id and updates employee', async () => {
      const input = {
        full_name: 'Clark Kent',
        email: 'clark@dailyplanet.com',
        job_id: '2',
        department_id: '1',
        country_id: '1',
        salary: '85000',
        hire_date: '2024-05-15',
      };

      apiConfig.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await updateEmployee(10, input);

      expect(apiConfig.put).toHaveBeenCalledWith('/employees/update', {
        employee_id: 10,
        data: {
          full_name: 'Clark Kent',
          email: 'clark@dailyplanet.com',
          job_id: 2,
          department_id: 1,
          country_id: 1,
          salary: 85000,
          hire_date: '2024-05-15',
        },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteEmployee', () => {
    test('throws error if ID is missing', async () => {
      await expect(deleteEmployee()).rejects.toThrow('Employee ID is required.');
      expect(apiConfig.delete).not.toHaveBeenCalled();
    });

    test('calls delete endpoint with ID', async () => {
      apiConfig.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteEmployee(15);
      expect(apiConfig.delete).toHaveBeenCalledWith('/employees/15');
      expect(result).toEqual({ success: true });
    });
  });
});
