'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const noteSchema = z.object({
  client_id: z.string().uuid(),
  note_type: z.enum(['general', 'treatment']),
  content: z.string().min(1, 'Content is required'),
})

const colourFormulaSchema = z.object({
  client_id: z.string().uuid(),
  formula: z.string().min(1, 'Formula is required'),
  notes: z.string().optional(),
})

export async function addNote(data: {
  client_id: string
  note_type: 'general' | 'treatment'
  content: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const parsed = noteSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from('client_notes').insert({
    owner_user_id: user.id,
    client_id: parsed.data.client_id,
    note_type: parsed.data.note_type,
    content: parsed.data.content,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/clients/${parsed.data.client_id}`)
  return { success: true }
}

export async function updateNote(id: string, data: { content: string }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  if (!data.content || data.content.trim().length === 0) {
    return { error: 'Content is required' }
  }

  const { data: note, error } = await supabase
    .from('client_notes')
    .update({ content: data.content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .select('client_id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/clients/${note.client_id}`)
  return { success: true }
}

export async function deleteNote(id: string, clientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Audit log: record note deletion (non-blocking)
  const { error: auditError } = await supabase.from('audit_log').insert({
    owner_user_id: user.id,
    action: 'note_deleted',
    entity_type: 'client_note',
    entity_id: id,
    details: { client_id: clientId },
  })
  if (auditError) {
    console.error('Audit log insert failed:', auditError.message)
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}

export async function addColourFormula(data: {
  client_id: string
  formula: string
  notes?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const parsed = colourFormulaSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from('colour_formulas').insert({
    owner_user_id: user.id,
    client_id: parsed.data.client_id,
    formula: parsed.data.formula,
    notes: parsed.data.notes || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/clients/${parsed.data.client_id}`)
  return { success: true }
}

export async function updateColourFormula(
  id: string,
  data: { formula: string; notes?: string }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  if (!data.formula || data.formula.trim().length === 0) {
    return { error: 'Formula is required' }
  }

  const { data: formula, error } = await supabase
    .from('colour_formulas')
    .update({
      formula: data.formula,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .select('client_id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/clients/${formula.client_id}`)
  return { success: true }
}

export async function deleteColourFormula(id: string, clientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('colour_formulas')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Audit log: record colour formula deletion (non-blocking)
  const { error: auditError } = await supabase.from('audit_log').insert({
    owner_user_id: user.id,
    action: 'colour_formula_deleted',
    entity_type: 'colour_formula',
    entity_id: id,
    details: { client_id: clientId },
  })
  if (auditError) {
    console.error('Audit log insert failed:', auditError.message)
  }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
