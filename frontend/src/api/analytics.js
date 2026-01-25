/**
 * Analytics API service
 * Calculates analytics from application data
 */

/**
 * Calculate analytics from applications
 */
export const calculateAnalytics = (applications) => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  // Count applications by time period
  const totalApplications = applications.length;
  const lastMonthApplications = applications.filter(app =>
    new Date(app.applied_at) >= lastMonth
  ).length;

  // Count interviews
  const interviews = applications.filter(app =>
    app.status === 'interview' || app.status === 'shortlisted'
  ).length;

  // Count offers
  const offers = applications.filter(app =>
    app.status === 'accepted' || app.status === 'offer_received'
  ).length;

  // Calculate response rate (reviewed or better vs total)
  const responded = applications.filter(app =>
    app.status !== 'pending'
  ).length;
  const responseRate = totalApplications > 0
    ? Math.round((responded / totalApplications) * 100)
    : 0;

  return {
    applications: {
      value: totalApplications,
      change: lastMonthApplications,
      period: 'vs last month',
      positive: lastMonthApplications > 0
    },
    interviews: {
      value: interviews,
      change: interviews,
      period: 'scheduled',
      positive: interviews > 0
    },
    responseRate: {
      value: responseRate,
      change: 5, // Could be calculated from historical data
      period: 'vs average',
      positive: responseRate >= 50
    },
    offers: {
      value: offers,
      change: offers,
      period: 'pending',
      positive: offers > 0
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

