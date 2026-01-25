/**
 * Format utilities for Dashboard
 */

/**
 * Map backend application status to dashboard status
 */
export const mapApplicationStatus = (backendStatus) => {
  const statusMap = {
    'pending': 'applied',
    'reviewed': 'under_review',
    'shortlisted': 'under_review',
    'interview': 'interview_scheduled',
    'accepted': 'offer_received',
    'rejected': 'rejected'
  };
  return statusMap[backendStatus] || 'applied';
};

/**
 * Format application data from backend to dashboard format
 */
export const formatApplication = (application, job) => {
  if (!application || !job) return null;

  return {
    id: application.id,
    position: job.title,
    company: job.company || 'Company Name',
    companyLogo: job.company ? job.company.substring(0, 2).toUpperCase() : 'CO',
    location: job.location || 'Remote',
    workType: job.job_type || 'Remote',
    salary: job.salary_min && job.salary_max
      ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
      : 'Competitive',
    status: mapApplicationStatus(application.status),
    stage: getStageFromStatus(application.status),
    date: formatRelativeDate(application.applied_at),
    nextAction: getNextAction(application.status),
    match: application.match_score ? Math.round(application.match_score * 100) : 85,
    tags: extractSkills(job.requirements || job.description || '').slice(0, 3)
  };
};

/**
 * Format job recommendation from backend to dashboard format
 */
export const formatRecommendation = (match, index) => {
  const job = match.job_details || match;
  const jobId = match.job_id || job.id;

  return {
    id: jobId,
    position: match.job_title || job.title,
    company: job.company || 'Company Name',
    companyLogo: job.company ? job.company.substring(0, 2).toUpperCase() : 'CO',
    location: job.location || 'Remote',
    workType: job.job_type || 'Remote',
    salary: job.salary_min && job.salary_max
      ? `$${Math.round(job.salary_min / 1000)}k - $${Math.round(job.salary_max / 1000)}k`
      : 'Competitive',
    match: match.match_score ? Math.round(match.match_score * 100) : 90,
    posted: formatRelativeDate(job.created_at),
    applicants: Math.floor(Math.random() * 100) + 10, // Mock data
    tags: extractSkills(job.requirements || job.description || '').slice(0, 3),
    featured: index < 2 // First 2 are featured
  };
};

/**
 * Get stage description from status
 */
const getStageFromStatus = (status) => {
  const stageMap = {
    'pending': 'Application Submitted',
    'reviewed': 'Resume Review',
    'shortlisted': 'Shortlisted',
    'interview': 'Technical Interview',
    'accepted': 'Offer Negotiation',
    'rejected': 'Not Selected'
  };
  return stageMap[status] || 'In Progress';
};

/**
 * Get next action based on status
 */
const getNextAction = (status) => {
  const actionMap = {
    'pending': 'Awaiting response',
    'reviewed': 'Under review',
    'shortlisted': 'Prepare for interview',
    'interview': 'Interview scheduled',
    'accepted': 'Review offer',
    'rejected': 'View similar jobs'
  };
  return actionMap[status] || 'Check status';
};

/**
 * Format date to relative time
 */
export const formatRelativeDate = (dateString) => {
  if (!dateString) return 'Recently';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffHours < 24) {
    if (diffHours < 1) return 'Just now';
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Extract skills from text
 */
const extractSkills = (text) => {
  const commonSkills = [
    'React', 'JavaScript', 'Python', 'TypeScript', 'Node.js',
    'AWS', 'Docker', 'Kubernetes', 'Java', 'SQL', 'MongoDB',
    'Vue.js', 'Angular', 'Go', 'Rust', 'C++', 'Machine Learning',
    'DevOps', 'CI/CD', 'Git', 'REST API', 'GraphQL', 'Redis',
    'PostgreSQL', 'Microservices', 'Agile', 'Scrum', 'TDD',
    'System Design', 'Distributed Systems', 'Cloud', 'Azure',
    'GCP', 'Terraform', 'Jenkins', 'Linux', 'Figma', 'UI/UX',
    'Design Systems', 'Leadership'
  ];

  const found = [];
  const lowerText = text.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerText.includes(skill.toLowerCase()) && found.length < 5) {
      found.push(skill);
    }
  }

  return found.length > 0 ? found : ['Technology', 'Development', 'Engineering'];
};

/**
 * Get user initials from name
 */
export const getUserInitials = (name) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

