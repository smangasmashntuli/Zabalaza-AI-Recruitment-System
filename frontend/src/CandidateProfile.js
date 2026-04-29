import React, { useState, useEffect } from 'react';
import './CandidateProfile.css';
import { getCandidateProfile, updateCandidateProfile, uploadResume } from './api/candidates';

function CandidateProfile({ onClose, onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [resumeMessage, setResumeMessage] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);

  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCandidateProfile();

      // Transform backend data to match component structure
      const transformedProfile = {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        title: data.title || '',
        bio: data.bio || '',
        website: data.website || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        experience: data.work_experience_list || [],
        education: data.education_list || [],
        skills: data.skills_list || [],
        certifications: data.certifications || [],
        resumePath: data.resume_path || null,
      };

      setProfile(transformedProfile);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile. Please try again.');

      // Set default profile if loading fails
      setProfile({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        title: '',
        bio: '',
        website: '',
        linkedin: '',
        github: '',
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        resumePath: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      // Transform profile data for backend
      const profileData = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        location: profile.location,
        title: profile.title,
        bio: profile.bio,
        website: profile.website,
        linkedin: profile.linkedin,
        github: profile.github,
        skills: profile.skills,
        work_experience: profile.experience,
        education: profile.education,
        certifications: profile.certifications,
      };

      await updateCandidateProfile(profileData);
      setIsEditing(false);

      // Reload profile to get updated data
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
    const file = event.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      setResumeUploading(true);
      setError(null);
      setResumeMessage(`Uploading ${file.name} and extracting your CV text...`);
      await uploadResume(file);

      // Reload profile to get updated resume path
      await loadProfile();
      await onProfileUpdated?.();
      setResumeMessage('CV uploaded successfully. Your profile and job recommendations were refreshed.');
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

  const getResumeFileName = () => {
    if (!profile?.resumePath) return '';
    return profile.resumePath.split(/[\\/]/).pop();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // SVG Icons
  const Icon = ({ name, size = 20 }) => {
    const icons = {
      user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      mail: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
      location: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />,
      link: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
      briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      education: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
      award: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
      upload: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />,
      edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
      save: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />,
      close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
      plus: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
      trash: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
      linkedin: <path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
      github: <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />,
      certificate: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    };
    return (
      <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[name] || icons['user']}
      </svg>
    );
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        {/* Header */}
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
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
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

          {/* Tab Navigation */}
          {!loading && (
            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                className={`profile-tab ${activeTab === 'experience' ? 'active' : ''}`}
                onClick={() => setActiveTab('experience')}
              >
                Experience
              </button>
              <button
                className={`profile-tab ${activeTab === 'education' ? 'active' : ''}`}
                onClick={() => setActiveTab('education')}
              >
                Education
              </button>
              <button
                className={`profile-tab ${activeTab === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveTab('skills')}
              >
                Skills & Certifications
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="profile-content">
          {loading ? (
            <div className="profile-state">
              <p>Loading profile...</p>
            </div>
          ) : error ? (
            <div className="profile-state error">
              <p>{error}</p>
              <button onClick={loadProfile} className="profile-state-button">Retry</button>
            </div>
          ) : profile && (
            <>
              {/* Tabs content - wrapped in fragment */}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="profile-tab-content">
              {/* Profile Card */}
              <div className="profile-card profile-hero-card">
                <div className="profile-hero-content">
                  <div className="profile-avatar-container">
                    <div className="profile-avatar-large">
                      {profile.firstName?.[0] || 'U'}{profile.lastName?.[0] || 'U'}
                    </div>
                    {isEditing && (
                      <button className="avatar-upload-button">
                        <Icon name="upload" size={16} />
                      </button>
                    )}
                  </div>

                  <div className="profile-hero-info">
                    {isEditing ? (
                      <div className="profile-edit-section">
                        <div className="input-row">
                          <div className="input-group">
                            <label className="input-label">First Name</label>
                            <input
                              type="text"
                              value={profile.firstName}
                              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                              className="profile-input"
                            />
                          </div>
                          <div className="input-group">
                            <label className="input-label">Last Name</label>
                            <input
                              type="text"
                              value={profile.lastName}
                              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                              className="profile-input"
                            />
                          </div>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Professional Title</label>
                          <input
                            type="text"
                            value={profile.title}
                            onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                            className="profile-input"
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Bio</label>
                          <textarea
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            className="profile-textarea"
                            rows={4}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="profile-name">{profile.firstName} {profile.lastName}</h2>
                        <p className="profile-title">{profile.title}</p>
                        <p className="profile-bio">{profile.bio}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* CV Upload Card */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="card-header-left">
                    <Icon name="upload" size={22} />
                    <h3 className="profile-card-title">Upload CV</h3>
                  </div>
                  <span className="skill-count">{profile.resumePath ? 'CV connected' : 'Upload required'}</span>
                </div>
                <div className="profile-card-body">
                  <div className="resume-upload-zone">
                    <div className="upload-icon-container">
                      <Icon name="upload" size={48} />
                    </div>
                    <h4 className="upload-title">Upload your CV</h4>
                    <p className="upload-subtitle">
                      We will extract the text from your CV, update your profile, and refresh your job matches in real time.
                    </p>
                    <label className={`upload-button ${resumeUploading ? 'disabled' : ''}`}>
                      <Icon name={resumeUploading ? 'briefcase' : 'upload'} size={18} />
                      {resumeUploading ? 'Uploading...' : 'Choose CV'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={resumeUploading || saving}
                        style={{ display: 'none' }}
                      />
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

              {/* Contact Information */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <h3 className="profile-card-title">Contact Information</h3>
                </div>
                <div className="profile-card-body">
                  <div className="contact-grid">
                    <div className="contact-item">
                      <div className="contact-icon">
                        <Icon name="mail" size={20} />
                      </div>
                      <div className="contact-content">
                        <label className="contact-label">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className="profile-input-small"
                          />
                        ) : (
                          <p className="contact-value">{profile.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="contact-item">
                      <div className="contact-icon">
                        <Icon name="phone" size={20} />
                      </div>
                      <div className="contact-content">
                        <label className="contact-label">Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="profile-input-small"
                          />
                        ) : (
                          <p className="contact-value">{profile.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="contact-item">
                      <div className="contact-icon">
                        <Icon name="location" size={20} />
                      </div>
                      <div className="contact-content">
                        <label className="contact-label">Location</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.location}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            className="profile-input-small"
                          />
                        ) : (
                          <p className="contact-value">{profile.location}</p>
                        )}
                      </div>
                    </div>

                    <div className="contact-item">
                      <div className="contact-icon">
                        <Icon name="link" size={20} />
                      </div>
                      <div className="contact-content">
                        <label className="contact-label">Website</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.website}
                            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            className="profile-input-small"
                          />
                        ) : (
                          <a href={`https://${profile.website}`} className="contact-link" target="_blank" rel="noopener noreferrer">
                            {profile.website}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="social-links-section">
                    <h4 className="section-subtitle">Social Links</h4>
                    <div className="social-links-grid">
                      <div className="social-link-item">
                        <div className="social-icon linkedin">
                          <Icon name="linkedin" size={18} />
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.linkedin}
                            onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                            className="profile-input-small"
                            placeholder="LinkedIn URL"
                          />
                        ) : (
                          <a href={`https://${profile.linkedin}`} className="social-link" target="_blank" rel="noopener noreferrer">
                            {profile.linkedin}
                          </a>
                        )}
                      </div>

                      <div className="social-link-item">
                        <div className="social-icon github">
                          <Icon name="github" size={18} />
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profile.github}
                            onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                            className="profile-input-small"
                            placeholder="GitHub URL"
                          />
                        ) : (
                          <a href={`https://${profile.github}`} className="social-link" target="_blank" rel="noopener noreferrer">
                            {profile.github}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="profile-tab-content">
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="card-header-left">
                    <Icon name="briefcase" size={22} />
                    <h3 className="profile-card-title">Work Experience</h3>
                  </div>
                  {isEditing && (
                    <button className="add-button">
                      <Icon name="plus" size={18} />
                      Add Experience
                    </button>
                  )}
                </div>
                <div className="profile-card-body">
                  <div className="timeline">
                    {profile.experience.map((exp) => (
                      <div key={exp.id} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <div className="timeline-title-group">
                              <h4 className="timeline-title">{exp.title}</h4>
                              <p className="timeline-company">{exp.company}</p>
                              <p className="timeline-location">
                                <Icon name="location" size={14} />
                                {exp.location}
                              </p>
                            </div>
                            {isEditing && (
                              <button className="delete-button">
                                <Icon name="trash" size={18} />
                              </button>
                            )}
                          </div>
                          <p className="timeline-date">
                            {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                          </p>
                          <p className="timeline-description">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="profile-tab-content">
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="card-header-left">
                    <Icon name="education" size={22} />
                    <h3 className="profile-card-title">Education</h3>
                  </div>
                  {isEditing && (
                    <button className="add-button">
                      <Icon name="plus" size={18} />
                      Add Education
                    </button>
                  )}
                </div>
                <div className="profile-card-body">
                  <div className="timeline">
                    {profile.education.map((edu) => (
                      <div key={edu.id} className="timeline-item education">
                        <div className="timeline-marker education"></div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <div className="timeline-title-group">
                              <h4 className="timeline-title">{edu.degree} in {edu.field}</h4>
                              <p className="timeline-company">{edu.school}</p>
                            </div>
                            {isEditing && (
                              <button className="delete-button">
                                <Icon name="trash" size={18} />
                              </button>
                            )}
                          </div>
                          <p className="timeline-date">
                            {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills & Certifications Tab */}
          {activeTab === 'skills' && (
            <div className="profile-tab-content">
              {/* Skills Section */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="card-header-left">
                    <Icon name="award" size={22} />
                    <h3 className="profile-card-title">Skills</h3>
                  </div>
                  <span className="skill-count">{profile.skills.length} skills</span>
                </div>
                <div className="profile-card-body">
                  <div className="skills-grid">
                    {profile.skills.map((skill, index) => (
                      <div key={index} className="skill-chip">
                        <span className="skill-name">{skill}</span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="skill-remove"
                          >
                            <Icon name="close" size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditing && (
                    <div className="add-skill-section">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        className="profile-input"
                        placeholder="Add a new skill (press Enter)"
                      />
                      <button onClick={handleAddSkill} className="add-skill-button">
                        <Icon name="plus" size={18} />
                        Add Skill
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications Section */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="card-header-left">
                    <Icon name="certificate" size={22} />
                    <h3 className="profile-card-title">Certifications</h3>
                  </div>
                  {isEditing && (
                    <button className="add-button">
                      <Icon name="plus" size={18} />
                      Add Certification
                    </button>
                  )}
                </div>
                <div className="profile-card-body">
                  <div className="certifications-list">
                    {profile.certifications.map((cert) => (
                      <div key={cert.id} className="certification-item">
                        <div className="certification-icon">
                          <Icon name="certificate" size={24} />
                        </div>
                        <div className="certification-content">
                          <h4 className="certification-name">{cert.name}</h4>
                          <p className="certification-issuer">{cert.issuer}</p>
                          <p className="certification-date">Issued {cert.date}</p>
                        </div>
                        {isEditing && (
                          <button className="delete-button">
                            <Icon name="trash" size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="profile-card">
                <div className="profile-card-header">
                  <h3 className="profile-card-title">Resume</h3>
                </div>
                <div className="profile-card-body">
                  <div className="resume-upload-zone">
                    <div className="upload-icon-container">
                      <Icon name="upload" size={48} />
                    </div>
                    <h4 className="upload-title">Upload your resume</h4>
                    <p className="upload-subtitle">PDF, DOC, DOCX (max. 5MB)</p>
                    <label className="upload-button">
                      <Icon name="upload" size={18} />
                      Choose File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  {profile.resumePath && (
                    <div className="current-resume">
                      <Icon name="link" size={16} />
                      <span>Current resume: {profile.resumePath.split('/').pop()}</span>
                      <span className="resume-date">Updated recently</span>
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
