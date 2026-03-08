import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Request Interceptor: Har request se pehle yeh chalega
axiosInstance.interceptors.request.use(config => {
    // Har baar localStorage se fresh token lo
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default axiosInstance;