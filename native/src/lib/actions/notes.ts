import { supabase } from '@/lib/supabase'
import type { ClientNote, ColourFormula } from '@/lib/types/database'

// --- Client Notes (general + treatment) ---

export async function getNotes(clientId: string): Promise<ClientNote[]> {
  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ClientNote[]
}

export async function getNotesByType(
  clientId: string,
  noteType: 'general' | 'treatment'
): Promise<ClientNote[]> {
  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', clientId)
    .eq('note_type', noteType)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ClientNote[]
}

export async function createNote(input: {
  clientId: string
  noteType: 'general' | 'treatment'
  content: string
}): Promise<ClientNote> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('client_notes')
    .insert({
      owner_user_id: user.id,
      client_id: input.clientId,
      note_type: input.noteType,
      content: input.content.trim(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ClientNote
}

export async function deleteNote(id: string) {
  const { error } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// --- Colour Formulas (separate table) ---

export async function getColourFormulas(clientId: string): Promise<ColourFormula[]> {
  const { data, error } = await supabase
    .from('colour_formulas')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ColourFormula[]
}

export async function createColourFormula(input: {
  clientId: string
  formula: string
  notes?: string
}): Promise<ColourFormula> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('colour_formulas')
    .insert({
      owner_user_id: user.id,
      client_id: input.clientId,
      formula: input.formula.trim(),
      notes: input.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ColourFormula
}

export async function deleteColourFormula(id: string) {
  const { error } = await supabase
    .from('colour_formulas')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
