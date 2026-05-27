import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';

/**
 * Get current candidate profile
 */
export const getCandidateProfile = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me`);
};

/**
 * Update current candidate profile
 * @param {Object} profileData - Profile data including skills, experience, education, etc.
 */
export const updateCandidateProfile = async (profileData) => {
  return put(`${API_ENDPOINTS.CANDIDATES}/me`, profileData);
};

/**
 * Get job matches and conversational insights (newer API wrapper)
 */
export const getJobMatchesWithInsights = async (topK = 10) => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/matches?top_k=${topK}`);
};

/**
 * Get AI-powered career path recommendations
 */
export const getCareerPath = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/career-path`);
};

/**
 * Get interview tips for a specific job
 */
export const getInterviewTips = async (jobId) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/interview-tips?job_id=${encodeURIComponent(jobId)}`, {});
};

/**
 * Optimize a CV section using Gemini
 */
export const optimizeCvSection = async (section) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/cv-optimization?section=${encodeURIComponent(section)}`, {});
};

/**
 * Get detailed match analysis for a job
 */
export const getMatchAnalysis = async (jobId) => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/match-analysis?job_id=${jobId}`);
};

/**
 * Get resume tailoring suggestions for a job
 */
export const getResumeTailoringTips = async (jobId) => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/resume-tailoring?job_id=${jobId}`);
};

/**
 * Get profile improvement tips
 */
export const getProfileImprovementTips = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/profile-improvement`);
};

/**
 * Get orchestrated context for a job action button
 */
export const getButtonContext = async (buttonType, jobData) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/button-context`, {
    button_type: buttonType,
    job_id: jobData?.job_id || jobData?.id,
    job_data: jobData,
  });
};

/**
 * Chat with Gemini career advisor
 */
export const chatWithGemini = async (message, history = null, context = null) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/chat`, { message, history, context });
};

/**
 * Apply for a job
 */
export const applyForJob = async (applicationData) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/applications`, applicationData);
};

export const saveJob = async (jobPayload) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/saved-jobs`, jobPayload);
};

export const getSavedJobs = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/saved-jobs`);
};

export const removeSavedJob = async (jobId) => {
  return del(`${API_ENDPOINTS.CANDIDATES}/me/saved-jobs/${jobId}`);
};

export const getNotifications = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/notifications`);
};

export const markNotificationRead = async (notificationId) => {
  return put(`${API_ENDPOINTS.CANDIDATES}/me/notifications/${notificationId}/read`, {});
};

/**
 * Get all applications for current candidate
 */
export const getMyApplications = async () => {
  return get(`${API_ENDPOINTS.CANDIDATES}/me/applications`);
};

/**
 * Upload resume
 */
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_ENDPOINTS.UPLOADS}/resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload resume');
  }

  return response.json();
};


/**
 * Upload a certificate file and attach it to the candidate profile
 */
export const uploadCertificate = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_ENDPOINTS.UPLOADS}/certificate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload certificate');
  }

  return response.json();
};


