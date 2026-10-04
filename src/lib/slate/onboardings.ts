import { supabase } from '@/lib/supabase/client';
import type { Onboarding } from './onboardingChecklist';

export async function fetchOnboardings(): Promise<Onboarding[]> {
  const { data, error } = await supabase
    .from('onboardings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Onboarding[]) || [];
}

export async function insertOnboarding(
  brand_name: string,
  verbal_date: string | null,
  items: import('./onboardingChecklist').OnboardingItem[]
): Promise<Onboarding> {
  const { data, error } = await supabase
    .from('onboardings')
    .insert([{ brand_name, verbal_date, checks: {}, items, archived: false }])
    .select()
    .single();
  if (error) throw error;
  return data as Onboarding;
}

export async function patchOnboardingChecks(
  id: string,
  checks: Record<string, string>
): Promise<void> {
  const { error } = await supabase.from('onboardings').update({ checks }).eq('id', id);
  if (error) throw error;
}

export async function patchOnboardingItems(
  id: string,
  items: import('./onboardingChecklist').OnboardingItem[]
): Promise<void> {
  const { error } = await supabase.from('onboardings').update({ items }).eq('id', id);
  if (error) throw error;
}

export async function patchOnboardingBrandName(id: string, brand_name: string): Promise<void> {
  const { error } = await supabase.from('onboardings').update({ brand_name }).eq('id', id);
  if (error) throw error;
}

export async function patchOnboardingArchived(
  id: string,
  archived: boolean
): Promise<void> {
  const { error } = await supabase.from('onboardings').update({ archived }).eq('id', id);
  if (error) throw error;
}

export async function removeOnboarding(id: string): Promise<void> {
  await supabase.from('onboardings').delete().eq('id', id);
}
