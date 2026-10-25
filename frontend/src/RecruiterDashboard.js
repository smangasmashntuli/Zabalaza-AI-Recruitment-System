import React, { useState, useEffect } from 'react';
import './RecruiterDashboard.css';
import {
  getJobs, createJob, getJobApplications, getRankedCandidates, updateApplicationStatus, sendCandidateEmail,
  rankCVsForJob
} from './api/recruiter';
import { logoutUser, getCurrentUser, getMyId } from './api/auth';
import { Icon } from './Dashboard';
import SemanticMap from './SemanticMap.tsx';
import logo from './image-logo/zabalaza_logo_clean_circle.png';

const toneClass = ['coral', 'yellow', 'sage', 'sky', 'rose'];

export default function RecruiterDashboard({ onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [postingJob, setPostingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'full-time',
    requirements: ''
  });
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [showRankingUI, setShowRankingUI] = useState(false);
  const [cvFiles, setCvFiles] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [selectedJobForVisualization, setSelectedJobForVisualization] = useState(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getJobs({ limit: 100 });

      let currentUserId = null;
      try {
        const idInfo = await getMyId();
        currentUserId = idInfo?.id;
      } catch (err) {
        console.warn('Could not fetch user ID from backend:', err);
      }

      if (!currentUserId) {
        const storedId = localStorage.getItem('recruiter_user_id');
        const userData = localStorage.getItem('user_data');
        if (storedId) {
          currentUserId = parseInt(storedId);
        } else if (userData) {
          currentUserId = JSON.parse(userData).id;
        }
      }

      let recruiterJobs = [];
      if (currentUserId) {
        recruiterJobs = jobsData.filter(job => {
          return String(job.recruiter_id) === String(currentUserId);
        });
      }

      setJobs(recruiterJobs);

      const allApplicants = [];
      for (const job of recruiterJobs) {
        try {
          const apps = await getJobApplications(job.id);
          allApplicants.push(...apps);
        } catch (err) {
          console.warn(`Failed to fetch applicants for job ${job.id}:`, err);
        }
      }
      setApplicants(allApplicants);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.description || !jobForm.location) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setPostingJob(true);
      const newJob = await createJob({
        title: jobForm.title,
        description: jobForm.description,
        location: jobForm.location,
        job_type: jobForm.job_type,
        requirements: jobForm.requirements,
      });

      setJobForm({ title: '', description: '', location: '', job_type: 'full-time', requirements: '' });
      await fetchJobs();
      setCurrentPage('manage-jobs');
      alert('Job posted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to post job');
    } finally {
      setPostingJob(false);
    }
  };

  const handleViewApplicants = (jobId) => {
    setSelectedJobId(jobId);
    setCurrentPage('applicants');
  };

  const handleRankCVs = async (jobId) => {
    if (cvFiles.length === 0) {
      alert('Please select CV files to upload');
      return;
    }

    try {
      setRankingLoading(true);
      const result = await rankCVsForJob(jobId, cvFiles);
      setRankedCandidates(result.candidates || []);
      setShowRankingUI(true);
      setCvFiles([]);
      alert(`Successfully processed ${result.total_processed} CVs`);
    } catch (err) {
      alert(err.message || 'Failed to rank CVs');
    } finally {
      setRankingLoading(false);
    }
  };

  const handleViewRankedCandidates = async (jobId) => {
    try {
      setRankingLoading(true);
      const candidates = await getRankedCandidates(jobId);
      setRankedCandidates(candidates);
      setShowRankingUI(true);
    } catch (err) {
      alert(err.message || 'Failed to load ranked candidates');
    } finally {
      setRankingLoading(false);
    }
  };

  const handleCandidateAction = async (applicationId, action) => {
    const statusMap = {
      'offer': 'accepted',
      'reject': 'rejected',
      'interview': 'interview',
    };
    const newStatus = statusMap[action];
    if (!newStatus) return;

    try {
      await updateApplicationStatus(applicationId, {
        status: newStatus,
        message: action === 'offer' ? 'Congratulations! You have been offered this position.' :
                 action === 'reject' ? 'Thank you for your application. We have decided to move forward with other candidates.' :
                 'You have been selected for an interview.'
      });
      alert(`Candidate ${action}ed successfully`);
      await fetchJobs();
    } catch (err) {
      alert(err.message || `Failed to ${action} candidate`);
    }
  };

  const handleSendEmail = async (applicationId) => {
    const subject = prompt('Email subject:');
    if (!subject) return;
    const body = prompt('Email message:');
    if (!body) return;

    try {
      await sendCandidateEmail(applicationId, { subject, body, type: 'general' });
      alert('Email sent successfully');
    } catch (err) {
      alert(err.message || 'Failed to send email');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setCvFiles(files);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout from company account?')) {
      logoutUser();
      onLogout?.();
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'high';
    if (score >= 45) return 'medium';
    return 'low';
  };

  const getStageBadge = (stage) => {
    const colors = {
      applied: 'sky',
      interview: 'yellow',
      accepted: 'sage',
      rejected: 'coral',
      offer: 'sage'
    };
    return <Pill tone={colors[stage] || 'sage'} filled>{stage?.replace('_', ' ') || 'Applied'}</Pill>;
  };

  const stats = {
    totalJobs: jobs.length,
    totalApplicants: applicants.length,
    interviewing: applicants.filter(a => a.status === 'interview').length,
    offers: applicants.filter(a => a.status === 'accepted' || a.status === 'offer').length,
    avgScore: applicants.length > 0
      ? Math.round(applicants.reduce((sum, a) => sum + (a.match_score || 0), 0) / applicants.length * 100)
      : 0
  };

  const getJobApplicationCount = (jobId) => {
    return applicants.filter(a => a.job_id === jobId).length;
  };

  const filteredApplicants = selectedJobId === 'all'
    ? applicants
    : applicants.filter(a => a.job_id === parseInt(selectedJobId));

  if (loading) {
    return (
      <div className="recruiter-dashboard" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="recruiter-card retro-loader">
          <h2>Loading Recruiter Dashboard...</h2>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-dashboard-wrapper">
      {/* Header */}
      <header className="recruiter-header">
        <div className="recruiter-header-content">
          <div className="recruiter-brand">
            <img src={logo} alt="Zabalaza Logo" className="recruiter-brand-logo" />
            <span className="recruiter-brand-name">Zabalaza</span>
          </div>
          <div className="recruiter-header-actions">
            <span className="recruiter-header-user">
              <Icon name="user" size={18} />
              {currentUser?.full_name || currentUser?.email || 'Recruiter'}
            </span>
            <button className="recruiter-header-logout" onClick={handleLogout}>
              <Icon name="send" size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="recruiter-dashboard">
        {/* Left Sidebar */}
        <aside className="recruiter-sidebar">
          <div className="recruiter-sidebar-header">
            <p className="recruiter-sidebar-title">Business Portal</p>
            <h2 className="recruiter-sidebar-name">Recruiter</h2>
          </div>

          <nav className="recruiter-nav">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'home' },
              { id: 'post-job', label: 'Post Job', icon: 'plus' },
              { id: 'manage-jobs', label: 'Manage Jobs', icon: 'briefcase' },
              { id: 'applicants', label: 'Applicants', icon: 'user' },
              { id: 'semantic-map', label: 'Semantic Map', icon: 'graph' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`recruiter-nav-item ${currentPage === tab.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(tab.id)}
              >
                <Icon name={tab.icon} size={18} /> {tab.label}
              </button>
            ))}
          </nav>

          <div className="recruiter-sidebar-footer">
            <button className="recruiter-logout-button" onClick={handleLogout}>
              <Icon name="send" size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="recruiter-main">
          {/* Dashboard Page */}
          {currentPage === 'dashboard' && (
            <div>
              <div className="recruiter-stats-grid">
                <div className="recruiter-stat-card">
                  <span className="stat-icon coral"><Icon name="briefcase" /></span>
                  <span className="stat-value">{stats.totalJobs}</span>
                  <p className="stat-label">Total Jobs</p>
                </div>
                <div className="recruiter-stat-card">
                  <span className="stat-icon yellow"><Icon name="user" /></span>
                  <span className="stat-value">{stats.totalApplicants}</span>
                  <p className="stat-label">Total Applicants</p>
                </div>
                <div className="recruiter-stat-card">
                  <span className="stat-icon sage"><Icon name="calendar" /></span>
                  <span className="stat-value">{stats.interviewing}</span>
                  <p className="stat-label">Interviewing</p>
                </div>
                <div className="recruiter-stat-card">
                  <span className="stat-icon sky"><Icon name="star" /></span>
                  <span className="stat-value">{stats.offers}</span>
                  <p className="stat-label">Offers Made</p>
                </div>
              </div>

              <div className="recruiter-content-grid">
                <div className="recruiter-card">
                  <div className="recruiter-card-header">
                    <h2>Your Posted Jobs</h2>
                    <button className="retro-primary-button" onClick={() => setCurrentPage('post-job')}>
                      <Icon name="plus" size={14} /> Post New Job
                    </button>
                  </div>
                  <div className="recruiter-list">
                    {jobs.length === 0 ? (
                      <div className="recruiter-empty"><Icon name="briefcase" />No jobs posted yet. Create your first job posting!</div>
                    ) : jobs.slice(0, 5).map((job, index) => (
                      <div key={job.id} className="recruiter-list-item">
                        <div>
                          <strong>{job.title}</strong>
                          <span>{job.location} · {job.job_type}</span>
                        </div>
                        <Pill tone="sage" filled>{getJobApplicationCount(job.id)} applicants</Pill>
                        <button className="retro-mini-action" onClick={() => handleViewApplicants(job.id)}>
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="recruiter-card">
                  <div className="recruiter-card-header">
                    <h2>Recent Applicants</h2>
                  </div>
                  <div className="recruiter-application-grid">
                    {applicants.length === 0 ? (
                      <div className="recruiter-empty"><Icon name="user" />No applicants yet.</div>
                    ) : applicants.slice(0, 6).map((app, index) => (
                      <div key={app.id} className="recruiter-application-card">
                        <div>
                          <strong>{app.candidate_name}</strong>
                          <span>{app.candidate_email}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={`score-badge ${getScoreColor(app.match_score * 100)}`}>
                            {Math.round(app.match_score * 100)}%
                          </div>
                          {getStageBadge(app.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post Job Page */}
          {currentPage === 'post-job' && (
            <div>
              <div className="recruiter-card">
                <div className="recruiter-card-header">
                  <div>
                    <p className="recruiter-sidebar-title">Business Portal</p>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Post a New Job</h1>
                  </div>
                </div>

                <form onSubmit={handlePostJob} className="recruiter-form">
                  <div className="recruiter-form-group">
                    <label>Position Title *</label>
                    <input
                      type="text"
                      required
                      className="recruiter-form-input"
                      placeholder="e.g., Senior React Developer"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    />
                  </div>

                  <div className="recruiter-form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      required
                      className="recruiter-form-input"
                      placeholder="e.g., Remote, New York, NY"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    />
                  </div>

                  <div className="recruiter-form-group">
                    <label>Job Type</label>
                    <select
                      className="recruiter-form-select"
                      value={jobForm.job_type}
                      onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>

                  <div className="recruiter-form-group">
                    <label>Description *</label>
                    <textarea
                      required
                      className="recruiter-form-textarea"
                      placeholder="Describe the role and responsibilities..."
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    />
                  </div>

                  <div className="recruiter-form-group">
                    <label>Requirements</label>
                    <textarea
                      className="recruiter-form-textarea"
                      placeholder="List required skills and qualifications..."
                      value={jobForm.requirements}
                      onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    />
                  </div>

                  <div className="recruiter-form-actions">
                    <button type="submit" className="retro-primary-button" disabled={postingJob}>
                      {postingJob ? 'Posting...' : 'Post Job'}
                    </button>
                    <button type="button" className="retro-ghost-button" onClick={() => setCurrentPage('dashboard')}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Manage Jobs Page */}
          {currentPage === 'manage-jobs' && (
            <div>
              <div className="recruiter-card">
                <div className="recruiter-card-header">
                  <div>
                    <p className="recruiter-sidebar-title">Business Portal</p>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Manage Jobs</h1>
                  </div>
                  <button className="retro-primary-button" onClick={() => setCurrentPage('post-job')}>
                    <Icon name="plus" size={14} /> Post New Job
                  </button>
                </div>
              </div>

              <div className="recruiter-list" style={{ gap: '0.8rem' }}>
                {jobs.length === 0 ? (
                  <div className="recruiter-card">
                    <div className="recruiter-empty"><Icon name="briefcase" />No jobs posted yet. Create your first job posting!</div>
                  </div>
              ) : jobs.map((job, index) => (
                  <div key={job.id} className="recruiter-job-card">
                    <div className="job-header">
                      <div>
                        <h3 className="job-title">{job.title}</h3>
                        <p className="job-meta">
                          {job.location} · {job.job_type} · Posted {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Pill tone="sage" filled>{getJobApplicationCount(job.id)} applicants</Pill>
                    </div>
                    <p className="job-description">
                      {job.description?.substring(0, 150)}...
                    </p>
                    <div className="job-actions">
                      <button
                        className="retro-primary-button"
                        onClick={() => handleViewApplicants(job.id)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                      >
                        <Icon name="user" size={14} /> View Applicants ({getJobApplicationCount(job.id)})
                      </button>
                      <button
                        className="retro-ghost-button"
                        onClick={() => handleViewRankedCandidates(job.id)}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                      >
                        <Icon name="graph" size={14} /> View Ranked
                      </button>
                      <button
                        className="retro-ghost-button"
                        onClick={() => {
                          setSelectedJobForVisualization(job.id);
                          setCurrentPage('semantic-map');
                        }}
                        style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                      >
                        <Icon name="graph" size={14} /> Semantic Map
                      </button>
                      <label className="retro-primary-button" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        background: 'var(--sage)',
                        fontSize: '0.8rem',
                        padding: '0.4rem 1rem'
                      }}>
                        <Icon name="doc" size={14} /> Upload CVs
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {cvFiles.length > 0 && (
                        <button
                          className="retro-primary-button"
                          onClick={() => handleRankCVs(job.id)}
                          disabled={rankingLoading}
                          style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                        >
                          {rankingLoading ? 'Ranking...' : `Rank ${cvFiles.length} CVs`}
                        </button>
                      )}
                    </div>
                    {cvFiles.length > 0 && (
                      <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--surface-2)', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <strong>Selected:</strong> {cvFiles.map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applicants Page */}
          {currentPage === 'applicants' && (
            <div>
              <div className="recruiter-card" style={{ marginBottom: '1.5rem' }}>
                <div className="recruiter-card-header">
                  <div>
                    <p className="recruiter-sidebar-title">Business Portal</p>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Applicants</h1>
                  </div>
                  <select
                    className="recruiter-form-select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    style={{ width: 'auto', minWidth: '150px' }}
                  >
                    <option value="all">All Jobs</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showRankingUI && rankedCandidates.length > 0 && (
                <div className="recruiter-card" style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)' }}>Ranked Candidates (by match score)</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {rankedCandidates.map((candidate, index) => (
                      <div key={candidate.application_id || candidate.id} className="recruiter-ranked-card">
                        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px', gap: '1rem', alignItems: 'start' }}>
                          <div className={`rank-number ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="candidate-name">{candidate.candidate_name}</h3>
                            <p className="candidate-email">{candidate.candidate_email}</p>
                            {candidate.headline && (
                              <p className="candidate-headline">"{candidate.headline}"</p>
                            )}
                            {candidate.summary && (
                              <p className="candidate-summary">{candidate.summary}</p>
                            )}
                            {candidate.strengths && candidate.strengths.length > 0 && (
                              <div className="strengths-section">
                                <strong>Strengths:</strong>
                                <ul>
                                  {candidate.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                              </div>
                            )}
                            {candidate.gaps && candidate.gaps.length > 0 && (
                              <div className="gaps-section">
                                <strong>Gaps:</strong>
                                <ul>
                                  {candidate.gaps.map((g, i) => <li key={i}>{g}</li>)}
                                </ul>
                              </div>
                            )}
                            <div className="candidate-tags">
                              <span>Status: {candidate.status || 'pending'}</span>
                              <span>CV: {candidate.resume_path || 'Uploaded'}</span>
                            </div>
                          </div>
                          <div className="candidate-actions">
                            <div className={`match-score ${getScoreColor(candidate.match_score)}`}>
                              {candidate.match_score}%
                            </div>
                            <div className="match-label">Match Score</div>
                            <button
                              className="retro-primary-button"
                              onClick={() => handleCandidateAction(candidate.application_id, 'offer')}
                              style={{ background: 'var(--green)', fontSize: '0.75rem', padding: '0.4rem 0.8rem', width: '100%' }}
                            >
                              Offer
                            </button>
                            <button
                              className="retro-primary-button"
                              onClick={() => handleCandidateAction(candidate.application_id, 'interview')}
                              style={{ background: 'var(--amber)', fontSize: '0.75rem', padding: '0.4rem 0.8rem', width: '100%' }}
                            >
                              Interview
                            </button>
                            <button
                              className="retro-primary-button"
                              onClick={() => handleCandidateAction(candidate.application_id, 'reject')}
                              style={{ background: 'var(--coral)', fontSize: '0.75rem', padding: '0.4rem 0.8rem', width: '100%' }}
                            >
                              Reject
                            </button>
                            <button
                              className="retro-ghost-button"
                              onClick={() => handleSendEmail(candidate.application_id)}
                              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', width: '100%', justifyContent: 'center' }}
                            >
                              Send Email
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showRankingUI && rankedCandidates.length === 0 && (
                <div className="recruiter-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="recruiter-empty">
                    <Icon name="doc" />
                    <h3>No ranked candidates yet</h3>
                    <p>Upload CVs using the button above to rank them against this job.</p>
                  </div>
                </div>
              )}

              <div className="recruiter-card">
                <div className="recruiter-table-wrapper">
                  <table className="recruiter-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Job</th>
                        <th>CV</th>
                        <th>Score</th>
                        <th>Summary</th>
                        <th>Stage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-mute)' }}>
                            No applicants found
                          </td>
                        </tr>
                      ) : filteredApplicants.map((app, index) => (
                        <tr key={app.id}>
                          <td data-label="Name">
                            <div>
                              <strong>{app.candidate_name}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--ink-mute)', marginTop: '2px' }}>{app.candidate_email}</div>
                            </div>
                          </td>
                          <td data-label="Job" style={{ fontSize: '0.85rem' }}>
                            {app.job_title || `Job #${app.job_id}`}
                          </td>
                          <td data-label="CV">
                            <button
                              className="retro-ghost-button"
                              style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                              onClick={() => {
                                if (app.resume_path) {
                                  const pdfUrl = `http://127.0.0.1:8000/${app.resume_path}`;
                                  window.open(pdfUrl, '_blank');
                                } else {
                                  alert('No CV available for this candidate');
                                }
                              }}
                            >
                              <Icon name="doc" size={12} /> Download
                            </button>
                          </td>
                          <td data-label="Score">
                            <div className={`score-badge ${getScoreColor((app.match_score || 0) * 100)}`}>
                              {Math.round((app.match_score || 0) * 100)}%
                            </div>
                          </td>
                        <td data-label="Summary" style={{ fontSize: '0.8rem', maxWidth: '250px', color: 'var(--ink-mute)' }}>
                          <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.4'
                          }}>
                            {app.summary || 'No summary available'}
                          </div>
                        </td>
                          <td data-label="Stage">
                            {getStageBadge(app.status)}
                          </td>
                          <td data-label="Actions">
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {app.status === 'applied' && (
                                <>
                                  <button
                                    className="retro-primary-button"
                                    onClick={() => handleCandidateAction(app.id, 'interview')}
                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'var(--amber)' }}
                                  >
                                    Interview
                                  </button>
                                  <button
                                    className="retro-primary-button"
                                    onClick={() => handleCandidateAction(app.id, 'reject')}
                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'var(--coral)' }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {app.status === 'interview' && (
                                <>
                                  <button
                                    className="retro-primary-button"
                                    onClick={() => handleCandidateAction(app.id, 'offer')}
                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'var(--green)' }}
                                  >
                                    Offer
                                  </button>
                                  <button
                                    className="retro-primary-button"
                                    onClick={() => handleCandidateAction(app.id, 'reject')}
                                    style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'var(--coral)' }}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {(app.status === 'accepted' || app.status === 'rejected') && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--ink-mute)' }}>
                                  {app.status === 'accepted' ? '✓ Offered' : '✗ Rejected'}
                                </span>
                              )}
                              <button
                                className="retro-ghost-button"
                                onClick={() => handleSendEmail(app.id)}
                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                              >
                                Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Semantic Map Page */}
          {currentPage === 'semantic-map' && (
            <div>
              <div className="recruiter-card" style={{ marginBottom: '1.5rem' }}>
                <div className="recruiter-card-header">
                  <div>
                    <p className="recruiter-sidebar-title">Business Portal</p>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Semantic Embedding Map</h1>
                  </div>
                  <select
                    className="recruiter-form-select"
                    value={selectedJobForVisualization || ''}
                    onChange={(e) => setSelectedJobForVisualization(parseInt(e.target.value))}
                    style={{ width: 'auto', minWidth: '250px' }}
                  >
                    <option value="">Select a job to visualize</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="recruiter-card">
                {selectedJobForVisualization ? (
                  <SemanticMap
                    jobId={selectedJobForVisualization}
                    onCandidateClick={(candidateId, applicationId) => {
                      // Handle candidate click - could open a modal or navigate to candidate details
                      alert(`Candidate ID: ${candidateId}\nApplication ID: ${applicationId}\n\nFeature coming soon: Full candidate profile view`);
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '500px',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
                        📊 Select a job to view semantic embedding visualization
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '12px' }}>
                        Choose a job from the dropdown above to see how candidates cluster based on their profile embeddings
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CompanyBadge({ text, tone = 'coral', size = 44 }) {
  return (
    <div className={`retro-company-badge ${tone}`} style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
      {text || 'AI'}
    </div>
  );
}

function Pill({ children, tone = 'sage', filled = false }) {
  return <span className={`retro-pill ${tone} ${filled ? 'filled' : ''}`}>{children}</span>;
}