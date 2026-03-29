import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, ChevronRight, Banknote } from 'lucide-react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import {
  getDailyPayments,
  calculateDailyTotals,
  formatPennies,
  type DailyTotals,
} from '@/lib/actions/payments'
import type { Payment } from '@/lib/types/database'

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatDate(d: Date): string {
  const today = new Date()
  if (toDateString(d) === toDateString(today)) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (toDateString(d) === toDateString(yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function paymentClientName(p: Payment): string {
  if (!p.clients) return 'Unknown'
  return [p.clients.first_name, p.clients.last_name].filter(Boolean).join(' ')
}

function TotalsCard({ totals }: { totals: DailyTotals }) {
  const { theme } = useTheme()
  return (
    <View style={[styles.totalsCard, { backgroundColor: theme.card, borderColor: theme.borderLight }]}>
      <View style={styles.totalMain}>
        <Text style={[typography.caption, { color: theme.textSecondary }]}>Total</Text>
        <Text style={[typography.h1, { color: theme.text }]}>
          {formatPennies(totals.total)}
        </Text>
      </View>
      <View style={styles.totalBreakdown}>
        <View style={styles.totalItem}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>Cash</Text>
          <Text style={[typography.bodyMedium, { color: theme.text }]}>
            {formatPennies(totals.cash)}
          </Text>
        </View>
        <View style={[styles.totalDivider, { backgroundColor: theme.border }]} />
        <View style={styles.totalItem}>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>Card</Text>
          <Text style={[typography.bodyMedium, { color: theme.text }]}>
            {formatPennies(totals.card)}
          </Text>
        </View>
        {totals.refunds > 0 && (
          <>
            <View style={[styles.totalDivider, { backgroundColor: theme.border }]} />
            <View style={styles.totalItem}>
              <Text style={[typography.caption, { color: theme.error }]}>Refunds</Text>
              <Text style={[typography.bodyMedium, { color: theme.error }]}>
                -{formatPennies(totals.refunds)}
              </Text>
            </View>
          </>
        )}
      </View>
      <Text style={[typography.caption, { color: theme.textTertiary, marginTop: spacing.sm }]}>
        {totals.count} payment{totals.count !== 1 ? 's' : ''}
      </Text>
    </View>
  )
}

function PaymentRow({ payment }: { payment: Payment }) {
  const { theme } = useTheme()
  const isRefund = payment.payment_type === 'refund' || payment.payment_type === 'void'
  const time = new Date(payment.paid_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <View style={[styles.paymentRow, { borderBottomColor: theme.borderLight }]}>
      <View style={styles.paymentInfo}>
        <Text style={[typography.bodyMedium, { color: theme.text }]} numberOfLines={1}>
          {paymentClientName(payment)}
        </Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]}>
          {time} · {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
          {isRefund && ' · Refund'}
        </Text>
      </View>
      <Text
        style={[
          typography.bodyMedium,
          { color: isRefund ? theme.error : theme.text },
        ]}
      >
        {formatPennies(payment.amount)}
      </Text>
    </View>
  )
}

export default function MoneyScreen() {
  const { theme } = useTheme()
  const [date, setDate] = useState(new Date())
  const [payments, setPayments] = useState<Payment[]>([])
  const [totals, setTotals] = useState<DailyTotals>({ cash: 0, card: 0, total: 0, refunds: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  const loadPayments = useCallback(async () => {
    try {
      const data = await getDailyPayments(toDateString(date))
      setPayments(data)
      setTotals(calculateDailyTotals(data))
    } catch {
      setPayments([])
      setTotals({ cash: 0, card: 0, total: 0, refunds: 0, count: 0 })
    } finally {
      setLoading(false)
    }
  }, [date])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadPayments()
    }, [loadPayments])
  )

  const changeDate = (offset: number) => {
    setDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + offset)
      return next
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Date navigator */}
      <View style={styles.dateNav}>
        <Pressable onPress={() => changeDate(-1)} hitSlop={12}>
          <ChevronLeft size={24} color={theme.text} />
        </Pressable>
        <Pressable onPress={() => setDate(new Date())}>
          <Text style={[typography.bodyMedium, { color: theme.text }]}>
            {formatDate(date)}
          </Text>
        </Pressable>
        <Pressable onPress={() => changeDate(1)} hitSlop={12}>
          <ChevronRight size={24} color={theme.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={<TotalsCard totals={totals} />}
          renderItem={({ item }) => <PaymentRow payment={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Banknote size={48} color={theme.textTertiary} />
              <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.md }]}>
                No payments for this day
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  totalsCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  totalMain: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  totalDivider: {
    width: 1,
    height: 32,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paymentInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
})
