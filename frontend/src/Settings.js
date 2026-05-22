import { useEffect, useState } from 'react';
import './Dashboard.css';
import { updateCandidateProfile } from './api/candidates';

const toggleOptions = [
  { label: 'Dark mode', key: 'darkMode', defaultValue: true },
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

export default function Settings({ candidateProfile, onProfileUpdated }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
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
        <h2>Settings</h2>
        <button className="job-portal-state-button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {message && <p className="view-error">{message}</p>}

      <div className="settings-grid">
        <section className="settings-card">
          <h3>Profile information</h3>
          <label>Full name</label>
          <input className="search-input-compact" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
          <label>Location</label>
          <input className="search-input-compact" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <label>Industry</label>
          <input className="search-input-compact" value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          <label>Professional title</label>
          <input className="search-input-compact" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </section>

        <section className="settings-card">
          <h3>Display and preferences</h3>
          {toggleOptions.map((option) => (
            <div key={option.key} className="settings-toggle-row">
              <span>{option.label}</span>
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

