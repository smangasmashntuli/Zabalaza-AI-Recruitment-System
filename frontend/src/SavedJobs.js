// SavedJobs.js - Updated with animation support
import { useEffect, useState } from 'react';
import './SavedJobs.css';
import { getSavedJobs, removeSavedJob } from './api/candidates';

export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const loadSavedJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSavedJobs();
      setSavedJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const handleRemove = async (jobId) => {
    try {
      setRemovingId(jobId);
      await removeSavedJob(jobId);
      // Wait for animation to complete before removing from state
      setTimeout(async () => {
        await loadSavedJobs();
        setRemovingId(null);
      }, 300);
    } catch (err) {
      setError(err.message || 'Failed to remove saved job');
      setRemovingId(null);
    }
  };

  return (
    <div className="dashboard-view-card">
      <div className="view-header">
        <h2>Saved Jobs</h2>
        <button className="job-portal-state-button" onClick={loadSavedJobs} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p className="view-error">{error}</p>}

      {loading ? (
        <p>Loading saved jobs...</p>
      ) : savedJobs.length === 0 ? (
        <p>No saved jobs yet. Use the Save button on a job to keep it here.</p>
      ) : (
        <div className="saved-jobs-grid">
          {savedJobs.map((item) => {
            const job = item.job || {};
            const isRemoving = removingId === job.id;
            return (
              <div
                key={item.saved_job_id || job.id}
                className={`saved-job-card ${isRemoving ? 'removing' : ''}`}
              >
                <h3>{job.title}</h3>
                <p>{job.company || 'Company'}</p>
                <p>{job.location || 'Remote'}</p>
                <p>{job.job_type || 'Full-time'}</p>
                <p>{job.description?.slice(0, 180)}{job.description && job.description.length > 180 ? '...' : ''}</p>
                <div className="view-actions-row">
                  <button
                    className="submit-button"
                    onClick={() => handleRemove(job.id)}
                    disabled={isRemoving}
                  >
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}