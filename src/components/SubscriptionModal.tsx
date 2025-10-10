import { useState, useEffect } from 'react';
import { X, Check, Zap, Sparkles } from 'lucide-react';
import { getSubscriptionTiers, getUserSubscription, upgradeTier } from '../services/subscriptionService';
import type { SubscriptionTier, UserSubscription } from '../services/subscriptionService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export function SubscriptionModal({ isOpen, onClose, onUpgrade }: SubscriptionModalProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSubscriptionData();
    }
  }, [isOpen]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [tiersData, subscriptionData] = await Promise.all([
        getSubscriptionTiers(),
        getUserSubscription(),
      ]);
      setTiers(tiersData);
      setCurrentSubscription(subscriptionData);
    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    try {
      setLoading(true);
      setError('');
      await upgradeTier(tierId);
      await loadSubscriptionData();
      if (onUpgrade) {
        onUpgrade();
      }
      onClose();
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError('Failed to upgrade subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const isCurrentTier = currentSubscription?.tier_id === tier.id;
              const isFreeTier = tier.id === 'free';
              const isPremium = tier.id === 'premium';

              return (
                <div
                  key={tier.id}
                  className={`relative border-2 rounded-lg p-6 ${
                    isPremium
                      ? 'border-blue-500 shadow-lg'
                      : isCurrentTier
                      ? 'border-green-500'
                      : 'border-gray-200'
                  }`}
                >
                  {isPremium && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Best Value
                    </div>
                  )}

                  {isCurrentTier && (
                    <div className="absolute -top-3 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Current Plan
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        ${tier.price.toFixed(2)}
                      </span>
                      {isPremium && (
                        <span className="text-gray-500 text-sm">one-time</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-center mb-4">
                      {tier.job_limit ? (
                        <span className="text-lg font-semibold text-gray-700">
                          {tier.job_limit} job applications
                        </span>
                      ) : (
                        <span className="text-lg font-semibold text-blue-600 flex items-center justify-center gap-1">
                          <Zap className="w-5 h-5" />
                          Unlimited applications
                        </span>
                      )}
                    </div>

                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={loading || isCurrentTier}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      isCurrentTier
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPremium
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : isFreeTier
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {loading
                      ? 'Processing...'
                      : isCurrentTier
                      ? 'Current Plan'
                      : isFreeTier
                      ? 'Downgrade to Free'
                      : 'Upgrade Now'}
                  </button>
                </div>
              );
            })}
          </div>

          {currentSubscription && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Current Usage</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  {currentSubscription.jobs_used} of{' '}
                  {currentSubscription.tier?.job_limit || 'unlimited'} applications used
                </span>
                {currentSubscription.tier?.job_limit && (
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (currentSubscription.jobs_used /
                            currentSubscription.tier.job_limit) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
