import { Tabs } from 'expo-router'
import { Calendar, Users, Banknote, Settings } from 'lucide-react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography } from '@/theme'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: theme.tabActive,
            tabBarInactiveTintColor: theme.tabInactive,
            tabBarLabelStyle: {
              ...typography.tabLabel,
            },
            tabBarStyle: {
              borderTopWidth: 1,
              borderTopColor: theme.tabBorder,
              backgroundColor: theme.tabBackground,
            },
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerTitleStyle: {
              fontWeight: '600',
              color: theme.text,
            },
            headerShadowVisible: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Diary',
              tabBarIcon: ({ color, size }) => (
                <Calendar size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="clients"
            options={{
              title: 'Clients',
              tabBarIcon: ({ color, size }) => (
                <Users size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="money"
            options={{
              title: 'Money',
              tabBarIcon: ({ color, size }) => (
                <Banknote size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, size }) => (
                <Settings size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
