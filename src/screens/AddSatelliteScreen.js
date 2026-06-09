import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { saveSatellite } from '../firebase/spaceService';
import { altitudeToVelocity, altitudeToPeriod, getOrbitType } from '../utils/orbitCalc';

function Field({ label, value, onChangeText, keyboardType = 'default', placeholder, error, unit }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{unit ? <Text style={styles.unit}> ({unit})</Text> : ''}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#4A5568"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function AddSatelliteScreen({ navigation }) {
  const [form, setForm] = useState({
    id: `SAT-${Date.now()}`,
    name: '', constellation: '', operator: '',
    altitude: '', inclination: '', raan: '',
    eccentricity: '0.0001', mass: '',
    launchDate: '', status: 'operational',
    lat: '0', lon: '0',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  const STATUS_OPTIONS = ['operational', 'warning', 'critical', 'inactive'];
  const STATUS_COLORS = { operational: '#00FF94', warning: '#FFB800', critical: '#FF2D2D', inactive: '#8B9BB4' };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obrigatório.';
    if (!form.constellation.trim()) e.constellation = 'Constelação obrigatória.';
    if (!form.operator.trim()) e.operator = 'Operador obrigatório.';
    const alt = parseFloat(form.altitude);
    if (isNaN(alt) || alt < 200 || alt > 36000) e.altitude = 'Altitude entre 200 e 36.000 km.';
    const inc = parseFloat(form.inclination);
    if (isNaN(inc) || inc < 0 || inc > 180) e.inclination = 'Inclinação entre 0° e 180°.';
    if (!form.launchDate.trim()) e.launchDate = 'Data de lançamento obrigatória.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const alt = parseFloat(form.altitude);
      const sat = {
        ...form,
        altitude: alt,
        inclination: parseFloat(form.inclination),
        raan: parseFloat(form.raan) || 0,
        eccentricity: parseFloat(form.eccentricity) || 0.0001,
        mass: parseFloat(form.mass) || 0,
        period: parseFloat(altitudeToPeriod(alt).toFixed(2)),
        lat: parseFloat(form.lat) || 0,
        lon: parseFloat(form.lon) || 0,
      };
      await saveSatellite(sat);
      Alert.alert('✅ Satélite Cadastrado', `${sat.name} adicionado ao monitoramento.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar. Verifique sua conexão.');
    } finally {
      setSaving(false);
    }
  }

  const previewAlt = parseFloat(form.altitude);
  const hasPreview = !isNaN(previewAlt) && previewAlt > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Orbital Preview */}
        {hasPreview && (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>📊 Preview Orbital</Text>
            <View style={styles.previewRow}>
              <View style={styles.previewItem}><Text style={styles.previewVal}>{getOrbitType(previewAlt)}</Text><Text style={styles.previewLbl}>Tipo</Text></View>
              <View style={styles.previewItem}><Text style={styles.previewVal}>{altitudeToVelocity(previewAlt).toFixed(2)}</Text><Text style={styles.previewLbl}>km/s</Text></View>
              <View style={styles.previewItem}><Text style={styles.previewVal}>{altitudeToPeriod(previewAlt).toFixed(1)}</Text><Text style={styles.previewLbl}>min/órbita</Text></View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛰️ Identificação</Text>
          <Field label="Nome do Satélite" value={form.name} onChangeText={v => set('name', v)} placeholder="Ex: StarLink-9999" error={errors.name} />
          <Field label="Constelação" value={form.constellation} onChangeText={v => set('constellation', v)} placeholder="Ex: Starlink" error={errors.constellation} />
          <Field label="Operador" value={form.operator} onChangeText={v => set('operator', v)} placeholder="Ex: SpaceX" error={errors.operator} />
          <Field label="Data de Lançamento" value={form.launchDate} onChangeText={v => set('launchDate', v)} placeholder="AAAA-MM-DD" error={errors.launchDate} />
          <Field label="Massa" unit="kg" value={form.mass} onChangeText={v => set('mass', v)} keyboardType="numeric" placeholder="Ex: 260" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📐 Parâmetros Orbitais</Text>
          <Field label="Altitude" unit="km" value={form.altitude} onChangeText={v => set('altitude', v)} keyboardType="numeric" placeholder="200 – 36.000" error={errors.altitude} />
          <Field label="Inclinação" unit="graus" value={form.inclination} onChangeText={v => set('inclination', v)} keyboardType="numeric" placeholder="0 – 180" error={errors.inclination} />
          <Field label="RAAN" unit="graus" value={form.raan} onChangeText={v => set('raan', v)} keyboardType="numeric" placeholder="0 – 360" />
          <Field label="Excentricidade" value={form.eccentricity} onChangeText={v => set('eccentricity', v)} keyboardType="numeric" placeholder="Ex: 0.0001" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📡 Status Inicial</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, { borderColor: STATUS_COLORS[s] }, form.status === s && { backgroundColor: STATUS_COLORS[s] + '22' }]}
                onPress={() => set('status', s)}
              >
                <Text style={[styles.statusChipText, { color: STATUS_COLORS[s] }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Cadastrar Satélite</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  preview: { margin: 16, backgroundColor: '#001830', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#00D4FF44' },
  previewTitle: { fontSize: 13, fontWeight: '600', color: '#00D4FF', marginBottom: 10 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-around' },
  previewItem: { alignItems: 'center' },
  previewVal: { fontSize: 20, fontWeight: '800', color: '#00D4FF' },
  previewLbl: { fontSize: 11, color: '#8B9BB4', marginTop: 2 },
  section: { margin: 16, marginBottom: 0, backgroundColor: '#080F22', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0D1F3C' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B9BB4', marginBottom: 14, letterSpacing: 0.5 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: '#8B9BB4', marginBottom: 6, fontWeight: '500' },
  unit: { color: '#4A5568' },
  input: { backgroundColor: '#0D1F3C', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#1A3A5C' },
  inputError: { borderColor: '#FF2D2D' },
  errorText: { color: '#FF2D2D', fontSize: 12, marginTop: 4 },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  statusChipText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { margin: 16, backgroundColor: '#003478', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#00D4FF44' },
  saveBtnText: { color: '#00D4FF', fontSize: 16, fontWeight: '700' },
});
