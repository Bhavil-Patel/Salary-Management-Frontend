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


export const getDashboardInsights = async () => {
  try {
    const response = await apiConfig.get('/dashboard');
    return response.data;
  } catch (error) {
    try {
      const fallbackResponse = await apiConfig.get('/employees/insights');
      return fallbackResponse.data;
    } catch {
      handleApiError(error, 'Failed to fetch dashboard insights.');
    }
  }
};

export default {
  getDashboardInsights,
};
