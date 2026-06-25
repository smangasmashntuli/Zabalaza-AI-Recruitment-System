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
export const getInterviewTips = async (jobId, jobData = null) => {
  if (jobData && !Number.isInteger(jobId)) {
    // External job - use POST with job_data
    return post(`${API_ENDPOINTS.CANDIDATES}/me/interview-tips`, {
      job_id: jobId,
      job_data: jobData
    });
  }
  // Internal job - use POST with query param (backward compatible)
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
export const getMatchAnalysis = async (jobId, jobData = null) => {
  if (jobData && !Number.isInteger(jobId)) {
    // External job - use POST with job_data
    return post(`${API_ENDPOINTS.CANDIDATES}/me/match-analysis`, {
      job_id: jobId,
      job_data: jobData
    });
  }
  // Internal job - use GET (backward compatible)
  return get(`${API_ENDPOINTS.CANDIDATES}/me/match-analysis?job_id=${jobId}`);
};

/**
 * Get resume tailoring suggestions for a job
 */
export const getResumeTailoringTips = async (jobId, jobData = null) => {
  if (jobData && !Number.isInteger(jobId)) {
    // External job - use POST with job_data
    return post(`${API_ENDPOINTS.CANDIDATES}/me/resume-tailoring`, {
      job_id: jobId,
      job_data: jobData
    });
  }
  // Internal job - use GET (backward compatible)
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

export const generateCoverLetter = async (payload) => {
  return post(`${API_ENDPOINTS.CANDIDATES}/me/generate-cover-letter`, payload);
};

/**
 * Apply for a job with PDF document generation (enhanced)
 * Generates ATS-friendly PDF with resume and cover letter
 */
export const applyWithDocuments = async ({ job_id, cover_letter = '', resume_text = '' }) => {
  const token = localStorage.getItem('access_token');
  
  // Build request body
  const requestBody = {
    job_id,
    cover_letter,
    ...(resume_text && { resume_text })
  };
  
  const response = await fetch(`${API_ENDPOINTS.CANDIDATES}/me/apply-with-documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to submit application' }));
    throw new Error(error.detail || 'Failed to submit application');
  }
  return response.json();
};

/**
 * Optimize resume for a specific job, returns ATS-friendly PDF
 */
export const optimizeResume = async (jobId) => {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_ENDPOINTS.CANDIDATES}/me/optimize-resume?job_id=${jobId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to optimize resume' }));
    throw new Error(error.detail || 'Failed to optimize resume');
  }
  return response.json();
};

/**
 * Download a generated PDF file
 */
export const downloadPdf = (pdfPath) => {
  const token = localStorage.getItem('access_token');
  // PDFs are stored in uploads/generated_pdfs/ directory
  const pdfUrl = `http://127.0.0.1:8000/uploads/generated_pdfs/${pdfPath.split('/').pop()}`;
  window.open(pdfUrl, '_blank');
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


