import apiConfig from './ApiConfig';

const handleApiError = (error, defaultMessage) => {
  let message = defaultMessage;

  if (error.response) {
    message =
      error.response.data?.message ||
      error.response.data?.error ||
      `Request failed with status ${error.response.status}`;
  } else if (error.code === 'ECONNABORTED') {
    message = 'Request timed out. Please try again.';
  } else if (error.code === 'ERR_NETWORK' || !error.response) {
    message = 'Unable to connect to the server. Please check your connection.';
  } else if (error.message) {
    message = error.message;
  }

  console.error(defaultMessage, error);

  const apiError = new Error(message);
  apiError.status = error.response?.status || null;
  apiError.code = error.code || null;
  apiError.response = error.response?.data || null;

  throw apiError;
};

export const getPayrollList = async ({
  page = 1,
  limit = 10,
  month = '',
  year = '',
  status = '',
  department_id = '',
  employee_id = '',
  search = '',
} = {}) => {
  try {
    const params = { page, limit };

    if (month) params.month = month;
    if (year) params.year = year;
    if (status && status !== 'ALL') params.status = status;
    if (department_id && department_id !== 'ALL') params.department_id = department_id;
    if (employee_id) params.employee_id = employee_id;
    if (search && search.trim()) params.search = search.trim();

    const response = await apiConfig.get('/payroll', { params });

    return {
      ...response.data,
      data: response.data?.data || [],
      pagination: response.data?.pagination || {
        totalRecords: response.data?.data?.length || 0,
        currentPage: page,
        limit,
        totalPages: Math.ceil((response.data?.data?.length || 0) / limit) || 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      summary: response.data?.summary || {
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalCount: 0,
        paidCount: 0,
        processedCount: 0,
      },
    };
  } catch (error) {
    handleApiError(error, 'Failed to fetch payroll list.');
  }
};

export const getPayrollById = async (id) => {
  try {
    if (!id) throw new Error('Payroll ID is required.');
    const response = await apiConfig.get(`/payroll/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to fetch payroll record.');
  }
};

export const generateMonthlyPayroll = async ({ month, year, department_id, bonus_percentage = 0 }) => {
  try {
    const response = await apiConfig.post('/payroll/generate', {
      month: Number(month),
      year: Number(year),
      department_id: department_id === 'ALL' ? undefined : department_id,
      bonus_percentage: Number(bonus_percentage) || 0,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to generate monthly payroll.');
  }
};

export const createPayroll = async (payrollData) => {
  try {
    const response = await apiConfig.post('/payroll/create', payrollData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to create payroll entry.');
  }
};

export const updatePayroll = async (id, payrollData) => {
  try {
    if (!id) throw new Error('Payroll ID is required.');
    const response = await apiConfig.put(`/payroll/${id}`, payrollData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to update payroll.');
  }
};

export const markPayrollPaid = async (id, paymentData = {}) => {
  try {
    if (!id) throw new Error('Payroll ID is required.');
    const response = await apiConfig.post(`/payroll/${id}/pay`, paymentData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to mark payroll as paid.');
  }
};

export const bulkMarkPaid = async ({ month, year, payment_date, payment_method = 'BANK_TRANSFER' }) => {
  try {
    const response = await apiConfig.post('/payroll/bulk-pay', {
      month: Number(month),
      year: Number(year),
      payment_date,
      payment_method,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to disburse payroll in bulk.');
  }
};

export const deletePayroll = async (id) => {
  try {
    if (!id) throw new Error('Payroll ID is required.');
    const response = await apiConfig.delete(`/payroll/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to delete payroll record.');
  }
};

export default {
  getPayrollList,
  getPayrollById,
  generateMonthlyPayroll,
  createPayroll,
  updatePayroll,
  markPayrollPaid,
  bulkMarkPaid,
  deletePayroll,
};
