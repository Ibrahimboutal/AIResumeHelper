import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Briefcase, Target, Calendar, Award, Zap, Crown } from 'lucide-react';
import { getApplicationStats } from '../services/applicationService';
import { getResumes } from '../services/resumeService';
import { useAuth } from '../hooks/useAuth';
import { UsageBanner } from './UsageBanner';
import { SubscriptionModal } from './SubscriptionModal';
import { getUsageStats } from '../services/subscriptionService';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });
  const [resumeCount, setResumeCount] = useState(0);
  const [_loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number | null;
    percentage: number;
    tierName: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [applicationStats, resumes, usageStats] = await Promise.all([
        getApplicationStats(),
        getResumes(),
        getUsageStats(),
      ]);

      if (applicationStats) {
        setStats(applicationStats);
      }
      if (Array.isArray(resumes)) {
        setResumeCount(resumes.length);
      }
      if (usageStats) {
        setUsage(usageStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({ total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 });
      setResumeCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </h2>
        <p className="text-sm text-slate-500 text-center py-4">
          Sign in to view your job search statistics
        </p>
      </div>
    );
  }

  // --- Rate Calculations (These were already safe) ---
  const successRate = stats.total > 0
    ? Math.min(Math.round(((stats.interview + stats.offer) / stats.total) * 100), 100)
    : 0;

  const offerRate = stats.total > 0
    ? Math.min(Math.round((stats.offer / stats.total) * 100), 100)
    : 0;

  const interviewRate = stats.total > 0
    ? Math.min(Math.round((stats.interview / stats.total) * 100), 100)
    : 0;

  const responseRate = stats.total > 0
    ? Math.min(Math.round(((stats.total - stats.applied) / stats.total) * 100), 100)
    : 0;

  // --- Progress Calculations (FIX for ARIA issue) ---
  const appliedProgress = stats.total > 0
    ? Math.min((stats.applied / stats.total) * 100, 100)
    : 0;

  const interviewProgress = stats.total > 0
    ? Math.min((stats.interview / stats.total) * 100, 100)
    : 0;

  const offerProgress = stats.total > 0
    ? Math.min((stats.offer / stats.total) * 100, 100)
    : 0;
    
  const StatCard = ({ icon, label, value, colorClass, bgClass, borderClass }: { icon: React.ReactNode, label: string, value: number, colorClass: string, bgClass: string, borderClass: string }) => (
    <div className={`${bgClass} border ${borderClass} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`${bgClass} p-2 rounded-lg`}>
          {icon}
        </div>
        <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      </div>
      <p className={`text-xs font-medium ${colorClass}`}>{label}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {usage && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Subscription Plan</h3>
                <p className="text-slate-300 text-xs">{usage.tierName} Tier</p>
              </div>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              {usage.limit === null ? 'Manage Plan' : 'Upgrade'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-300 text-xs mb-1">Applications Used</p>
              <p className="text-2xl font-bold">
                {usage.used} {usage.limit !== null && `/ ${usage.limit}`}
              </p>
            </div>
            {usage.limit !== null && (
              <div>
                <p className="text-slate-300 text-xs mb-1">Usage</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/20 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usage.percentage >= 100
                          ? 'bg-red-500'
                          : usage.percentage >= 80
                          ? 'bg-yellow-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{Math.round(usage.percentage)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <UsageBanner onUpgradeClick={() => setShowSubscriptionModal(true)} />

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Job Search Dashboard</h2>
            <p className="text-blue-100 text-sm">Track your progress at a glance</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-blue-100 text-xs mb-1">Total Applications</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-blue-100 text-xs mb-1">Saved Resumes</p>
            <p className="text-3xl font-bold">{resumeCount}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-blue-100 text-xs mb-1">Success Rate</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold">{successRate}%</p>
              {successRate >= 30 && (
                <span className="text-emerald-300 text-xs" aria-label="Above average">↑</span>
              )}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <p className="text-blue-100 text-xs mb-1">Response Rate</p>
            <p className="text-3xl font-bold">{responseRate}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Application Status Breakdown
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Briefcase className="w-4 h-4" />}
            label="Applied"
            value={stats.applied}
            colorClass="text-blue-700"
            bgClass="bg-blue-50"
            borderClass="border-blue-200"
          />

          <StatCard
            icon={<Calendar className="w-4 h-4" />}
            label="Interview Stage"
            value={stats.interview}
            colorClass="text-amber-700"
            bgClass="bg-amber-50"
            borderClass="border-amber-200"
          />

          <StatCard
            icon={<Award className="w-4 h-4" />}
            label="Offers Received"
            value={stats.offer}
            colorClass="text-emerald-700"
            bgClass="bg-emerald-50"
            borderClass="border-emerald-200"
          />

          <StatCard
            icon={<Target className="w-4 h-4" />}
            label="Not Selected"
            value={stats.rejected}
            colorClass="text-rose-700"
            bgClass="bg-rose-50"
            borderClass="border-rose-200"
          />
        </div>
      </div>

      {stats.total > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Progress Visualization
          </h3>

          <div className="space-y-3">
            {/* Applied Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Applied</span>
                <span className="font-semibold">{stats.applied} ({Math.round(appliedProgress)}%)</span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${appliedProgress}%` }}
                  role="progressbar"
                  // FIX: Using the safe, pre-calculated number
                  aria-valuenow={appliedProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  title='Applied Progress'
                />
              </div>
            </div>

            {/* Interview Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Interview</span>
                <span className="font-semibold">{stats.interview} ({Math.round(interviewProgress)}%)</span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 transition-all duration-500"
                  style={{ width: `${interviewProgress}%` }}
                  role="progressbar"
                  // FIX: Using the safe, pre-calculated number
                  aria-valuenow={interviewProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  title='Interview Progress'
                />
              </div>
            </div>

            {/* Offers Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Offers</span>
                <span className="font-semibold">{stats.offer} ({Math.round(offerProgress)}%)</span>
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${offerProgress}%` }}
                  role="progressbar"
                  // FIX: Using the safe, pre-calculated number
                  aria-valuenow={offerProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  title='Offer Progress'
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium mb-1">Interview Rate</p>
                <p className="text-2xl font-bold text-emerald-700">{interviewRate}%</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-medium mb-1">Offer Rate</p>
                <p className="text-2xl font-bold text-blue-700">{offerRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Start Your Job Search</h3>
          <p className="text-sm text-slate-600">
            Track your applications to see insights and statistics here
          </p>
        </div>
      )}

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onUpgrade={() => loadStats()}
      />
    </div>
  );
}