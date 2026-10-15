import apiConfig from './ApiConfig';
import {
  getSalaryRevisions,
  addSalaryRevision,
  deleteSalaryRevision,
} from './SalaryRevisionApis';

jest.mock('./ApiConfig');

describe('api/SalaryRevisionApis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getSalaryRevisions', () => {
    test('fetches revisions with parameters', async () => {
      const mockData = {
        data: [{ id: 1, employee_id: 2, new_salary: 90000 }],
        pagination: { totalRecords: 1, currentPage: 1, limit: 10, totalPages: 1 },
      };
      apiConfig.get.mockResolvedValueOnce({ data: mockData });

      const result = await getSalaryRevisions({
        page: 1,
        limit: 10,
        employee_id: 2,
        search: 'Annual',
      });

      expect(apiConfig.get).toHaveBeenCalledWith('/salary-revisions', {
        params: {
          page: 1,
          limit: 10,
          employee_id: 2,
          search: 'Annual',
        },
      });
      expect(result.data).toHaveLength(1);
    });

    test('generates fallback pagination if absent from response', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: {
          data: [{ id: 1 }, { id: 2 }],
        },
      });

      const result = await getSalaryRevisions({ page: 1, limit: 5 });
      expect(result.pagination.totalRecords).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    test('handles API error with custom message', async () => {
      apiConfig.get.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Bad query parameters' },
        },
      });

      await expect(getSalaryRevisions()).rejects.toThrow('Bad query parameters');
    });
  });

  describe('addSalaryRevision', () => {
    test('sends payload with converted numbers and default revision_type', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await addSalaryRevision({
        employee_id: '4',
        new_salary: '110000',
        effective_date: '2026-04-01',
      });

      expect(apiConfig.post).toHaveBeenCalledWith('/salary-revisions/add', {
        employee_id: 4,
        new_salary: 110000,
        effective_date: '2026-04-01',
        revision_type: 'Annual Appraisal',
        remarks: '',
      });
      expect(result).toEqual({ success: true });
    });

    test('sends custom revision_type and remarks', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { success: true } });

      await addSalaryRevision({
        employee_id: 1,
        new_salary: 150000,
        effective_date: '2026-05-01',
        revision_type: 'Promotion',
        remarks: 'Promoted to Senior Lead',
      });

      expect(apiConfig.post).toHaveBeenCalledWith('/salary-revisions/add', {
        employee_id: 1,
        new_salary: 150000,
        effective_date: '2026-05-01',
        revision_type: 'Promotion',
        remarks: 'Promoted to Senior Lead',
      });
    });
  });

  describe('deleteSalaryRevision', () => {
    test('throws error if ID is missing', async () => {
      await expect(deleteSalaryRevision()).rejects.toThrow('Revision ID is required.');
      expect(apiConfig.delete).not.toHaveBeenCalled();
    });

    test('deletes salary revision by ID', async () => {
      apiConfig.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteSalaryRevision(9);
      expect(apiConfig.delete).toHaveBeenCalledWith('/salary-revisions/9');
      expect(result).toEqual({ success: true });
    });
  });
});
