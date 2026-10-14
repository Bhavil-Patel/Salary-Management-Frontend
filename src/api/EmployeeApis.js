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

export const getEmployees = async ({ page = 1, limit = 10, name = "", job = "", department = "", } = {}) => {
    try {
        const params = { page, limit };

        if (name.trim()) {
            params.name = name.trim();
        }

        if (job.trim() && job !== "ALL") {
            params.job = job.trim();
        }

        if (department.trim() && department !== "ALL") {
            params.department = department.trim();
        }

        const response = await apiConfig.get("/employees", { params });

        return {
            ...response.data,
            data: response.data?.data || [],
            pagination: response.data?.pagination || {
                totalRecords: response.data?.data?.length || 0,
                currentPage: page,
                limit,
                totalPages: Math.ceil((response.data?.data?.length || 0) / limit),
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    } catch (error) {
        handleApiError(error, "Failed to fetch employees.");
    }
};

export const getEmployeeById = async (id) => {
    try {
        if (!id) {
            throw new Error("Employee ID is required.");
        }

        const response = await apiConfig.get(`/employees/${id}`);

        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }

        handleApiError(error, "Failed to fetch employee.");
    }
};

export const addEmployee = async (employeeData) => {
    try {
        if (!employeeData) {
            throw new Error("Employee data is required.");
        }

        const payload = {
            data: {
                full_name: employeeData.full_name,
                email: employeeData.email,
                job_title: employeeData.job_title,
                department: employeeData.department,
                country_id: Number(employeeData.country_id),
                salary: Number(employeeData.salary),
                hire_date: employeeData.hire_date,
            },
        };

        const response = await apiConfig.post("/employees/add", payload);

        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }

        handleApiError(error, "Failed to add employee.");
    }
};

export const updateEmployee = async (id, employeeData) => {
    try {
        if (!id) {
            throw new Error("Employee ID is required.");
        }

        if (!employeeData) {
            throw new Error("Employee data is required.");
        }

        const payload = {
            employee_id: id,
            data: {
                full_name: employeeData.full_name,
                email: employeeData.email,
                job_title: employeeData.job_title,
                department: employeeData.department,
                country_id: Number(employeeData.country_id),
                salary: Number(employeeData.salary),
                hire_date: employeeData.hire_date,
            },
        };

        const response = await apiConfig.post("/employees/update", payload);

        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }

        handleApiError(error, "Failed to update employee.");
    }
};

export const deleteEmployee = async (id) => {
    try {
        if (!id) {
            throw new Error("Employee ID is required.");
        }

        const response = await apiConfig.delete(`/employees/${id}`);

        return response.data;
    } catch (error) {
        if (!error.response && !error.code) {
            throw error;
        }

        handleApiError(error, "Failed to delete employee.");
    }
};