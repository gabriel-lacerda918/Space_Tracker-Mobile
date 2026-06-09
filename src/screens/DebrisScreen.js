import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { getAllDebris } from '../firebase/spaceService';
import { riskColor, altitudeToVelocity } from '../utils/orbitCalc';

export default function DebrisScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [debris, setDebris] = useState([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getAllDebris();
    setDebris(data);
  }, []);

  useState(() => { load(); }, []);

  const filtered = debris.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name?.toLowerCase().includes(q) || d.origin?.toLowerCase().includes(q);
    const matchRisk = riskFilter === 'all' || d.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const RISKS = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TextInput
          style={styles.search}
          placeholder="Buscar detrito ou origem..."
          placeholderTextColor="#4A5568"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {RISKS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, riskFilter === r && { borderColor: riskColor(r === 'all' ? 'low' : r), backgroundColor: riskColor(r === 'all' ? 'low' : r) + '18' }]}
            onPress={() => setRiskFilter(r)}
          >
            <Text style={[styles.chipText, riskFilter === r && { color: riskColor(r === 'all' ? 'low' : r) }]}>
              {r === 'all' ? 'Todos' : r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFB800" />}
        renderItem={({ item: d }) => {
          const rc = riskColor(d.riskLevel);
          return (
            <TouchableOpacity
              style={[styles.card, { borderLeftColor: rc }]}
              onPress={() => navigation.navigate('DebrisDetail', { debris: d })}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.riskBadge, { borderColor: rc, backgroundColor: rc + '18' }]}>
                  <Text style={[styles.riskText, { color: rc }]}>{d.riskLevel?.toUpperCase()}</Text>
                </View>
                <Text style={styles.catalogId}>#{d.catalogId}</Text>
              </View>
              <Text style={styles.debrisName}>{d.name}</Text>
              <Text style={styles.debrisOrigin}>Origem: {d.origin}</Text>
              <View style={styles.metrics}>
                <View style={styles.metric}><Text style={styles.mVal}>{d.altitude}</Text><Text style={styles.mLbl}>km</Text></View>
                <View style={styles.metric}><Text style={styles.mVal}>{d.velocity}</Text><Text style={styles.mLbl}>km/s</Text></View>
                <View style={styles.metric}><Text style={styles.mVal}>Ø {d.size}m</Text><Text style={styles.mLbl}>Tamanho</Text></View>
                <View style={styles.metric}><Text style={styles.mVal}>{d.inclination}°</Text><Text style={styles.mLbl}>Incl.</Text></View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>☄️</Text>
            <Text style={styles.emptyText}>Nenhum detrito encontrado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { padding: 16, backgroundColor: '#080F22', borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  search: { backgroundColor: '#0D1F3C', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14 },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#080F22', borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#0D1F3C', borderWidth: 1, borderColor: '#1A3A5C' },
  chipText: { color: '#8B9BB4', fontSize: 12, fontWeight: '500' },
  list: { padding: 16 },
  card: { backgroundColor: '#080F22', borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#0D1F3C' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  riskBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  riskText: { fontSize: 11, fontWeight: '700' },
  catalogId: { fontSize: 12, color: '#4A5568' },
  debrisName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  debrisOrigin: { fontSize: 12, color: '#8B9BB4', marginBottom: 10 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0D1F3C', borderRadius: 8, padding: 10 },
  metric: { alignItems: 'center', flex: 1 },
  mVal: { fontSize: 14, fontWeight: '700', color: '#FFB800' },
  mLbl: { fontSize: 10, color: '#8B9BB4', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#8B9BB4' },
});
