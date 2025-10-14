/*
  # Add Local AI Usage Tracking

  ## Overview
  This migration adds usage tracking for Chrome on-device AI features:
  - Prompt API
  - Proofreader API
  - Summarizer API
  - Translator API
  - Writer API
  - Rewriter API
  - Image Analysis
  - Audio Analysis

  ## New Tables

  ### `local_ai_usage`
  Tracks usage of local AI features per user
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key to auth.users) - User who made the request
  - `feature_type` (text) - Type of feature used (prompt, proofread, summarize, translate, write, rewrite, image_analysis, audio_analysis)
  - `input_length` (integer) - Length of input text/file size
  - `created_at` (timestamptz) - When the feature was used

  ### `local_ai_monthly_usage`
  Aggregated monthly usage per feature per user
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key to auth.users) - User
  - `feature_type` (text) - Feature type
  - `usage_count` (integer) - Number of uses this month
  - `month` (date) - Month for this usage period
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ## Security
  - Enable RLS on both tables
  - Users can only read/insert their own usage data
  - Automatic monthly reset handled by functions

  ## Important Notes
  1. Usage resets monthly (first day of each month)
  2. Each feature type has separate limits based on subscription tier
  3. Free: 5 calls per feature per month
  4. Basic: 20 calls per feature per month
  5. Premium: unlimited calls
*/

-- Create local_ai_usage table for detailed tracking
CREATE TABLE IF NOT EXISTS local_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type text NOT NULL CHECK (feature_type IN ('prompt', 'proofread', 'summarize', 'translate', 'write', 'rewrite', 'image_analysis', 'audio_analysis')),
  input_length integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create monthly usage aggregation table
CREATE TABLE IF NOT EXISTS local_ai_monthly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_type text NOT NULL CHECK (feature_type IN ('prompt', 'proofread', 'summarize', 'translate', 'write', 'rewrite', 'image_analysis', 'audio_analysis')),
  usage_count integer NOT NULL DEFAULT 0,
  month date NOT NULL DEFAULT date_trunc('month', now()),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_type, month)
);

-- Enable Row Level Security
ALTER TABLE local_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_ai_monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for local_ai_usage
CREATE POLICY "Users can view own AI usage"
  ON local_ai_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage"
  ON local_ai_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for local_ai_monthly_usage
CREATE POLICY "Users can view own monthly usage"
  ON local_ai_monthly_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly usage"
  ON local_ai_monthly_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly usage"
  ON local_ai_monthly_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_local_ai_usage_user_id ON local_ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_local_ai_usage_feature_type ON local_ai_usage(feature_type);
CREATE INDEX IF NOT EXISTS idx_local_ai_usage_created_at ON local_ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_local_ai_monthly_usage_user_feature ON local_ai_monthly_usage(user_id, feature_type, month);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at
CREATE TRIGGER update_local_ai_monthly_usage_updated_at
  BEFORE UPDATE ON local_ai_monthly_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to record local AI usage and update monthly count
CREATE OR REPLACE FUNCTION record_local_ai_usage(
  p_user_id uuid,
  p_feature_type text,
  p_input_length integer DEFAULT 0
)
RETURNS boolean AS $$
DECLARE
  v_current_month date;
BEGIN
  v_current_month := date_trunc('month', now());

  -- Insert detailed usage record
  INSERT INTO local_ai_usage (user_id, feature_type, input_length)
  VALUES (p_user_id, p_feature_type, p_input_length);

  -- Update or insert monthly usage count
  INSERT INTO local_ai_monthly_usage (user_id, feature_type, usage_count, month)
  VALUES (p_user_id, p_feature_type, 1, v_current_month)
  ON CONFLICT (user_id, feature_type, month)
  DO UPDATE SET
    usage_count = local_ai_monthly_usage.usage_count + 1,
    updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can use local AI feature
CREATE OR REPLACE FUNCTION can_use_local_ai_feature(
  p_user_id uuid,
  p_feature_type text
)
RETURNS jsonb AS $$
DECLARE
  v_tier_id text;
  v_usage_count integer;
  v_limit integer;
  v_current_month date;
BEGIN
  v_current_month := date_trunc('month', now());

  -- Get user's subscription tier
  SELECT tier_id INTO v_tier_id
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'No subscription found',
      'current', 0,
      'limit', 0
    );
  END IF;

  -- Get current month usage
  SELECT COALESCE(usage_count, 0) INTO v_usage_count
  FROM local_ai_monthly_usage
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND month = v_current_month;

  IF NOT FOUND THEN
    v_usage_count := 0;
  END IF;

  -- Determine limit based on tier
  CASE v_tier_id
    WHEN 'free' THEN v_limit := 5;
    WHEN 'basic' THEN v_limit := 20;
    WHEN 'premium' THEN v_limit := NULL; -- unlimited
    ELSE v_limit := 0;
  END CASE;

  -- Check if allowed
  IF v_limit IS NULL THEN
    -- Unlimited (premium)
    RETURN jsonb_build_object(
      'allowed', true,
      'current', v_usage_count,
      'limit', NULL
    );
  ELSIF v_usage_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', format('Monthly limit of %s uses reached for %s', v_limit, p_feature_type),
      'current', v_usage_count,
      'limit', v_limit
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', true,
      'current', v_usage_count,
      'limit', v_limit
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all local AI usage stats for a user
CREATE OR REPLACE FUNCTION get_local_ai_usage_stats(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_current_month date;
BEGIN
  v_current_month := date_trunc('month', now());

  SELECT jsonb_object_agg(
    feature_type,
    jsonb_build_object(
      'used', COALESCE(usage_count, 0),
      'limit', CASE
        WHEN (SELECT tier_id FROM user_subscriptions WHERE user_id = p_user_id) = 'premium' THEN NULL
        WHEN (SELECT tier_id FROM user_subscriptions WHERE user_id = p_user_id) = 'basic' THEN 20
        ELSE 5
      END
    )
  ) INTO v_result
  FROM (
    SELECT unnest(ARRAY['prompt', 'proofread', 'summarize', 'translate', 'write', 'rewrite', 'image_analysis', 'audio_analysis']) AS feature_type
  ) features
  LEFT JOIN local_ai_monthly_usage lamu ON
    lamu.user_id = p_user_id AND
    lamu.feature_type = features.feature_type AND
    lamu.month = v_current_month;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
