import { useState, useEffect } from 'react';
import { AlertCircle, Zap } from 'lucide-react';
import { getUsageStats } from '../services/subscriptionService';

interface UsageBannerProps {
  onUpgradeClick: () => void;
}

export function UsageBanner({ onUpgradeClick }: UsageBannerProps) {
  const [usage, setUsage] = useState<{
    used: number;
    limit: number | null;
    percentage: number;
    tierName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const stats = await getUsageStats();
      setUsage(stats);
      setError(null);
    } catch (err) {
      console.error('Error loading usage stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-yellow-900">Unable to Load Usage Stats</h3>
            <p className="text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!usage || usage.limit === null) {
    return null;
  }

  const isNearLimit = usage.percentage >= 80;
  const isAtLimit = usage.used >= usage.limit;

  if (!isNearLimit) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-lg border ${
        isAtLimit
          ? 'bg-red-50 border-red-200'
          : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            isAtLimit ? 'text-red-600' : 'text-yellow-600'
          }`}
        />
        <div className="flex-1">
          <h3
            className={`font-semibold mb-1 ${
              isAtLimit ? 'text-red-900' : 'text-yellow-900'
            }`}
          >
            {isAtLimit
              ? 'Application Limit Reached'
              : 'Approaching Application Limit'}
          </h3>
          <p
            className={`text-sm mb-3 ${
              isAtLimit ? 'text-red-700' : 'text-yellow-700'
            }`}
          >
            You've used {usage.used} of {usage.limit} applications in your{' '}
            {usage.tierName} plan.
            {isAtLimit
              ? ' Upgrade to continue tracking more jobs.'
              : ' Consider upgrading for more applications.'}
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white rounded-full h-2 max-w-xs">
              <div
                className={`h-2 rounded-full transition-all ${
                  isAtLimit ? 'bg-red-600' : 'bg-yellow-600'
                }`}
                style={{ width: `${usage.percentage}%` }}
              />
            </div>
            <button
              onClick={onUpgradeClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              <Zap className="w-4 h-4" />
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
