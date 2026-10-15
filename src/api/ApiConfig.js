import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://salary-management-backend-vcnr.onrender.com/api";

const apiConfig = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export default apiConfig;