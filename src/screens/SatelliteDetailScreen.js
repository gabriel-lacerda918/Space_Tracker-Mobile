import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { statusColor, altitudeToVelocity, altitudeToPeriod, getOrbitType } from '../utils/orbitCalc';

const { width } = Dimensions.get('window');

// Mini ASCII orbit visualizer
function OrbitViz({ sat }) {
  const cx = 110, cy = 110, re = 45, ra = Math.min(90, 45 + sat.altitude / 100);
  const incRad = (sat.inclination * Math.PI) / 180;
  // Draw ellipse points
  const points = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * 2 * Math.PI;
    const x = cx + ra * Math.cos(angle);
    const y = cy + ra * Math.sin(angle) * Math.cos(incRad);
    return `${x},${y}`;
  }).join(' ');
  const sc = statusColor(sat.status);
  return (
    <View style={styles.orbitViz}>
      <Text style={styles.orbitVizTitle}>🌍 Visualização Orbital</Text>
      <View style={styles.orbitCanvas}>
        {/* Earth */}
        <View style={[styles.earth, { left: cx - 22, top: cy - 22 }]} />
        {/* Orbit path (simplified circle) */}
        <View style={[styles.orbitRing, {
          left: cx - ra, top: cy - ra * Math.cos(incRad),
          width: ra * 2, height: ra * 2 * Math.cos(incRad),
          borderRadius: ra,
        }]} />
        {/* Satellite dot */}
        <View style={[styles.satDot, { left: cx + ra - 6, top: cy - 6, backgroundColor: sc }]} />
        <Text style={[styles.satLabel, { left: cx + ra - 10, top: cy + 8, color: sc }]}>🛰️</Text>
      </View>
      <Text style={styles.orbitCaption}>Inclinação: {sat.inclination}° • Altitude: {sat.altitude} km</Text>
    </View>
  );
}

function InfoRow({ label, value, color }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

export default function SatelliteDetailScreen({ route, navigation }) {
  const { satellite: sat } = route.params;
  const [vel] = useState(altitudeToVelocity(sat.altitude).toFixed(3));
  const [period] = useState(altitudeToPeriod(sat.altitude).toFixed(2));
  const orbitType = getOrbitType(sat.altitude);
  const sc = statusColor(sat.status);

  const statusLabels = { operational: 'Operacional', warning: 'Atenção', critical: 'Crítico', inactive: 'Inativo' };

  return (
    <ScrollView style={styles.container}>
      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: sc + '18', borderBottomColor: sc }]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: sc }]} />
          <Text style={[styles.statusLabel, { color: sc }]}>{statusLabels[sat.status] ?? sat.status}</Text>
          <View style={[styles.orbitBadge, { borderColor: sc }]}>
            <Text style={[styles.orbitBadgeText, { color: sc }]}>{orbitType}</Text>
          </View>
        </View>
        <Text style={styles.satName}>{sat.name}</Text>
        <Text style={styles.satConstellation}>{sat.constellation} • {sat.operator}</Text>
      </View>

      {/* Orbit viz */}
      <OrbitViz sat={sat} />

      {/* Orbital params */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📐 Parâmetros Orbitais</Text>
        <InfoRow label="Altitude" value={`${sat.altitude} km`} color="#00D4FF" />
        <InfoRow label="Velocidade orbital" value={`${vel} km/s`} color="#00D4FF" />
        <InfoRow label="Período orbital" value={`${period} min`} />
        <InfoRow label="Inclinação" value={`${sat.inclination}°`} />
        <InfoRow label="RAAN" value={`${sat.raan}°`} />
        <InfoRow label="Excentricidade" value={sat.eccentricity} />
        <InfoRow label="Órbitas/dia" value={(1440 / period).toFixed(2)} />
      </View>

      {/* Physical params */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔩 Dados do Satélite</Text>
        <InfoRow label="ID" value={sat.id} />
        <InfoRow label="Massa" value={`${sat.mass} kg`} />
        <InfoRow label="Lançamento" value={sat.launchDate} />
        <InfoRow label="Posição (lat)" value={`${sat.lat?.toFixed(4)}°`} />
        <InfoRow label="Posição (lon)" value={`${sat.lon?.toFixed(4)}°`} />
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Ações</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Maneuvers', { satelliteId: sat.id, satelliteName: sat.name })}
        >
          <Text style={styles.actionIcon}>🚀</Text>
          <View>
            <Text style={styles.actionTitle}>Registrar Manobra Evasiva</Text>
            <Text style={styles.actionSub}>Documentar manobra de esquiva de detritos</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Gallery')}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <View>
            <Text style={styles.actionTitle}>Ver Galeria de Imagens</Text>
            <Text style={styles.actionSub}>Registros capturados por este satélite</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('LocationTracker')}
        >
          <Text style={styles.actionIcon}>📍</Text>
          <View>
            <Text style={styles.actionTitle}>Rastrear via Localização</Text>
            <Text style={styles.actionSub}>Ver passagem sobre sua posição</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  statusBanner: { padding: 20, paddingTop: 16, borderBottomWidth: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusLabel: { fontWeight: '700', fontSize: 13, flex: 1 },
  orbitBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  orbitBadgeText: { fontSize: 11, fontWeight: '700' },
  satName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  satConstellation: { fontSize: 13, color: '#8B9BB4' },
  orbitViz: { margin: 16, backgroundColor: '#080F22', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0D1F3C' },
  orbitVizTitle: { fontSize: 14, fontWeight: '600', color: '#8B9BB4', marginBottom: 12, textAlign: 'center' },
  orbitCanvas: { height: 220, position: 'relative' },
  earth: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A3A6C', borderWidth: 2, borderColor: '#2D6A8F' },
  orbitRing: { position: 'absolute', borderWidth: 1, borderColor: '#00D4FF44', borderStyle: 'dashed' },
  satDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  satLabel: { position: 'absolute', fontSize: 14 },
  orbitCaption: { textAlign: 'center', fontSize: 12, color: '#8B9BB4', marginTop: 8 },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#080F22', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0D1F3C' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8B9BB4', marginBottom: 12, letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  infoLabel: { fontSize: 14, color: '#8B9BB4' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  actionIcon: { fontSize: 22, marginRight: 12 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: '#fff' },
  actionSub: { fontSize: 12, color: '#8B9BB4', marginTop: 2 },
  actionArrow: { fontSize: 20, color: '#8B9BB4', marginLeft: 'auto' },
});
