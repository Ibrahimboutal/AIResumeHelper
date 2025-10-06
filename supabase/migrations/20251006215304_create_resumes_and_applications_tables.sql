/*
  # Create Resume and Job Application Tables

  ## Overview
  This migration creates tables for storing user resumes and job applications,
  enabling users to track their job search progress and manage multiple resume versions.

  ## New Tables

  ### `resumes`
  Stores user resume versions with full content
  - `id` (uuid, primary key) - Unique identifier for each resume
  - `user_id` (uuid, foreign key to auth.users) - Owner of the resume
  - `name` (text) - Resume name/version (e.g., "Software Engineer Resume", "Marketing Resume")
  - `content` (text) - Full resume text content
  - `created_at` (timestamptz) - When the resume was created
  - `updated_at` (timestamptz) - Last modification time

  ### `job_applications`
  Tracks job applications with details and status
  - `id` (uuid, primary key) - Unique identifier for each application
  - `user_id` (uuid, foreign key to auth.users) - User who applied
  - `job_title` (text) - Position title
  - `company` (text) - Company name
  - `job_url` (text, nullable) - Link to job posting
  - `job_description` (text, nullable) - Full job posting text
  - `status` (text) - Application status (applied, interview, offer, rejected)
  - `applied_date` (date) - When application was submitted
  - `notes` (text, nullable) - User notes about the application
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last modification time

  ## Security
  - Enable Row Level Security (RLS) on both tables
  - Users can only read/write their own resumes and applications
  - Authenticated access only - no public access
*/

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company text NOT NULL,
  job_url text,
  job_description text,
  status text NOT NULL DEFAULT 'applied',
  applied_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resumes table

-- Users can view their own resumes
CREATE POLICY "Users can view own resumes"
  ON resumes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own resumes
CREATE POLICY "Users can insert own resumes"
  ON resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own resumes
CREATE POLICY "Users can update own resumes"
  ON resumes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
  ON resumes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for job_applications table

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications"
  ON job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update own applications"
  ON job_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications"
  ON job_applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON job_applications(applied_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically update updated_at
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
