'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createTag(name: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  if (!name || name.trim().length === 0) {
    return { error: 'Tag name is required' }
  }

  const { data: tag, error } = await supabase
    .from('tags')
    .upsert(
      { owner_user_id: user.id, name: name.trim() },
      { onConflict: 'owner_user_id,name' }
    )
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, data: tag }
}

export async function addTagToClient(clientId: string, tagId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { error } = await supabase.from('client_tags').insert({
    owner_user_id: user.id,
    client_id: clientId,
    tag_id: tagId,
  })

  if (error) {
    // Unique constraint violation = already tagged, treat as success
    if (error.code === '23505') {
      revalidatePath(`/clients/${clientId}`)
      return { success: true }
    }
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function removeTagFromClient(clientId: string, tagId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('client_tags')
    .delete()
    .eq('client_id', clientId)
    .eq('tag_id', tagId)
    .eq('owner_user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
