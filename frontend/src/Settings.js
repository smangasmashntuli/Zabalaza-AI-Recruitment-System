// Settings.js - Redesigned for AI Recruitment System
import { useEffect, useState } from 'react';
import './Settings.css';
import { updateCandidateProfile } from './api/candidates';
import { getCurrentUser } from './api/auth';

export default function Settings({ candidateProfile, onProfileUpdated }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    location: '',
    title: '',
    phone: '',
    linkedin: '',
    github: '',
  });

  // Recruitment-specific preferences
  const [preferences, setPreferences] = useState({
    jobAlerts: true,
    emailNotifications: true,
    matchNotifications: true,
    weeklyDigest: false,
    savedSearchAlerts: true,
    interviewReminders: true,
  });

  // Job search preferences
  const [jobPreferences, setJobPreferences] = useState({
    preferredJobTypes: ['full-time'],
    remotePreference: 'hybrid',
    salaryMin: '',
    salaryMax: '',
    industries: [],
    locations: [],
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (candidateProfile) {
      setForm({
        full_name: candidateProfile.full_name ||
          `${candidateProfile.first_name || ''} ${candidateProfile.last_name || ''}`.trim() || '',
        location: candidateProfile.location || '',
        title: candidateProfile.title || '',
        phone: candidateProfile.phone || '',
        linkedin: candidateProfile.linkedin || '',
        github: candidateProfile.github || '',
      });
    }
  }, [candidateProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      setMessageType('');

      const nameParts = form.full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await updateCandidateProfile({
        first_name: firstName,
        last_name: lastName,
        location: form.location,
        title: form.title,
        phone: form.phone,
        linkedin: form.linkedin,
        github: form.github,
      });

      setMessage('Settings saved successfully!');
      setMessageType('success');
      onProfileUpdated?.();

      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (err) {
      setMessage(err.message || 'Could not save settings');
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <div className="settings-header-left">
          <p className="settings-eyebrow">Manage your account</p>
          <h1 className="settings-title">Settings</h1>
        </div>
        <button className="settings-save-button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <p className={messageType === 'success' ? 'settings-success' : 'settings-error'}>
          {message}
        </p>
      )}

      <div className="settings-grid">
        {/* Profile Information Card */}
        <div className="settings-card">
          <h3>Profile Information</h3>
          <p className="settings-card-subtitle">Keep your profile details up to date for better job matches</p>

          <div className="settings-profile-section">
            <div className="settings-profile-avatar">
              <div className="settings-avatar-circle">
                {getInitials(form.full_name)}
              </div>
              <div className="settings-avatar-info">
                <span className="settings-avatar-name">{form.full_name || 'Your Name'}</span>
                <span className="settings-avatar-email">{user?.email || 'email@example.com'}</span>
              </div>
            </div>
          </div>

          <label className="settings-field-label">Full Name</label>
          <input
            className="settings-input"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Enter your full name"
          />

          <label className="settings-field-label">Professional Title</label>
          <input
            className="settings-input"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g., Senior Software Engineer"
          />

          <label className="settings-field-label">Location</label>
          <input
            className="settings-input"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g., New York, NY"
          />

          <label className="settings-field-label">Phone Number</label>
          <input
            className="settings-input"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="e.g., +1 234 567 890"
          />

          <label className="settings-field-label">LinkedIn Profile</label>
          <input
            className="settings-input"
            value={form.linkedin}
            onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
            placeholder="https://linkedin.com/in/your-profile"
          />

          <label className="settings-field-label">GitHub Profile</label>
          <input
            className="settings-input"
            value={form.github}
            onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))}
            placeholder="https://github.com/your-username"
          />
        </div>

        {/* Job Preferences Card */}
        <div className="settings-card">
          <h3>Job Preferences</h3>
          <p className="settings-card-subtitle">Customize your job search preferences</p>

          <label className="settings-field-label">Preferred Job Types</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'].map((type) => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={jobPreferences.preferredJobTypes.includes(type.toLowerCase())}
                  onChange={(e) => {
                    const value = type.toLowerCase();
                    if (e.target.checked) {
                      setJobPreferences((p) => ({
                        ...p,
                        preferredJobTypes: [...p.preferredJobTypes, value]
                      }));
                    } else {
                      setJobPreferences((p) => ({
                        ...p,
                        preferredJobTypes: p.preferredJobTypes.filter((t) => t !== value)
                      }));
                    }
                  }}
                />
                {type}
              </label>
            ))}
          </div>

          <label className="settings-field-label">Remote Preference</label>
          <select
            className="settings-select"
            value={jobPreferences.remotePreference}
            onChange={(e) => setJobPreferences((p) => ({ ...p, remotePreference: e.target.value }))}
            style={{ width: '100%', marginBottom: '1rem', padding: '0.6rem 1.2rem' }}
          >
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid</option>
            <option value="on-site">On-site Only</option>
            <option value="any">Any</option>
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label className="settings-field-label">Min Salary ($)</label>
              <input
                className="settings-input"
                type="number"
                value={jobPreferences.salaryMin}
                onChange={(e) => setJobPreferences((p) => ({ ...p, salaryMin: e.target.value }))}
                placeholder="50,000"
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label className="settings-field-label">Max Salary ($)</label>
              <input
                className="settings-input"
                type="number"
                value={jobPreferences.salaryMax}
                onChange={(e) => setJobPreferences((p) => ({ ...p, salaryMax: e.target.value }))}
                placeholder="150,000"
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="settings-card">
          <h3>Notification Preferences</h3>
          <p className="settings-card-subtitle">Control how you receive updates</p>

          <div className="settings-toggle-row">
            <div>
              <span className="settings-toggle-title">Job Alerts</span>
              <span className="settings-toggle-description">Get notified about new matching jobs</span>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={preferences.jobAlerts}
                onChange={(e) => setPreferences((p) => ({ ...p, jobAlerts: e.target.checked }))}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="settings-toggle-title">Email Notifications</span>
              <span className="settings-toggle-description">Receive updates via email</span>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences((p) => ({ ...p, emailNotifications: e.target.checked }))}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="settings-toggle-title">AI Match Alerts</span>
              <span className="settings-toggle-description">Get notified when new high-match jobs appear</span>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={preferences.matchNotifications}
                onChange={(e) => setPreferences((p) => ({ ...p, matchNotifications: e.target.checked }))}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="settings-toggle-title">Weekly Digest</span>
              <span className="settings-toggle-description">Receive a weekly summary of your activity</span>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={(e) => setPreferences((p) => ({ ...p, weeklyDigest: e.target.checked }))}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <div>
              <span className="settings-toggle-title">Interview Reminders</span>
              <span className="settings-toggle-description">Get reminders for upcoming interviews</span>
            </div>
            <label className="settings-toggle-switch">
              <input
                type="checkbox"
                checked={preferences.interviewReminders}
                onChange={(e) => setPreferences((p) => ({ ...p, interviewReminders: e.target.checked }))}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Account Management Card */}
        <div className="settings-card">
          <h3>Account Management</h3>
          <p className="settings-card-subtitle">Manage your account settings</p>

          <div className="settings-list-item">
            <span className="item-label">Account Type</span>
            <span className="settings-badge premium">Job Seeker</span>
          </div>

          <div className="settings-list-item">
            <span className="item-label">Profile Visibility</span>
            <button className="item-action primary">Make Public</button>
          </div>

          <div className="settings-list-item">
            <span className="item-label">Resume</span>
            <button className="item-action primary">Upload New</button>
          </div>

          <div className="settings-list-item">
            <span className="item-label">Download My Data</span>
            <button className="item-action primary">Export</button>
          </div>

          <div className="settings-list-item">
            <span className="item-label">Deactivate Account</span>
            <button className="item-action">Deactivate</button>
          </div>

          <div className="settings-list-item" style={{ borderBottom: 'none' }}>
            <span className="item-label">Delete Account</span>
            <button className="item-action" style={{ color: 'var(--coral)' }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}