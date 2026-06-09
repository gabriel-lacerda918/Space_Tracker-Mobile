import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, Animated } from 'react-native';
import { getAlerts, resolveAlert } from '../firebase/spaceService';
import { riskColor } from '../utils/orbitCalc';

const SEVERITY_ICONS = { critical: '🚨', warning: '⚠️', info: 'ℹ️' };
const SEVERITY_LABELS = { critical: 'ALERTA VERMELHO', warning: 'CONJUNÇÃO', info: 'MONITORAMENTO' };
const TYPE_LABELS = { collision: 'Risco de Colisão', conjunction: 'Conjunção Orbital', reentry: 'Reentrada Atmosférica' };

function AlertCard({ alert, onResolve, onPress }) {
  const color = riskColor(alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'high' : 'low');
  const timeAgo = Math.round((Date.now() - alert.createdAt) / 60000);
  const resolved = alert.status === 'resolved';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color, opacity: resolved ? 0.5 : 1 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardIcon}>{SEVERITY_ICONS[alert.severity]}</Text>
        <View style={styles.cardTitleWrap}>
          <Text style={[styles.cardSeverity, { color }]}>{SEVERITY_LABELS[alert.severity]}</Text>
          <Text style={styles.cardType}>{TYPE_LABELS[alert.type] ?? alert.type}</Text>
        </View>
        <Text style={styles.cardTime}>{timeAgo < 60 ? `${timeAgo}m` : `${Math.round(timeAgo / 60)}h`} atrás</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardSatName}>🛰️ {alert.satelliteName}</Text>
        <Text style={styles.cardVs}>↔</Text>
        <Text style={styles.cardDebrisName}>☄️ {alert.debrisName}</Text>
      </View>

      <View style={styles.cardMetrics}>
        <View style={styles.metric}>
          <Text style={[styles.metricVal, { color: alert.probability > 1 ? '#FF2D2D' : '#FFB800' }]}>
            {alert.probability}%
          </Text>
          <Text style={styles.metricLbl}>Probabilidade</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricVal}>{alert.missDistance} km</Text>
          <Text style={styles.metricLbl}>Dist. mínima</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricVal, { color: '#00D4FF' }]}>{alert.timeToClosestApproach}</Text>
          <Text style={styles.metricLbl}>TCA</Text>
        </View>
      </View>

      {!resolved && (
        <TouchableOpacity style={styles.resolveBtn} onPress={() => onResolve(alert)}>
          <Text style={styles.resolveBtnText}>✅ Marcar como Resolvido</Text>
        </TouchableOpacity>
      )}
      {resolved && <Text style={styles.resolvedTag}>✅ RESOLVIDO</Text>}
    </TouchableOpacity>
  );
}

export default function AlertsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');

  const load = useCallback(async () => {
    const data = await getAlerts();
    setAlerts(data);
  }, []);

  useState(() => { load(); }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.status !== 'resolved');

  async function handleResolve(alert) {
    Alert.alert('Resolver Alerta', `Confirmar resolução do alerta de ${alert.satelliteName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          await resolveAlert(alert.id);
          load();
        },
      },
    ]);
  }

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {criticalCount > 0 && (
        <View style={styles.criticalBanner}>
          <Text style={styles.criticalText}>🚨 {criticalCount} ALERTA(S) CRÍTICO(S) ATIVO(S)</Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {[['active', 'Ativos'], ['all', 'Todos']].map(([val, lbl]) => (
          <TouchableOpacity
            key={val}
            style={[styles.chip, filter === val && styles.chipActive]}
            onPress={() => setFilter(val)}
          >
            <Text style={[styles.chipText, filter === val && styles.chipTextActive]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>{filtered.length} alertas</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onResolve={handleResolve}
            onPress={() => navigation.navigate('AlertDetail', { alert: item })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF2D2D" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Nenhum alerta ativo</Text>
            <Text style={styles.emptySub}>Todos os satélites operando normalmente</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  criticalBanner: { backgroundColor: '#1A0000', borderBottomWidth: 2, borderBottomColor: '#FF2D2D', padding: 12, alignItems: 'center' },
  criticalText: { color: '#FF2D2D', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, alignItems: 'center', backgroundColor: '#080F22', borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0D1F3C', borderWidth: 1, borderColor: '#1A3A5C' },
  chipActive: { backgroundColor: '#1A0000', borderColor: '#FF2D2D' },
  chipText: { color: '#8B9BB4', fontSize: 13 },
  chipTextActive: { color: '#FF2D2D', fontWeight: '700' },
  count: { marginLeft: 'auto', color: '#4A5568', fontSize: 13 },
  list: { padding: 16 },
  card: { backgroundColor: '#080F22', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#0D1F3C' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardIcon: { fontSize: 22, marginRight: 10 },
  cardTitleWrap: { flex: 1 },
  cardSeverity: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  cardType: { fontSize: 14, color: '#fff', fontWeight: '600', marginTop: 2 },
  cardTime: { fontSize: 12, color: '#4A5568' },
  cardBody: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1F3C', borderRadius: 8, padding: 10, marginBottom: 10 },
  cardSatName: { flex: 1, fontSize: 13, color: '#00D4FF', fontWeight: '600' },
  cardVs: { fontSize: 16, color: '#4A5568', paddingHorizontal: 8 },
  cardDebrisName: { flex: 1, fontSize: 13, color: '#FFB800', fontWeight: '600', textAlign: 'right' },
  cardMetrics: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  metric: { alignItems: 'center' },
  metricVal: { fontSize: 16, fontWeight: '700', color: '#fff' },
  metricLbl: { fontSize: 11, color: '#8B9BB4', marginTop: 2 },
  resolveBtn: { backgroundColor: '#001A00', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#00FF9444' },
  resolveBtnText: { color: '#00FF94', fontWeight: '600', fontSize: 13 },
  resolvedTag: { textAlign: 'center', color: '#00FF94', fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#00FF94' },
  emptySub: { fontSize: 14, color: '#8B9BB4', marginTop: 6 },
});
