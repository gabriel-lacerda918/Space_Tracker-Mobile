import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, RefreshControl, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { getGallery, saveGalleryEntry, deleteGalleryEntry } from '../firebase/spaceService';

const { width } = Dimensions.get('window');
const THUMB = (width - 48) / 3;

export default function GalleryScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const data = await getGallery();
    setImages(data);
  }, []);

  useState(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  async function pickFromGallery() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Acesso à galeria é necessário para importar imagens.'); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) await persistImage(result.assets[0].uri, 'gallery');
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Acesso à câmera é necessário para capturar imagens.'); return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) await persistImage(result.assets[0].uri, 'camera');
  }

  async function persistImage(uri, source) {
    setUploading(true);
    try {
      // Save metadata to Firebase (URI is local — in production, upload to Storage)
      await saveGalleryEntry({
        uri,
        source,
        caption: source === 'camera' ? 'Captura da câmera' : 'Importado da galeria',
        satellite: 'Não identificado',
      });
      load();
      Alert.alert('✅ Imagem salva', 'Registro adicionado à galeria de monitoramento.');
    } catch {
      Alert.alert('Erro', 'Falha ao salvar imagem no banco de dados.');
    } finally {
      setUploading(false);
    }
  }

  function handleDelete(img) {
    Alert.alert('Remover Imagem', 'Remover este registro da galeria?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await deleteGalleryEntry(img.id); load(); } },
    ]);
  }

  function showOptions() {
    Alert.alert('Adicionar Imagem', 'Escolha a origem:', [
      { text: '📷 Câmera', onPress: takePhoto },
      { text: '🖼️ Galeria do Dispositivo', onPress: pickFromGallery },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📷 Galeria de Monitoramento</Text>
        <TouchableOpacity style={styles.addBtn} onPress={showOptions} disabled={uploading}>
          {uploading ? <ActivityIndicator size="small" color="#00D4FF" /> : <Text style={styles.addBtnText}>+ Capturar</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={images}
        keyExtractor={i => i.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D4FF" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.thumb}
            onPress={() => setSelected(item)}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.uri }} style={styles.thumbImg} resizeMode="cover" />
            <View style={styles.thumbOverlay}>
              <Text style={styles.thumbLabel} numberOfLines={1}>{item.source === 'camera' ? '📷' : '🖼️'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyText}>Nenhuma imagem registrada</Text>
            <Text style={styles.emptySub}>Capture imagens da câmera ou importe da galeria do dispositivo</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={showOptions}>
              <Text style={styles.emptyBtnText}>+ Adicionar Primeira Imagem</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Fullscreen viewer */}
      <Modal visible={!!selected} transparent animationType="fade">
        <View style={styles.modal}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          {selected && (
            <>
              <Image source={{ uri: selected.uri }} style={styles.fullImg} resizeMode="contain" />
              <View style={styles.modalMeta}>
                <Text style={styles.modalCaption}>{selected.caption}</Text>
                <Text style={styles.modalSat}>🛰️ {selected.satellite}</Text>
                <Text style={styles.modalTime}>
                  {new Date(selected.createdAt).toLocaleDateString('pt-BR')} • {selected.source === 'camera' ? 'Câmera' : 'Galeria'}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => { setSelected(null); handleDelete(selected); }}>
                <Text style={styles.modalDeleteText}>🗑️ Remover</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#080F22', borderBottomWidth: 1, borderBottomColor: '#0D1F3C' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  addBtn: { backgroundColor: '#003478', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#00D4FF44' },
  addBtnText: { color: '#00D4FF', fontWeight: '700', fontSize: 13 },
  grid: { padding: 12 },
  row: { gap: 6, marginBottom: 6 },
  thumb: { width: THUMB, height: THUMB, borderRadius: 8, overflow: 'hidden', backgroundColor: '#0D1F3C' },
  thumbImg: { width: '100%', height: '100%' },
  thumbOverlay: { position: 'absolute', bottom: 4, right: 4 },
  thumbLabel: { fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#8B9BB4', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  emptyBtn: { backgroundColor: '#003478', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#00D4FF', fontWeight: '700' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, backgroundColor: '#0D1F3C', borderRadius: 20, padding: 10, zIndex: 10 },
  modalCloseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  fullImg: { width: width, height: width },
  modalMeta: { padding: 20, alignItems: 'center' },
  modalCaption: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  modalSat: { fontSize: 14, color: '#00D4FF', marginBottom: 4 },
  modalTime: { fontSize: 12, color: '#8B9BB4' },
  modalDeleteBtn: { backgroundColor: '#1A0000', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 1, borderColor: '#FF2D2D' },
  modalDeleteText: { color: '#FF2D2D', fontWeight: '600' },
});
