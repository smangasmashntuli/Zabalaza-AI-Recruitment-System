import React, { useState, useEffect, useCallback } from 'react';
import './Applications.css';
import { getMyApplications } from './api/candidates';
import { getJob } from './api/jobs';

export function Applications() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    applications: { value: 0, change: 0, period: 'vs last month' },
    interviews: { value: 0, change: 0, period: 'scheduled' },
    responseRate: { value: 0, change: 0, period: 'this month' },
    offers: { value: 0, change: 0, period: 'active' }
  });

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const applicationsData = await getMyApplications();

      // Transform applications data
      const transformedApplications = await Promise.all(
        applicationsData.map(async (app) => {
          try {
            // Fetch job details for each application
            const jobData = await getJob(app.job_id);

            return {
              id: app.id,
              position: jobData.title,
              company: jobData.recruiter?.full_name || 'Company',
              companyLogo: getCompanyInitials(jobData.recruiter?.full_name || 'Company'),
              location: jobData.location || 'Remote',
              workType: formatWorkType(jobData.job_type),
              salary: formatSalary(jobData.salary_min, jobData.salary_max),
              status: mapApplicationStatus(app.status),
              stage: getStageText(app.status),
              date: formatDate(app.applied_at),
              nextAction: getNextAction(app.status),
              match: Math.round(app.match_score * 100) || 0,
              tags: parseSkills(jobData.skills),
              jobData: jobData,
              applicationData: app
            };
          } catch (err) {
            console.error(`Error fetching job ${app.job_id}:`, err);
            return null;
          }
        })
      );

      // Filter out null values (failed fetches)
      const validApplications = transformedApplications.filter(app => app !== null);
      setApplications(validApplications);

      // Calculate analytics
      calculateAnalytics(validApplications, applicationsData);

    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const calculateAnalytics = (apps) => {
    const totalApps = apps.length;
    const interviews = apps.filter(app =>
      app.status === 'interview_scheduled' || app.status === 'interview'
    ).length;
    const offers = apps.filter(app => app.status === 'offer_received').length;

    // Calculate response rate (applications that moved beyond 'applied')
    const responded = apps.filter(app => app.status !== 'applied').length;
    const responseRate = totalApps > 0 ? Math.round((responded / totalApps) * 100) : 0;

    setAnalytics({
      applications: { value: totalApps, change: 12, period: 'vs last month' },
      interviews: { value: interviews, change: interviews, period: 'scheduled' },
      responseRate: { value: responseRate, change: 8, period: 'this month' },
      offers: { value: offers, change: offers, period: 'active' }
    });
  };

  // Helper functions for data transformation
  const getCompanyInitials = (companyName) => {
    return companyName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatWorkType = (jobType) => {
    const typeMap = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'contract': 'Contract',
      'remote': 'Remote',
      'hybrid': 'Hybrid',
      'on-site': 'On-site'
    };
    return typeMap[jobType?.toLowerCase()] || 'Full-time';
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Competitive';
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    return min ? `$${(min / 1000).toFixed(0)}k+` : `Up to $${(max / 1000).toFixed(0)}k`;
  };

  const mapApplicationStatus = (backendStatus) => {
    const statusMap = {
      'pending': 'applied',
      'reviewed': 'under_review',
      'shortlisted': 'under_review',
      'interview': 'interview_scheduled',
      'rejected': 'rejected',
      'accepted': 'offer_received'
    };
    return statusMap[backendStatus?.toLowerCase()] || 'applied';
  };

  const getStageText = (status) => {
    const stageMap = {
      'applied': 'Application Submitted',
      'under_review': 'Resume Review',
      'interview_scheduled': 'Interview Scheduled',
      'offer_received': 'Offer Received',
      'rejected': 'Application Closed'
    };
    return stageMap[status] || 'Application Submitted';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const getNextAction = (status) => {
    const actionMap = {
      'applied': 'Awaiting update',
      'under_review': 'Awaiting response',
      'interview_scheduled': 'Prepare for interview',
      'offer_received': 'Review offer',
      'rejected': 'Application closed'
    };
    return actionMap[status] || 'Awaiting update';
  };

  const parseSkills = (skillsString) => {
    try {
      const skills = typeof skillsString === 'string' ? JSON.parse(skillsString) : skillsString;
      return Array.isArray(skills) ? skills.slice(0, 5) : [];
    } catch {
      return [];
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'applied': { label: 'Applied', color: 'blue', icon: 'send' },
      'under_review': { label: 'Under Review', color: 'purple', icon: 'search' },
      'interview_scheduled': { label: 'Interview', color: 'green', icon: 'calendar' },
      'offer_received': { label: 'Offer', color: 'gold', icon: 'star' },
      'rejected': { label: 'Not Selected', color: 'gray', icon: 'close' }
    };
    return statusMap[status] || statusMap['applied'];
  };

  // SVG Icons Library
  const Icon = ({ name, size = 20 }) => {
    const icons = {
      briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
      chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
      trending: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
      location: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
      money: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      send: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
      arrow: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    };
    return (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[name] || icons['star']}
      </svg>
    );
  };

  // Loading state
  if (loading && applications.length === 0) {
    return (
      <div className="applications-view">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading applications...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && applications.length === 0) {
    return (
      <div className="applications-view">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Error Loading Applications</h2>
          <p className="applications-state-error" style={{ marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchApplications} className="applications-state-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && applications.length === 0) {
    return (
      <div className="applications-view">
        <div className="view-header">
          <div>
            <h1 className="view-title">My Applications</h1>
            <p className="view-subtitle">Track and manage all your job applications in one place</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
          <h2 style={{ marginBottom: '8px' }}>No Applications Yet</h2>
          <p className="applications-state-text" style={{ marginBottom: '24px' }}>
            Start applying to jobs to see them here
          </p>
          <button onClick={() => window.location.href = '#/jobs'} className="applications-state-button">
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-view">
      <div className="view-header">
        <div>
          <h1 className="view-title">My Applications</h1>
          <p className="view-subtitle">Track and manage all your job applications in one place</p>
        </div>
        <div className="header-actions">
          <select
            className="filter-select"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="all">All Applications</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="offer_received">Offer Received</option>
          </select>
        </div>
      </div>

      {/* Applications Stats */}
      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon blue">
              <Icon name="send" size={22} />
            </div>
            <span className="metric-badge positive">
              <Icon name="trending" size={14} />
              +{analytics.applications.change}%
            </span>
          </div>
          <div className="metric-body">
            <h3 className="metric-value">{analytics.applications.value}</h3>
            <p className="metric-label">Total Applications</p>
            <p className="metric-period">{analytics.applications.period}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon green">
              <Icon name="calendar" size={22} />
            </div>
            <span className="metric-badge positive">
              <Icon name="trending" size={14} />
              +{analytics.interviews.change}
            </span>
          </div>
          <div className="metric-body">
            <h3 className="metric-value">{analytics.interviews.value}</h3>
            <p className="metric-label">Interviews</p>
            <p className="metric-period">{analytics.interviews.period}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon purple">
              <Icon name="chart" size={22} />
            </div>
            <span className="metric-badge positive">
              <Icon name="trending" size={14} />
              +{analytics.responseRate.change}%
            </span>
          </div>
          <div className="metric-body">
            <h3 className="metric-value">{analytics.responseRate.value}%</h3>
            <p className="metric-label">Response Rate</p>
            <p className="metric-period">{analytics.responseRate.period}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <div className="metric-icon gold">
              <Icon name="star" size={22} />
            </div>
            <span className="metric-badge positive">
              <Icon name="trending" size={14} />
              +{analytics.offers.change}
            </span>
          </div>
          <div className="metric-body">
            <h3 className="metric-value">{analytics.offers.value}</h3>
            <p className="metric-label">Active Offers</p>
            <p className="metric-period">{analytics.offers.period}</p>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="applications-list-section">
        <h2 className="section-title">All Applications ({applications.filter(app => selectedFilter === 'all' || app.status === selectedFilter).length})</h2>
        <div className="applications-list">
          {applications
            .filter(app => selectedFilter === 'all' || app.status === selectedFilter)
            .map((app) => {
              const statusInfo = getStatusInfo(app.status);
              return (
                <div key={app.id} className="application-card">
                  <div className="application-header">
                    <div className="company-logo-container">
                      <div className="company-logo">{app.companyLogo}</div>
                    </div>
                    <div className="application-info">
                      <div className="application-title-row">
                        <h4 className="application-title">{app.position}</h4>
                        <div className={`status-pill ${statusInfo.color}`}>
                          {statusInfo.label}
                        </div>
                      </div>
                      <p className="company-name">{app.company}</p>
                    </div>
                  </div>

                  <div className="application-details">
                    <div className="detail-item">
                      <Icon name="location" size={16} />
                      <span>{app.location}</span>
                    </div>
                    <div className="detail-item">
                      <Icon name="briefcase" size={16} />
                      <span>{app.workType}</span>
                    </div>
                    <div className="detail-item">
                      <Icon name="money" size={16} />
                      <span>{app.salary}</span>
                    </div>
                  </div>

                  <div className="application-tags">
                    {app.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>

                  <div className="application-footer">
                    <div className="footer-left">
                      <div className="match-indicator">
                        <Icon name="star" size={16} />
                        <span className="match-score">{app.match}% Match</span>
                      </div>
                      <span className="application-date">{app.date}</span>
                    </div>
                    <div className="footer-right">
                      <span className="next-action">{app.nextAction}</span>
                      <button className="action-button-small" onClick={() => {
                        if (app.jobData?.id) {
                          window.open(`/job/${app.jobData.id}`, '_self');
                        }
                      }} title="View job details">
                        <Icon name="arrow" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
