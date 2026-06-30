import { useEffect, useState } from 'react';
import './Dashboard.css';
import { getNotifications, markNotificationRead } from './api/candidates';

export default function NotificationsPanel({ notifications: initialNotifications = [], onRefresh }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      onRefresh?.();
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Only auto-load if no initial notifications provided
  useEffect(() => {
    if (initialNotifications.length === 0) {
      loadNotifications();
    }
    const interval = window.setInterval(loadNotifications, 60000);
    return () => window.clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch (err) {
      setError(err.message || 'Failed to update notification');
    }
  };

  return (
    <div className="dashboard-view-card">
      <div className="view-header">
        <h2>Notifications</h2>
        <button className="job-portal-state-button" onClick={loadNotifications} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <p className="view-error">{error}</p>}

      {notifications.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div key={notification.id} className={`notification-card ${notification.is_read ? 'read' : 'unread'}`}>
              <div>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <small>{notification.created_at ? new Date(notification.created_at).toLocaleString() : ''}</small>
              </div>
              {!notification.is_read && (
                <button className="submit-button" onClick={() => handleMarkRead(notification.id)}>
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

