// lib/projects.ts
// Supabase-backed project persistence — replaces the old localStorage history

import { createClient } from '@/utils/supabase/client';

export interface Project {
  id: string;
  user_id: string;
  file_name: string;
  marketplace: 'shopify' | 'amazon';
  product_count: number;
  status: 'done' | 'failed';
  products: any[];
  created_at: string;
}

/** Fetch all projects for the currently logged-in user, newest first */
export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProjects error:', error.message);
    return [];
  }
  return (data as Project[]) ?? [];
}

/** Save a new processing result to Supabase */
export async function saveProject(entry: {
  fileName: string;
  marketplace: 'shopify' | 'amazon';
  productCount: number;
  products: any[];
}): Promise<Project | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn('saveProject: no logged-in user — skipping save');
    return null;
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      file_name: entry.fileName,
      marketplace: entry.marketplace,
      product_count: entry.productCount,
      products: entry.products,
      status: 'done',
    })
    .select()
    .single();

  if (error) {
    console.error('saveProject error:', error.message);
    return null;
  }
  return data as Project;
}

/** Delete a project by ID */
export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) console.error('deleteProject error:', error.message);
}

/** Delete ALL projects for the current user */
export async function clearAllProjects(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('projects').delete().eq('user_id', user.id);
  if (error) console.error('clearAllProjects error:', error.message);
}
