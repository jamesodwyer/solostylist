import { supabase } from '@/lib/supabase'
import type { Tag } from '@/lib/types/database'

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Tag[]
}

export async function getClientTagIds(clientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('client_tags')
    .select('tag_id')
    .eq('client_id', clientId)

  if (error) throw new Error(error.message)
  return (data ?? []).map((t) => t.tag_id)
}

export async function setClientTags(clientId: string, tagIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Remove all existing tags for this client
  const { error: deleteError } = await supabase
    .from('client_tags')
    .delete()
    .eq('client_id', clientId)

  if (deleteError) throw new Error(deleteError.message)

  // Insert new tags
  if (tagIds.length > 0) {
    const rows = tagIds.map((tag_id) => ({
      owner_user_id: user.id,
      client_id: clientId,
      tag_id,
    }))

    const { error: insertError } = await supabase
      .from('client_tags')
      .insert(rows)

    if (insertError) throw new Error(insertError.message)
  }
}
