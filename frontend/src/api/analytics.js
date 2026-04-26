/**
 * Analytics API service
 * Calculates analytics from application data
 */

/**
 * Calculate analytics from applications
 */
export const calculateAnalytics = (applications) => {
  const now = new Date();
  const totalApplications = applications.length;
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);
  const previous30Days = new Date(now);
  previous30Days.setDate(now.getDate() - 60);

  const currentWindow = applications.filter(app => {
    const appliedAt = new Date(app.applied_at || app.appliedAt || app.date);
    return appliedAt >= last30Days;
  });

  const previousWindow = applications.filter(app => {
    const appliedAt = new Date(app.applied_at || app.appliedAt || app.date);
    return appliedAt >= previous30Days && appliedAt < last30Days;
  });

  const interviews = applications.filter(app =>
    ['interview', 'shortlisted', 'interview_scheduled'].includes(app.status)
  ).length;
  const previousInterviews = previousWindow.filter(app =>
    ['interview', 'shortlisted', 'interview_scheduled'].includes(app.status)
  ).length;

  const offers = applications.filter(app =>
    app.status === 'accepted' || app.status === 'offer_received'
  ).length;
  const previousOffers = previousWindow.filter(app =>
    app.status === 'accepted' || app.status === 'offer_received'
  ).length;

  const responded = applications.filter(app =>
    app.status !== 'pending'
  ).length;
  const responseRate = totalApplications > 0
    ? Math.round((responded / totalApplications) * 100)
    : 0;

  const previousResponded = previousWindow.filter(app => app.status !== 'pending').length;
  const previousResponseRate = previousWindow.length > 0
    ? Math.round((previousResponded / previousWindow.length) * 100)
    : 0;

  const calculateDelta = (currentValue, previousValue) => currentValue - previousValue;

  return {
    applications: {
      value: totalApplications,
      change: calculateDelta(currentWindow.length, previousWindow.length),
      period: 'vs last month',
      positive: currentWindow.length >= previousWindow.length
    },
    interviews: {
      value: interviews,
      change: calculateDelta(interviews, previousInterviews),
      period: 'scheduled',
      positive: interviews >= previousInterviews
    },
    responseRate: {
      value: responseRate,
      change: calculateDelta(responseRate, previousResponseRate),
      period: 'vs average',
      positive: responseRate >= previousResponseRate
    },
    offers: {
      value: offers,
      change: calculateDelta(offers, previousOffers),
      period: 'pending',
      positive: offers >= previousOffers
    }
  };
};

/**
 * Generate insights from application data
 */
export const generateInsights = (applications, profile) => {
  const insights = [];

  // Profile completion insight
  if (profile) {
    const completionPercentage = calculateProfileCompletion(profile);
    if (completionPercentage < 100) {
      insights.push({
        type: 'tip',
        title: 'Profile Optimization',
        message: `Add ${100 - completionPercentage}% more information to increase your match rate`,
        action: 'Update Profile',
        priority: 'medium'
      });
    }
  }

  // Interview reminders
  const upcomingInterviews = applications.filter(app =>
    app.status === 'interview'
  );
  if (upcomingInterviews.length > 0) {
    insights.push({
      type: 'alert',
      title: 'Interview Reminder',
      message: `You have ${upcomingInterviews.length} upcoming interview${upcomingInterviews.length > 1 ? 's' : ''}`,
      action: 'View Details',
      priority: 'high'
    });
  }

  // Application updates
  const recentUpdates = applications.filter(app => {
    const updatedAt = new Date(app.updated_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return updatedAt >= threeDaysAgo && app.status !== 'pending';
  });

  if (recentUpdates.length > 0) {
    const latest = recentUpdates[0];
    insights.push({
      type: 'success',
      title: 'Application Update',
      message: `Your application status was updated to ${latest.status}`,
      action: 'View Application',
      priority: 'high'
    });
  }

  return insights;
};

/**
 * Calculate profile completion percentage
 */
export const calculateProfileCompletion = (profile) => {
  if (!profile) return 0;

  const fields = [
    profile.phone,
    profile.location,
    profile.resume_text,
    profile.skills,
    profile.experience_years,
    profile.education,
    profile.work_experience
  ];

  const completed = fields.filter(field => field && field !== '[]' && field !== '').length;
  return Math.round((completed / fields.length) * 100);
};

