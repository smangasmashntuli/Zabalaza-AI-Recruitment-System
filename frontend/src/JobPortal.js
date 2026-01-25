import { useState, useEffect } from 'react';
import './JobPortal.css';
import { getJobs, searchJobs } from './api/jobs';
import { applyForJob } from './api/candidates';
import { getCandidateProfile } from './api/candidates';

export function JobPortal() {
  // Dynamic state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);

  // UI state
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applying, setApplying] = useState(false);

  // Application form state
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
  });

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobsData();
    fetchCandidateProfile();
  }, []);

  const fetchJobsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobsData = await getJobs({ status: 'active' });
      setJobs(jobsData || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateProfile = async () => {
    try {
      const profile = await getCandidateProfile();
      setCandidateProfile(profile);
    } catch (err) {
      console.warn('Could not fetch candidate profile:', err);
    }
  };

  // Search jobs with filters
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = {
        query: searchQuery,
        location: locationFilter,
        jobType: typeFilter !== 'all' ? typeFilter : undefined,
        status: 'active'
      };

      const results = await searchJobs(searchParams);
      setJobs(results || []);
    } catch (err) {
      console.error('Error searching jobs:', err);
      setError(err.message || 'Failed to search jobs');
    } finally {
      setLoading(false);
    }
  };


  // Transform backend job data to display format
  const formatJob = (job) => {
    const salaryRange = job.salary_min && job.salary_max
      ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
      : 'Competitive';

    const daysAgo = Math.floor((new Date() - new Date(job.created_at)) / (1000 * 60 * 60 * 24));
    const posted = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

    // Parse requirements if it's a string
    let requirements = [];
    try {
      requirements = typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements;
    } catch {
      requirements = [job.requirements];
    }

    // Parse skills as benefits/tags
    let skills = [];
    try {
      skills = job.skills ? (typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills) : [];
    } catch {
      skills = [];
    }

    return {
      ...job,
      type: job.job_type || 'Full-time',
      salary: salaryRange,
      posted: posted,
      requirements: Array.isArray(requirements) ? requirements : [requirements],
      benefits: skills.slice(0, 6) || ['Competitive Salary', 'Health Insurance', 'Remote Options'],
      logo: getCompanyLogo(job.title),
      matchScore: null, // Will be set if we have match data
    };
  };

  // Generate company logo emoji based on job title
  const getCompanyLogo = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('developer') || titleLower.includes('engineer')) return '💻';
    if (titleLower.includes('designer') || titleLower.includes('ui')) return '🎨';
    if (titleLower.includes('data') || titleLower.includes('analyst')) return '📊';
    if (titleLower.includes('product') || titleLower.includes('manager')) return '📱';
    if (titleLower.includes('marketing')) return '📢';
    if (titleLower.includes('sales')) return '💼';
    return '🏢';
  };

  // Handle job application
  const handleApply = async (job) => {
    if (!candidateProfile) {
      alert('Please complete your profile before applying to jobs');
      return;
    }

    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const submitApplication = async (e) => {
    e.preventDefault();

    if (!selectedJob) return;

    try {
      setApplying(true);

      await applyForJob({
        job_id: selectedJob.id,
        cover_letter: applicationData.coverLetter || `Application for ${selectedJob.title}`
      });

      alert('Application submitted successfully!');
      setShowApplicationModal(false);
      setSelectedJob(null);
      setApplicationData({ coverLetter: '' });
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const formattedJob = formatJob(job);
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (job.recruiter?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || formattedJob.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesLocation && matchesType;
  });

  // Loading state
  if (loading && jobs.length === 0) {
    return (
      <div className="job-portal">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading jobs...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && jobs.length === 0) {
    return (
      <div className="job-portal">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Error Loading Jobs</h2>
          <p>{error}</p>
          <button onClick={fetchJobsData} style={{ marginTop: '20px' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-portal">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Find Your Dream Job</h1>
        <p className="hero-subtitle">
          Discover opportunities matched to your skills with AI-powered recommendations
        </p>

        {/* Search Bar */}
        <div className="search-bar">
          <div className="search-input-group">
            <span className="icon">🔍</span>
            <input
              type="text"
              placeholder="Job title or company"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-input-group">
            <span className="icon">📍</span>
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="search-button" onClick={handleSearch}>
            Search Jobs
          </button>
        </div>

        {/* Quick Filters */}
        <div className="filter-buttons">
          <button
            onClick={() => setTypeFilter('all')}
            className={`filter-button ${typeFilter === 'all' ? 'active' : 'inactive'}`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setTypeFilter('full-time')}
            className={`filter-button ${typeFilter === 'full-time' ? 'active' : 'inactive'}`}
          >
            Full-time
          </button>
          <button
            onClick={() => setTypeFilter('remote')}
            className={`filter-button ${typeFilter === 'remote' ? 'active' : 'inactive'}`}
          >
            Remote
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon blue">
              <span className="icon-lg">💼</span>
            </div>
            <div>
              <p className="stat-number">{jobs.length}</p>
              <p className="stat-label">Open Positions</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon green">
              <span className="icon-lg">🏢</span>
            </div>
            <div>
              <p className="stat-number">{new Set(jobs.map(j => j.recruiter_id)).size || 1}+</p>
              <p className="stat-label">Companies Hiring</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon purple">
              <span className="icon-lg">📈</span>
            </div>
            <div>
              <p className="stat-number">AI</p>
              <p className="stat-label">Powered Matching</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="results-header">
        <h2>
          {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found
        </h2>
      </div>

      {/* Job Listings */}
      <div className="jobs-grid">
        {filteredJobs.map((job) => {
          const formattedJob = formatJob(job);
          return (
            <div
              key={job.id}
              onClick={() => setSelectedJob(job)}
              className="job-card"
            >
              <div className="job-header">
                <div className="job-logo">
                  {formattedJob.logo}
                </div>
                <div className="job-title-section">
                  <div className="job-title-row">
                    <h3 className="job-title">{job.title}</h3>
                    {formattedJob.matchScore && (
                      <div className="match-badge">
                        <span className="icon-sm">⭐</span>
                        <span className="match-score">{formattedJob.matchScore}%</span>
                      </div>
                    )}
                  </div>
                  <p className="job-company">{job.recruiter?.full_name || 'Company'}</p>
                </div>
              </div>

              <div className="job-details">
                <div className="job-detail-item">
                  <span className="icon-sm">📍</span>
                  {job.location || 'Remote'}
                </div>
                <div className="job-detail-item">
                  <span className="icon-sm">💰</span>
                  {formattedJob.salary}
                </div>
                <div className="job-detail-item">
                  <span className="icon-sm">🕒</span>
                  {formattedJob.type} • Posted {formattedJob.posted}
                </div>
              </div>

              <p className="job-description">{job.description}</p>

              <div className="benefits-tags">
                {formattedJob.benefits.slice(0, 3).map((benefit, index) => (
                  <span key={index} className="benefit-tag">
                    {benefit}
                  </span>
                ))}
              </div>

              <button className="view-details-button">
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const formattedJob = formatJob(selectedJob);
              return (
                <>
                  <div className="modal-header">
                    <div className="modal-header-content">
                      <div className="modal-job-info">
                        <div className="modal-job-logo">
                          {formattedJob.logo}
                        </div>
                        <div>
                          <h2 className="modal-job-title">{selectedJob.title}</h2>
                          <p className="modal-job-company">{selectedJob.recruiter?.full_name || 'Company'}</p>
                          {formattedJob.matchScore && (
                            <div className="modal-match-info">
                              <span className="icon">⭐</span>
                              <span className="match-percentage">{formattedJob.matchScore}% Match</span>
                              <span className="match-text">• Great fit for you!</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedJob(null)}
                        className="close-button"
                      >
                        <svg className="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="modal-body">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="icon">📍</span>
                        <span>{selectedJob.location || 'Remote'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">💰</span>
                        <span>{formattedJob.salary}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">💼</span>
                        <span>{formattedJob.type}</span>
                      </div>
                      <div className="detail-item">
                        <span className="icon">🕒</span>
                        <span>Posted {formattedJob.posted}</span>
                      </div>
                    </div>

                    <div className="section">
                      <h3 className="section-title">About the Role</h3>
                      <p className="section-text">{selectedJob.description}</p>
                    </div>

                    <div className="section">
                      <h3 className="section-title">Requirements</h3>
                      <ul className="requirements-list">
                        {formattedJob.requirements.map((req, index) => (
                          <li key={index} className="requirement-item">
                            <svg className="check-icon" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedJob.experience_level && (
                      <div className="section">
                        <h3 className="section-title">Experience Level</h3>
                        <p className="section-text">{selectedJob.experience_level}</p>
                      </div>
                    )}

                    <div className="section">
                      <h3 className="section-title">Skills & Benefits</h3>
                      <div className="modal-benefits-tags">
                        {formattedJob.benefits.map((benefit, index) => (
                          <span key={index} className="modal-benefit-tag">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="modal-actions">
                      <button
                        onClick={() => handleApply(selectedJob)}
                        className="apply-button"
                      >
                        Apply Now
                      </button>
                      <button className="save-button">
                        Save Job
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <div
          className="modal-overlay"
          onClick={() => setShowApplicationModal(false)}
        >
          <div
            className="modal-content application-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-content">
                <div>
                  <h2 className="modal-job-title">Apply to {selectedJob.title}</h2>
                  <p className="modal-job-company">{selectedJob.recruiter?.full_name || 'Company'}</p>
                </div>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="close-button"
                >
                  <svg className="icon-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="application-form">
              <form onSubmit={submitApplication}>
                {candidateProfile && (
                  <div className="profile-info-section">
                    <h3>Your Profile Information</h3>
                    <p>Name: {candidateProfile.first_name} {candidateProfile.last_name}</p>
                    <p>Email: {candidateProfile.email}</p>
                    {candidateProfile.phone && <p>Phone: {candidateProfile.phone}</p>}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Cover Letter (Optional)</label>
                  <textarea
                    rows={6}
                    className="form-textarea"
                    placeholder="Tell us why you're a great fit for this position..."
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={applying}
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="cancel-button"
                    disabled={applying}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobPortal;
