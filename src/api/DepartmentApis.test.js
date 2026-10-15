import apiConfig from './ApiConfig';
import {
  getDepartments,
  getDepartmentById,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} from './DepartmentApis';

jest.mock('./ApiConfig');

describe('api/DepartmentApis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getDepartments', () => {
    test('fetches departments with pagination parameters', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: {
          data: [{ id: 1, department_name: 'Engineering' }],
          totalRecords: 1,
        },
      });

      const result = await getDepartments({ page: 1, limit: 10, search: ' Eng ' });

      expect(apiConfig.get).toHaveBeenCalledWith('/department', {
        params: { page: 1, limit: 10, search: 'Eng' },
      });
      expect(result.data).toHaveLength(1);
    });

    test('sets all=true parameter when all flag is passed', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: { data: [{ id: 1 }, { id: 2 }] },
      });

      await getDepartments({ all: true });

      expect(apiConfig.get).toHaveBeenCalledWith('/department', {
        params: { all: true },
      });
    });
  });

  describe('getDepartmentById', () => {
    test('throws error if ID is missing', async () => {
      await expect(getDepartmentById()).rejects.toThrow('Department ID is required.');
    });

    test('fetches department by ID', async () => {
      apiConfig.get.mockResolvedValueOnce({ data: { id: 3, department_name: 'HR' } });

      const result = await getDepartmentById(3);
      expect(apiConfig.get).toHaveBeenCalledWith('/department/3');
      expect(result).toEqual({ id: 3, department_name: 'HR' });
    });
  });

  describe('addDepartment', () => {
    test('throws error if department_name is empty', async () => {
      await expect(addDepartment({ department_name: '   ' })).rejects.toThrow(
        'Department name is required.'
      );
    });

    test('posts trimmed department_name', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { id: 1, department_name: 'Finance' } });

      const result = await addDepartment({ department_name: '  Finance  ' });
      expect(apiConfig.post).toHaveBeenCalledWith('/department/add', {
        department_name: 'Finance',
      });
      expect(result.id).toBe(1);
    });
  });

  describe('updateDepartment', () => {
    test('throws error if ID or department_name is missing', async () => {
      await expect(updateDepartment(null, { department_name: 'Sales' })).rejects.toThrow(
        'Department ID is required.'
      );
      await expect(updateDepartment(1, { department_name: '' })).rejects.toThrow(
        'Department name is required.'
      );
    });

    test('updates department with trimmed name', async () => {
      apiConfig.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await updateDepartment(2, { department_name: '  Marketing  ' });
      expect(apiConfig.put).toHaveBeenCalledWith('/department/update', {
        id: 2,
        department_name: 'Marketing',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteDepartment', () => {
    test('throws error if ID is missing', async () => {
      await expect(deleteDepartment()).rejects.toThrow('Department ID is required.');
    });

    test('deletes department by ID', async () => {
      apiConfig.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteDepartment(5);
      expect(apiConfig.delete).toHaveBeenCalledWith('/department/5');
      expect(result.success).toBe(true);
    });
  });
});
