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
  if (!name?.trim() || !content?.trim()) {
    throw new Error('Name and content are required');
  }

  if (name.length > 200) {
    throw new Error('Resume name is too long (max 200 characters)');
  }

  if (content.length > 100000) {
    throw new Error('Resume content is too large (max 100,000 characters)');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      name: name.trim(),
      content: content.trim(),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error saving resume:', error);
    throw new Error(`Failed to save resume: ${error.message}`);
  }

  return data;
}

export async function getResumes(): Promise<Resume[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching resumes:', error);
    throw new Error(`Failed to fetch resumes: ${error.message}`);
  }

  return data || [];
}

export async function updateResume(id: string, name: string, content: string): Promise<Resume | null> {
  if (!id?.trim()) {
    throw new Error('Resume ID is required');
  }

  if (!name?.trim() || !content?.trim()) {
    throw new Error('Name and content are required');
  }

  if (name.length > 200) {
    throw new Error('Resume name is too long (max 200 characters)');
  }

  if (content.length > 100000) {
    throw new Error('Resume content is too large (max 100,000 characters)');
  }

  const { data, error } = await supabase
    .from('resumes')
    .update({
      name: name.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating resume:', error);
    throw new Error(`Failed to update resume: ${error.message}`);
  }

  if (!data) {
    throw new Error('Resume not found or you do not have permission to update it');
  }

  return data;
}

export async function deleteResume(id: string): Promise<void> {
  if (!id?.trim()) {
    throw new Error('Resume ID is required');
  }

  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting resume:', error);
    throw new Error(`Failed to delete resume: ${error.message}`);
  }
}
