import { ref, set, get, push, remove, onValue, off } from 'firebase/database';
import { db } from './config';

// ─── Satélites ─────────────────────────────────────────────────────────────

export async function saveSatellite(sat) {
  const satRef = ref(db, `satellites/${sat.id}`);
  await set(satRef, { ...sat, updatedAt: Date.now() });
}

export async function getAllSatellites() {
  const snap = await get(ref(db, 'satellites'));
  if (!snap.exists()) return [];
  return Object.values(snap.val());
}

export async function deleteSatellite(id) {
  await remove(ref(db, `satellites/${id}`));
}

// ─── Detritos ──────────────────────────────────────────────────────────────

export async function saveDebris(debris) {
  const r = ref(db, `debris/${debris.id}`);
  await set(r, { ...debris, updatedAt: Date.now() });
}

export async function getAllDebris() {
  const snap = await get(ref(db, 'debris'));
  if (!snap.exists()) return [];
  return Object.values(snap.val());
}

// ─── Alertas ───────────────────────────────────────────────────────────────

export async function saveAlert(alert) {
  const newRef = push(ref(db, 'alerts'));
  await set(newRef, { ...alert, id: newRef.key, createdAt: Date.now() });
  return newRef.key;
}

export async function getAlerts() {
  const snap = await get(ref(db, 'alerts'));
  if (!snap.exists()) return [];
  return Object.values(snap.val()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function resolveAlert(id) {
  const r = ref(db, `alerts/${id}/status`);
  await set(r, 'resolved');
}

// ─── Manobras ──────────────────────────────────────────────────────────────

export async function saveManeuver(maneuver) {
  const newRef = push(ref(db, 'maneuvers'));
  await set(newRef, { ...maneuver, id: newRef.key, createdAt: Date.now() });
  return newRef.key;
}

export async function getManeuvers() {
  const snap = await get(ref(db, 'maneuvers'));
  if (!snap.exists()) return [];
  return Object.values(snap.val()).sort((a, b) => b.createdAt - a.createdAt);
}

// ─── Galeria ───────────────────────────────────────────────────────────────

export async function saveGalleryEntry(entry) {
  const newRef = push(ref(db, 'gallery'));
  await set(newRef, { ...entry, id: newRef.key, createdAt: Date.now() });
  return newRef.key;
}

export async function getGallery() {
  const snap = await get(ref(db, 'gallery'));
  if (!snap.exists()) return [];
  return Object.values(snap.val()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteGalleryEntry(id) {
  await remove(ref(db, `gallery/${id}`));
}
