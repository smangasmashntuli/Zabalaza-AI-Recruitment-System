import { useEffect, useState } from 'react';
import './JobPortal.css';
import { getHybridJobs } from './api/jobs'; // Only import getHybridJobs
import {
  applyForJob,
  applyWithDocuments,
  chatWithGemini,
  getButtonContext,
  getCandidateProfile,
  getInterviewTips,
  getMatchAnalysis,
  getMyApplications,
  getResumeTailoringTips,
  getProfileImprovementTips,
  getSavedJobs,
  saveJob,
  generateCoverLetter,
} from './api/candidates';

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
  const [typeFilter] = useState('all');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({ coverLetter: '' });
  const [optimizingResume, setOptimizingResume] = useState(false);
  const [optimizedResumeText, setOptimizedResumeText] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [showCoverLetterPreview, setShowCoverLetterPreview] = useState(false);
  const [interviewTips, setInterviewTips] = useState('');
  const [interviewTipsLoading, setInterviewTipsLoading] = useState(false);
  const [interviewTipsError, setInterviewTipsError] = useState('');
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [matchAnalysisLoading, setMatchAnalysisLoading] = useState(false);
  const [resumeTailoringTips, setResumeTailoringTips] = useState('');
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [profileImprovementTips, setProfileImprovementTips] = useState('');
  const [improvementLoading, setImprovementLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savingJobIds, setSavingJobIds] = useState([]);
  const [actionNotice, setActionNotice] = useState('');
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchModalData, setMatchModalData] = useState(null);
  const [matchQuestion, setMatchQuestion] = useState('');
  const [matchMessages, setMatchMessages] = useState([]);
  const [matchAsking, setMatchAsking] = useState(false);
  const [viewedJobIds, setViewedJobIds] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  const hasResumeProfile = Boolean(candidateProfile?.resume_path || candidateProfile?.resume_text);

  useEffect(() => {
    fetchJobsData();
    fetchCandidateData();
    fetchApplicationsData();
    fetchSavedJobsData();
  }, []);

  useEffect(() => {
    setSearchQuery(initialSearchQuery || '');
  }, [initialSearchQuery]);

  useEffect(() => {
    setLocationFilter(initialLocation || '');
  }, [initialLocation]);

  useEffect(() => {
    if (selectedJob && selectedJob.id && !viewedJobIds.includes(selectedJob.id)) {
      setViewedJobIds((prev) => [...new Set([...prev, selectedJob.id])]);
    }
  }, [selectedJob]);

  useEffect(() => {
    if (myApplications.length > 0) {
      const appliedIds = myApplications.map((app) => app.job_id);
      setAppliedJobIds((prev) => [...new Set([...prev, ...appliedIds])]);
    }
  }, [myApplications]);

  const fetchJobsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build params for getHybridJobs
      const params = {
        limit: 50,
        include_external: true
      };

      // Add search parameters if they exist
      if (searchQuery) params.query = searchQuery;
      if (locationFilter) params.location = locationFilter;
      if (typeFilter !== 'all') params.jobType = typeFilter;

      const jobsData = await getHybridJobs(params);
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

  const fetchApplicationsData = async () => {
    try {
      const applications = await getMyApplications();
      setMyApplications(Array.isArray(applications) ? applications : []);
    } catch {
      setMyApplications([]);
    }
  };

  const fetchSavedJobsData = async () => {
    try {
      const saved = await getSavedJobs();
      setSavedJobs(Array.isArray(saved) ? saved : []);
    } catch {
      setSavedJobs([]);
    }
  };

  const handleSearch = async () => {
    await fetchJobsData();
  };

  // When searchQuery or locationFilter changes to empty, re-fetch all jobs
  useEffect(() => {
    fetchJobsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, locationFilter]);

  const formatJob = (job) => {
    let requirements;
    let skills;

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

  const getApplicationForJob = (jobId) => myApplications.find((application) => application.job_id === jobId);

  const isInterviewEligible = (jobId) => {
    const status = getApplicationForJob(jobId)?.status;
    return ['interview', 'interview_scheduled'].includes(status);
  };

  const handleSaveJob = async (job) => {
    const jobId = job.job_id || job.id;
    const source = job.source || "internal";
    const externalJobId = job.external_job_id || job.id;

    if (!jobId && !job.title) return;
    try {
      setActionNotice('');
      setSavingJobIds((current) => [...new Set([...current, jobId || externalJobId])]);

      const payload = {
        job_id: source === "internal" ? jobId : null,
        source: source,
        external_job_id: source !== "internal" ? externalJobId : null,
        job_data: source !== "internal" ? {
          id: job.id,
          job_id: job.job_id,
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          job_type: job.job_type,
          posted: job.posted,
          source: source,
        } : null
      };

      await saveJob(payload);
      await fetchSavedJobsData();
      setActionNotice(`${job.title} saved successfully.`);
    } catch (err) {
      setActionNotice(err.message || 'Could not save the job.');
    } finally {
      setSavingJobIds((current) => current.filter((id) => id !== (jobId || externalJobId)));
    }
  };

  const handleInterviewTips = async () => {
    if (!selectedJob) return;

    const jobId = selectedJob.job_id || selectedJob.id;
    if (!jobId) {
      setInterviewTipsError('Job ID is required to generate interview tips.');
      return;
    }

    if (!isInterviewEligible(jobId)) {
      setInterviewTipsError('Interview tips will unlock after you are selected for interview for this job.');
      return;
    }

    try {
      setInterviewTipsLoading(true);
      setInterviewTipsError('');
      const result = await getInterviewTips(jobId, selectedJob);
      setInterviewTips(result?.interview_tips || 'No interview tips were generated.');
      setExpandedSection('interview-tips');
    } catch (err) {
      setInterviewTipsError(err.message || 'Failed to generate interview tips');
    } finally {
      setInterviewTipsLoading(false);
    }
  };

  const handleMatchDetails = async () => {
    if (!selectedJob) return;

    const jobId = selectedJob.job_id || selectedJob.id;
    if (!jobId) {
      setActionNotice('Job ID is required to view match details.');
      return;
    }

    try {
      setMatchAnalysisLoading(true);
      const [contextResult, analysisResult] = await Promise.all([
        getButtonContext('match_details', selectedJob),
        getMatchAnalysis(jobId, selectedJob),
      ]);
      setMatchModalData(contextResult);
      setMatchAnalysis(analysisResult);
      setMatchMessages([
        {
          role: 'assistant',
          content: analysisResult?.summary || contextResult?.context || 'Here is your match analysis.',
        },
      ]);
      setMatchQuestion('');
      setShowMatchModal(true);
      setExpandedSection('match-details');
    } catch (err) {
      setMatchAnalysis({ error: err.message || 'Failed to get match analysis' });
      setActionNotice(err.message || 'Failed to get match analysis');
    } finally {
      setMatchAnalysisLoading(false);
    }
  };

  const handleTailorResume = async () => {
    if (!selectedJob) return;

    const jobId = selectedJob.job_id || selectedJob.id;
    if (!jobId) {
      setActionNotice('Job ID is required to tailor your resume.');
      return;
    }

    try {
      setTailoringLoading(true);
      const result = await getResumeTailoringTips(jobId, selectedJob);
      setResumeTailoringTips(result?.suggestions || 'No suggestions available.');
      setExpandedSection('tailor-resume');
    } catch (err) {
      setResumeTailoringTips('Failed to get tailoring suggestions.');
    } finally {
      setTailoringLoading(false);
    }
  };

  const handleHelpStandOut = async () => {
    if (!selectedJob) return;

    const jobId = selectedJob.job_id || selectedJob.id;
    if (!jobId) {
      setActionNotice('Job ID is required to generate improvement suggestions.');
      return;
    }

    try {
      setImprovementLoading(true);
      const result = await getProfileImprovementTips();
      setProfileImprovementTips(result?.improvements || 'No improvements available.');
      setExpandedSection('help-stand-out');
    } catch (err) {
      setProfileImprovementTips('Failed to get improvement suggestions.');
    } finally {
      setImprovementLoading(false);
    }
  };

  const handleOptimizeResumeForJob = async () => {
    if (!selectedJob || !candidateProfile?.resume_text) {
      setActionNotice('No resume found. Please upload a resume in your profile first.');
      return;
    }

    try {
      setOptimizingResume(true);
      setOptimizedResumeText('');
      const jobId = selectedJob.job_id || selectedJob.id;
      const result = await getResumeTailoringTips(jobId, selectedJob);
      const suggestions = result?.suggestions || '';
      setOptimizedResumeText(suggestions);
      setActionNotice('Resume optimization suggestions generated. Review them below before applying.');
    } catch (err) {
      setActionNotice(err.message || 'Failed to optimize resume');
    } finally {
      setOptimizingResume(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!selectedJob) return;

    try {
      setGeneratingCoverLetter(true);
      setGeneratedCoverLetter('');
      const jobId = selectedJob.job_id || selectedJob.id;
      
      const payload = {
        job_id: jobId,
        job_data: selectedJob
      };

      const result = await generateCoverLetter(payload);
      const coverLetter = result?.cover_letter || '';

      if (coverLetter) {
        setGeneratedCoverLetter(coverLetter);
        setShowCoverLetterPreview(true);
        setActionNotice('Cover letter generated with AI! Review it below and use it in your application.');
      } else {
        setActionNotice('Failed to generate cover letter. Please try again.');
      }
    } catch (err) {
      setActionNotice(err.message || 'Failed to generate cover letter');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const useGeneratedCoverLetter = () => {
    setApplicationData({ coverLetter: generatedCoverLetter });
    setShowCoverLetterPreview(false);
    setActionNotice('Cover letter added to your application.');
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!selectedJob) return;

    try {
      setApplying(true);
      const jobId = selectedJob.job_id || selectedJob.id;
      
      // Use the enhanced application endpoint that generates PDFs
      // Send the edited resume text (if user edited it) or empty string to use profile resume
      const result = await applyWithDocuments({
        job_id: jobId,
        cover_letter: applicationData.coverLetter || `Application for ${selectedJob.title}`,
        resume_text: applicationData.resumeText || '',  // Send edited resume or empty to use profile
      });
      
      setAppliedJobIds((prev) => [...new Set([...prev, jobId])]);
      setShowApplicationModal(false);
      setSelectedJob(null);
      setApplicationData({ coverLetter: '', resumeText: '' });
      setOptimizedResumeText('');
      setGeneratedCoverLetter('');
      setShowCoverLetterPreview(false);
      
      alert(`Application submitted successfully!\nMatch Score: ${result.match_score}%\nCV Strength: ${result.cv_strength_score}%`);
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
    <div className="job-portal linkedin-style-layout">
      {/* Header Section */}
      <div className="portal-header">
        <div className="header-content">
          <h1 className="header-title">Top job picks for you</h1>
          <p className="header-subtitle">
            Based on your profile, preferences, and activity like applies, searches, and saves
          </p>
          <div className="results-count">{filteredJobs.length} results</div>
        </div>
      </div>

      {/* Split Panel Container */}
      <div className="split-panel-container">
        {/* Left Panel: Job List */}
        <div className="jobs-list-panel">
          <div className="jobs-list-header">
            <div className="search-bar-compact">
              <div className="search-input-group-compact">
                <span className="icon"><Icon name="search" size={16} /></span>
                <input
                  type="text"
                  placeholder="Job title"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="search-input-compact"
                />
              </div>
              <button className="job-portal-state-button" type="button" onClick={handleSearch}>
                Search
              </button>
            </div>
          </div>

          <div className="jobs-list">
            {filteredJobs.length === 0 ? (
              <div className="no-jobs-message">No jobs found</div>
            ) : (
              filteredJobs.map((job) => {
                const formattedJob = formatJob(job);
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    className={`jobs-list-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="list-item-header">
                      <div className="list-item-logo">{formattedJob.logo}</div>
                      <div className="list-item-title-group">
                        <div className="list-item-title">{job.title}</div>
                        <div className="list-item-company">{formattedJob.company}</div>
                      </div>
                      <button className="close-item-button" onClick={(e) => {
                        e.stopPropagation();
                      }}>
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                    <div className="list-item-details">
                      <span className="list-detail">{job.location || 'Remote'}</span>
                      <span className="list-detail">{formattedJob.type}</span>
                    </div>
                    <div className="list-item-meta">
                      {appliedJobIds.includes(job.id) && <span className="list-meta-badge">Applied</span>}
                      {viewedJobIds.includes(job.id) && !appliedJobIds.includes(job.id) && <span className="list-meta-badge">Recently viewed</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Job Details */}
        <div className="job-details-panel">
          {selectedJob ? (
            (() => {
              const formattedJob = formatJob(selectedJob);
              return (
                <div className="job-details-content">
                  {/* Company Header */}
                  <div className="details-company-header">
                    <div className="company-logo-large">{formattedJob.logo}</div>
                    <div>
                      <h2 className="details-company-name">{formattedJob.company}</h2>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h1 className="details-job-title">{selectedJob.title}</h1>

                  {/* Key Info Badges */}
                  <div className="details-badges-row">
                    <span className="details-badge">
                      <Icon name="check" size={16} /> On-site
                    </span>
                    <span className="details-badge details-badge-alt">Full-time</span>
                  </div>

                  {/* Location and Details */}
                  <div className="details-meta-info">
                    <div className="meta-info-item">
                      <Icon name="location" size={16} />
                      <span>{selectedJob.location || 'Remote'}</span>
                    </div>
                    <div className="meta-info-item">
                      <span className="posted-badge">{formattedJob.posted}</span>
                    </div>
                  </div>

                  {/* Match Section */}
                  {candidateProfile && (
                    <div className="details-match-section">
                      <div className="match-header">
                        <h3>How your profile and resume fit this job</h3>
                      </div>
                      {actionNotice && <p className="details-action-notice">{actionNotice}</p>}
                      <div className="match-actions">
                        <button
                          className="match-action-button"
                          onClick={handleMatchDetails}
                          disabled={matchAnalysisLoading}
                        >
                          <Icon name="star" size={18} />
                          {matchAnalysisLoading ? 'Analyzing...' : 'Show match details'}
                        </button>
                        <button
                          className="match-action-button"
                          onClick={handleTailorResume}
                          disabled={tailoringLoading}
                        >
                          <Icon name="briefcase" size={18} />
                          {tailoringLoading ? 'Tailoring...' : 'Tailor my resume'}
                        </button>
                        <button
                          className="match-action-button"
                          onClick={handleHelpStandOut}
                          disabled={improvementLoading}
                        >
                          <Icon name="chart" size={18} />
                          {improvementLoading ? 'Fetching tips...' : 'Help me stand out'}
                        </button>
                        <button className="match-action-button" onClick={handleInterviewTips} disabled={interviewTipsLoading}>
                          <Icon name="clock" size={18} />
                          {interviewTipsLoading ? 'Generating tips...' : isInterviewEligible(selectedJob.job_id || selectedJob.id) ? 'Interview tips' : 'Locked until interview'}
                        </button>
                      </div>
                    </div>
                  )}

                  {matchAnalysis && expandedSection === 'match-details' && !matchAnalysis.error && (
                    <div className="details-section" style={{ background: 'rgba(14,165,233,0.06)', borderRadius: '16px', padding: '16px' }}>
                      <h3 className="details-section-title">Match Analysis</h3>
                      <p><strong>Summary:</strong> {matchAnalysis.summary}</p>
                      {matchAnalysis.strengths?.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Your Strengths:</strong>
                          <ul style={{ marginTop: '8px' }}>
                            {matchAnalysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                      {matchAnalysis.gaps?.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Skill Gaps:</strong>
                          <ul style={{ marginTop: '8px' }}>
                            {matchAnalysis.gaps.map((g, i) => <li key={i}>{g}</li>)}
                          </ul>
                        </div>
                      )}
                      {matchAnalysis.recommendations && (
                        <div style={{ marginTop: '12px' }}>
                          <strong>Recommendations:</strong>
                          <p style={{ marginTop: '8px' }}>{matchAnalysis.recommendations}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {resumeTailoringTips && expandedSection === 'tailor-resume' && (
                    <div className="details-section" style={{ background: 'rgba(14,165,233,0.06)', borderRadius: '16px', padding: '16px' }}>
                      <h3 className="details-section-title">Resume Tailoring Tips</h3>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>
                        {resumeTailoringTips}
                      </pre>
                    </div>
                  )}

                  {profileImprovementTips && expandedSection === 'help-stand-out' && (
                    <div className="details-section" style={{ background: 'rgba(14,165,233,0.06)', borderRadius: '16px', padding: '16px' }}>
                      <h3 className="details-section-title">How to Stand Out</h3>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>
                        {profileImprovementTips}
                      </pre>
                    </div>
                  )}

                  {(interviewTips || interviewTipsError) && (
                    <div className="details-section" style={{ background: 'rgba(14,165,233,0.06)', borderRadius: '16px', padding: '16px' }}>
                      <h3 className="details-section-title">Gemini Interview Prep</h3>
                      {interviewTipsError ? (
                        <p style={{ color: '#b91c1c' }}>{interviewTipsError}</p>
                      ) : (
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>{interviewTips}</pre>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div className="details-section">
                    <h3 className="details-section-title">About the role</h3>
                    <p className="details-description">{selectedJob.description}</p>
                  </div>

                  {/* Requirements */}
                  {formattedJob.requirements.length > 0 && (
                    <div className="details-section">
                      <h3 className="details-section-title">Requirements</h3>
                      <ul className="requirements-list">
                        {formattedJob.requirements.slice(0, 5).map((requirement, index) => (
                          <li key={index} className="requirement-item">
                            <Icon name="check" size={16} />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills */}
                  {formattedJob.benefits.length > 0 && (
                    <div className="details-section">
                      <h3 className="details-section-title">Skills</h3>
                      <div className="details-skills-tags">
                        {formattedJob.benefits.map((benefit, index) => (
                          <span key={index} className="details-skill-tag">{benefit}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="details-actions">
                    <button onClick={() => handleApply(selectedJob)} className="apply-button-large">
                      <Icon name="check" size={18} />
                      Apply
                    </button>
                    <button
                      className="save-button-large"
                      onClick={() => handleSaveJob(selectedJob)}
                      disabled={savingJobIds.includes(selectedJob.id) || savingJobIds.includes(selectedJob.job_id)}
                    >
                      {savingJobIds.includes(selectedJob.id) || savingJobIds.includes(selectedJob.job_id)
                        ? 'Saving...'
                        : savedJobs.some((item) => (item.job?.id || item.job_id) === (selectedJob.id || selectedJob.job_id))
                          ? 'Saved'
                          : 'Save'}
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="no-selection-placeholder">
              <Icon name="briefcase" size={48} />
              <p>Select a job to view details</p>
            </div>
          )}
        </div>
      </div>

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

                {/* Resume Section */}
                <div className="form-group">
                  <label className="form-label">Resume</label>
                  <p style={{ fontSize: '13px', color: 'var(--ink-mute)', marginBottom: '8px' }}>
                    Review and edit your resume below, or upload a new one
                  </p>
                  
                  {/* Show existing resume text */}
                  {candidateProfile?.resume_text && !applicationData.resumeFile && (
                    <div style={{ marginBottom: '12px' }}>
                      <textarea
                        rows={12}
                        className="form-textarea"
                        value={applicationData.resumeText || candidateProfile.resume_text}
                        onChange={(e) => setApplicationData({ ...applicationData, resumeText: e.target.value })}
                        placeholder="Your resume text will appear here. You can edit it to optimize for this job."
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="retro-ghost-button"
                          onClick={handleOptimizeResumeForJob}
                          disabled={optimizingResume}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          {optimizingResume ? 'Optimizing...' : '✨ Optimize with AI'}
                        </button>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          AI will suggest improvements for ATS
                        </span>
                      </div>
                      {optimizedResumeText && (
                        <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(14,165,233,0.06)', borderRadius: '6px', fontSize: '12px', lineHeight: 1.5 }}>
                          <strong>💡 AI Suggestions:</strong>
                          <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0 0', fontFamily: 'inherit' }}>{optimizedResumeText}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload new resume option */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ display: 'inline-block', cursor: 'pointer', fontSize: '13px', color: 'var(--sage)' }}>
                      📄 Or upload a different resume file
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setApplicationData({ ...applicationData, resumeFile: file, resumeText: '' });
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {applicationData.resumeFile && (
                      <p style={{ fontSize: '12px', color: 'var(--sage)', marginTop: '4px' }}>
                        ✓ New resume selected: {applicationData.resumeFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Cover Letter Section */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Cover Letter</label>
                    <button
                      type="button"
                      className="retro-link-button"
                      onClick={handleGenerateCoverLetter}
                      disabled={generatingCoverLetter}
                    >
                      {generatingCoverLetter ? 'Generating...' : '✨ Generate with AI'}
                    </button>
                  </div>
                  {showCoverLetterPreview && generatedCoverLetter && (
                    <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(140,154,110,0.1)', borderRadius: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong>Generated Cover Letter</strong>
                        <button type="button" className="retro-primary-button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={useGeneratedCoverLetter}>
                          Use this
                        </button>
                      </div>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>{generatedCoverLetter}</pre>
                    </div>
                  )}
                  <textarea
                    rows={6}
                    className="form-textarea"
                    placeholder="Write your cover letter or generate one with AI..."
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-button" disabled={applying}>
                    {applying ? 'Generating PDF & Submitting...' : 'Submit Application'}
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

      {showMatchModal && selectedJob && matchModalData && (
        <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
          <div className="modal-content application-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div>
                  <h2 className="modal-job-title">Match details for {selectedJob.title}</h2>
                  <p className="modal-job-company">Confidence: {Math.round((matchAnalysis?.match_score || matchModalData?.ml_data?.match_score || 0) * 100)}%</p>
                </div>
                <button onClick={() => setShowMatchModal(false)} className="close-button">
                  <Icon name="close" size={20} />
                </button>
              </div>
            </div>

            <div className="application-form" style={{ gap: '16px' }}>
              <div className="details-section" style={{ background: 'rgba(14,165,233,0.06)', borderRadius: '16px', padding: '16px' }}>
                <h3 className="details-section-title">Match Summary</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{matchAnalysis?.summary || matchModalData?.context || 'No summary available.'}</p>
                {Array.isArray(matchAnalysis?.strengths) && matchAnalysis.strengths.length > 0 && (
                  <>
                    <strong>Strengths</strong>
                    <ul>
                      {matchAnalysis.strengths.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </>
                )}
                {Array.isArray(matchAnalysis?.gaps) && matchAnalysis.gaps.length > 0 && (
                  <>
                    <strong>Gaps</strong>
                    <ul>
                      {matchAnalysis.gaps.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </>
                )}
              </div>

              <div className="details-section" style={{ background: 'rgba(15,23,42,0.03)', borderRadius: '16px', padding: '16px' }}>
                <h3 className="details-section-title">Ask a follow-up question</h3>
                <div className="chat-thread" style={{ maxHeight: '260px', overflowY: 'auto', marginBottom: '12px' }}>
                  {matchMessages.map((msg, idx) => (
                    <div key={idx} style={{ marginBottom: '10px' }}>
                      <strong>{msg.role === 'user' ? 'You' : 'Advisor'}:</strong>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    </div>
                  ))}
                </div>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={matchQuestion}
                  onChange={(e) => setMatchQuestion(e.target.value)}
                  placeholder="Ask anything about this match, your gaps, or how to improve your chances..."
                />
                <div className="form-actions" style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    className="submit-button"
                    disabled={matchAsking || !matchQuestion.trim()}
                    onClick={async () => {
                      try {
                        setMatchAsking(true);
                        const nextHistory = matchMessages.map((msg) => ({
                          user: msg.role === 'user' ? msg.content : undefined,
                          assistant: msg.role === 'assistant' ? msg.content : undefined,
                        }));
                        setMatchMessages((current) => [...current, { role: 'user', content: matchQuestion.trim() }]);
                        const response = await chatWithGemini(matchQuestion.trim(), nextHistory, matchModalData?.context || matchModalData?.query);
                        setMatchMessages((current) => [...current, { role: 'assistant', content: response?.response || 'No response returned.' }]);
                        setMatchQuestion('');
                      } catch (err) {
                        setMatchMessages((current) => [...current, { role: 'assistant', content: err.message || 'Failed to answer question.' }]);
                      } finally {
                        setMatchAsking(false);
                      }
                    }}
                  >
                    {matchAsking ? 'Thinking...' : 'Ask'}
                  </button>
                  <button type="button" onClick={() => setShowMatchModal(false)} className="cancel-button">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}