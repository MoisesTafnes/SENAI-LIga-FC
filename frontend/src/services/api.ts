import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      'Ocorreu um erro inesperado ao se comunicar com o servidor.';

    const formattedMessage = Array.isArray(message) ? message.join(' | ') : message;

    return Promise.reject(new Error(formattedMessage));
  }
);
