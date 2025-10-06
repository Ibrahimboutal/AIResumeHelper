import { supabase } from '../lib/supabase';

export interface Resume {
  id: string;
  user_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function saveResume(name: string, content: string): Promise<Resume | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      name,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving resume:', error);
    throw error;
  }

  return data;
}

export async function getResumes(): Promise<Resume[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resumes:', error);
    throw error;
  }

  return data || [];
}

export async function updateResume(id: string, name: string, content: string): Promise<Resume | null> {
  const { data, error } = await supabase
    .from('resumes')
    .update({
      name,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating resume:', error);
    throw error;
  }

  return data;
}

export async function deleteResume(id: string): Promise<void> {
  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
}
