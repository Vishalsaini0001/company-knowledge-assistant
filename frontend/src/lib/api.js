import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 30000 });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const msg =
      err.response?.data?.detail ||
      err.message ||
      "Something went wrong";
    return Promise.reject(new Error(msg));
  }
);

export default api;
