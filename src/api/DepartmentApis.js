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

export const getDepartments = async ({ page, limit, search = "", all = false } = {}) => {
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

        const response = await apiConfig.get("/department", { params });

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
        handleApiError(error, "Failed to fetch departments.");
    }
};

export const getDepartmentById = async (id) => {
    try {
        if (!id) {
            throw new Error("Department ID is required.");
        }

        const response = await apiConfig.get(`/department/${id}`);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to fetch department.");
    }
};

export const addDepartment = async (departmentData) => {
    try {
        if (!departmentData?.department_name?.trim()) {
            throw new Error("Department name is required.");
        }

        const payload = {
            department_name: departmentData.department_name.trim(),
        };

        const response = await apiConfig.post("/department/add", payload);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to add department.");
    }
};

export const updateDepartment = async (id, departmentData) => {
    try {
        const targetId = id || departmentData?.id;
        if (!targetId) {
            throw new Error("Department ID is required.");
        }

        if (!departmentData?.department_name?.trim()) {
            throw new Error("Department name is required.");
        }

        const payload = {
            id: targetId,
            department_name: departmentData.department_name.trim(),
        };

        const response = await apiConfig.put("/department/update", payload);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to update department.");
    }
};

export const deleteDepartment = async (id) => {
    try {
        if (!id) {
            throw new Error("Department ID is required.");
        }

        const response = await apiConfig.delete(`/department/${id}`);
        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }
        handleApiError(error, "Failed to delete department.");
    }
};
