import { useEffect, useState } from 'react';
import './Dashboard.css';
import { updateCandidateProfile } from './api/candidates';

const toggleOptions = [
  { label: 'Language', key: 'language', defaultValue: 'English' },
  { label: 'Content language', key: 'contentLanguage', defaultValue: 'English' },
  { label: 'Autoplay videos', key: 'autoplayVideos', defaultValue: true },
  { label: 'Sound effects', key: 'soundEffects', defaultValue: true },
  { label: 'Showing profile photos', key: 'showProfilePhotos', defaultValue: 'All members' },
  { label: 'Preferred feed view', key: 'feedView', defaultValue: 'Most relevant posts' },
  { label: 'Sync calendar', key: 'syncCalendar', defaultValue: false },
  { label: 'Sync contacts', key: 'syncContacts', defaultValue: false },
  { label: 'Enable receiving notifications', key: 'enableNotifications', defaultValue: true },
];

export default function Settings({ candidateProfile, onProfileUpdated, theme = 'light', onThemeChange }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [form, setForm] = useState({
    full_name: '',
    location: '',
    title: '',
    industry: '',
  });
  const [preferences, setPreferences] = useState(
    toggleOptions.reduce((acc, option) => ({ ...acc, [option.key]: option.defaultValue }), {})
  );

  useEffect(() => {
    setForm({
      full_name: candidateProfile?.full_name || '',
      location: candidateProfile?.location || '',
      title: candidateProfile?.title || '',
      industry: candidateProfile?.industry || '',
    });
  }, [candidateProfile]);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleThemeToggle = (event) => {
    const nextTheme = event.target.checked ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    onThemeChange?.(nextTheme);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      await updateCandidateProfile({
        first_name: form.full_name.split(' ')[0] || '',
        last_name: form.full_name.split(' ').slice(1).join(' ') || '',
        location: form.location,
        title: form.title,
      });
      setMessage('Settings saved successfully.');
      onProfileUpdated?.();
    } catch (err) {
      setMessage(err.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-view-card">
      <div className="view-header">
        <div>
          <p className="settings-eyebrow">Personalize your workspace</p>
          <h2>Settings</h2>
        </div>
        <button className="settings-save-button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {message && <p className="view-error">{message}</p>}

      <section className="settings-hero-card">
        <div>
          <p className="settings-hero-label">Appearance</p>
          <h3>Switch between light and dark mode</h3>
          <p className="settings-hero-text">
            Dark mode uses a soft navy background and bright text for a comfortable, modern viewing experience.
          </p>
        </div>
        <div className="settings-theme-switch">
          <span className="settings-theme-label">Light</span>
          <label className="theme-switch" aria-label="Toggle dark mode">
            <input type="checkbox" checked={currentTheme === 'dark'} onChange={handleThemeToggle} />
            <span className="theme-switch-track">
              <span className="theme-switch-thumb" />
            </span>
          </label>
          <span className="settings-theme-label">Dark</span>
        </div>
      </section>

      <div className="settings-grid">
        <section className="settings-card">
          <h3>Profile information</h3>
          <p className="settings-card-subtitle">Keep your visible profile details fresh and accurate.</p>
          <label className="settings-field-label">Full name</label>
          <input className="settings-input" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          <label className="settings-field-label">Location</label>
          <input className="settings-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <label className="settings-field-label">Industry</label>
          <input className="settings-input" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          <label className="settings-field-label">Professional title</label>
          <input className="settings-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </section>

        <section className="settings-card">
          <h3>Display and preferences</h3>
          <p className="settings-card-subtitle">Control the experience with quick preferences.</p>
          {toggleOptions.map((option) => (
            <div key={option.key} className="settings-toggle-row">
              <div>
                <span className="settings-toggle-title">{option.label}</span>
                <span className="settings-toggle-description">{typeof preferences[option.key] === 'boolean' ? (preferences[option.key] ? 'On' : 'Off') : preferences[option.key]}</span>
              </div>
              {typeof preferences[option.key] === 'boolean' ? (
                <input type="checkbox" checked={preferences[option.key]} onChange={(e) => setPreferences((p) => ({ ...p, [option.key]: e.target.checked }))} />
              ) : (
                <select value={preferences[option.key]} onChange={(e) => setPreferences((p) => ({ ...p, [option.key]: e.target.value }))}>
                  <option value={preferences[option.key]}>{preferences[option.key]}</option>
                  <option value="On">On</option>
                  <option value="Off">Off</option>
                  <option value="English">English</option>
                  <option value="All members">All LinkedIn members</option>
                  <option value="Most relevant posts">Most relevant posts (Recommended)</option>
                  <option value="People you unfollowed">People you unfollowed</option>
                </select>
              )}
            </div>
          ))}
        </section>

        <section className="settings-card">
          <h3>Subscriptions & payments</h3>
          <p>Retry Premium Free</p>
          <p>Manage Premium account</p>
          <p>View purchase history</p>
          <h3 style={{ marginTop: '16px' }}>Partners & services</h3>
          <p>Microsoft</p>
          <h3 style={{ marginTop: '16px' }}>Account management</h3>
          <p>Hibernate account</p>
          <p>Close and delete account</p>
          <p>Manage notifications</p>
        </section>
      </div>
    </div>
  );
}

