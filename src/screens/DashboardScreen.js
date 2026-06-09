import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllSatellites, getAllDebris, getAlerts } from '../firebase/spaceService';
import { SEED_SATELLITES, SEED_DEBRIS, SEED_ALERTS } from '../data/seedData';
import { saveSatellite, saveDebris, saveAlert } from '../firebase/spaceService';
import { statusColor, riskColor } from '../utils/orbitCalc';
import { sendCollisionAlert, requestNotificationPermission } from '../hooks/useNotifications';

const { width } = Dimensions.get('window');

function StatCard({ label, value, color, icon, onPress }) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function AlertBanner({ alert, onPress }) {
  const pulse = useState(new Animated.Value(1))[0];
  useEffect(() => {
    if (alert.severity === 'critical') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const bgColor = alert.severity === 'critical' ? '#1A0000' : '#1A1000';
  const borderColor = alert.severity === 'critical' ? '#FF2D2D' : '#FFB800';

  return (
    <TouchableOpacity style={[styles.alertBanner, { backgroundColor: bgColor, borderColor }]} onPress={onPress} activeOpacity={0.85}>
      <Animated.Text style={[styles.alertIcon, { opacity: alert.severity === 'critical' ? pulse : 1 }]}>
        {alert.severity === 'critical' ? '🚨' : '⚠️'}
      </Animated.Text>
      <View style={styles.alertInfo}>
        <Text style={[styles.alertTitle, { color: borderColor }]}>
          {alert.severity === 'critical' ? 'ALERTA VERMELHO' : 'CONJUNÇÃO DETECTADA'}
        </Text>
        <Text style={styles.alertBody} numberOfLines={1}>
          {alert.satelliteName} ↔ {alert.debrisName}
        </Text>
        <Text style={styles.alertMeta}>
          TCA: {alert.timeToClosestApproach}  •  P(col): {alert.probability}%  •  Δd: {alert.missDistance} km
        </Text>
      </View>
      <Text style={styles.alertArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [satellites, setSatellites] = useState([]);
  const [debris, setDebris] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const load = useCallback(async () => {
    try {
      let [sats, deb, alts] = await Promise.all([getAllSatellites(), getAllDebris(), getAlerts()]);
      if (sats.length === 0 && !seeded) {
        await Promise.all(SEED_SATELLITES.map(saveSatellite));
        await Promise.all(SEED_DEBRIS.map(saveDebris));
        await Promise.all(SEED_ALERTS.map(saveAlert));
        [sats, deb, alts] = await Promise.all([getAllSatellites(), getAllDebris(), getAlerts()]);
        setSeeded(true);
      }
      setSatellites(sats);
      setDebris(deb);
      setAlerts(alts.filter(a => a.status === 'active' || a.status === 'monitoring'));
      await requestNotificationPermission();
      const critical = alts.find(a => a.severity === 'critical' && a.status === 'active');
      if (critical) {
        await sendCollisionAlert(critical.satelliteName, critical.debrisName, critical.timeToClosestApproach, critical.probability);
      }
    } catch (e) {
      console.warn('Load error:', e);
    }
  }, [seeded]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const critical = satellites.filter(s => s.status === 'critical').length;
  const operational = satellites.filter(s => s.status === 'operational').length;
  const activeAlerts = alerts.filter(a => a.severity === 'critical').length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D4FF" />}
    >
      {/* Header — paddingTop dinâmico via insets.top */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>🛰️ Space Tracker</Text>
          <Text style={styles.headerSub}>Dashboard de Operações</Text>
        </View>
        <View style={styles.headerBadge}>
          <View style={[styles.dot, { backgroundColor: activeAlerts > 0 ? '#FF2D2D' : '#00FF94' }]} />
          <Text style={styles.headerBadgeText}>{activeAlerts > 0 ? 'ALERTA' : 'NOMINAL'}</Text>
        </View>
      </View>

      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Alertas Ativos</Text>
          {alerts.slice(0, 3).map(a => (
            <AlertBanner key={a.id} alert={a} onPress={() => navigation.navigate('AlertDetail', { alert: a })} />
          ))}
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard label="Satélites" value={satellites.length} color="#00D4FF" icon="🛰️" onPress={() => navigation.navigate('Satellites')} />
        <StatCard label="Operacionais" value={operational} color="#00FF94" icon="✅" onPress={() => navigation.navigate('Satellites')} />
        <StatCard label="Em Risco" value={critical} color="#FF2D2D" icon="🚨" onPress={() => navigation.navigate('Alerts')} />
        <StatCard label="Detritos" value={debris.length} color="#FFB800" icon="☄️" onPress={() => navigation.navigate('Debris')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📡 Estado da Constelação</Text>
        {satellites.slice(0, 5).map(sat => (
          <TouchableOpacity
            key={sat.id}
            style={styles.satRow}
            onPress={() => navigation.navigate('SatelliteDetail', { satellite: sat })}
            activeOpacity={0.8}
          >
            <View style={[styles.satDot, { backgroundColor: statusColor(sat.status) }]} />
            <View style={styles.satInfo}>
              <Text style={styles.satName}>{sat.name}</Text>
              <Text style={styles.satMeta}>{sat.altitude} km • {sat.constellation}</Text>
            </View>
            <Text style={[styles.satStatus, { color: statusColor(sat.status) }]}>
              {sat.status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
        {satellites.length > 5 && (
          <TouchableOpacity onPress={() => navigation.navigate('Satellites')} style={styles.seeMoreBtn}>
            <Text style={styles.seeMoreText}>Ver todos ({satellites.length}) →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>☄️ Detritos de Alto Risco</Text>
        {debris.filter(d => d.riskLevel === 'critical' || d.riskLevel === 'high').slice(0, 3).map(d => (
          <TouchableOpacity
            key={d.id}
            style={styles.debrisRow}
            onPress={() => navigation.navigate('DebrisDetail', { debris: d })}
            activeOpacity={0.8}
          >
            <View style={[styles.riskBadge, { backgroundColor: riskColor(d.riskLevel) + '22', borderColor: riskColor(d.riskLevel) }]}>
              <Text style={[styles.riskText, { color: riskColor(d.riskLevel) }]}>{d.riskLevel.toUpperCase()}</Text>
            </View>
            <View style={styles.debrisInfo}>
              <Text style={styles.debrisName}>{d.name}</Text>
              <Text style={styles.debrisMeta}>{d.altitude} km • Ø {d.size}m • {d.velocity} km/s</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
        <View style={styles.quickActions}>
          {[
            { icon: '🛰️', label: 'Novo Satélite', screen: 'AddSatellite' },
            { icon: '🔭', label: 'Manobras', screen: 'Maneuvers' },
            { icon: '📷', label: 'Galeria', screen: 'Gallery' },
            { icon: '📍', label: 'Localização', screen: 'LocationTracker' },
          ].map(({ icon, label, screen }) => (
            <TouchableOpacity key={screen} style={styles.quickBtn} onPress={() => navigation.navigate(screen)} activeOpacity={0.8}>
              <Text style={styles.quickIcon}>{icon}</Text>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#080F22',
    borderBottomWidth: 1,
    borderBottomColor: '#0D1F3C',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#8B9BB4', marginTop: 2 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1F3C', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#8B9BB4', marginBottom: 10, letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, marginTop: 16, gap: 8 },
  statCard: { backgroundColor: '#080F22', borderRadius: 12, padding: 14, width: (width - 40) / 2 - 4, borderTopWidth: 3, alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#8B9BB4', marginTop: 2 },
  alertBanner: { borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  alertIcon: { fontSize: 24, marginRight: 10 },
  alertInfo: { flex: 1 },
  alertTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  alertBody: { fontSize: 14, color: '#fff', fontWeight: '600', marginTop: 2 },
  alertMeta: { fontSize: 11, color: '#8B9BB4', marginTop: 3 },
  alertArrow: { fontSize: 22, color: '#8B9BB4' },
  satRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  satDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  satInfo: { flex: 1 },
  satName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  satMeta: { fontSize: 12, color: '#8B9BB4', marginTop: 2 },
  satStatus: { fontSize: 11, fontWeight: '700' },
  debrisRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  riskBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 12 },
  riskText: { fontSize: 10, fontWeight: '700' },
  debrisInfo: { flex: 1 },
  debrisName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  debrisMeta: { fontSize: 12, color: '#8B9BB4', marginTop: 2 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn: { backgroundColor: '#080F22', borderRadius: 12, padding: 14, alignItems: 'center', width: (width - 48) / 4, borderWidth: 1, borderColor: '#0D1F3C' },
  quickIcon: { fontSize: 22, marginBottom: 6 },
  quickLabel: { fontSize: 10, color: '#8B9BB4', textAlign: 'center' },
  seeMoreBtn: { paddingVertical: 12, alignItems: 'center' },
  seeMoreText: { color: '#00D4FF', fontSize: 13, fontWeight: '600' },
});
