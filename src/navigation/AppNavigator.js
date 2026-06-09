import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import SatellitesScreen from '../screens/SatellitesScreen';
import SatelliteDetailScreen from '../screens/SatelliteDetailScreen';
import AddSatelliteScreen from '../screens/AddSatelliteScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import DebrisScreen from '../screens/DebrisScreen';
import DebrisDetailScreen from '../screens/DebrisDetailScreen';
import ManeuversScreen from '../screens/ManeuversScreen';
import GalleryScreen from '../screens/GalleryScreen';
import LocationTrackerScreen from '../screens/LocationTrackerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom dark nav theme so NavigationContainer background matches
const SpaceTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#050A18',
    card: '#080F22',
    text: '#ffffff',
    border: '#0D1F3C',
    primary: '#00D4FF',
  },
};

const STACK_HEADER = {
  headerStyle: { backgroundColor: '#080F22' },
  headerTintColor: '#00D4FF',
  headerTitleStyle: { fontWeight: '700', color: '#fff' },
  headerBackTitle: '',
  contentStyle: { backgroundColor: '#050A18' },
};

const TABS = [
  { name: 'Dashboard', label: 'Início',     icon: '🏠' },
  { name: 'Satellites', label: 'Satélites', icon: '🛰️' },
  { name: 'Alerts',     label: 'Alertas',   icon: '🚨' },
  { name: 'Debris',     label: 'Detritos',  icon: '☄️' },
];

const TAB_SCREENS = {
  Dashboard: DashboardScreen,
  Satellites: SatellitesScreen,
  Alerts: AlertsScreen,
  Debris: DebrisScreen,
};

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // Respect bottom safe area (home indicator on Pixel 9 Pro)
        tabBarStyle: {
          backgroundColor: '#080F22',
          borderTopColor: '#0D1F3C',
          borderTopWidth: 1,
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: '#4A5568',
        tabBarLabel: ({ color, focused }) => {
          const tab = TABS.find(t => t.name === route.name);
          return (
            <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '400', marginTop: 2 }}>
              {tab?.label}
            </Text>
          );
        },
        tabBarIcon: ({ focused }) => {
          const tab = TABS.find(t => t.name === route.name);
          return (
            <View style={{ alignItems: 'center', position: 'relative' }}>
              {route.name === 'Alerts' && (
                <View style={{
                  position: 'absolute', top: -3, right: -8,
                  backgroundColor: '#FF2D2D', borderRadius: 5,
                  width: 10, height: 10, zIndex: 10,
                }} />
              )}
              <Text style={{ fontSize: focused ? 22 : 19 }}>{tab?.icon}</Text>
            </View>
          );
        },
      })}
    >
      {TABS.map(t => (
        <Tab.Screen key={t.name} name={t.name} component={TAB_SCREENS[t.name]} />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={SpaceTheme}>
      <Stack.Navigator screenOptions={STACK_HEADER}>
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="SatelliteDetail" component={SatelliteDetailScreen} options={{ title: 'Detalhes do Satélite' }} />
        <Stack.Screen name="AddSatellite" component={AddSatelliteScreen} options={{ title: '🛰️ Cadastrar Satélite' }} />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ title: 'Detalhe do Alerta' }} />
        <Stack.Screen name="DebrisDetail" component={DebrisDetailScreen} options={{ title: 'Detrito Espacial' }} />
        <Stack.Screen name="Maneuvers" component={ManeuversScreen} options={{ title: '🚀 Manobras Evasivas' }} />
        <Stack.Screen name="Gallery" component={GalleryScreen} options={{ title: '📷 Galeria' }} />
        <Stack.Screen name="LocationTracker" component={LocationTrackerScreen} options={{ title: '📍 Rastreamento' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
