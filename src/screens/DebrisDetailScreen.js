import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { riskColor } from '../utils/orbitCalc';

function Row({ label, value, color }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, color ? { color } : {}]}>{value ?? '—'}</Text>
    </View>
  );
}

export default function DebrisDetailScreen({ route }) {
  const { debris: d } = route.params;
  const rc = riskColor(d.riskLevel);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: rc, backgroundColor: rc + '12' }]}>
        <Text style={styles.headerIcon}>☄️</Text>
        <View style={[styles.badge, { borderColor: rc, backgroundColor: rc + '22' }]}>
          <Text style={[styles.badgeText, { color: rc }]}>{d.riskLevel?.toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{d.name}</Text>
        <Text style={styles.origin}>Origem: {d.origin}</Text>
        <Text style={styles.catalogId}>Catálogo NORAD: #{d.catalogId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📐 Parâmetros Orbitais</Text>
        <Row label="Altitude" value={`${d.altitude} km`} color="#FFB800" />
        <Row label="Inclinação" value={`${d.inclination}°`} />
        <Row label="Velocidade relativa" value={`${d.velocity} km/s`} color="#FFB800" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📏 Características Físicas</Text>
        <Row label="Tamanho estimado" value={`Ø ${d.size} m`} color={rc} />
        <Row label="Detectado em" value={d.detectedAt ? new Date(d.detectedAt).toLocaleDateString('pt-BR') : '—'} />
        <Row label="Nível de risco" value={d.riskLevel?.toUpperCase()} color={rc} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Avaliação de Risco</Text>
        <View style={[styles.riskInfo, { backgroundColor: rc + '12', borderColor: rc }]}>
          <Text style={[styles.riskTitle, { color: rc }]}>
            {d.riskLevel === 'critical' ? '🚨 Risco Crítico — Ação Imediata' :
             d.riskLevel === 'high' ? '⚠️ Risco Alto — Monitoramento Prioritário' :
             d.riskLevel === 'medium' ? '🔶 Risco Médio — Observação Contínua' :
             '🟢 Risco Baixo — Monitoramento Padrão'}
          </Text>
          <Text style={styles.riskDesc}>
            {d.riskLevel === 'critical'
              ? 'Este objeto representa risco imediato. Verifique se há satélites na mesma faixa orbital e acione o protocolo de manobra evasiva se necessário.'
              : d.riskLevel === 'high'
              ? 'Objeto com potencial de colisão elevado. Aumentar frequência de rastreamento e preparar planos de contingência.'
              : 'Objeto catalogado e monitorado. Manter rastreamento conforme protocolo padrão.'}
          </Text>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { padding: 20, alignItems: 'center', borderBottomWidth: 2 },
  headerIcon: { fontSize: 40, marginBottom: 10 },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  origin: { fontSize: 13, color: '#8B9BB4', marginBottom: 2 },
  catalogId: { fontSize: 12, color: '#4A5568' },
  section: { margin: 16, backgroundColor: '#080F22', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0D1F3C' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B9BB4', marginBottom: 12, letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  rowLabel: { fontSize: 14, color: '#8B9BB4' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  riskInfo: { borderRadius: 10, borderWidth: 1, padding: 14 },
  riskTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  riskDesc: { fontSize: 13, color: '#C8D6E5', lineHeight: 20 },
});
