import apiConfig from "./ApiConfig";

const handleApiError = (error, defaultMessage) => {
    let message = defaultMessage;

    if (error.response) {
        message = error.response.data?.message || error.response.data?.error || `Request failed with status ${error.response.status}`;
    } else if (error.code === "ECONNABORTED") {
        message = "Request timed out. Please try again.";
    } else if (error.code === "ERR_NETWORK" || !error.response) {
        message = "Unable to connect to the server. Please check your connection.";
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

export const getCountries = async ({ page, limit, search = "", country_code = "", all = false } = {}) => {
    try {
        const params = {};

        if (all) {
            params.all = true;
        } else {
            if (page !== undefined) params.page = page;
            if (limit !== undefined) params.limit = limit;
        }

        if (search && search.trim()) {
            params.search = search.trim();
        }

        if (country_code && country_code.trim()) {
            params.country_code = country_code.trim().toUpperCase();
        }

        const response = await apiConfig.get("/country", { params });

        return {
            ...response.data,
            data: response.data?.data || [],
            totalRecords: response.data?.totalRecords || response.data?.pagination?.totalRecords || response.data?.data?.length || 0,
            pagination: response.data?.pagination || {
                totalRecords: response.data?.totalRecords || response.data?.data?.length || 0,
                currentPage: page || 1,
                limit: limit || response.data?.data?.length || 10,
                totalPages: Math.ceil((response.data?.totalRecords || response.data?.data?.length || 0) / (limit || 10)) || 1,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    } catch (error) {
        handleApiError(error, "Failed to fetch countries.");
    }
};

export const getCountryById = async (id) => {
    try {
        if (!id) {
            throw new Error("Country ID is required.");
        }

        const response = await apiConfig.get(`/country/${id}`);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to fetch country.");
    }
};

export const addCountry = async (countryData) => {
    try {
        if (!countryData?.country_code?.trim() || !countryData?.country_name?.trim() || !countryData?.currency_code?.trim()) {
            throw new Error("country_code, country_name, and currency_code are required.");
        }

        const payload = {
            country_code: countryData.country_code.trim().toUpperCase(),
            country_name: countryData.country_name.trim(),
            currency_code: countryData.currency_code.trim().toUpperCase(),
        };

        const response = await apiConfig.post("/country/add", payload);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to add country.");
    }
};

export const updateCountry = async (id, countryData) => {
    try {
        const targetId = id || countryData?.id;
        if (!targetId) {
            throw new Error("Country ID is required.");
        }

        const payload = {
            id: targetId,
            ...(countryData.country_code && { country_code: countryData.country_code.trim().toUpperCase() }),
            ...(countryData.country_name && { country_name: countryData.country_name.trim() }),
            ...(countryData.currency_code && { currency_code: countryData.currency_code.trim().toUpperCase() }),
        };

        const response = await apiConfig.put("/country/update", payload);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to update country.");
    }
};

export const deleteCountry = async (id) => {
    try {
        if (!id) {
            throw new Error("Country ID is required.");
        }

        const response = await apiConfig.delete(`/country/${id}`);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to delete country.");
    }
};
