import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

const apiConfig = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export default apiConfig;