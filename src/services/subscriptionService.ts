import { supabase } from '../lib/supabase';

export interface SubscriptionTier {
  id: string;
  name: string;
  job_limit: number | null;
  price: number;
  features: string[];
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  jobs_used: number;
  subscribed_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  tier?: SubscriptionTier;
}

export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching subscription tiers:', error);
    throw new Error(`Failed to fetch subscription tiers: ${error.message}`);
  }

  return data || [];
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      tier:subscription_tiers(*)
    `)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user subscription:', error);
    throw new Error(`Failed to fetch subscription: ${error.message}`);
  }

  return data;
}

export async function canCreateJobApplication(): Promise<{
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number | null;
}> {
  try {
    const subscription = await getUserSubscription();

    if (!subscription) {
      return {
        allowed: false,
        reason: 'No subscription found. Please sign up to continue.',
        current: 0,
        limit: 0,
      };
    }

    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
      return {
        allowed: false,
        reason: 'Your subscription has expired. Please renew to continue.',
        current: subscription.jobs_used,
        limit: subscription.tier?.job_limit || null,
      };
    }

    const limit = subscription.tier?.job_limit;

    if (limit === null || limit === undefined) {
      return {
        allowed: true,
        current: subscription.jobs_used,
        limit: null,
      };
    }

    if (subscription.jobs_used >= limit) {
      return {
        allowed: false,
        reason: `You've reached your limit of ${limit} job applications. Upgrade to continue.`,
        current: subscription.jobs_used,
        limit: limit,
      };
    }

    return {
      allowed: true,
      current: subscription.jobs_used,
      limit: limit,
    };
  } catch (error) {
    console.error('Error checking job application permission:', error);
    return {
      allowed: false,
      reason: 'Error checking subscription status',
      current: 0,
      limit: 0,
    };
  }
}

export async function upgradeTier(tierId: string): Promise<boolean> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const expiresAt = tierId === 'premium' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      tier_id: tierId,
      expires_at: expiresAt,
      subscribed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error upgrading subscription:', error);
    throw new Error(`Failed to upgrade subscription: ${error.message}`);
  }

  return true;
}

export async function createDefaultSubscription(): Promise<UserSubscription | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      tier_id: 'free',
      jobs_used: 0,
    })
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return getUserSubscription();
    }
    console.error('Error creating default subscription:', error);
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  return data;
}

export async function getUsageStats(): Promise<{
  used: number;
  limit: number | null;
  percentage: number;
  tierName: string;
}> {
  const subscription = await getUserSubscription();

  if (!subscription) {
    return {
      used: 0,
      limit: 0,
      percentage: 0,
      tierName: 'None',
    };
  }

  const limit = subscription.tier?.job_limit;
  const used = subscription.jobs_used;

  return {
    used,
    limit: limit || null,
    percentage: limit ? Math.min((used / limit) * 100, 100) : 0,
    tierName: subscription.tier?.name || 'Unknown',
  };
}

export type LocalAIFeatureType =
  | 'prompt'
  | 'proofread'
  | 'summarize'
  | 'translate'
  | 'write'
  | 'rewrite'
  | 'image_analysis'
  | 'audio_analysis';

export async function canUseLocalAIFeature(featureType: LocalAIFeatureType): Promise<{
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
      current: 0,
      limit: 0,
    };
  }

  try {
    const { data, error } = await supabase.rpc('can_use_local_ai_feature', {
      p_user_id: user.id,
      p_feature_type: featureType,
    });

    if (error) {
      console.error('Error checking local AI feature permission:', error);
      return {
        allowed: false,
        reason: 'Error checking subscription status',
        current: 0,
        limit: 0,
      };
    }

    return {
      allowed: data.allowed,
      reason: data.reason,
      current: data.current,
      limit: data.limit,
    };
  } catch (error) {
    console.error('Error checking local AI feature permission:', error);
    return {
      allowed: false,
      reason: 'Error checking subscription status',
      current: 0,
      limit: 0,
    };
  }
}

export async function getLocalAIUsageStats(): Promise<Record<LocalAIFeatureType, { used: number; limit: number | null }>> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('get_local_ai_usage_stats', {
    p_user_id: user.id,
  });

  if (error) {
    console.error('Error fetching local AI usage stats:', error);
    throw new Error('Failed to fetch usage stats');
  }

  return data || {};
}
