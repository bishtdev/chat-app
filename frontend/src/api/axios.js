// import axios from "axios";

// const instance = axios.create({
//   baseURL: "http://localhost:3000/api",
//   withCredentials: true,
// });

// export default instance;

// import axios from "axios";

// const instance = axios.create({
//   baseURL: "http://localhost:3000/api",
// });

// instance.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default instance;

import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    'Content-Type': 'application/json'
  }
});

// ✅ Add the interceptor HERE directly
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[Axios Interceptor] token:", token, "for URL:", config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
