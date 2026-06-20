import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import CandidateProfile from './CandidateProfile';
import {
  applyForJob,
  getCandidateProfile,
  getCareerPath,
  getJobMatchesWithInsights,
  getMyApplications,
  getNotifications,
  getProfileImprovementTips,
} from './api/candidates';
import { getJobs, createJob, getJobApplications } from './api/jobs';
import { getDiscoverIntelligence } from './api/intelligence';
import { getCurrentUser } from './api/auth';
import { calculateAnalytics, calculateProfileCompletion, generateInsights } from './api/analytics';
import { formatApplication, formatRecommendation, getUserInitials } from './utils/formatters';
import JobPortal from './JobPortal';
import { Applications } from './Applications';
import SavedJobs from './SavedJobs';
import NotificationsPanel from './Notifications';
import Settings from './Settings';
import ChatBot from './ChatBot';

const Icon = ({ name, size = 18, color = 'currentColor', strokeWidth = 1.8 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /><path d="M9.5 20v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5" /></>,
    briefcase: <><rect x="3" y="7.5" width="18" height="12" rx="1.5" /><path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" /><path d="M3 12.5h18" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.5-4.5" /></>,
    chat: <><path d="M4 5.5h16v10H10l-4 3.5v-3.5H4z" /><path d="M8 9h8" /><path d="M8 12h5" /></>,
    user: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></>,
    bell: <><path d="M7 10a5 5 0 0 1 10 0v4l1.5 2.5h-13L7 14z" /><path d="M10 19.5a2 2 0 0 0 4 0" /></>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
    star: <path d="M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3.1-5.3 3.1 1.2-6L3.4 9.8l6-.7z" />,
    location: <><path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.3" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.2 2" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" />,
    send: <path d="M4 12 20 4l-7 16-2.5-7.5z" />,
    dots: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
    chevDown: <path d="M6 9l6 6 6-6" />,
    building: <><rect x="4" y="3.5" width="10" height="17" /><rect x="15" y="9" width="5" height="11" /><path d="M7 7h1.2M10.8 7H12M7 10.5h1.2M10.8 10.5H12M7 14h1.2M10.8 14H12" /></>,
    trend: <><path d="M4 16l5-5 4 4 7-8" /><path d="M16 6.5h4V10.5" /></>,
    doc: <><path d="M7 3.5h7l3 3v14h-10z" /><path d="M14 3.5V7h3" /></>,
    spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M6 6l2.5 2.5M17.5 17.5L15 15M18 6l-2.5 2.5M6 18l2.5-2.5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    money: <><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.3c0-1 1-1.8 2.5-1.8s2.5.8 2.5 1.8c0 2.4-5 1.6-5 4 0 1 1 1.8 2.5 1.8s2.5-.8 2.5-1.8" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="1.5" /><path d="M3.5 9.5h17" /><path d="M8 3v3.5M16 3v3.5" /></>,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.2 7.2 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.6a7.2 7.2 0 0 0-2 1.2l-2.4-1-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-1a7.2 7.2 0 0 0 2 1.2l.4 2.6h4.4l.4-2.6a7.2 7.2 0 0 0 2-1.2l2.4 1 2-3.5-2-1.5c.1-.4.1-.8.1-1.2z" /></>,
  };
  return <svg {...common}>{paths[name] || paths.star}</svg>;
};

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: 'home' },
  { id: 'jobs', label: 'Find jobs', icon: 'search' },
  { id: 'applications', label: 'Applications', icon: 'briefcase' },
  { id: 'saved', label: 'Saved jobs', icon: 'bookmark' },
  { id: 'coach', label: 'Career coach', icon: 'chat' },
  { id: 'discover', label: 'Discover', icon: 'spark' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const toneClass = ['coral', 'yellow', 'sage', 'sky', 'rose'];

function CompanyBadge({ text, tone = 'coral', size = 44 }) {
  return (
    <div className={`retro-company-badge ${tone}`} style={{ width: size, height: size }}>
      {text || 'AI'}
    </div>
  );
}

function Pill({ children, tone = 'sage', filled = false }) {
  return <span className={`retro-pill ${tone} ${filled ? 'filled' : ''}`}>{children}</span>;
}

function Dashboard({ onLogout, theme, onThemeChange }) {
  const [activeView, setActiveView] = useState('overview');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);
  const [careerPath, setCareerPath] = useState(null);
  const [careerPathNextRoles, setCareerPathNextRoles] = useState([]);
  const [careerPathSkills, setCareerPathSkills] = useState([]);
  const [careerPathTrendingSkills, setCareerPathTrendingSkills] = useState([]);
  const [profileImprovementTips, setProfileImprovementTips] = useState('');
  const [improvementTipsLoading, setImprovementTipsLoading] = useState(false);
  const [discoverData, setDiscoverData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [postJobForm, setPostJobForm] = useState({ title: '', description: '', location: '', job_type: 'full-time', requirements: '' });
  const [postingJob, setPostingJob] = useState(false);
  const [postJobMessage, setPostJobMessage] = useState('');
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [selectedJobApplications, setSelectedJobApplications] = useState(null);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const fetchDashboardData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const currentUser = getCurrentUser();
      if (!currentUser) {
        onLogout?.();
        return;
      }

      const profile = await getCandidateProfile();
      const apps = await getMyApplications();
      const jobs = await getJobs();
      const formattedApps = apps.map((app) => formatApplication(app, jobs.find((job) => job.id === app.job_id))).filter(Boolean);

      setCandidateProfile(profile);
      setApplications(formattedApps);
      setAnalytics(calculateAnalytics(apps));
      setInsights(generateInsights(apps, profile));
      setUserProfile({
        name: currentUser.full_name || currentUser.username,
        title: profile.title || profile.profile_summary || currentUser.email || currentUser.username,
        avatar: getUserInitials(currentUser.full_name || currentUser.username),
        profileComplete: calculateProfileCompletion(profile),
      });

      try {
        const matchesResp = await getJobMatchesWithInsights(10);
        const matches = Array.isArray(matchesResp) ? matchesResp : matchesResp.items || [];
        setRecommendations(matches.map((match, index) => ({
          ...formatRecommendation(match, index),
          matchExplanation: match.match_explanation || '',
          skillGaps: match.skill_gaps || [],
          strengths: match.strengths || [],
        })));
        if (matchesResp?.insights) {
          setInsights((current) => [...current, { title: 'Matching Insight', message: matchesResp.insights, action: 'Update Profile' }]);
        }
        if (matchesResp?.career_path) setCareerPath(matchesResp.career_path);
      } catch (err) {
        console.warn('Could not fetch job matches:', err);
        setRecommendations([]);
      }

      try {
        const [discoverResp, careerResp, notificationsData] = await Promise.all([
          getDiscoverIntelligence().catch(() => null),
          getCareerPath().catch(() => null),
          getNotifications().catch(() => []),
        ]);
        setDiscoverData(discoverResp || null);
        setCareerPath(careerResp?.career_path || careerPath || null);
        setCareerPathNextRoles(Array.isArray(careerResp?.next_roles) ? careerResp.next_roles : []);
        setCareerPathSkills(Array.isArray(careerResp?.learning_recommendations) ? careerResp.learning_recommendations : []);
        setCareerPathTrendingSkills(Array.isArray(careerResp?.trending_skills) ? careerResp.trending_skills : []);
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      } catch {
        setNotifications([]);
      }

      try {
        setImprovementTipsLoading(true);
        const improvementResp = await getProfileImprovementTips();
        setProfileImprovementTips(improvementResp?.improvements || '');
      } catch {
        setProfileImprovementTips('');
      } finally {
        setImprovementTipsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (/session has expired|validate credentials/i.test(err.message || '')) {
        onLogout?.();
        return;
      }
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshNotifications = async () => {
      try {
        const notificationsData = await getNotifications();
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      } catch {
        // Keep the current notification list.
      }
    };

    const interval = window.setInterval(refreshNotifications, 60000);
    window.addEventListener('focus', refreshNotifications);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshNotifications);
    };
  }, []);

  useEffect(() => {
    if (activeView === 'recruiter-analytics') {
      fetchRecruiterJobs();
    }
  }, [activeView]);

  const fetchRecruiterJobs = async () => {
    try {
      const jobs = await getJobs({ limit: 100 });
      const currentUser = getCurrentUser();
      const userJobs = jobs.filter((job) => job.recruiter_id === currentUser?.id);
      setRecruiterJobs(userJobs);
    } catch (err) {
      console.error('Failed to fetch recruiter jobs:', err);
    }
  };

  useEffect(() => {
    if (selectedJobApplications && selectedJobApplications.id) {
      const loadApplications = async () => {
        try {
          setApplicationsLoading(true);
          const apps = await getJobApplications(selectedJobApplications.id);
          setSelectedJobApplications((prev) => ({ ...prev, applications: apps }));
        } catch (err) {
          console.error('Failed to load applications:', err);
        } finally {
          setApplicationsLoading(false);
        }
      };
      loadApplications().then(r => r);
    }
  }, [selectedJobApplications?.id]);

  const displayUserProfile = userProfile || { name: '', title: '', avatar: '', profileComplete: 0 };
  const displayAnalytics = analytics || {
    applications: { value: 0, change: 0, period: 'vs last month', positive: false },
    interviews: { value: 0, change: 0, period: 'scheduled', positive: false },
    responseRate: { value: 0, change: 0, period: 'vs average', positive: false },
    offers: { value: 0, change: 0, period: 'pending', positive: false },
  };
  const candidateSkills = candidateProfile?.skills_list || [];
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const profileChecklist = [
    { label: 'Complete basic information', completed: Boolean(candidateProfile?.phone && candidateProfile?.location) },
    { label: 'Add work experience', completed: Boolean(candidateProfile?.work_experience_list?.length) },
    { label: 'Upload resume', completed: Boolean(candidateProfile?.resume_path || candidateProfile?.resume_text) },
    { label: 'Add certifications', completed: Boolean(candidateProfile?.certifications?.length) },
  ];

  const topRecommendations = recommendations.slice(0, 3);
  const nearMatches = recommendations
    .filter((job) => job.match >= 55 && job.match < 80)
    .slice(0, 3)
    .map((job) => ({ ...job, missingSkills: (job.tags || []).filter((tag) => !candidateSkills.includes(tag)).slice(0, 3) }));
  const discoverInsights = discoverData?.discover || null;
  const targetCompanies = Array.from(new Set([
    ...(discoverInsights?.top_companies || []),
    ...recommendations.map((job) => job.company).filter(Boolean),
  ])).slice(0, 4);
  const learningRecommendations = careerPathSkills.length > 0
    ? [...new Set([...careerPathSkills, ...careerPathTrendingSkills])].slice(0, 5)
    : [...new Set([...nearMatches.flatMap((job) => job.missingSkills || []), ...careerPathTrendingSkills])].slice(0, 5);
  const dynamicCareerPaths = (() => {
    const nextRoles = careerPathNextRoles.length ? careerPathNextRoles : discoverInsights?.career_path?.next_roles || [];
    if (nextRoles.length) {
      return nextRoles.slice(0, 3).map((role, index) => ({
        current: index === 0 ? candidateProfile?.title || displayUserProfile.title || 'Current role' : nextRoles[index - 1],
        next: role,
        description: [careerPath, learningRecommendations.length ? `Focus areas: ${learningRecommendations.slice(0, 3).join(', ')}` : ''].filter(Boolean).join(' - '),
      }));
    }
    return topRecommendations.slice(0, 2).map((job) => ({
      current: candidateProfile?.title || displayUserProfile.title || 'Current role',
      next: job.position || job.title,
      description: job.matchExplanation || `Match score: ${job.match}%`,
    }));
  })();
  const discoverTips = [
    profileImprovementTips,
    !candidateProfile?.resume_text && 'Upload your resume to unlock deeper AI matching.',
    !candidateProfile?.work_experience_list?.length && 'Add work experience to improve role seniority matching.',
    candidateSkills.length < 5 && 'Add more skills to improve skill-overlap recommendations.',
  ].filter(Boolean).slice(0, 4);

  const businessActions = [
    { label: 'Post a Job', description: 'Create a job opening for your organization.' },
    { label: 'View Applications', description: 'See all candidates who applied to your jobs.' },
  ];

  const filteredApplications = applications.filter((app) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'applied') return app.status === 'applied';
    if (selectedFilter === 'interview') return app.status === 'interview_scheduled';
    if (selectedFilter === 'offer') return app.status === 'offer_received';
    return true;
  });

  const handleQuickApply = async (jobId) => {
    try {
      await applyForJob({ job_id: jobId, cover_letter: 'Quick application via AI match recommendation' });
      await fetchDashboardData();
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    }
  };

  const handleFindJobs = () => setActiveView('jobs');
  const handleBusinessAction = (label) => {
    setShowBusinessMenu(false);
    if (label === 'Post a Job') {
      setActiveView('post-job');
    } else if (label === 'View Applications') {
      setActiveView('recruiter-analytics');
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!postJobForm.title || !postJobForm.description || !postJobForm.location) {
      setPostJobMessage('Please fill in all required fields.');
      return;
    }
    try {
      setPostingJob(true);
      setPostJobMessage('');
      await createJob({
        title: postJobForm.title,
        description: postJobForm.description,
        location: postJobForm.location,
        job_type: postJobForm.job_type,
        requirements: postJobForm.requirements,
      });
      setPostJobMessage('Job posted successfully!');
      setPostJobForm({ title: '', description: '', location: '', job_type: 'full-time', requirements: '' });
      setTimeout(() => setActiveView('overview'), 2000);
    } catch (err) {
      setPostJobMessage(err.message || 'Failed to post job.');
    } finally {
      setPostingJob(false);
    }
  };

  const renderRecruiterAnalyticsView = () => (
    <div className="retro-page">
      <div className="retro-page-header">
        <p className="retro-muted">Business Portal</p>
        <h1>Job Applications & Analytics</h1>
      </div>

      <section className="retro-card">
        <h2 style={{ marginBottom: '16px' }}>Your Posted Jobs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {recruiterJobs.map((job) => (
            <div key={job.id} style={{ border: '2px solid var(--ink)', borderRadius: '12px', padding: '16px', cursor: 'pointer' }} onClick={() => setSelectedJobApplications(job)}>
              <h3 style={{ margin: '0 0 8px 0' }}>{job.title}</h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ink-mute)' }}>{job.location}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px' }}>{job.application_count || 0} applications</strong>
                <span style={{ fontSize: '12px', color: 'var(--ink-mute)' }}>Click to view</span>
              </div>
            </div>
          ))}
          {recruiterJobs.length === 0 && <p style={{ gridColumn: '1 / -1' }}>No jobs posted yet. <button className="retro-link-button" onClick={() => setActiveView('post-job')}>Post a job</button></p>}
        </div>
      </section>

      {selectedJobApplications && (
        <section className="retro-card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2>{selectedJobApplications.title} - Applicants</h2>
            <button className="retro-ghost-button" onClick={() => setSelectedJobApplications(null)}>Close</button>
          </div>
          {applicationsLoading ? <p>Loading applications...</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {selectedJobApplications.applications?.map((app) => (
              <div key={app.id} style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{app.candidate_name}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--ink-mute)' }}>{app.candidate_email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: 'var(--yellow)', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', marginBottom: '4px' }}>Match: {Math.round(app.match_score * 100)}%</div>
                  <small style={{ color: 'var(--ink-mute)' }}>{new Date(app.applied_at).toLocaleDateString()}</small>
                </div>
              </div>
            ))}
            {selectedJobApplications.applications?.length === 0 && <p>No applications yet.</p>}
          </div>}
        </section>
      )}
    </div>
  );

  const renderPostJobView = () => (
    <div className="retro-page">
      <div className="retro-page-header">
        <p className="retro-muted">Business Portal</p>
        <h1>Post a Job Opening</h1>
      </div>

      <section className="retro-card">
        <form onSubmit={handlePostJob} style={{ maxWidth: '600px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Position Title *</label>
            <input
              type="text"
              required
              className="retro-search-field"
              style={{ width: '100%', padding: '10px', border: '2px solid var(--ink)' }}
              placeholder="e.g., Senior React Developer"
              value={postJobForm.title}
              onChange={(e) => setPostJobForm({ ...postJobForm, title: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description *</label>
            <textarea
              required
              style={{ width: '100%', padding: '10px', border: '2px solid var(--ink)', fontFamily: 'inherit', minHeight: '120px' }}
              placeholder="Describe the role and responsibilities..."
              value={postJobForm.description}
              onChange={(e) => setPostJobForm({ ...postJobForm, description: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Location *</label>
            <input
              type="text"
              required
              className="retro-search-field"
              style={{ width: '100%', padding: '10px', border: '2px solid var(--ink)' }}
              placeholder="e.g., New York, NY or Remote"
              value={postJobForm.location}
              onChange={(e) => setPostJobForm({ ...postJobForm, location: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Job Type</label>
              <select
                className="retro-search-field"
                style={{ width: '100%', padding: '10px', border: '2px solid var(--ink)' }}
                value={postJobForm.job_type}
                onChange={(e) => setPostJobForm({ ...postJobForm, job_type: e.target.value })}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Requirements</label>
            <textarea
              style={{ width: '100%', padding: '10px', border: '2px solid var(--ink)', fontFamily: 'inherit', minHeight: '100px' }}
              placeholder="List required skills and qualifications..."
              value={postJobForm.requirements}
              onChange={(e) => setPostJobForm({ ...postJobForm, requirements: e.target.value })}
            />
          </div>

          {postJobMessage && (
            <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: postingJob ? 'transparent' : postJobMessage.includes('success') ? 'rgba(140, 154, 110, 0.1)' : 'rgba(200, 0, 0, 0.1)', borderRadius: '8px', color: postJobMessage.includes('success') ? 'var(--sage)' : 'var(--coral)' }}>
              {postJobMessage}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="retro-primary-button" disabled={postingJob}>
              {postingJob ? 'Posting...' : 'Post Job'}
            </button>
            <button
              type="button"
              className="retro-ghost-button"
              onClick={() => setActiveView('overview')}
              disabled={postingJob}
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  );

  const renderOverview = () => (
    <div className="retro-page">
      <div className="retro-page-header">
        {/*<div>
          <p className="retro-muted">Welcome back</p>
          <h1>Hey {displayUserProfile.name?.split(' ')[0] || 'there'}, let's find your next role.</h1>
        </div>*/}

        <div>
          <p className="retro-muted">Welcome back</p>
          <h1>
            Hey {displayUserProfile.first_name?.split(' ')[0] ||
            displayUserProfile.firstName?.split(' ')[0] ||
            'there'},
            let's find your next role.
          </h1>
        </div>

        <button className="retro-ghost-button" onClick={() => setActiveView('jobs')}><Icon name="search" />Browse jobs</button>
      </div>

      <section className="retro-hero-search">
        <div className="retro-search-field">
          <Icon name="search" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by job title" />
        </div>
        <div className="retro-search-field">
          <Icon name="location" />
          <input value={searchLocation} onChange={(event) => setSearchLocation(event.target.value)} placeholder="Location" />
        </div>
        <button className="retro-primary-button" onClick={handleFindJobs}>Find Jobs</button>
      </section>

      <section className="retro-stats-grid">
        {[
          { label: 'Applications sent', value: displayAnalytics.applications.value, delta: displayAnalytics.applications.period, icon: 'doc', tone: 'coral' },
          { label: 'Interviews', value: displayAnalytics.interviews.value, delta: displayAnalytics.interviews.period, icon: 'calendar', tone: 'yellow' },
          { label: 'Response rate', value: `${displayAnalytics.responseRate.value}%`, delta: displayAnalytics.responseRate.period, icon: 'trend', tone: 'sage' },
          { label: 'Active offers', value: displayAnalytics.offers.value, delta: displayAnalytics.offers.period, icon: 'star', tone: 'sky' },
        ].map((stat) => (
          <article className="retro-card retro-stat-card" key={stat.label}>
            <span className={`retro-icon-box ${stat.tone}`}><Icon name={stat.icon} /></span>
            <strong>{stat.value}</strong>
            <p>{stat.label}</p>
            <small>{stat.delta}</small>
          </article>
        ))}
      </section>

      <div className="retro-content-grid">
        <section className="retro-card retro-section-card">
          <div className="retro-section-header">
            <h2>Recommended for you</h2>
            <button className="retro-link-button" onClick={() => setActiveView('jobs')}>See all <Icon name="arrowRight" size={14} /></button>
          </div>
          <div className="retro-list">
            {topRecommendations.length === 0 ? (
              <div className="retro-empty"><Icon name="spark" />Complete your profile to generate AI-ranked job matches.</div>
            ) : topRecommendations.map((job, index) => (
              <div className="retro-list-item" key={job.id || job.position}>
                <CompanyBadge text={job.companyLogo || job.logo} tone={toneClass[index % toneClass.length]} size={42} />
                <div>
                  <strong>{job.position}</strong>
                  <span>{job.company} - {job.location}</span>
                </div>
                <Pill tone="sage" filled>{job.match}% match</Pill>
                <button className="retro-mini-action" onClick={() => handleQuickApply(job.id)}>Apply</button>
              </div>
            ))}
          </div>
        </section>

        <section className="retro-card retro-section-card">
          <h2>Profile strength</h2>
          <div className="retro-progress"><span style={{ width: `${displayUserProfile.profileComplete}%` }} /></div>
          <p className="retro-muted">{displayUserProfile.profileComplete}% complete</p>
          <div className="retro-checklist">
            {profileChecklist.map((item) => (
              <div key={item.label} className={item.completed ? 'complete' : ''}>
                <Icon name={item.completed ? 'check' : 'clock'} size={14} />
                {item.label}
              </div>
            ))}
          </div>
          <button className="retro-primary-button full" onClick={() => setShowProfile(true)}>Complete Profile</button>
        </section>
      </div>

      <section className="retro-card retro-section-card">
        <div className="retro-section-header">
          <h2>Recent applications</h2>
          <select className="retro-select" value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)}>
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
          </select>
        </div>
        <div className="retro-application-grid">
          {filteredApplications.slice(0, 4).map((app, index) => (
            <article className="retro-application-card" key={app.id}>
              <CompanyBadge text={app.companyLogo} tone={toneClass[index % toneClass.length]} size={40} />
              <div>
                <strong>{app.position}</strong>
                <span>{app.company}</span>
              </div>
              <Pill tone={app.status === 'interview_scheduled' ? 'sage' : 'yellow'} filled>{app.status?.replace('_', ' ') || 'Applied'}</Pill>
            </article>
          ))}
          {filteredApplications.length === 0 && <div className="retro-empty"><Icon name="briefcase" />No applications yet.</div>}
        </div>
      </section>

      {insights.length > 0 && (
        <section className="retro-card retro-section-cards">
          <div className="retro-section-header">
            <h2>AI insights</h2>
            <span>{insights.length} signals</span>
          </div>
          <div className="retro-tip-grid">
            {insights.slice(0, 3).map((insight, index) => (
              <div className="retro-tip" key={`${insight.title}-${index}`}>
                <Icon name="spark" size={15} />
                <span><strong>{insight.title}</strong> {insight.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const renderDiscoverView = () => (
    <div className="retro-page discover-view">
      <section className="retro-card retro-discover-hero">
        <div>
          <p className="retro-muted">AI Discovery</p>
          <h1>Explore what Career Hub sees for you next</h1>
          <p>This space combines your profile, application history, and recommendation signals to suggest roles, companies, and next moves.</p>
        </div>
        <div className="retro-summary-tile">
          <span>Profile Strength</span>
          <strong>{displayUserProfile.profileComplete}%</strong>
          <small>{candidateSkills.length} tracked skills</small>
        </div>
      </section>

      {careerPath && (
        <section className="retro-card retro-section-card">
          <div className="retro-section-header"><h2>Gemini Career Guidance</h2><span>LLM-powered next-step advice</span></div>
          <p className="retro-readable">{careerPath}</p>
        </section>
      )}

      <div className="retro-content-grid">
        <section className="retro-card retro-section-card">
          <div className="retro-section-header"><h2>Top Matches</h2><span>{topRecommendations.length} strongest recommendations</span></div>
          <div className="retro-tile-grid">
            {topRecommendations.length === 0 ? <div className="retro-empty"><Icon name="spark" />Complete your profile to generate matches.</div> : topRecommendations.map((job, index) => (
              <article className="retro-mini-card" key={job.id || job.position}>
                <div className="retro-card-top"><CompanyBadge text={job.companyLogo || job.logo} tone={toneClass[index % toneClass.length]} /><Pill tone="sage" filled>{job.match}%</Pill></div>
                <h3>{job.position}</h3>
                <p>{job.company}</p>
                <div className="retro-tags">{(job.tags || []).slice(0, 3).map((tag) => <Pill key={tag}>{tag}</Pill>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="retro-card retro-section-card">
          <div className="retro-section-header"><h2>Learning focus</h2><span>{learningRecommendations.length} skills</span></div>
          <div className="retro-list compact">
            {learningRecommendations.length === 0 ? <div className="retro-empty"><Icon name="doc" />No learning gaps yet.</div> : learningRecommendations.map((skill) => (
              <div className="retro-list-item" key={skill}><Icon name="check" size={15} /> <strong>{skill}</strong></div>
            ))}
          </div>
        </section>
      </div>

      <div className="retro-content-grid">
        <section className="retro-card retro-section-card">
          <div className="retro-section-header"><h2>Career path</h2><span>{dynamicCareerPaths.length} paths</span></div>
          <div className="retro-list">
            {dynamicCareerPaths.map((path) => (
              <article className="retro-path-card" key={`${path.current}-${path.next}`}>
                <strong>{path.current}</strong>
                <Icon name="arrowRight" size={15} />
                <strong>{path.next}</strong>
                <p>{path.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="retro-card retro-section-card">
          <div className="retro-section-header"><h2>Target companies</h2><span>{targetCompanies.length} tracked</span></div>
          <div className="retro-company-grid">
            {targetCompanies.length === 0 ? <div className="retro-empty">No companies yet.</div> : targetCompanies.map((company, index) => (
              <div className="retro-company-row" key={company}><CompanyBadge text={company.slice(0, 2).toUpperCase()} tone={toneClass[index % toneClass.length]} size={36} /><span>{company}</span></div>
            ))}
          </div>
        </section>
      </div>

      <section className="retro-card retro-section-card">
        <div className="retro-section-header"><h2>Profile tips</h2><span>{improvementTipsLoading ? 'Loading' : `${discoverTips.length} tips`}</span></div>
        <div className="retro-tip-grid">
          {discoverTips.map((tip, index) => <div className="retro-tip" key={index}><Icon name="spark" size={15} />{tip}</div>)}
        </div>
      </section>
    </div>
  );

  const renderContent = () => {
    if (activeView === 'jobs') {
      return <JobPortal onCompleteProfile={() => setShowProfile(true)} initialSearchQuery={searchQuery} initialLocation={searchLocation} />;
    }
    if (activeView === 'post-job') return renderPostJobView();
    if (activeView === 'recruiter-analytics') return renderRecruiterAnalyticsView();
    if (activeView === 'applications') return <Applications />;
    if (activeView === 'saved') return <SavedJobs />;
    if (activeView === 'coach') {
      return (
        <div className="career-coach-view">
          <div className="career-coach-main">
            <ChatBot mode="embedded" title="Career coach" />
          </div>
          <aside className="career-coach-side">
            <section className="retro-card retro-section-card">
              <h2>Your snapshot</h2>
              <div className="coach-profile-chip">
                <span className="retro-avatar">{displayUserProfile.avatar || <Icon name="user" size={16} />}</span>
                <div>
                  <strong>{displayUserProfile.name}</strong>
                  <small>{displayUserProfile.title}</small>
                </div>
              </div>
              <div className="retro-progress"><span style={{ width: `${displayUserProfile.profileComplete}%` }} /></div>
              <p className="retro-muted">{displayUserProfile.profileComplete}% profile strength</p>
            </section>
            <section className="retro-card retro-section-card">
              <h2>Quick actions</h2>
              <div className="coach-action-list">
                <button onClick={() => setActiveView('jobs')}><Icon name="search" size={15} />Browse matched jobs</button>
                <button onClick={() => setShowProfile(true)}><Icon name="doc" size={15} />Update my profile</button>
                <button onClick={() => setActiveView('applications')}><Icon name="briefcase" size={15} />Review applications</button>
              </div>
            </section>
          </aside>
        </div>
      );
    }
    if (activeView === 'notifications') return <NotificationsPanel notifications={notifications} onRefresh={fetchDashboardData} />;
    if (activeView === 'settings') {
      return <Settings candidateProfile={candidateProfile} onProfileUpdated={() => fetchDashboardData({ silent: true })} theme={theme} onThemeChange={onThemeChange} />;
    }
    if (activeView === 'discover') return renderDiscoverView();
    return renderOverview();
  };

  if (loading) {
    return <div className="dashboard retro-loading"><div className="retro-card retro-loader"><h2>Loading your dashboard...</h2><div className="spinner" /></div></div>;
  }

  if (error) {
    return (
      <div className="dashboard retro-loading">
        <div className="retro-card retro-loader">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button className="retro-primary-button" onClick={() => fetchDashboardData()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard retro-app-shell">
      {showProfile && <CandidateProfile onClose={() => setShowProfile(false)} onProfileUpdated={() => fetchDashboardData({ silent: true })} />}

      <header className="retro-topbar">
        <div className="retro-logo">
          <div className="retro-logo-mark">C</div>
          <span>CareerHub</span>
        </div>
        <div className="retro-top-actions">
          <div className="business-menu-wrapper">
            <button className={`retro-ghost-button business-trigger ${showBusinessMenu ? 'open' : ''}`} onClick={() => setShowBusinessMenu((value) => !value)}>
              <Icon name="building" />Business<Icon name="chevDown" size={14} />
            </button>
            {showBusinessMenu && (
              <div className="business-dropdown">
                {businessActions.map((action) => (
                  <button key={action.label} className="business-dropdown-item" onClick={() => handleBusinessAction(action.label)}>
                    <span className="business-dropdown-title">{action.label}</span>
                    <span className="business-dropdown-description">{action.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="retro-icon-button" onClick={() => setActiveView('notifications')} aria-label="Notifications">
            <Icon name="bell" />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          <button className="retro-user-chip" onClick={() => setShowProfile(true)}>
            <span className="retro-avatar">{displayUserProfile.avatar || <Icon name="user" size={16} />}</span>
            <span className="retro-user-copy">
              <strong>{displayUserProfile.name}</strong>
              <small>{displayUserProfile.title}</small>
            </span>
            <Icon name="chevDown" size={14} color="var(--ink-mute)" />
          </button>
          <button className="retro-ghost-button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="retro-workspace">
        <aside className="retro-sidebar">
          <nav>
            {navItems.map((item) => (
              <button key={item.id} className={`retro-nav-item ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}>
                <Icon name={item.icon} />{item.label}
              </button>
            ))}
          </nav>
          {/*<div className="retro-profile-meter">
            <p>Profile strength</p>
            <div className="retro-progress small"><span style={{ width: `${displayUserProfile.profileComplete}%` }} /></div>
            <small>{displayUserProfile.profileComplete}% - add Git to skills</small>
          </div>*/}
        </aside>

        <main className="retro-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
