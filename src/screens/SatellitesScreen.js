import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { getAllSatellites, deleteSatellite } from '../firebase/spaceService';
import { statusColor, getOrbitType, altitudeToVelocity } from '../utils/orbitCalc';

const FILTERS = ['Todos', 'operational', 'warning', 'critical'];

export default function SatellitesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [satellites, setSatellites] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const sats = await getAllSatellites();
    setSatellites(sats);
    applyFilter(sats, search, activeFilter);
  }, [search, activeFilter]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, load]);

  function applyFilter(data, q, filter) {
    let result = data;
    if (filter !== 'Todos') result = result.filter(s => s.status === filter);
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(lower) ||
        s.constellation?.toLowerCase().includes(lower) ||
        s.operator?.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  }

  useEffect(() => { applyFilter(satellites, search, activeFilter); }, [search, activeFilter, satellites]);

  function handleDelete(sat) {
    Alert.alert('Remover Satélite', `Remover ${sat.name} do monitoramento?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await deleteSatellite(sat.id); load(); } },
    ]);
  }

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  function renderItem({ item: sat }) {
    const vel = altitudeToVelocity(sat.altitude).toFixed(2);
    const orbit = getOrbitType(sat.altitude);
    const sc = statusColor(sat.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SatelliteDetail', { satellite: sat })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: sc }]} />
          <Text style={styles.cardName}>{sat.name}</Text>
          <View style={[styles.orbitBadge, { borderColor: sc }]}>
            <Text style={[styles.orbitText, { color: sc }]}>{orbit}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.metric}><Text style={styles.metricVal}>{sat.altitude}</Text><Text style={styles.metricLbl}>km Alt.</Text></View>
          <View style={styles.metric}><Text style={styles.metricVal}>{vel}</Text><Text style={styles.metricLbl}>km/s</Text></View>
          <View style={styles.metric}><Text style={styles.metricVal}>{sat.inclination}°</Text><Text style={styles.metricLbl}>Incl.</Text></View>
          <View style={styles.metric}><Text style={styles.metricVal}>{sat.period?.toFixed(1)}</Text><Text style={styles.metricLbl}>min/órbita</Text></View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>🏢 {sat.operator} • 📡 {sat.constellation}</Text>
          <TouchableOpacity onPress={() => handleDelete(sat)} style={styles.delBtn}>
            <Text style={styles.delBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TextInput
          style={styles.search}
          placeholder="Buscar satélite, constelação..."
          placeholderTextColor="#4A5568"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddSatellite')}>
          <Text style={styles.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {f === 'Todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D4FF" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛰️</Text>
            <Text style={styles.emptyText}>Nenhum satélite encontrado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: '#080F22', borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  search: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14 },
  addBtn: { backgroundColor: '#003478', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#00D4FF', fontWeight: '700', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#080F22' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0D1F3C', borderWidth: 1, borderColor: '#1A3A5C' },
  chipActive: { backgroundColor: '#003478', borderColor: '#00D4FF' },
  chipText: { color: '#8B9BB4', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#00D4FF' },
  list: { padding: 16 },
  card: { backgroundColor: '#080F22', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#0D1F3C' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  cardName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  orbitBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  orbitText: { fontSize: 11, fontWeight: '700' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#0D1F3C', paddingVertical: 12 },
  metric: { alignItems: 'center', flex: 1 },
  metricVal: { fontSize: 18, fontWeight: '700', color: '#00D4FF' },
  metricLbl: { fontSize: 11, color: '#8B9BB4', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: 12, color: '#8B9BB4' },
  delBtn: { backgroundColor: '#1A0000', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  delBtnText: { color: '#FF2D2D', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#8B9BB4' },
});
