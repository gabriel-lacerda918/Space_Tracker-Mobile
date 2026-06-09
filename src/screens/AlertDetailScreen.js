import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { resolveAlert, saveManeuver } from '../firebase/spaceService';
import { riskColor } from '../utils/orbitCalc';
import { sendManeuverConfirmation } from '../hooks/useNotifications';

export default function AlertDetailScreen({ route, navigation }) {
  const { alert } = route.params;
  const [resolving, setResolving] = useState(false);
  const color = riskColor(alert.severity === 'critical' ? 'critical' : 'high');

  async function handleOrderManeuver() {
    Alert.alert(
      '🚀 Ordenar Manobra Evasiva',
      `Confirmar manobra para ${alert.satelliteName}?\n\nO satélite executará queima de motor para aumentar altitude e evitar colisão com ${alert.debrisName}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar Manobra',
          onPress: async () => {
            setResolving(true);
            try {
              await saveManeuver({
                satelliteId: alert.satelliteId,
                satelliteName: alert.satelliteName,
                alertId: alert.id,
                type: 'Queima Evasiva',
                deltaV: (Math.random() * 0.5 + 0.1).toFixed(3),
                duration: Math.floor(Math.random() * 60 + 10),
                status: 'scheduled',
                note: `Manobra ordenada via alerta ${alert.id}`,
              });
              await resolveAlert(alert.id);
              await sendManeuverConfirmation(alert.satelliteName, 'Queima Evasiva');
              Alert.alert('✅ Manobra Programada', `${alert.satelliteName} executará manobra evasiva. Notificação enviada.`, [
                { text: 'OK', onPress: () => navigation.navigate('Alerts') },
              ]);
            } catch {
              Alert.alert('Erro', 'Falha ao programar manobra.');
            } finally {
              setResolving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: color, backgroundColor: color + '12' }]}>
        <Text style={styles.headerIcon}>{alert.severity === 'critical' ? '🚨' : '⚠️'}</Text>
        <Text style={[styles.headerSeverity, { color }]}>
          {alert.severity === 'critical' ? 'ALERTA VERMELHO — RISCO DE COLISÃO' : 'CONJUNÇÃO DETECTADA'}
        </Text>
        <Text style={styles.headerTime}>
          Detectado {Math.round((Date.now() - alert.createdAt) / 60000)} minutos atrás
        </Text>
      </View>

      {/* Objects involved */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔭 Objetos Envolvidos</Text>
        <View style={styles.objectCard}>
          <Text style={styles.objectLabel}>SATÉLITE MONITORADO</Text>
          <Text style={styles.objectName}>🛰️ {alert.satelliteName}</Text>
          <Text style={styles.objectId}>ID: {alert.satelliteId}</Text>
        </View>
        <View style={styles.vsRow}><Text style={styles.vsText}>ROTA DE COLISÃO COM</Text></View>
        <View style={[styles.objectCard, { borderColor: '#FFB800' }]}>
          <Text style={[styles.objectLabel, { color: '#FFB800' }]}>DETRITO ESPACIAL</Text>
          <Text style={styles.objectName}>☄️ {alert.debrisName}</Text>
          <Text style={styles.objectId}>ID: {alert.debrisId}</Text>
        </View>
      </View>

      {/* Risk metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Métricas de Risco</Text>
        <View style={styles.metricsGrid}>
          {[
            { label: 'Probabilidade de Colisão', value: `${alert.probability}%`, color: alert.probability > 1 ? '#FF2D2D' : '#FFB800' },
            { label: 'Distância Mínima (TCA)', value: `${alert.missDistance} km`, color: '#00D4FF' },
            { label: 'Tempo para Aproximação', value: alert.timeToClosestApproach, color: '#FF2D2D' },
            { label: 'Status Atual', value: alert.status?.toUpperCase(), color: color },
          ].map(({ label, value, color: c }) => (
            <View key={label} style={styles.metricCard}>
              <Text style={[styles.metricVal, { color: c }]}>{value}</Text>
              <Text style={styles.metricLbl}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommended actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Ações Recomendadas</Text>
        {[
          { step: '1', text: 'Confirmar dados orbitais com sensores de rastreamento.' },
          { step: '2', text: 'Calcular Δv necessário para manobra evasiva.' },
          { step: '3', text: 'Verificar janela de tempo disponível para queima.' },
          { step: '4', text: 'Ordenar manobra e monitorar execução.' },
          { step: '5', text: 'Confirmar nova órbita e resolver alerta.' },
        ].map(({ step, text }) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.stepNum}>{step}</Text></View>
            <Text style={styles.stepText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      {alert.status !== 'resolved' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.maneuverBtn} onPress={handleOrderManeuver} disabled={resolving}>
            {resolving ? <ActivityIndicator color="#fff" /> : <Text style={styles.maneuverBtnText}>🚀 Ordenar Manobra Evasiva</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigation.navigate('Maneuvers', { satelliteId: alert.satelliteId })}
          >
            <Text style={styles.historyBtnText}>📋 Ver Histórico de Manobras</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { padding: 20, borderBottomWidth: 2, alignItems: 'center' },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  headerSeverity: { fontSize: 14, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  headerTime: { fontSize: 12, color: '#8B9BB4', marginTop: 6 },
  section: { margin: 16, backgroundColor: '#080F22', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0D1F3C' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B9BB4', marginBottom: 14, letterSpacing: 0.5 },
  objectCard: { borderWidth: 1, borderColor: '#00D4FF44', borderRadius: 10, padding: 14, marginBottom: 8 },
  objectLabel: { fontSize: 11, fontWeight: '700', color: '#00D4FF', letterSpacing: 1, marginBottom: 4 },
  objectName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  objectId: { fontSize: 12, color: '#8B9BB4', marginTop: 2 },
  vsRow: { alignItems: 'center', marginVertical: 6 },
  vsText: { fontSize: 11, color: '#FF2D2D', fontWeight: '700', letterSpacing: 1 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { backgroundColor: '#0D1F3C', borderRadius: 10, padding: 14, width: '47%' },
  metricVal: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  metricLbl: { fontSize: 11, color: '#8B9BB4' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepBadge: { backgroundColor: '#003478', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1 },
  stepNum: { color: '#00D4FF', fontWeight: '700', fontSize: 12 },
  stepText: { flex: 1, fontSize: 14, color: '#C8D6E5', lineHeight: 20 },
  actions: { marginHorizontal: 16 },
  maneuverBtn: { backgroundColor: '#FF2D2D', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  maneuverBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyBtn: { backgroundColor: '#0D1F3C', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1A3A5C' },
  historyBtnText: { color: '#8B9BB4', fontSize: 14, fontWeight: '600' },
});
