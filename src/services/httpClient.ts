import axios, { AxiosError, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://devops-backend-6c9x.onrender.com/api';

export const httpClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let sessionExpired = false;

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login' &&
      !sessionExpired
    ) {
      sessionExpired = true;
      sessionStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
