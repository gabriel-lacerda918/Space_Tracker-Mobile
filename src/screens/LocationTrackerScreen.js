import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { getAllSatellites } from '../firebase/spaceService';
import { getSatellitePosition, altitudeToPeriod } from '../utils/orbitCalc';

const { width } = Dimensions.get('window');

function PolarMap({ userLat, userLon, nearbyPasses }) {
  const cx = width / 2 - 32, cy = 140, r = 110;
  return (
    <View style={styles.polarWrap}>
      <Text style={styles.polarTitle}>🎯 Mapa de Passagens</Text>
      <View style={[styles.polarCanvas, { height: cy * 2 + 40 }]}>
        {/* Rings */}
        {[1, 0.66, 0.33].map((scale, i) => (
          <View key={i} style={[styles.ring, {
            width: r * 2 * scale, height: r * 2 * scale,
            borderRadius: r * scale,
            left: cx - r * scale,
            top: cy - r * scale,
            borderColor: i === 0 ? '#0D1F3C' : i === 1 ? '#1A3A5C44' : '#00D4FF22',
          }]} />
        ))}
        {/* Zenith label */}
        <Text style={[styles.polarLabel, { left: cx - 10, top: cy - 12 }]}>Z</Text>
        {/* Horizon labels */}
        <Text style={[styles.polarLabel, { left: cx - 4, top: cy - r - 16 }]}>N</Text>
        <Text style={[styles.polarLabel, { left: cx + r + 4, top: cy - 8 }]}>E</Text>
        <Text style={[styles.polarLabel, { left: cx - 4, top: cy + r + 4 }]}>S</Text>
        <Text style={[styles.polarLabel, { left: cx - r - 16, top: cy - 8 }]}>O</Text>
        {/* Satellite dots */}
        {nearbyPasses.map((p, i) => {
          const ele = Math.max(0, Math.min(90, p.elevation));
          const azRad = (p.azimuth * Math.PI) / 180;
          const dist = r * (1 - ele / 90);
          const x = cx + dist * Math.sin(azRad);
          const y = cy - dist * Math.cos(azRad);
          return (
            <View key={i} style={[styles.satBlip, { left: x - 6, top: y - 6, backgroundColor: p.color }]}>
              <Text style={styles.satBlipLabel}>{i + 1}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.polarCaption}>Círculo interno = 60° elevação • Externo = horizonte</Text>
    </View>
  );
}

export default function LocationTrackerScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passes, setPasses] = useState([]);
  const [permError, setPermError] = useState(false);
  const intervalRef = useRef(null);

  async function requestLocation() {
    setLoading(true);
    setPermError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermError(true);
        Alert.alert('Permissão Negada', 'O acesso à localização é necessário para calcular passagens de satélites sobre sua posição.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc.coords);
      computePasses(loc.coords);
    } catch (e) {
      Alert.alert('Erro de Localização', 'Não foi possível obter sua posição. Verifique se o GPS está ativado.');
    } finally {
      setLoading(false);
    }
  }

  async function computePasses(coords) {
    const sats = await getAllSatellites();
    const now = Date.now();
    const results = [];

    sats.forEach(sat => {
      const period = altitudeToPeriod(sat.altitude);
      // Calculate next pass (simplified model)
      for (let t = 0; t < period; t += 0.5) {
        const pos = getSatellitePosition(sat, t);
        const dLat = pos.lat - coords.latitude;
        const dLon = pos.lon - coords.longitude;
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        if (dist < 15) {
          const elevation = Math.max(5, 90 - dist * 4);
          const azimuth = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;
          const passTime = new Date(now + t * 60000);
          results.push({
            satellite: sat,
            timeMin: t,
            passTime,
            elevation: parseFloat(elevation.toFixed(1)),
            azimuth: parseFloat(azimuth.toFixed(1)),
            duration: Math.floor(Math.random() * 6 + 2),
            maxElevation: parseFloat((elevation + Math.random() * 10).toFixed(1)),
            color: sat.status === 'critical' ? '#FF2D2D' : sat.status === 'warning' ? '#FFB800' : '#00D4FF',
          });
          break;
        }
      }
    });

    results.sort((a, b) => a.timeMin - b.timeMin);
    setPasses(results.slice(0, 8));
  }

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  function formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Rastreamento por Localização</Text>
        <Text style={styles.headerSub}>Passagens de satélites sobre sua posição</Text>
      </View>

      {/* Location status */}
      <View style={styles.locCard}>
        {location ? (
          <>
            <Text style={styles.locStatus}>✅ Localização Obtida</Text>
            <View style={styles.locRow}>
              <View style={styles.locItem}><Text style={styles.locVal}>{location.latitude.toFixed(4)}°</Text><Text style={styles.locLbl}>Latitude</Text></View>
              <View style={styles.locItem}><Text style={styles.locVal}>{location.longitude.toFixed(4)}°</Text><Text style={styles.locLbl}>Longitude</Text></View>
              <View style={styles.locItem}><Text style={styles.locVal}>{location.altitude ? `${location.altitude.toFixed(0)}m` : '—'}</Text><Text style={styles.locLbl}>Altitude</Text></View>
            </View>
          </>
        ) : (
          <View style={styles.locPlaceholder}>
            <Text style={styles.locPlaceholderIcon}>📍</Text>
            <Text style={styles.locPlaceholderText}>
              {permError ? '❌ Permissão de localização negada' : 'Localização não obtida'}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.locBtn} onPress={requestLocation} disabled={loading}>
          {loading ? <ActivityIndicator color="#00D4FF" /> : (
            <Text style={styles.locBtnText}>{location ? '🔄 Atualizar Posição' : '📍 Obter Localização'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Polar map */}
      {location && passes.length > 0 && (
        <PolarMap userLat={location.latitude} userLon={location.longitude} nearbyPasses={passes} />
      )}

      {/* Passes list */}
      {passes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛰️ Próximas Passagens</Text>
          {passes.map((pass, i) => (
            <View key={i} style={[styles.passCard, { borderLeftColor: pass.color }]}>
              <View style={styles.passHeader}>
                <Text style={[styles.passNum, { color: pass.color }]}>#{i + 1}</Text>
                <Text style={styles.passSatName}>{pass.satellite.name}</Text>
                <Text style={styles.passTime}>{formatTime(pass.passTime)}</Text>
              </View>
              <View style={styles.passMetrics}>
                <View style={styles.pm}><Text style={styles.pmVal}>{pass.maxElevation}°</Text><Text style={styles.pmLbl}>Elev. máx.</Text></View>
                <View style={styles.pm}><Text style={styles.pmVal}>{pass.azimuth}°</Text><Text style={styles.pmLbl}>Azimute</Text></View>
                <View style={styles.pm}><Text style={styles.pmVal}>{pass.duration} min</Text><Text style={styles.pmLbl}>Duração</Text></View>
                <View style={styles.pm}><Text style={styles.pmVal}>{Math.round(pass.timeMin)} min</Text><Text style={styles.pmLbl}>Em</Text></View>
              </View>
            </View>
          ))}
        </View>
      )}

      {location && passes.length === 0 && (
        <View style={styles.noPasses}>
          <Text style={styles.noPassesIcon}>🔭</Text>
          <Text style={styles.noPassesText}>Nenhuma passagem prevista nas próximas horas para esta localização.</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { padding: 20, backgroundColor: '#080F22', borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#8B9BB4', marginTop: 4 },
  locCard: { margin: 16, backgroundColor: '#080F22', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0D1F3C' },
  locStatus: { fontSize: 14, fontWeight: '600', color: '#00FF94', marginBottom: 12 },
  locRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  locItem: { alignItems: 'center' },
  locVal: { fontSize: 16, fontWeight: '700', color: '#00D4FF' },
  locLbl: { fontSize: 11, color: '#8B9BB4', marginTop: 2 },
  locPlaceholder: { alignItems: 'center', paddingVertical: 20 },
  locPlaceholderIcon: { fontSize: 32, marginBottom: 8 },
  locPlaceholderText: { fontSize: 14, color: '#8B9BB4' },
  locBtn: { backgroundColor: '#003478', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#00D4FF44' },
  locBtnText: { color: '#00D4FF', fontWeight: '700', fontSize: 14 },
  polarWrap: { margin: 16, backgroundColor: '#080F22', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0D1F3C' },
  polarTitle: { fontSize: 14, fontWeight: '600', color: '#8B9BB4', marginBottom: 12, textAlign: 'center' },
  polarCanvas: { position: 'relative' },
  ring: { position: 'absolute', borderWidth: 1 },
  polarLabel: { position: 'absolute', color: '#4A5568', fontSize: 11, fontWeight: '700' },
  satBlip: { position: 'absolute', width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  satBlipLabel: { color: '#fff', fontSize: 8, fontWeight: '700' },
  polarCaption: { textAlign: 'center', fontSize: 11, color: '#4A5568', marginTop: 8 },
  section: { marginHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#8B9BB4', marginBottom: 10 },
  passCard: { backgroundColor: '#080F22', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, borderWidth: 1, borderColor: '#0D1F3C' },
  passHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  passNum: { fontSize: 14, fontWeight: '800', marginRight: 8 },
  passSatName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  passTime: { fontSize: 13, color: '#8B9BB4' },
  passMetrics: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0D1F3C', borderRadius: 8, padding: 8 },
  pm: { alignItems: 'center', flex: 1 },
  pmVal: { fontSize: 13, fontWeight: '700', color: '#00D4FF' },
  pmLbl: { fontSize: 10, color: '#8B9BB4', marginTop: 2 },
  noPasses: { margin: 16, alignItems: 'center', padding: 24 },
  noPassesIcon: { fontSize: 40, marginBottom: 10 },
  noPassesText: { fontSize: 14, color: '#8B9BB4', textAlign: 'center', lineHeight: 20 },
});
