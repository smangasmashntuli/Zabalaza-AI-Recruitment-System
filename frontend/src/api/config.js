// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_V1 = `${API_BASE_URL}/api/v1`;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_V1}/auth/login`,
    REGISTER: `${API_V1}/auth/register`,
  },
  CANDIDATES: `${API_V1}/candidates`,
  JOBS: `${API_V1}/jobs`,
  MATCHES: `${API_V1}/matches`,
  UPLOADS: `${API_V1}/uploads`,
};

export default API_BASE_URL;

