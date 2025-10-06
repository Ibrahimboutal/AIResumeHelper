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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      user_id: user.id,
      job_title: jobTitle,
      company,
      job_url: jobUrl || null,
      job_description: jobDescription || null,
      notes: notes || null,
      status: 'applied',
      applied_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving job application:', error);
    throw error;
  }

  return data;
}

export async function getJobApplications(): Promise<JobApplication[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false });

  if (error) {
    console.error('Error fetching job applications:', error);
    throw error;
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
  const { data, error } = await supabase
    .from('job_applications')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job application:', error);
    throw error;
  }

  return data;
}

export async function deleteJobApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting job application:', error);
    throw error;
  }
}

export async function getApplicationStats(): Promise<{
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
}> {
  const applications = await getJobApplications();

  return {
    total: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
    interview: applications.filter(app => app.status === 'interview').length,
    offer: applications.filter(app => app.status === 'offer').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };
}
