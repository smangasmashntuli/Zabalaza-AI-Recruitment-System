import { get, post } from './client';
import { API_ENDPOINTS } from './config';

/**
 * Get all jobs
 */
export const getJobs = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams ? `${API_ENDPOINTS.JOBS}?${queryParams}` : API_ENDPOINTS.JOBS;
  return get(url);
};

/**
 * Get unified jobs (internal + external) from hybrid endpoint.
 */
export const getHybridJobs = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const url = queryParams
    ? `${API_ENDPOINTS.JOBS}/search/hybrid?${queryParams}`
    : `${API_ENDPOINTS.JOBS}/search/hybrid`;
  const result = await get(url);
  return result?.items || [];
};

/**
 * Get a specific job by ID
 */
export const getJob = async (jobId) => {
  return get(`${API_ENDPOINTS.JOBS}/${jobId}`);
};

/**
 * Create a new job (Recruiter/Admin only)
 */
export const createJob = async (jobData) => {
  return post(API_ENDPOINTS.JOBS, jobData);
};

/**
 * Get job matches for current candidate
 */
export const getJobMatches = async (topK = 10) => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/matches?top_k=${topK}`);
};

/**
 * Search jobs with filters
 */
export const searchJobs = async (searchParams) => {
  const params = new URLSearchParams();

  if (searchParams.query) params.append('search', searchParams.query);
  if (searchParams.location) params.append('location', searchParams.location);
  if (searchParams.jobType) params.append('job_type', searchParams.jobType);
  if (searchParams.status) params.append('status', searchParams.status);
  if (searchParams.skip) params.append('skip', searchParams.skip);
  if (searchParams.limit) params.append('limit', searchParams.limit);

  return get(`${API_ENDPOINTS.JOBS}?${params.toString()}`);
};

/**
 * Search unified jobs (internal + external) from hybrid endpoint.
 */
export const searchHybridJobs = async (searchParams = {}) => {
  const params = new URLSearchParams();

  if (searchParams.query) params.append('query', searchParams.query);
  if (searchParams.location) params.append('location', searchParams.location);
  if (searchParams.jobType) params.append('job_type', searchParams.jobType);
  if (searchParams.experienceLevel) params.append('experience_level', searchParams.experienceLevel);
  if (searchParams.remoteOnly) params.append('remote_only', 'true');
  if (searchParams.salaryMin) params.append('salary_min', String(searchParams.salaryMin));
  if (searchParams.salaryMax) params.append('salary_max', String(searchParams.salaryMax));
  if (searchParams.page) params.append('page', String(searchParams.page));
  if (searchParams.limit) params.append('limit', String(searchParams.limit));
  params.append('include_external', 'true');

  const result = await get(`${API_ENDPOINTS.JOBS}/search/hybrid?${params.toString()}`);
  return result?.items || [];
};

