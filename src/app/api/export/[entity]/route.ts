import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function escape(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ]
  return '\uFEFF' + lines.join('\r\n') // UTF-8 BOM + CRLF line endings (Excel-friendly)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { entity } = await params
  const today = new Date().toISOString().split('T')[0]
  const filename = `solostylist-${entity}-${today}.csv`
  let csv = ''

  if (entity === 'clients') {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, email, address, marketing_consent, created_at')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })

    csv = buildCsv(
      ['id', 'first_name', 'last_name', 'phone', 'email', 'address', 'marketing_consent', 'created_at'],
      (data ?? []) as Record<string, unknown>[]
    )
  } else if (entity === 'appointments') {
    const { data } = await supabase
      .from('appointments')
      .select(
        'id, client_id, clients(first_name, last_name), starts_at, ends_at, status, notes, created_at, appointment_services(service_name, service_price)'
      )
      .eq('owner_user_id', user.id)
      .order('starts_at', { ascending: true })

    const rows = (data ?? []).map(a => {
      type ClientShape = { first_name: string; last_name?: string | null }
      const client = (a.clients as unknown) as ClientShape | null
      const clientName = client
        ? `${client.first_name} ${client.last_name ?? ''}`.trim()
        : ''
      const services = Array.isArray(a.appointment_services)
        ? (a.appointment_services as { service_name: string }[])
            .map(s => s.service_name)
            .join(' | ')
        : ''
      return {
        id: a.id,
        client_id: a.client_id,
        client_name: clientName,
        starts_at: a.starts_at,
        ends_at: a.ends_at,
        status: a.status,
        notes: a.notes ?? '',
        services,
        created_at: a.created_at,
      }
    })

    csv = buildCsv(
      ['id', 'client_id', 'client_name', 'starts_at', 'ends_at', 'status', 'notes', 'services', 'created_at'],
      rows
    )
  } else if (entity === 'payments') {
    const { data } = await supabase
      .from('payments')
      .select(
        'id, client_id, appointment_id, amount, method, payment_type, reference_payment_id, notes, paid_at, created_at'
      )
      .eq('owner_user_id', user.id)
      .order('paid_at', { ascending: true })

    const rows = (data ?? []).map(p => ({
      id: p.id,
      client_id: p.client_id,
      appointment_id: p.appointment_id,
      amount_gbp: (p.amount / 100).toFixed(2),
      method: p.method,
      payment_type: p.payment_type,
      reference_payment_id: p.reference_payment_id,
      notes: p.notes,
      paid_at: p.paid_at,
      created_at: p.created_at,
    }))

    csv = buildCsv(
      ['id', 'client_id', 'appointment_id', 'amount_gbp', 'method', 'payment_type', 'reference_payment_id', 'notes', 'paid_at', 'created_at'],
      rows as Record<string, unknown>[]
    )
  } else if (entity === 'notes') {
    const [notesResult, formulasResult] = await Promise.all([
      supabase
        .from('client_notes')
        .select('id, client_id, note_type, content, created_at, updated_at')
        .eq('owner_user_id', user.id),
      supabase
        .from('colour_formulas')
        .select('id, client_id, formula, notes, created_at, updated_at')
        .eq('owner_user_id', user.id),
    ])

    const noteRows = (notesResult.data ?? []).map(n => ({
      id: n.id,
      client_id: n.client_id,
      note_type: n.note_type,
      content: n.content,
      created_at: n.created_at,
      updated_at: n.updated_at,
    }))

    const formulaRows = (formulasResult.data ?? []).map(f => ({
      id: f.id,
      client_id: f.client_id,
      note_type: 'colour_formula',
      content: f.formula + (f.notes ? '\n' + f.notes : ''),
      created_at: f.created_at,
      updated_at: f.updated_at,
    }))

    const combined = [...noteRows, ...formulaRows].sort((a, b) =>
      a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
    )

    csv = buildCsv(
      ['id', 'client_id', 'note_type', 'content', 'created_at', 'updated_at'],
      combined
    )
  } else {
    return new Response('Not found', { status: 404 })
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
