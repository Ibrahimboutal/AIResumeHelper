/*
  # Add Subscription System

  ## Overview
  This migration implements a tiered subscription system allowing:
  - Free tier: 5 job applications
  - Basic tier: 20 job applications
  - Premium tier: Unlimited job applications (lifetime access)

  ## New Tables

  ### `subscription_tiers`
  Defines available subscription tiers and their limits
  - `id` (text, primary key) - Tier identifier (free, basic, premium)
  - `name` (text) - Display name
  - `job_limit` (integer, nullable) - Max job applications (null = unlimited)
  - `price` (numeric) - Price in USD
  - `features` (jsonb) - Additional features as JSON
  - `created_at` (timestamptz) - Creation timestamp

  ### `user_subscriptions`
  Tracks user subscription status and usage
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key to auth.users) - Subscriber
  - `tier_id` (text, foreign key to subscription_tiers) - Current tier
  - `jobs_used` (integer) - Number of jobs used in current period
  - `subscribed_at` (timestamptz) - When subscription started
  - `expires_at` (timestamptz, nullable) - Expiration date (null for lifetime)
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last modification time

  ## Security
  - Enable RLS on user_subscriptions table
  - Users can read their own subscription data
  - Only authenticated users can access
  - Subscription tiers table is readable by all authenticated users

  ## Important Notes
  1. Free tier is automatically assigned to new users
  2. jobs_used counter tracks usage against tier limits
  3. Premium tier has no expiration (lifetime access)
  4. Basic tier requires manual expiration management
*/

-- Create subscription_tiers table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  job_limit integer,
  price numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id text NOT NULL REFERENCES subscription_tiers(id),
  jobs_used integer NOT NULL DEFAULT 0,
  subscribed_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Insert subscription tiers
INSERT INTO subscription_tiers (id, name, job_limit, price, features)
VALUES
  ('free', 'Free', 5, 0, '["Resume tailoring", "Cover letter generation", "Job tracking"]'::jsonb),
  ('basic', 'Basic', 20, 9.99, '["Resume tailoring", "Cover letter generation", "Job tracking", "Advanced AI features", "Priority support"]'::jsonb),
  ('premium', 'Premium', NULL, 49.99, '["Resume tailoring", "Cover letter generation", "Job tracking", "Unlimited applications", "Advanced AI features", "Priority support", "Lifetime access"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers
CREATE POLICY "Anyone can view subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON user_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

-- Add trigger to update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier_id, jobs_used)
  VALUES (NEW.id, 'free', 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Function to check if user can create job application
CREATE OR REPLACE FUNCTION can_create_job_application(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_tier_limit integer;
  v_jobs_used integer;
  v_expires_at timestamptz;
BEGIN
  SELECT
    st.job_limit,
    us.jobs_used,
    us.expires_at
  INTO
    v_tier_limit,
    v_jobs_used,
    v_expires_at
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RETURN false;
  END IF;

  IF v_tier_limit IS NULL THEN
    RETURN true;
  END IF;

  RETURN v_jobs_used < v_tier_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment job usage counter
CREATE OR REPLACE FUNCTION increment_job_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_subscriptions
  SET jobs_used = jobs_used + 1
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment usage when job application is created
CREATE TRIGGER on_job_application_created
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_usage();
