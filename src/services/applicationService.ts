import { supabase } from '../lib/supabase';

export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  job_url: string | null;
  job_description: string | null;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function saveJobApplication(
  jobTitle: string,
  company: string,
  jobUrl?: string,
  jobDescription?: string,
  notes?: string
): Promise<JobApplication | null> {
  if (!jobTitle?.trim() || !company?.trim()) {
    throw new Error('Job title and company are required');
  }

  if (jobTitle.length > 200) {
    throw new Error('Job title is too long (max 200 characters)');
  }

  if (company.length > 200) {
    throw new Error('Company name is too long (max 200 characters)');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      user_id: user.id,
      job_title: jobTitle.trim(),
      company: company.trim(),
      job_url: jobUrl?.trim() || null,
      job_description: jobDescription?.trim() || null,
      notes: notes?.trim() || null,
      status: 'applied',
      applied_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error saving job application:', error);
    throw new Error(`Failed to save application: ${error.message}`);
  }

  return data;
}

export async function getJobApplications(): Promise<JobApplication[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching job applications:', error);
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  return data || [];
}

export async function updateJobApplication(
  id: string,
  updates: {
    job_title?: string;
    company?: string;
    job_url?: string;
    job_description?: string;
    status?: 'applied' | 'interview' | 'offer' | 'rejected';
    notes?: string;
  }
): Promise<JobApplication | null> {
  if (!id?.trim()) {
    throw new Error('Application ID is required');
  }

  if (updates.job_title && updates.job_title.length > 200) {
    throw new Error('Job title is too long (max 200 characters)');
  }

  if (updates.company && updates.company.length > 200) {
    throw new Error('Company name is too long (max 200 characters)');
  }

  const trimmedUpdates: any = {};
  if (updates.job_title) trimmedUpdates.job_title = updates.job_title.trim();
  if (updates.company) trimmedUpdates.company = updates.company.trim();
  if (updates.job_url) trimmedUpdates.job_url = updates.job_url.trim();
  if (updates.job_description) trimmedUpdates.job_description = updates.job_description.trim();
  if (updates.notes) trimmedUpdates.notes = updates.notes.trim();
  if (updates.status) trimmedUpdates.status = updates.status;

  const { data, error } = await supabase
    .from('job_applications')
    .update({
      ...trimmedUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating job application:', error);
    throw new Error(`Failed to update application: ${error.message}`);
  }

  if (!data) {
    throw new Error('Application not found or you do not have permission to update it');
  }

  return data;
}

export async function deleteJobApplication(id: string): Promise<void> {
  if (!id?.trim()) {
    throw new Error('Application ID is required');
  }

  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting job application:', error);
    throw new Error(`Failed to delete application: ${error.message}`);
  }
}

export async function getApplicationStats(): Promise<{
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}> {
  try {
    const applications = await getJobApplications();

    if (!Array.isArray(applications)) {
      return { total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    }

    return {
      total: applications.length,
      applied: applications.filter(app => app?.status === 'applied').length,
      interview: applications.filter(app => app?.status === 'interview').length,
      offer: applications.filter(app => app?.status === 'offer').length,
      rejected: applications.filter(app => app?.status === 'rejected').length,
    };
  } catch (error) {
    console.error('Error getting application stats:', error);
    return { total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  }
}
