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

export const getSalaryRevisions = async ({
  page = 1,
  limit = 10,
  employee_id = '',
  search = '',
} = {}) => {
  try {
    const params = { page, limit };
    if (employee_id) params.employee_id = employee_id;
    if (search && search.trim()) params.search = search.trim();

    const response = await apiConfig.get('/salary-revisions', { params });

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
    };
  } catch (error) {
    handleApiError(error, 'Failed to fetch salary revisions.');
  }
};

export const addSalaryRevision = async ({
  employee_id,
  new_salary,
  effective_date,
  revision_type = 'Annual Appraisal',
  remarks = '',
}) => {
  try {
    const response = await apiConfig.post('/salary-revisions/add', {
      employee_id: Number(employee_id),
      new_salary: Number(new_salary),
      effective_date,
      revision_type,
      remarks,
    });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to add salary revision.');
  }
};

export const deleteSalaryRevision = async (id) => {
  try {
    if (!id) throw new Error('Revision ID is required.');
    const response = await apiConfig.delete(`/salary-revisions/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Failed to delete salary revision.');
  }
};
