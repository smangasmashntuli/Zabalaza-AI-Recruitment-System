import { useEffect, useState } from 'react';
import './JobPortal.css';
import { getHybridJobs, searchHybridJobs } from './api/jobs';
import { applyForJob, getCandidateProfile } from './api/candidates';

const Icon = ({ name, size = 20 }) => {
  const icons = {
    search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />,
    location: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
    briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.93 23.93 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19V6m-4 13V9m8 10v-6m4 6V4" />,
    building: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />,
    money: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
    close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
  };

  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name] || icons.briefcase}
    </svg>
  );
};

const getInitials = (value) =>
  value
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CO';

export default function JobPortal({ onCompleteProfile, initialSearchQuery = '', initialLocation = '' }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({ coverLetter: '' });

  const hasResumeProfile = Boolean(candidateProfile?.resume_path || candidateProfile?.resume_text);

  useEffect(() => {
    fetchJobsData();
    fetchCandidateData();
  }, []);

  useEffect(() => {
    setSearchQuery(initialSearchQuery || '');
  }, [initialSearchQuery]);

  useEffect(() => {
    setLocationFilter(initialLocation || '');
  }, [initialLocation]);

  const fetchJobsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobsData = await getHybridJobs({ limit: 50, include_external: true });
      setJobs(jobsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateData = async () => {
    try {
      const profile = await getCandidateProfile();
      setCandidateProfile(profile);
    } catch (err) {
      setCandidateProfile(null);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await searchHybridJobs({
        query: searchQuery,
        location: locationFilter,
        jobType: typeFilter !== 'all' ? typeFilter : undefined,
        limit: 50,
      });
      setJobs(results || []);
    } catch (err) {
      setError(err.message || 'Failed to search jobs');
    } finally {
      setLoading(false);
    }
  };

  const formatJob = (job) => {
    let requirements = [];
    let skills = [];

    try {
      requirements = typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements;
    } catch {
      requirements = job.requirements ? [job.requirements] : [];
    }

    try {
      skills = job.skills ? (typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills) : [];
    } catch {
      skills = [];
    }

    const createdAt = job.created_at ? new Date(job.created_at) : new Date();
    const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...job,
      company: job.company || job.recruiter?.full_name || 'Company',
      logo: getInitials(job.company || job.recruiter?.full_name || job.title),
      type: job.job_type || 'Full-time',
      salary:
        job.salary_min && job.salary_max
          ? `$${(job.salary_min / 1000).toFixed(0)}k - $${(job.salary_max / 1000).toFixed(0)}k`
          : 'Competitive',
      posted: daysAgo <= 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`,
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: Array.isArray(skills) ? skills.slice(0, 6) : [],
      matchScore: null,
    };
  };

  const handleApply = async (job) => {
    if (job.source && job.source !== 'internal') {
      if (job.apply_url) {
        window.open(job.apply_url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (!candidateProfile) {
      alert('Please complete your profile before applying to jobs');
      return;
    }

    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!selectedJob) return;

    try {
      setApplying(true);
      await applyForJob({
        job_id: selectedJob.job_id || selectedJob.id,
        cover_letter: applicationData.coverLetter || `Application for ${selectedJob.title}`,
      });
      setShowApplicationModal(false);
      setSelectedJob(null);
      setApplicationData({ coverLetter: '' });
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const formattedJob = formatJob(job);
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formattedJob.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation =
      !locationFilter || (job.location || '').toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || formattedJob.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesLocation && matchesType;
  });

  if (loading && jobs.length === 0) {
    return (
      <div className="job-portal">
        <div className="job-portal-state">
          <div className="job-portal-state-icon"><Icon name="chart" size={30} /></div>
          <h2 className="job-portal-state-title">Loading jobs...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="job-portal">
        <div className="job-portal-state">
          <div className="job-portal-state-icon"><Icon name="briefcase" size={30} /></div>
          <h2 className="job-portal-state-title">Error Loading Jobs</h2>
          <p className="job-portal-state-text">{error}</p>
          <button onClick={fetchJobsData} className="job-portal-state-button">Retry</button>
        </div>
      </div>
    );
  }

  if (!hasResumeProfile) {
    return (
      <div className="job-portal">
        <div className="job-portal-state">
          <div className="job-portal-state-icon"><Icon name="briefcase" size={30} /></div>
          <h2 className="job-portal-state-title">Complete your profile</h2>
          <p className="job-portal-state-text">
            Upload your CV or resume so the system can extract your education, experience, and skills before recommending jobs.
          </p>
          <button
            onClick={() => onCompleteProfile?.()}
            className="job-portal-state-button"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-portal">
      <div className="hero-section">
        <h1 className="hero-title">Find Your Dream Job</h1>
        <p className="hero-subtitle">
          Discover opportunities matched to your skills with AI-powered recommendations
        </p>

        <div className="search-bar">
          <div className="search-input-group">
            <span className="icon"><Icon name="search" size={18} /></span>
            <input
              type="text"
              placeholder="Job title or company"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="search-input-group">
            <span className="icon"><Icon name="location" size={18} /></span>
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

        <div className="filter-buttons">
          <button onClick={() => setTypeFilter('all')} className={`filter-button ${typeFilter === 'all' ? 'active' : 'inactive'}`}>All Jobs</button>
          <button onClick={() => setTypeFilter('full-time')} className={`filter-button ${typeFilter === 'full-time' ? 'active' : 'inactive'}`}>Full-time</button>
          <button onClick={() => setTypeFilter('remote')} className={`filter-button ${typeFilter === 'remote' ? 'active' : 'inactive'}`}>Remote</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon blue"><span className="icon-lg"><Icon name="briefcase" size={24} /></span></div>
            <div>
              <p className="stat-number">{jobs.length}</p>
              <p className="stat-label">Open Positions</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon green"><span className="icon-lg"><Icon name="building" size={24} /></span></div>
            <div>
              <p className="stat-number">{new Set(jobs.map((job) => job.recruiter_id)).size || 1}+</p>
              <p className="stat-label">Companies Hiring</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-icon purple"><span className="icon-lg"><Icon name="chart" size={24} /></span></div>
            <div>
              <p className="stat-number">AI</p>
              <p className="stat-label">Powered Matching</p>
            </div>
          </div>
        </div>
      </div>

      <div className="results-header">
        <h2>{filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Found</h2>
      </div>

      <div className="jobs-grid">
        {filteredJobs.map((job) => {
          const formattedJob = formatJob(job);
          return (
            <div key={job.id} onClick={() => setSelectedJob(job)} className="job-card">
              <div className="job-header">
                <div className="job-logo">{formattedJob.logo}</div>
                <div className="job-title-section">
                  <div className="job-title-row">
                    <h3 className="job-title">{job.title}</h3>
                    {formattedJob.matchScore && (
                      <div className="match-badge">
                        <span className="icon-sm"><Icon name="star" size={14} /></span>
                        <span className="match-score">{formattedJob.matchScore}%</span>
                      </div>
                    )}
                  </div>
                  <p className="job-company">{formattedJob.company}</p>
                </div>
              </div>

              <div className="job-details">
                <div className="job-detail-item"><span className="icon-sm"><Icon name="location" size={14} /></span>{job.location || 'Remote'}</div>
                <div className="job-detail-item"><span className="icon-sm"><Icon name="money" size={14} /></span>{formattedJob.salary}</div>
                <div className="job-detail-item"><span className="icon-sm"><Icon name="clock" size={14} /></span>{formattedJob.type} | Posted {formattedJob.posted}</div>
              </div>

              <p className="job-description">{job.description}</p>

              <div className="benefits-tags">
                {formattedJob.benefits.slice(0, 3).map((benefit, index) => (
                  <span key={index} className="benefit-tag">{benefit}</span>
                ))}
              </div>

              <button className="view-details-button">View Details</button>
            </div>
          );
        })}
      </div>

      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            {(() => {
              const formattedJob = formatJob(selectedJob);
              return (
                <>
                  <div className="modal-header">
                    <div className="modal-header-content">
                      <div className="modal-job-info">
                        <div className="modal-job-logo">{formattedJob.logo}</div>
                        <div>
                          <h2 className="modal-job-title">{selectedJob.title}</h2>
                          <p className="modal-job-company">{formattedJob.company}</p>
                          {formattedJob.matchScore && (
                            <div className="modal-match-info">
                              <Icon name="star" size={16} />
                              <span className="match-percentage">{formattedJob.matchScore}% Match</span>
                              <span className="match-text">Good fit for your profile</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setSelectedJob(null)} className="close-button">
                        <Icon name="close" size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="modal-body">
                    <div className="detail-grid">
                      <div className="detail-item"><Icon name="location" size={16} /><span>{selectedJob.location || 'Remote'}</span></div>
                      <div className="detail-item"><Icon name="money" size={16} /><span>{formattedJob.salary}</span></div>
                      <div className="detail-item"><Icon name="briefcase" size={16} /><span>{formattedJob.type}</span></div>
                      <div className="detail-item"><Icon name="clock" size={16} /><span>Posted {formattedJob.posted}</span></div>
                    </div>

                    <div className="section">
                      <h3 className="section-title">About the Role</h3>
                      <p className="section-text">{selectedJob.description}</p>
                    </div>

                    <div className="section">
                      <h3 className="section-title">Requirements</h3>
                      <ul className="requirements-list">
                        {formattedJob.requirements.map((requirement, index) => (
                          <li key={index} className="requirement-item">
                            <svg className="check-icon" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="section">
                      <h3 className="section-title">Skills</h3>
                      <div className="modal-benefits-tags">
                        {formattedJob.benefits.map((benefit, index) => (
                          <span key={index} className="modal-benefit-tag">{benefit}</span>
                        ))}
                      </div>
                    </div>

                    <div className="modal-actions">
                      <button onClick={() => handleApply(selectedJob)} className="apply-button">Apply Now</button>
                      <button className="save-button">Save Job</button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {showApplicationModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-content application-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div>
                  <h2 className="modal-job-title">Apply to {selectedJob.title}</h2>
                  <p className="modal-job-company">{selectedJob.company || selectedJob.recruiter?.full_name || 'Company'}</p>
                </div>
                <button onClick={() => setShowApplicationModal(false)} className="close-button">
                  <Icon name="close" size={20} />
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
                    placeholder="Tell us why you're a good fit for this position..."
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-button" disabled={applying}>
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button type="button" onClick={() => setShowApplicationModal(false)} className="cancel-button" disabled={applying}>
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
