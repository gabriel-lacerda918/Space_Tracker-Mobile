import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, Modal, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getManeuvers, saveManeuver, getAllSatellites } from '../firebase/spaceService';
import { sendManeuverConfirmation } from '../hooks/useNotifications';

const MANEUVER_TYPES = ['Queima Evasiva', 'Boost Orbital', 'Deorbiting', 'Station Keeping', 'Correção de Atitude'];
const STATUS_COLORS = { scheduled: '#00D4FF', executing: '#FFB800', completed: '#00FF94', failed: '#FF2D2D' };
const STATUS_LABELS = { scheduled: 'Agendada', executing: 'Em execução', completed: 'Concluída', failed: 'Falhou' };

function ManeuverCard({ m }) {
  const sc = STATUS_COLORS[m.status] ?? '#8B9BB4';
  const timeAgo = Math.round((Date.now() - m.createdAt) / 60000);
  return (
    <View style={[styles.card, { borderLeftColor: sc }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{m.type}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc + '22', borderColor: sc }]}>
          <Text style={[styles.statusText, { color: sc }]}>{STATUS_LABELS[m.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardSat}>🛰️ {m.satelliteName}</Text>
      <View style={styles.cardMetrics}>
        {m.deltaV && <View style={styles.metric}><Text style={styles.mVal}>{m.deltaV} m/s</Text><Text style={styles.mLbl}>Δv</Text></View>}
        {m.duration && <View style={styles.metric}><Text style={styles.mVal}>{m.duration}s</Text><Text style={styles.mLbl}>Duração</Text></View>}
        <View style={styles.metric}><Text style={styles.mVal}>{timeAgo < 60 ? `${timeAgo}m` : `${Math.round(timeAgo/60)}h`}</Text><Text style={styles.mLbl}>Registrado</Text></View>
      </View>
      {m.note && <Text style={styles.cardNote}>📝 {m.note}</Text>}
    </View>
  );
}

export default function ManeuversScreen({ route, navigation }) {
  const preselectedSatId = route.params?.satelliteId;
  const preselectedSatName = route.params?.satelliteName;

  const [maneuvers, setManeuvers] = useState([]);
  const [satellites, setSatellites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    satelliteId: preselectedSatId ?? '',
    satelliteName: preselectedSatName ?? '',
    type: MANEUVER_TYPES[0],
    deltaV: '',
    duration: '',
    note: '',
    status: 'scheduled',
  });
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    const [m, s] = await Promise.all([getManeuvers(), getAllSatellites()]);
    setManeuvers(preselectedSatId ? m.filter(x => x.satelliteId === preselectedSatId) : m);
    setSatellites(s);
  }, [preselectedSatId]);

  useState(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const e = {};
    if (!form.satelliteId) e.satellite = 'Selecione um satélite.';
    if (!form.deltaV || isNaN(parseFloat(form.deltaV))) e.deltaV = 'Δv inválido.';
    if (!form.duration || isNaN(parseInt(form.duration))) e.duration = 'Duração inválida.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await saveManeuver({ ...form, deltaV: parseFloat(form.deltaV), duration: parseInt(form.duration) });
      await sendManeuverConfirmation(form.satelliteName, form.type);
      setModalVisible(false);
      load();
      Alert.alert('✅ Manobra Registrada', `${form.type} agendada para ${form.satelliteName}.`);
    } catch {
      Alert.alert('Erro', 'Falha ao registrar manobra.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {preselectedSatName ? `Manobras — ${preselectedSatName}` : 'Histórico de Manobras'}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Registrar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={maneuvers}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <ManeuverCard m={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D4FF" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚀</Text>
            <Text style={styles.emptyText}>Nenhuma manobra registrada</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Registrar primeira manobra</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>🚀 Registrar Manobra</Text>

            {/* Satellite select */}
            <Text style={styles.label}>Satélite *</Text>
            {errors.satellite && <Text style={styles.errorText}>{errors.satellite}</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.satPicker}>
              {satellites.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.satChip, form.satelliteId === s.id && styles.satChipActive]}
                  onPress={() => { set('satelliteId', s.id); set('satelliteName', s.name); }}
                >
                  <Text style={[styles.satChipText, form.satelliteId === s.id && styles.satChipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Type */}
            <Text style={styles.label}>Tipo de Manobra</Text>
            <View style={styles.typePicker}>
              {MANEUVER_TYPES.map(t => (
                <TouchableOpacity key={t} style={[styles.typeChip, form.type === t && styles.typeChipActive]} onPress={() => set('type', t)}>
                  <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Δv (m/s) *</Text>
            <TextInput style={[styles.input, errors.deltaV && styles.inputError]} value={form.deltaV} onChangeText={v => set('deltaV', v)} keyboardType="numeric" placeholder="Ex: 0.35" placeholderTextColor="#4A5568" />
            {errors.deltaV && <Text style={styles.errorText}>{errors.deltaV}</Text>}

            <Text style={styles.label}>Duração da Queima (s) *</Text>
            <TextInput style={[styles.input, errors.duration && styles.inputError]} value={form.duration} onChangeText={v => set('duration', v)} keyboardType="numeric" placeholder="Ex: 30" placeholderTextColor="#4A5568" />
            {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}

            <Text style={styles.label}>Observações</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.note} onChangeText={v => set('note', v)} multiline placeholder="Motivo, referência de alerta..." placeholderTextColor="#4A5568" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#080F22', borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  addBtn: { backgroundColor: '#003478', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#00D4FF44' },
  addBtnText: { color: '#00D4FF', fontWeight: '700', fontSize: 13 },
  list: { padding: 16 },
  card: { backgroundColor: '#080F22', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderWidth: 1, borderColor: '#0D1F3C' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardType: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardSat: { fontSize: 13, color: '#8B9BB4', marginBottom: 10 },
  cardMetrics: { flexDirection: 'row', backgroundColor: '#0D1F3C', borderRadius: 8, padding: 10, marginBottom: 8 },
  metric: { flex: 1, alignItems: 'center' },
  mVal: { fontSize: 14, fontWeight: '700', color: '#00D4FF' },
  mLbl: { fontSize: 10, color: '#8B9BB4', marginTop: 2 },
  cardNote: { fontSize: 12, color: '#8B9BB4', fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#8B9BB4', marginBottom: 16 },
  emptyBtn: { backgroundColor: '#003478', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: '#00D4FF', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#080F22', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 20 },
  label: { fontSize: 13, color: '#8B9BB4', fontWeight: '500', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: '#0D1F3C', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#1A3A5C' },
  inputError: { borderColor: '#FF2D2D' },
  errorText: { color: '#FF2D2D', fontSize: 12, marginTop: 4 },
  satPicker: { marginBottom: 4 },
  satChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#0D1F3C', marginRight: 8, borderWidth: 1, borderColor: '#1A3A5C' },
  satChipActive: { backgroundColor: '#003478', borderColor: '#00D4FF' },
  satChipText: { color: '#8B9BB4', fontSize: 13 },
  satChipTextActive: { color: '#00D4FF', fontWeight: '700' },
  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#0D1F3C', borderWidth: 1, borderColor: '#1A3A5C' },
  typeChipActive: { backgroundColor: '#1A0D00', borderColor: '#FFB800' },
  typeChipText: { color: '#8B9BB4', fontSize: 13 },
  typeChipTextActive: { color: '#FFB800', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#0D1F3C', borderRadius: 10, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: '#8B9BB4', fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#003478', borderRadius: 10, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#00D4FF', fontWeight: '700' },
});
