import apiConfig from './ApiConfig';
import {
  getPayrollList,
  getPayrollById,
  generateMonthlyPayroll,
  createPayroll,
  updatePayroll,
  markPayrollPaid,
  bulkMarkPaid,
  deletePayroll,
} from './PayrollApis';

jest.mock('./ApiConfig');

describe('api/PayrollApis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getPayrollList', () => {
    test('calls /payroll with default pagination and formats response', async () => {
      const mockResponse = {
        data: {
          data: [{ id: 1, gross_salary: 50000 }],
          pagination: { totalRecords: 1, currentPage: 1, limit: 10, totalPages: 1 },
          summary: { totalGross: 50000, totalDeductions: 5000, totalNet: 45000 },
        },
      };

      apiConfig.get.mockResolvedValueOnce(mockResponse);

      const result = await getPayrollList();

      expect(apiConfig.get).toHaveBeenCalledWith('/payroll', {
        params: { page: 1, limit: 10 },
      });
      expect(result.data).toHaveLength(1);
      expect(result.summary.totalNet).toBe(45000);
    });

    test('passes filter parameters correctly and omits "ALL" filters', async () => {
      apiConfig.get.mockResolvedValueOnce({ data: {} });

      await getPayrollList({
        page: 2,
        limit: 25,
        month: 10,
        year: 2026,
        status: 'ALL',
        department_id: 'ALL',
        employee_id: 5,
        search: '  John  ',
      });

      expect(apiConfig.get).toHaveBeenCalledWith('/payroll', {
        params: {
          page: 2,
          limit: 25,
          month: 10,
          year: 2026,
          employee_id: 5,
          search: 'John',
        },
      });
    });

    test('falls back to default summary when not returned from server', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      const result = await getPayrollList();
      expect(result.summary).toEqual({
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalCount: 0,
        paidCount: 0,
        processedCount: 0,
      });
    });
  });

  describe('getPayrollById', () => {
    test('throws error if ID is missing', async () => {
      await expect(getPayrollById()).rejects.toThrow('Payroll ID is required.');
    });

    test('fetches payroll record by ID', async () => {
      apiConfig.get.mockResolvedValueOnce({ data: { id: 10, month: 10 } });

      const result = await getPayrollById(10);
      expect(apiConfig.get).toHaveBeenCalledWith('/payroll/10');
      expect(result).toEqual({ id: 10, month: 10 });
    });
  });

  describe('generateMonthlyPayroll', () => {
    test('sends formatted generation request', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { generated: 15 } });

      const result = await generateMonthlyPayroll({
        month: '10',
        year: '2026',
        department_id: 2,
        bonus_percentage: '5',
      });

      expect(apiConfig.post).toHaveBeenCalledWith('/payroll/generate', {
        month: 10,
        year: 2026,
        department_id: 2,
        bonus_percentage: 5,
      });
      expect(result).toEqual({ generated: 15 });
    });

    test('handles department_id="ALL" by sending undefined', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { generated: 50 } });

      await generateMonthlyPayroll({
        month: 10,
        year: 2026,
        department_id: 'ALL',
      });

      expect(apiConfig.post).toHaveBeenCalledWith('/payroll/generate', {
        month: 10,
        year: 2026,
        department_id: undefined,
        bonus_percentage: 0,
      });
    });
  });

  describe('createPayroll', () => {
    test('posts payrollData to /payroll/create', async () => {
      const payload = { employee_id: 1, month: 10, year: 2026, base_salary: 50000 };
      apiConfig.post.mockResolvedValueOnce({ data: { id: 1, ...payload } });

      const result = await createPayroll(payload);
      expect(apiConfig.post).toHaveBeenCalledWith('/payroll/create', payload);
      expect(result.id).toBe(1);
    });
  });

  describe('updatePayroll', () => {
    test('throws error if ID is missing', async () => {
      await expect(updatePayroll(null, {})).rejects.toThrow('Payroll ID is required.');
    });

    test('sends update payload to /payroll/:id', async () => {
      apiConfig.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await updatePayroll(5, { bonus: 2000, remarks: 'Bonus updated' });
      expect(apiConfig.put).toHaveBeenCalledWith('/payroll/5', {
        bonus: 2000,
        remarks: 'Bonus updated',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('markPayrollPaid', () => {
    test('throws error if ID is missing', async () => {
      await expect(markPayrollPaid()).rejects.toThrow('Payroll ID is required.');
    });

    test('marks individual payroll as paid', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { status: 'PAID' } });

      const result = await markPayrollPaid(7, {
        payment_date: '2026-10-31',
        payment_method: 'UPI',
      });

      expect(apiConfig.post).toHaveBeenCalledWith('/payroll/7/pay', {
        payment_date: '2026-10-31',
        payment_method: 'UPI',
      });
      expect(result.status).toBe('PAID');
    });
  });

  describe('bulkMarkPaid', () => {
    test('calls /payroll/bulk-pay with parameters', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { disbursedCount: 20 } });

      const result = await bulkMarkPaid({
        month: '10',
        year: '2026',
        payment_date: '2026-10-31',
        payment_method: 'BANK_TRANSFER',
      });

      expect(apiConfig.post).toHaveBeenCalledWith('/payroll/bulk-pay', {
        month: 10,
        year: 2026,
        payment_date: '2026-10-31',
        payment_method: 'BANK_TRANSFER',
      });
      expect(result.disbursedCount).toBe(20);
    });
  });

  describe('deletePayroll', () => {
    test('throws error if ID is missing', async () => {
      await expect(deletePayroll()).rejects.toThrow('Payroll ID is required.');
    });

    test('calls delete on /payroll/:id', async () => {
      apiConfig.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deletePayroll(12);
      expect(apiConfig.delete).toHaveBeenCalledWith('/payroll/12');
      expect(result.success).toBe(true);
    });
  });
});
