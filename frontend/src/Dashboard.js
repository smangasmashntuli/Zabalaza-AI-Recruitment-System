import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import CandidateProfile from './CandidateProfile';
import { getCandidateProfile, getMyApplications, getJobMatches, applyForJob } from './api/candidates';
import { getJobs } from './api/jobs';
import { getCurrentUser } from './api/auth';
import { calculateAnalytics, generateInsights, calculateProfileCompletion } from './api/analytics';
import { formatApplication, formatRecommendation, getUserInitials } from './utils/formatters';
import JobPortal from "./JobPortal";
import { Applications } from "./Applications";

function Dashboard({ onLogout }) {
  const [activeView, setActiveView] = useState('overview');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);

  // Dynamic data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchDashboardData().then(r => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user data
      const currentUser = getCurrentUser();
      if (!currentUser) {
        onLogout?.();
        return;
      }

      // Fetch candidate profile
      const profile = await getCandidateProfile();
      setCandidateProfile(profile);

      // Fetch applications with job details
      const apps = await getMyApplications();

      // Fetch all jobs to get details for applications
      const jobs = await getJobs();

      // Format applications with job details
      const formattedApps = apps.map(app => {
        const job = jobs.find(j => j.id === app.job_id);
        return formatApplication(app, job);
      }).filter(app => app !== null);

      setApplications(formattedApps);

      // Fetch job matches/recommendations
      try {
        const matches = await getJobMatches(10);
        const formattedMatches = matches.map((match, index) =>
          formatRecommendation(match, index)
        );
        setRecommendations(formattedMatches);
      } catch (err) {
        console.warn('Could not fetch job matches:', err);
        setRecommendations([]);
      }

      // Calculate analytics
      const analyticsData = calculateAnalytics(apps);
      setAnalytics(analyticsData);

      // Generate insights
      const insightsData = generateInsights(apps, profile);
      setInsights(insightsData);

      // Set user profile data
      setUserProfile({
        name: currentUser.full_name || currentUser.username,
        title: profile.title || profile.profile_summary || currentUser.email || currentUser.username,
        avatar: getUserInitials(currentUser.full_name || currentUser.username),
        profileComplete: calculateProfileCompletion(profile)
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (/session has expired|validate credentials/i.test(err.message || '')) {
        onLogout?.();
        return;
      }
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle quick apply
  const handleQuickApply = async (jobId) => {
    try {
      await applyForJob({
        job_id: jobId,
        cover_letter: 'Quick application via AI match recommendation'
      });
      // Refresh applications
      await fetchDashboardData();
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    }
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'applied') return app.status === 'applied';
    if (selectedFilter === 'interview') return app.status === 'interview_scheduled';
    if (selectedFilter === 'offer') return app.status === 'offer_received';
    return true;
  });

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard loading-state">
        <div className="loading-spinner">
          <h2>Loading your dashboard...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard error-state">
        <div className="error-message">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  // Fallback data if no data loaded
  const displayUserProfile = userProfile || {
    name: 'User',
    title: 'Profile incomplete',
    avatar: 'U',
    profileComplete: 0
  };

  const displayAnalytics = analytics || {
    applications: { value: 0, change: 0, period: 'vs last month', positive: false },
    interviews: { value: 0, change: 0, period: 'scheduled', positive: false },
    responseRate: { value: 0, change: 0, period: 'vs average', positive: false },
    offers: { value: 0, change: 0, period: 'pending', positive: false }
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

  const profileChecklist = [
    {
      label: 'Complete basic information',
      completed: Boolean(candidateProfile?.phone && candidateProfile?.location),
    },
    {
      label: 'Add work experience',
      completed: Boolean(candidateProfile?.work_experience_list?.length),
    },
    {
      label: 'Upload resume',
      completed: Boolean(candidateProfile?.resume_path || candidateProfile?.resume_text),
    },
    {
      label: 'Add certifications',
      completed: Boolean(candidateProfile?.certifications?.length),
    },
  ];

  const dynamicNotificationCount =
    insights.length +
    profileChecklist.filter((item) => !item.completed).length +
    (recommendations.length > 0 ? 1 : 0);

  const businessActions = [
    { label: 'Post a job', description: 'Recruiters can publish a new opening on Career Hub.' },
    { label: 'Create a Company Page', description: 'Create a company page and submit it for verification.' },
    { label: 'Hire on Career Hub', description: 'Start the hiring workflow and manage applicants.' },
  ];

  const candidateSkills = candidateProfile?.skills_list || [];
  const topRecommendations = recommendations.slice(0, 3);
  const nearMatches = recommendations
    .filter((job) => job.match >= 55 && job.match < 80)
    .slice(0, 3)
    .map((job) => ({
      ...job,
      missingSkills: job.tags.filter((tag) => !candidateSkills.includes(tag)).slice(0, 3),
    }));

  const targetCompanies = Array.from(
    new Set(recommendations.map((job) => job.company).filter(Boolean))
  ).slice(0, 4);

  const careerPaths = [
    {
      title: candidateProfile?.title || 'Current Profile',
      next: topRecommendations[0]?.position || 'Senior Specialist',
      description: 'Best next-step role based on your strongest current match.',
    },
    {
      title: topRecommendations[0]?.position || 'Growth Role',
      next: topRecommendations[1]?.position || 'Leadership Track',
      description: 'A second role to consider as your profile expands.',
    },
  ];

  const learningRecommendations = [
    ...new Set(
      nearMatches.flatMap((job) => job.missingSkills || [])
    ),
  ].slice(0, 4);

  const discoverTips = [
    !candidateProfile?.resume_text && 'Upload your resume to unlock deeper AI matching.',
    !candidateProfile?.work_experience_list?.length && 'Add work experience to improve role seniority matching.',
    !candidateProfile?.education_list?.length && 'Include your education details to strengthen academic fit scoring.',
    candidateSkills.length < 5 && 'Add more skills to improve skill-overlap recommendations.',
  ].filter(Boolean);

  const handleFindJobs = () => {
    setActiveView('jobs');
  };

  const handleBusinessAction = (label) => {
    setShowBusinessMenu(false);
    if (label === 'Create a Company Page') {
      alert('Company page creation will require verification before it is published.');
      return;
    }
    alert(`${label} is available from the business workflow.`);
  };

  const renderDiscoverView = () => (
    <div className="discover-view">
      <section className="discover-hero">
        <div className="discover-hero-content">
          <div>
            <p className="discover-kicker">AI Discovery</p>
            <h2 className="discover-title">Explore what Career Hub sees for you next</h2>
            <p className="discover-subtitle">
              This space combines your profile, application history, and recommendation signals to suggest roles, companies, and next moves.
            </p>
          </div>
          <div className="discover-summary-card">
            <span className="discover-summary-label">Profile Strength</span>
            <strong className="discover-summary-value">{displayUserProfile.profileComplete}%</strong>
            <span className="discover-summary-meta">{candidateSkills.length} tracked skills</span>
          </div>
        </div>
      </section>

      <section className="discover-section">
        <div className="discover-section-header">
          <h3>Top Matches</h3>
          <span>{topRecommendations.length} strongest recommendations</span>
        </div>
        <div className="discover-card-grid">
          {topRecommendations.length === 0 ? (
            <div className="discover-empty-card">
              <Icon name="sparkles" size={28} />
              <p>Complete your profile to generate AI-ranked job matches here.</p>
            </div>
          ) : (
            topRecommendations.map((job) => (
              <article key={job.id} className="discover-job-card">
                <div className="discover-job-top">
                  <div className="discover-company-mark">{job.companyLogo}</div>
                  <span className="discover-match-score">{job.match}% Match</span>
                </div>
                <h4>{job.position}</h4>
                <p className="discover-company-name">{job.company}</p>
                <div className="discover-meta-row">
                  <span><Icon name="location" size={14} /> {job.location}</span>
                  <span><Icon name="money" size={14} /> {job.salary}</span>
                </div>
                <div className="discover-tag-row">
                  {job.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="discover-tag">{tag}</span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="discover-two-column">
        <div className="discover-panel">
          <div className="discover-section-header">
            <h3>Near Matches</h3>
            <span>Roles you can unlock with a few improvements</span>
          </div>
          {nearMatches.length === 0 ? (
            <div className="discover-empty-card compact">
              <Icon name="chart" size={24} />
              <p>No near-match roles yet. More recommendations will appear as your profile grows.</p>
            </div>
          ) : (
            nearMatches.map((job) => (
              <div key={job.id} className="discover-list-card">
                <div className="discover-list-header">
                  <div>
                    <h4>{job.position}</h4>
                    <p>{job.company}</p>
                  </div>
                  <span className="discover-soft-badge">{job.match}%</span>
                </div>
                <p className="discover-list-note">
                  Missing skills: {job.missingSkills?.length ? job.missingSkills.join(', ') : 'No major skill gaps detected'}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="discover-panel">
          <div className="discover-section-header">
            <h3>Learning Focus</h3>
            <span>Skills to improve your next recommendation wave</span>
          </div>
          <div className="discover-learning-list">
            {learningRecommendations.length === 0 ? (
              <div className="discover-empty-card compact">
                <Icon name="bookmark" size={24} />
                <p>Your profile already covers the main skills in current matches.</p>
              </div>
            ) : (
              learningRecommendations.map((item) => (
                <div key={item} className="discover-learning-item">
                  <div className="discover-learning-icon">
                    <Icon name="check" size={14} />
                  </div>
                  <span>{item}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="discover-two-column">
        <div className="discover-panel">
          <div className="discover-section-header">
            <h3>Career Paths</h3>
            <span>AI-suggested role progression</span>
          </div>
          <div className="discover-paths">
            {careerPaths.map((path, index) => (
              <div key={`${path.title}-${index}`} className="discover-path-card">
                <span className="discover-path-current">{path.title}</span>
                <Icon name="arrow" size={16} />
                <span className="discover-path-next">{path.next}</span>
                <p>{path.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="discover-panel">
          <div className="discover-section-header">
            <h3>Companies to Explore</h3>
            <span>Based on your top recommendation patterns</span>
          </div>
          <div className="discover-company-grid">
            {targetCompanies.length === 0 ? (
              <div className="discover-empty-card compact">
                <Icon name="users" size={24} />
                <p>Company suggestions will appear once enough recommendations are available.</p>
              </div>
            ) : (
              targetCompanies.map((company) => (
                <div key={company} className="discover-company-card">
                  <div className="discover-company-badge">{getUserInitials(company)}</div>
                  <span>{company}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="discover-section">
        <div className="discover-section-header">
          <h3>Profile Improvement Tips</h3>
          <span>Generated from your current profile signals</span>
        </div>
        <div className="discover-tips">
          {discoverTips.length === 0 ? (
            <div className="discover-empty-card compact">
              <Icon name="sparkles" size={24} />
              <p>Your profile already covers the core recommendation inputs.</p>
            </div>
          ) : (
            discoverTips.map((tip) => (
              <div key={tip} className="discover-tip-card">
                <Icon name="lightning" size={18} />
                <span>{tip}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  // SVG Icons Library
  const Icon = ({ name, size = 20 }) => {
    const icons = {
      briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
      chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
      users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      trending: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
      location: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
      money: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
      filter: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />,
      send: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
      check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
      arrow: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />,
      plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
      bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
      settings: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
      sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
      bookmark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
      lightning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    };
    return (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[name] || icons['star']}
      </svg>
    );
  };

  return (
    <div className="dashboard">
      {/* Candidate Profile Modal */}
      {showProfile && <CandidateProfile onClose={() => setShowProfile(false)} />}

      {/* Modern Header with Navigation */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-icon">
                <Icon name="briefcase" size={24} />
              </div>
              <h1 className="app-title">CareerHub</h1>
            </div>

            <nav className="main-nav">
              <button
                className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveView('overview')}
              >
                <Icon name="chart" size={18} />
                Overview
              </button>
              <button
                className={`nav-item ${activeView === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveView('applications')}
              >
                <Icon name="briefcase" size={18} />
                Applications
              </button>
              <button
                className={`nav-item ${activeView === 'jobs' ? 'active' : ''}`}
                onClick={() => setActiveView('jobs')}
              >
                <Icon name="search" size={18} />
                Find Jobs
              </button>
              <button
                className={`nav-item ${activeView === 'discover' ? 'active' : ''}`}
                onClick={() => setActiveView('discover')}
              >
                <Icon name="sparkles" size={18} />
                Discover
              </button>
            </nav>
          </div>

          <div className="header-right">
            <button className="icon-button">
              <Icon name="bell" size={20} />
              {dynamicNotificationCount > 0 && <span className="notification-badge">{dynamicNotificationCount}</span>}
            </button>
            <button className="icon-button">
              <Icon name="settings" size={20} />
            </button>
            <div className="business-menu-wrapper">
              <button
                className={`icon-button business-trigger ${showBusinessMenu ? 'open' : ''}`}
                onClick={() => setShowBusinessMenu((current) => !current)}
              >
                <Icon name="briefcase" size={20} />
              </button>
              {showBusinessMenu && (
                <div className="business-dropdown">
                  {businessActions.map((action) => (
                    <button
                      key={action.label}
                      className="business-dropdown-item"
                      onClick={() => handleBusinessAction(action.label)}
                    >
                      <span className="business-dropdown-title">{action.label}</span>
                      <span className="business-dropdown-description">{action.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="user-profile-header" onClick={() => setShowProfile(true)}>
              <div className="user-avatar-small">{displayUserProfile.avatar}</div>
              <div className="user-info-small">
                <span className="user-name-small">{displayUserProfile.name}</span>
                <span className="user-title-small">{displayUserProfile.title}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="logout-button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="content-wrapper">

        {activeView === 'jobs' ? (
            <JobPortal
              onCompleteProfile={() => setShowProfile(true)}
              initialSearchQuery={searchQuery}
              initialLocation={searchLocation}
            />
          ) : activeView === 'applications' ? (
            <Applications />
          ) : activeView === 'discover' ? (
            renderDiscoverView()
          ) : (
            <>

          {/* Hero Section with Search */}
          <section className="hero-section">
            <div className="hero-content">
              <h2 className="hero-title">Find Your Dream Job</h2>
              <p className="hero-subtitle">Discover opportunities that match your skills and aspirations</p>

              <div className="search-bar-container">
                <div className="search-bar">
                  <div className="search-segment">
                    <Icon name="search" size={20} />
                    <input
                      type="text"
                      placeholder="Search by job title"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="search-divider"></div>
                  <div className="search-segment">
                    <Icon name="location" size={20} />
                    <input
                      type="text"
                      placeholder="Location"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <button className="find-jobs-button" onClick={handleFindJobs}>
                    Find Jobs
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Analytics Cards */}
          <section className="analytics-section">
            <div className="analytics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon blue">
                    <Icon name="send" size={22} />
                  </div>
                  <span className={`metric-badge ${displayAnalytics.applications.positive ? 'positive' : 'negative'}`}>
                    <Icon name="trending" size={14} />
                    {displayAnalytics.applications.change >= 0 ? '+' : ''}{displayAnalytics.applications.change}
                  </span>
                </div>
                <div className="metric-body">
                  <h3 className="metric-value">{displayAnalytics.applications.value}</h3>
                  <p className="metric-label">Total Applications</p>
                  <p className="metric-period">{displayAnalytics.applications.period}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon green">
                    <Icon name="calendar" size={22} />
                  </div>
                  <span className={`metric-badge ${displayAnalytics.interviews.positive ? 'positive' : 'negative'}`}>
                    <Icon name="trending" size={14} />
                    {displayAnalytics.interviews.change >= 0 ? '+' : ''}{displayAnalytics.interviews.change}
                  </span>
                </div>
                <div className="metric-body">
                  <h3 className="metric-value">{displayAnalytics.interviews.value}</h3>
                  <p className="metric-label">Interviews</p>
                  <p className="metric-period">{displayAnalytics.interviews.period}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon purple">
                    <Icon name="chart" size={22} />
                  </div>
                  <span className={`metric-badge ${displayAnalytics.responseRate.positive ? 'positive' : 'negative'}`}>
                    <Icon name="trending" size={14} />
                    {displayAnalytics.responseRate.change >= 0 ? '+' : ''}{displayAnalytics.responseRate.change}%
                  </span>
                </div>
                <div className="metric-body">
                  <h3 className="metric-value">{displayAnalytics.responseRate.value}%</h3>
                  <p className="metric-label">Response Rate</p>
                  <p className="metric-period">{displayAnalytics.responseRate.period}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon gold">
                    <Icon name="star" size={22} />
                  </div>
                  <span className={`metric-badge ${displayAnalytics.offers.positive ? 'positive' : 'negative'}`}>
                    <Icon name="trending" size={14} />
                    {displayAnalytics.offers.change >= 0 ? '+' : ''}{displayAnalytics.offers.change}
                  </span>
                </div>
                <div className="metric-body">
                  <h3 className="metric-value">{displayAnalytics.offers.value}</h3>
                  <p className="metric-label">Active Offers</p>
                  <p className="metric-period">{displayAnalytics.offers.period}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Insights Section */}
          <section className="insights-section">
            <div className="insights-grid">
              {insights.map((insight, index) => (
                <div key={index} className={`insight-card ${insight.priority}`}>
                  <div className="insight-content">
                    <h4 className="insight-title">{insight.title}</h4>
                    <p className="insight-message">{insight.message}</p>
                  </div>
                  <button className="insight-action">{insight.action}</button>
                </div>
              ))}
            </div>
          </section>

          {/* Main Grid Layout */}
          <div className="content-grid">

            {/* Applications Section */}
            <section className="applications-section">
              <div className="section-header">
                <div className="section-title-group">
                  <h3 className="section-title">Recent Applications</h3>
                  <span className="count-badge">{applications.length}</span>
                </div>
                <div className="section-actions">
                  <select
                    className="filter-select"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                  </select>
                  <button className="text-button">View All</button>
                </div>
              </div>

              <div className="applications-list">
                {filteredApplications.length === 0 ? (
                  <div className="empty-state">
                    <Icon name="briefcase" size={48} />
                    <h3>No Applications Yet</h3>
                    <p>Start exploring job matches and submit your first application!</p>
                    <button className="primary-button" onClick={() => setActiveView('discover')}>
                      Discover Jobs
                    </button>
                  </div>
                ) : (
                  filteredApplications.map((app) => {
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
                            <button className="action-button-small">
                              <Icon name="arrow" size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Sidebar */}
            <aside className="sidebar-section">

              {/* AI Recommendations */}
              <div className="sidebar-card">
                <div className="sidebar-card-header">
                  <div className="header-icon-text">
                    <Icon name="sparkles" size={20} />
                    <h3 className="sidebar-title">AI Matches</h3>
                  </div>
                  <span className="ai-badge-small">SMART</span>
                </div>

                <div className="recommendations-list">
                  {recommendations.length === 0 ? (
                    <div className="empty-state-small">
                      <Icon name="sparkles" size={32} />
                      <p>No job matches yet. Complete your profile to get personalized recommendations!</p>
                      <button className="complete-profile-button" onClick={() => setShowProfile(true)}>
                        Update Profile
                      </button>
                    </div>
                  ) : (
                    recommendations.map((job) => (
                      <div key={job.id} className={`recommendation-card ${job.featured ? 'featured' : ''}`}>
                        {job.featured && (
                          <div className="featured-badge">
                            <Icon name="lightning" size={12} />
                            Hot Match
                          </div>
                        )}

                        <div className="rec-header">
                          <div className="rec-company-logo">{job.companyLogo}</div>
                          <div className="rec-match-badge">{job.match}%</div>
                        </div>

                        <h4 className="rec-title">{job.position}</h4>
                        <p className="rec-company">{job.company}</p>

                        <div className="rec-details">
                          <span className="rec-detail">
                            <Icon name="location" size={14} />
                            {job.location}
                          </span>
                          <span className="rec-detail">
                            <Icon name="money" size={14} />
                            {job.salary}
                          </span>
                        </div>

                        <div className="rec-tags">
                          {job.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="rec-tag">{tag}</span>
                          ))}
                          {job.tags.length > 2 && (
                            <span className="rec-tag-more">+{job.tags.length - 2}</span>
                          )}
                        </div>

                        <div className="rec-footer">
                          <span className="rec-posted">{job.posted}</span>
                          <button
                            className="apply-quick-button"
                            onClick={() => handleQuickApply(job.id)}
                          >
                            Quick Apply
                            <Icon name="arrow" size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="view-more-button">
                  View All Matches
                  <Icon name="arrow" size={16} />
                </button>
              </div>

              {/* Profile Completion */}
              <div className="sidebar-card profile-card">
                <div className="sidebar-card-header">
                  <h3 className="sidebar-title">Profile Strength</h3>
                  <span className="profile-percentage">{displayUserProfile.profileComplete}%</span>
                </div>

                <div className="progress-container">
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${displayUserProfile.profileComplete}%` }}
                    ></div>
                  </div>
                </div>

                <div className="profile-tasks">
                  {profileChecklist.map((item) => (
                    <div key={item.label} className={`task-item ${item.completed ? 'completed' : ''}`}>
                      <div className={`task-check ${item.completed ? '' : 'empty'}`}>
                        {item.completed && <Icon name="check" size={14} />}
                      </div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <button className="complete-profile-button" onClick={() => setShowProfile(true)}>
                  Complete Profile
                  <Icon name="arrow" size={16} />
                </button>
              </div>

              {/* Quick Actions */}
              <div className="sidebar-card quick-actions-card">
                <h3 className="sidebar-title quick-actions-title">Quick Actions</h3>
                <div className="quick-actions">
                  <button className="quick-action-btn">
                    <Icon name="plus" size={18} />
                    New Application
                  </button>
                  <button className="quick-action-btn">
                    <Icon name="bookmark" size={18} />
                    Saved Jobs
                  </button>
                </div>
              </div>

            </aside>
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
