import React, { useEffect, useMemo, useState } from 'react';
import './CandidateProfile.css';
import {
  getCandidateProfile,
  updateCandidateProfile,
  uploadResume,
  uploadCertificate,
  optimizeCvSection,
} from './api/candidates';

const createEmptyProfile = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  title: '',
  bio: '',
  coverLetter: '',
  website: '',
  linkedin: '',
  github: '',
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: [],
  languages: [],
  extractionReport: null,
  resumePath: null,
  resumeText: '',
});

const parseMaybeJson = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const isYearLike = (value) => {
  if (!value) return false;
  const text = String(value).trim();
  return /^(?:19|20)\d{2}$/.test(text) || /^(?:19|20)\d{2}-\d{2}$/.test(text);
};

const normalizeDateInput = (value) => {
  if (!value) return '';
  const text = String(value).trim().toLowerCase();
  if (!text) return '';
  if (['present', 'current', 'now'].includes(text)) return 'present';
  if (/^(?:19|20)\d{2}-\d{2}$/.test(text)) return text;
  if (/^(?:19|20)\d{2}$/.test(text)) return `${text}-01`;

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  const yearMatch = text.match(/((?:19|20)\d{2})/);
  return yearMatch ? `${yearMatch[1]}-01` : '';
};

const formatDisplayDate = (value) => {
  if (!value || value === 'Not provided') return 'Not provided';
  const text = String(value).trim();
  if (!text) return 'Not provided';
  if (['present', 'current'].includes(text.toLowerCase())) return 'Present';
  if (/^(?:19|20)\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}-01T00:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }
  if (/^(?:19|20)\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return text;
};

const normalizeSkills = (value) => Array.from(new Set(parseMaybeJson(value).map((item) => String(item || '').trim()).filter(Boolean)));

const normalizeExperience = (list = []) =>
  parseMaybeJson(list).map((item, index) => ({
    id: item.id || item.uuid || `exp-${index}`,
    title: item.title || item.position || item.job_title || item.role || '',
    company: item.company || item.employer || '',
    location: item.location || item.city || '',
    startDate: normalizeDateInput(item.startDate || item.start_date || item.from || item.from_date || item.dates || ''),
    endDate: normalizeDateInput(item.endDate || item.end_date || item.to || item.to_date || ''),
    current: Boolean(item.current || item.is_current || item.currently_working || false),
    description: item.description || item.summary || item.responsibilities || '',
  }));

const normalizeEducation = (list = []) =>
  parseMaybeJson(list).map((item, index) => {
    const rawDegree = item.degree || item.title || item.qualification || '';
    const rawField = item.field || item.major || item.area || '';
    let school = item.school || item.institution || item.university || '';
    if (!school || isYearLike(school)) {
      const source = [rawField, rawDegree, item.fieldOfStudy, item.course].filter(Boolean).join(' ');
      const parts = source
        .split(/[-|•]/)
        .map((part) => part.trim())
        .filter(Boolean);
      const inferred = parts
        .slice(0, -1)
        .reverse()
        .find((part) => part && !isYearLike(part));
      school = inferred || school || '';
    }

    let degree = rawDegree;
    let field = rawField;
    if (!field && degree && /\bin\b/i.test(degree)) {
      const pieces = degree.split(/\bin\b/i);
      degree = pieces[0].trim();
      field = pieces[1]?.trim() || '';
    }

    if (!degree && rawField) {
      degree = rawField.includes(' in ') ? rawField.split(/\bin\b/i)[0].trim() : rawField;
    }

    return {
      id: item.id || item.uuid || `edu-${index}`,
      degree,
      field,
      school,
      startDate: normalizeDateInput(item.startDate || item.start_date || item.from || ''),
      endDate: normalizeDateInput(item.endDate || item.end_date || item.to || ''),
      current: Boolean(item.current || item.is_current || false),
    };
  });

const normalizeProjects = (list = []) =>
  parseMaybeJson(list).map((item, index) => ({
    id: item.id || item.uuid || `proj-${index}`,
    name: item.name || item.title || '',
    link: item.link || item.url || '',
    type: item.type || 'project',
    description: item.description || item.summary || '',
  }));

const createEmptyExperience = () => ({
  id: `new-exp-${Date.now()}`,
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
});

const createEmptyEducation = () => ({
  id: `new-edu-${Date.now()}`,
  degree: '',
  field: '',
  school: '',
  startDate: '',
  endDate: '',
  current: false,
});

const createEmptyProject = () => ({
  id: `new-proj-${Date.now()}`,
  name: '',
  link: '',
  type: 'project',
  description: '',
});

function CandidateProfile({ onClose, onProfileUpdated }) {
  const [profile, setProfile] = useState(createEmptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeMessage, setResumeMessage] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [cvOptimizationSection, setCvOptimizationSection] = useState('summary');
  const [cvOptimizationResult, setCvOptimizationResult] = useState('');
  const [cvOptimizationMessage, setCvOptimizationMessage] = useState('');
  const [cvOptimizing, setCvOptimizing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const mapBackendProfile = (data) => ({
    firstName: data.first_name || data.firstName || '',
    lastName: data.last_name || data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    location: data.location || '',
    title: data.title || '',
    bio: data.bio || '',
    coverLetter: data.cover_letter || data.coverLetter || '',
    website: data.website || '',
    linkedin: data.linkedin || '',
    github: data.github || '',
    experience: normalizeExperience(data.work_experience_list || data.work_experience || data.experience || []),
    education: normalizeEducation(data.education_list || data.education || []),
    skills: normalizeSkills(data.skills_list || data.skills || []),
    certifications: parseMaybeJson(data.certifications || []),
    projects: normalizeProjects(data.projects || []),
    languages: parseMaybeJson(data.languages || []),
    extractionReport: data.extraction_report || null,
    resumePath: data.resume_path || data.resumePath || null,
    resumeText: data.resume_text || '',
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCandidateProfile();
      setProfile(mapBackendProfile(data));
      if (data?.extraction_report?.needs_review) {
        setResumeMessage(data.extraction_report.review_notes || 'Your CV was uploaded, but some fields need review.');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile. Please try again.');
      setProfile(createEmptyProfile());
    } finally {
      setLoading(false);
    }
  };

  const updateExperienceItem = (id, field, value) => {
    setProfile((current) => ({
      ...current,
      experience: current.experience.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const updateEducationItem = (id, field, value) => {
    setProfile((current) => ({
      ...current,
      education: current.education.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const updateProjectItem = (id, field, value) => {
    setProfile((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value) return;
    setProfile((current) => ({
      ...current,
      skills: current.skills.includes(value) ? current.skills : [...current.skills, value],
    }));
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    setProfile((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const addExperience = () => {
    setProfile((current) => ({
      ...current,
      experience: [createEmptyExperience(), ...(current.experience || [])],
    }));
    setIsEditing(true);
  };

  const removeExperience = (id) => {
    setProfile((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== id),
    }));
  };

  const addEducation = () => {
    setProfile((current) => ({
      ...current,
      education: [createEmptyEducation(), ...(current.education || [])],
    }));
    setIsEditing(true);
  };

  const addProject = () => {
    setProfile((current) => ({
      ...current,
      projects: [createEmptyProject(), ...(current.projects || [])],
    }));
    setIsEditing(true);
  };

  const removeEducation = (id) => {
    setProfile((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== id),
    }));
  };

  const removeProject = (id) => {
    setProfile((current) => ({
      ...current,
      projects: current.projects.filter((item) => item.id !== id),
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      await updateCandidateProfile({
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        location: profile.location,
        title: profile.title,
        bio: profile.bio,
        cover_letter: profile.coverLetter,
        website: profile.website,
        linkedin: profile.linkedin,
        github: profile.github,
        skills: profile.skills,
        work_experience: profile.experience,
        education: profile.education,
        certifications: profile.certifications,
        projects: profile.projects,
      });

      setIsEditing(false);
      await loadProfile();
      await onProfileUpdated?.();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      setResumeUploading(true);
      setError(null);
      setResumeMessage(`Uploading ${file.name} and extracting your CV...`);
      const uploadResult = await uploadResume(file);

      const review = uploadResult?.extraction_report;
      if (review?.needs_review) {
        setResumeMessage(review.review_notes || 'CV uploaded. Some fields need review.');
      } else {
        setResumeMessage('CV uploaded successfully. Your profile was auto-filled from the extracted CV data.');
      }

      await loadProfile();
      await onProfileUpdated?.();
    } catch (err) {
      console.error('Error uploading resume:', err);
      setResumeMessage('');
      setError('Failed to upload resume. Please try again.');
    } finally {
      setSaving(false);
      setResumeUploading(false);
      event.target.value = '';
    }
  };

  const handleCertificateUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      setError(null);
      setResumeMessage(`Uploading certificate ${file.name}...`);
      await uploadCertificate(file);
      await loadProfile();
      setResumeMessage('Certificate uploaded successfully.');
    } catch (err) {
      console.error('Error uploading certificate:', err);
      setError('Failed to upload certificate. Please try again.');
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const handleOptimizeCvSection = async (section) => {
    try {
      setCvOptimizing(true);
      setCvOptimizationSection(section);
      setCvOptimizationMessage('');
      setCvOptimizationResult('');

      const result = await optimizeCvSection(section);
      setCvOptimizationResult(result?.optimized_text || '');
      setCvOptimizationMessage(result?.message || (result?.optimized_text ? '' : 'No optimization was returned for this section.'));
    } catch (err) {
      setCvOptimizationMessage(err.message || 'Failed to optimize the selected CV section.');
    } finally {
      setCvOptimizing(false);
    }
  };

  const getResumeFileName = () => {
    if (!profile?.resumePath) return '';
    return profile.resumePath.split(/[\\/]/).pop();
  };

  const formatDateRange = (start, end, current) => {
    const startLabel = formatDisplayDate(start);
    const endLabel = current ? 'Present' : formatDisplayDate(end);
    if (startLabel === 'Not provided' && endLabel === 'Not provided') return 'Not provided';
    if (startLabel === 'Not provided') return endLabel;
    return `${startLabel} - ${endLabel}`;
  };

  const Icon = ({ name, size = 20 }) => {
    const icons = {
      user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      mail: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
      location: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
      link: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
      briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      education: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
      award: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
      upload: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
      edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
      save: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />,
      close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
      plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
      trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
      linkedin: <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
      github: <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />,
      certificate: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    };
    return (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[name] || icons.user}
      </svg>
    );
  };

  const extractionSummary = useMemo(() => {
    const report = profile.extractionReport;
    if (!report) return null;
    const verified = report.validation?.verified_fields || [];
    const ambiguous = report.validation?.ambiguous_fields || [];
    const missing = report.validation?.missing_fields || [];
    return {
      note: report.validation?.review_notes || '',
      needsReview: Boolean(report.validation?.needs_review),
      verified,
      ambiguous,
      missing,
    };
  }, [profile.extractionReport]);

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-header-left">
              <h1 className="profile-main-title">My Profile</h1>
              <p className="profile-subtitle">Manage your professional information</p>
            </div>
            <div className="profile-header-actions">
              {!loading && (
                <button
                  className={`profile-action-button ${isEditing ? 'save' : 'edit'}`}
                  onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                  disabled={saving}
                >
                  <Icon name={isEditing ? 'save' : 'edit'} size={18} />
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              )}
              <button className="profile-close-button" onClick={onClose}>
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          {!loading && (
            <div className="profile-tabs">
              {['overview', 'experience', 'education', 'skills'].map((tab) => (
                <button
                  key={tab}
                  className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'overview' ? 'Overview' : tab === 'skills' ? 'Skills & Certifications' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="profile-content">
          {loading ? (
            <div className="profile-state"><p>Loading profile...</p></div>
          ) : error ? (
            <div className="profile-state error">
              <p>{error}</p>
              <button onClick={loadProfile} className="profile-state-button">Retry</button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="profile-tab-content">
                  <div className="profile-card profile-hero-card">
                    <div className="profile-hero-content">
                      <div className="profile-avatar-container">
                        <div className="profile-avatar-large">
                          {(profile.firstName?.[0] || 'U').toUpperCase()}{(profile.lastName?.[0] || 'U').toUpperCase()}
                        </div>
                      </div>
                      <div className="profile-hero-info">
                        {isEditing ? (
                          <div className="profile-edit-section">
                            <div className="input-row">
                              <div className="input-group"><label className="input-label">First Name</label><input type="text" value={profile.firstName} onChange={(e) => setProfile((current) => ({ ...current, firstName: e.target.value }))} className="profile-input" /></div>
                              <div className="input-group"><label className="input-label">Last Name</label><input type="text" value={profile.lastName} onChange={(e) => setProfile((current) => ({ ...current, lastName: e.target.value }))} className="profile-input" /></div>
                            </div>
                            <div className="input-group"><label className="input-label">Professional Title</label><input type="text" value={profile.title} onChange={(e) => setProfile((current) => ({ ...current, title: e.target.value }))} className="profile-input" /></div>
                            <div className="input-group"><label className="input-label">Bio</label><textarea value={profile.bio} onChange={(e) => setProfile((current) => ({ ...current, bio: e.target.value }))} className="profile-textarea" rows={4} /></div>
                          </div>
                        ) : (
                          <>
                            <h2 className="profile-name">{profile.firstName} {profile.lastName}</h2>
                            <p className="profile-title">{profile.title || 'Not provided'}</p>
                            <p className="profile-bio">{profile.bio || 'No bio available yet. Upload your CV to auto-fill your profile.'}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {extractionSummary && (
                    <div className="profile-card">
                      <div className="profile-card-header">
                        <div className="card-header-left"><Icon name="sparkles" size={22} /><h3 className="profile-card-title">CV Extraction</h3></div>
                        <span className="skill-count">{extractionSummary.needsReview ? 'Needs review' : 'Validated'}</span>
                      </div>
                      <div className="profile-card-body">
                        <p className="upload-subtitle" style={{ marginTop: 0 }}>{extractionSummary.note}</p>
                        <div className="skills-grid" style={{ marginBottom: 12 }}>
                          <div className="skill-chip"><span className="skill-name">Verified: {extractionSummary.verified.length || 0}</span></div>
                          <div className="skill-chip"><span className="skill-name">Needs review: {extractionSummary.ambiguous.length || 0}</span></div>
                          <div className="skill-chip"><span className="skill-name">Missing: {extractionSummary.missing.length || 0}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="card-header-left"><Icon name="edit" size={22} /><h3 className="profile-card-title">Cover Letter</h3></div>
                      <span className="skill-count">{profile.coverLetter ? 'Extracted' : 'Not provided'}</span>
                    </div>
                    <div className="profile-card-body">
                      {isEditing ? (
                        <div className="profile-edit-section">
                          <div className="input-group">
                            <label className="input-label">Cover Letter</label>
                            <textarea
                              value={profile.coverLetter}
                              onChange={(e) => setProfile((current) => ({ ...current, coverLetter: e.target.value }))}
                              className="profile-textarea"
                              rows={8}
                              placeholder="Your extracted cover letter appears here, and you can edit it if needed."
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="profile-bio" style={{ whiteSpace: 'pre-wrap' }}>
                          {profile.coverLetter || 'No cover letter was extracted from the uploaded CV.'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="card-header-left"><Icon name="upload" size={22} /><h3 className="profile-card-title">Upload CV</h3></div>
                      <span className="skill-count">{profile.resumePath ? 'CV connected' : 'Upload required'}</span>
                    </div>
                    <div className="profile-card-body">
                      <div className="resume-upload-zone">
                        <div className="upload-icon-container"><Icon name="upload" size={48} /></div>
                        <h4 className="upload-title">Upload your CV</h4>
                        <p className="upload-subtitle">PDF, DOC, DOCX or TXT. The system extracts and auto-fills your profile.</p>
                        <label className={`upload-button ${resumeUploading ? 'disabled' : ''}`}>
                          <Icon name={resumeUploading ? 'briefcase' : 'upload'} size={18} />
                          {resumeUploading ? 'Uploading...' : 'Choose CV'}
                          <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} disabled={resumeUploading || saving} style={{ display: 'none' }} />
                        </label>
                        {resumeMessage && <p className="resume-upload-status">{resumeMessage}</p>}
                      </div>
                      {profile.resumePath && (
                        <div className="current-resume">
                          <Icon name="link" size={16} />
                          <span>Current CV: {getResumeFileName()}</span>
                          <span className="resume-date">Used for profile extraction and job matching</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-header"><h3 className="profile-card-title">Contact Information</h3></div>
                    <div className="profile-card-body">
                      <div className="contact-grid">
                        {[
                          ['Email', 'mail', 'email', 'email', 'email'],
                          ['Phone', 'phone', 'phone', 'tel', 'phone'],
                          ['Location', 'location', 'location', 'text', 'location'],
                          ['Website', 'link', 'website', 'text', 'website'],
                        ].map(([label, icon, key, type, placeholder]) => (
                          <div className="contact-item" key={key}>
                            <div className="contact-icon"><Icon name={icon} size={20} /></div>
                            <div className="contact-content">
                              <label className="contact-label">{label}</label>
                              {isEditing ? (
                                <input
                                  type={type}
                                  value={profile[key]}
                                  onChange={(e) => setProfile((current) => ({ ...current, [key]: e.target.value }))}
                                  className="profile-input-small"
                                  placeholder={placeholder}
                                />
                              ) : key === 'website' ? (
                                profile.website ? <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} className="contact-link" target="_blank" rel="noopener noreferrer">{profile.website}</a> : <p className="contact-value">Not provided</p>
                              ) : (
                                <p className="contact-value">{profile[key] || 'Not provided'}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="social-links-section">
                        <h4 className="section-subtitle">Social Links</h4>
                        <div className="social-links-grid">
                          {[
                            ['linkedin', 'LinkedIn URL', 'linkedin'],
                            ['github', 'GitHub URL', 'github'],
                          ].map(([iconName, placeholder, key]) => (
                            <div className="social-link-item" key={key}>
                              <div className={`social-icon ${key}`}><Icon name={iconName} size={18} /></div>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={profile[key]}
                                  onChange={(e) => setProfile((current) => ({ ...current, [key]: e.target.value }))}
                                  className="profile-input-small"
                                  placeholder={placeholder}
                                />
                              ) : (
                                <a href={profile[key] ? (profile[key].startsWith('http') ? profile[key] : `https://${profile[key]}`) : '#'} className="social-link" target="_blank" rel="noopener noreferrer" onClick={(e) => !profile[key] && e.preventDefault()}>
                                  {profile[key] || 'Not provided'}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="profile-tab-content">
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="card-header-left"><Icon name="briefcase" size={22} /><h3 className="profile-card-title">Work Experience</h3></div>
                      {isEditing && <button className="add-button" onClick={addExperience}><Icon name="plus" size={18} />Add Experience</button>}
                    </div>
                    <div className="profile-card-body">
                      {profile.experience.length === 0 ? (
                        <p className="upload-subtitle">No work experience was extracted from the CV yet.</p>
                      ) : (
                        <div className="timeline">
                          {profile.experience.map((exp) => (
                            <div key={exp.id} className="timeline-item">
                              <div className="timeline-marker" />
                              <div className="timeline-content">
                                {isEditing ? (
                                  <div className="profile-edit-section">
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Job Title</label><input className="profile-input" type="text" value={exp.title} onChange={(e) => updateExperienceItem(exp.id, 'title', e.target.value)} placeholder="e.g. Full Stack Developer" /></div>
                                      <div className="input-group"><label className="input-label">Company</label><input className="profile-input" type="text" value={exp.company} onChange={(e) => updateExperienceItem(exp.id, 'company', e.target.value)} placeholder="Company name" /></div>
                                    </div>
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Location</label><input className="profile-input" type="text" value={exp.location} onChange={(e) => updateExperienceItem(exp.id, 'location', e.target.value)} placeholder="Location" /></div>
                                      <div className="input-group"><label className="input-label">Current Role</label><input type="checkbox" checked={Boolean(exp.current)} onChange={(e) => updateExperienceItem(exp.id, 'current', e.target.checked)} style={{ marginTop: 16 }} /> <span style={{ marginLeft: 8 }}>Currently working here</span></div>
                                    </div>
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Start Date</label><input className="profile-input" type="month" value={exp.startDate || ''} onChange={(e) => updateExperienceItem(exp.id, 'startDate', e.target.value)} /></div>
                                      <div className="input-group"><label className="input-label">End Date</label><input className="profile-input" type="month" value={exp.endDate || ''} onChange={(e) => updateExperienceItem(exp.id, 'endDate', e.target.value)} disabled={exp.current} /></div>
                                    </div>
                                    <div className="input-group"><label className="input-label">Description</label><textarea className="profile-textarea" rows={4} value={exp.description} onChange={(e) => updateExperienceItem(exp.id, 'description', e.target.value)} placeholder="Responsibilities, achievements, tools used" /></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                      <div className="timeline-date">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</div>
                                      <button className="delete-button" type="button" onClick={() => removeExperience(exp.id)}><Icon name="trash" size={18} /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="timeline-header">
                                      <div className="timeline-title-group">
                                        <h4 className="timeline-title">{exp.title || 'Not provided'}</h4>
                                        <p className="timeline-company">{exp.company || 'Not provided'}</p>
                                        <p className="timeline-location"><Icon name="location" size={14} />{exp.location || 'Not provided'}</p>
                                      </div>
                                    </div>
                                    <p className="timeline-date">{formatDateRange(exp.startDate, exp.endDate, exp.current)}</p>
                                    <p className="timeline-description">{exp.description || 'No description provided.'}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'education' && (
                <div className="profile-tab-content">
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="card-header-left"><Icon name="education" size={22} /><h3 className="profile-card-title">Education</h3></div>
                      {isEditing && <button className="add-button" onClick={addEducation}><Icon name="plus" size={18} />Add Education</button>}
                    </div>
                    <div className="profile-card-body">
                      {profile.education.length === 0 ? (
                        <p className="upload-subtitle">No education entries were extracted from the CV yet.</p>
                      ) : (
                        <div className="timeline">
                          {profile.education.map((edu) => (
                            <div key={edu.id} className="timeline-item education">
                              <div className="timeline-marker education" />
                              <div className="timeline-content">
                                {isEditing ? (
                                  <div className="profile-edit-section">
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Degree</label><input className="profile-input" type="text" value={edu.degree} onChange={(e) => updateEducationItem(edu.id, 'degree', e.target.value)} placeholder="e.g. Diploma in ICT" /></div>
                                      <div className="input-group"><label className="input-label">Field / Specialization</label><input className="profile-input" type="text" value={edu.field} onChange={(e) => updateEducationItem(edu.id, 'field', e.target.value)} placeholder="e.g. Software Development" /></div>
                                    </div>
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Institution</label><input className="profile-input" type="text" value={edu.school} onChange={(e) => updateEducationItem(edu.id, 'school', e.target.value)} placeholder="Institution name" /></div>
                                      <div className="input-group"><label className="input-label">Current Study</label><input type="checkbox" checked={Boolean(edu.current)} onChange={(e) => updateEducationItem(edu.id, 'current', e.target.checked)} style={{ marginTop: 16 }} /> <span style={{ marginLeft: 8 }}>Currently studying here</span></div>
                                    </div>
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Start Date</label><input className="profile-input" type="month" value={edu.startDate || ''} onChange={(e) => updateEducationItem(edu.id, 'startDate', e.target.value)} /></div>
                                      <div className="input-group"><label className="input-label">End Date</label><input className="profile-input" type="month" value={edu.endDate || ''} onChange={(e) => updateEducationItem(edu.id, 'endDate', e.target.value)} disabled={edu.current} /></div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                      <div className="timeline-date">{formatDateRange(edu.startDate, edu.endDate, edu.current)}</div>
                                      <button className="delete-button" type="button" onClick={() => removeEducation(edu.id)}><Icon name="trash" size={18} /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="timeline-header">
                                      <div className="timeline-title-group">
                                        <h4 className="timeline-title">{edu.degree || 'Not provided'}{edu.field ? ` in ${edu.field}` : ''}</h4>
                                        <p className="timeline-company">{edu.school || 'Not provided'}</p>
                                      </div>
                                    </div>
                                    <p className="timeline-date">{formatDateRange(edu.startDate, edu.endDate, edu.current)}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="profile-tab-content">
                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="card-header-left"><Icon name="award" size={22} /><h3 className="profile-card-title">Skills</h3></div>
                      <span className="skill-count">{profile.skills.length} skills</span>
                    </div>
                    <div className="profile-card-body">
                      {profile.skills.length === 0 ? (
                        <p className="upload-subtitle">No skills were extracted from the CV yet.</p>
                      ) : (
                        <div className="skills-grid">
                          {profile.skills.map((skill, index) => (
                            <div key={`${skill}-${index}`} className="skill-chip">
                              <span className="skill-name">{skill}</span>
                              {isEditing && <button onClick={() => removeSkill(skill)} className="skill-remove" type="button"><Icon name="close" size={14} /></button>}
                            </div>
                          ))}
                        </div>
                      )}

                      {isEditing && (
                        <div className="add-skill-section">
                          <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                            className="profile-input"
                            placeholder="Add a new skill"
                          />
                          <button onClick={addSkill} className="add-skill-button" type="button"><Icon name="plus" size={18} />Add Skill</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="card-header-left"><Icon name="certificate" size={22} /><h3 className="profile-card-title">Certifications</h3></div>
                      {isEditing && (
                        <label className="add-button upload-cert-label">
                          <Icon name="plus" size={18} />Upload Certificate
                          <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleCertificateUpload} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                    <div className="profile-card-body">
                      {profile.certifications.length === 0 ? (
                        <p className="upload-subtitle">No certifications uploaded yet.</p>
                      ) : (
                        <div className="certifications-list">
                          {profile.certifications.map((cert, index) => (
                            <div key={cert.id || `${cert.name}-${index}`} className="certification-item">
                              <div className="certification-icon"><Icon name="certificate" size={24} /></div>
                              <div className="certification-content">
                                <h4 className="certification-name">{cert.name || 'Not provided'}</h4>
                                <p className="certification-issuer">{cert.issuer || 'Not provided'}</p>
                                {cert.path ? <a href={cert.path} target="_blank" rel="noopener noreferrer">Download</a> : <p className="certification-date">{cert.date ? `Issued ${cert.date}` : 'Issued date not provided'}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-header"><h3 className="profile-card-title">Projects & Portfolio</h3></div>
                    <div className="profile-card-body">
                      {isEditing && (
                        <div style={{ marginBottom: 16 }}>
                          <button type="button" className="add-button" onClick={addProject}>
                            <Icon name="plus" size={18} />Add Project
                          </button>
                        </div>
                      )}
                      {profile.projects.length === 0 ? (
                        <p className="upload-subtitle">No projects were extracted from the CV yet.</p>
                      ) : (
                        <div className="certifications-list">
                          {profile.projects.map((project, index) => (
                            <div key={project.id || `${project.name}-${index}`} className="certification-item">
                              <div className="certification-icon"><Icon name="link" size={24} /></div>
                              <div className="certification-content">
                                {isEditing ? (
                                  <div className="profile-edit-section">
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Project Name</label><input className="profile-input" type="text" value={project.name || ''} onChange={(e) => updateProjectItem(project.id, 'name', e.target.value)} placeholder="Project title" /></div>
                                      <div className="input-group"><label className="input-label">Project Link</label><input className="profile-input" type="text" value={project.link || ''} onChange={(e) => updateProjectItem(project.id, 'link', e.target.value)} placeholder="GitHub / portfolio link" /></div>
                                    </div>
                                    <div className="input-row">
                                      <div className="input-group"><label className="input-label">Type</label><input className="profile-input" type="text" value={project.type || 'project'} onChange={(e) => updateProjectItem(project.id, 'type', e.target.value)} placeholder="project / publication" /></div>
                                      <div className="input-group"><label className="input-label">Description</label><textarea className="profile-textarea" rows={3} value={project.description || ''} onChange={(e) => updateProjectItem(project.id, 'description', e.target.value)} placeholder="What did you build?" /></div>
                                    </div>
                                    <button type="button" className="delete-button" onClick={() => removeProject(project.id)}><Icon name="trash" size={18} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="certification-name">{project.name || 'Not provided'}</h4>
                                    <p className="certification-issuer">{project.link || 'No link extracted'}</p>
                                    {project.description && <p className="timeline-description">{project.description}</p>}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-header"><h3 className="profile-card-title">Languages</h3></div>
                    <div className="profile-card-body">
                      {profile.languages.length === 0 ? (
                        <p className="upload-subtitle">No languages were extracted from the CV yet.</p>
                      ) : (
                        <div className="skills-grid">
                          {profile.languages.map((language, index) => (
                            <div key={language.id || `${language.name}-${index}`} className="skill-chip">
                              <span className="skill-name">{language.name || 'Not provided'}{language.proficiency ? ` • ${language.proficiency}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-card">
                    <div className="profile-card-header">
                      <div className="card-header-left"><Icon name="sparkles" size={22} /><h3 className="profile-card-title">Gemini CV Optimization</h3></div>
                      <span className="skill-count">AI rewrite help</span>
                    </div>
                    <div className="profile-card-body">
                      <p className="upload-subtitle" style={{ marginTop: 0 }}>Improve one section at a time with ATS-friendly wording and role-specific keywords.</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {['summary', 'skills', 'experience', 'cover_letter'].map((section) => (
                          <button
                            key={section}
                            type="button"
                            className="cv-optimize-button"
                            onClick={() => handleOptimizeCvSection(section)}
                            disabled={cvOptimizing}
                          >
                            {cvOptimizing && cvOptimizationSection === section
                              ? `Optimizing ${section}...`
                              : section === 'cover_letter'
                                ? 'Cover Letter Enhancement'
                                : section === 'summary'
                                  ? 'Resume Improvement'
                                  : `Optimize ${section}`}
                          </button>
                        ))}
                      </div>

                      {(cvOptimizationResult || cvOptimizationMessage) && (
                        <div style={{ background: 'rgba(14,165,233,0.06)', borderRadius: '16px', padding: '16px' }}>
                          <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Suggested {cvOptimizationSection.charAt(0).toUpperCase() + cvOptimizationSection.slice(1)}</h4>
                          {cvOptimizationMessage && <p style={{ color: '#b91c1c' }}>{cvOptimizationMessage}</p>}
                          {cvOptimizationResult && <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit', lineHeight: 1.6 }}>{cvOptimizationResult}</pre>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CandidateProfile;
