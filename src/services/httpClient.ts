import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://devops-backend-6c9x.onrender.com/api';

export const httpClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});


