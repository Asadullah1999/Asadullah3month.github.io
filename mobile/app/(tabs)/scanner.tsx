import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { analyzeMeal, lookupBarcode } from '../../lib/api';
import { getTodayLog, upsertDailyLog, DailyLog, MealItem } from '../../lib/database';
import { Colors } from '../../constants/Colors';

type Mode = 'choose' | 'barcode' | 'photo';

function today() { return new Date().toISOString().split('T')[0]; }

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const [mode, setMode] = useState<Mode>('choose');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function openPhotoMode() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to scan meals');
      return;
    }
    setMode('photo');
  }

  async function openBarcodeMode() {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert('Permission needed', 'Allow camera access to scan barcodes');
        return;
      }
    }
    setMode('barcode');
    setScanning(true);
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0].base64) {
      setImageUri(res.assets[0].uri);
      setAnalyzing(true);
      try {
        const data = await analyzeMeal(res.assets[0].base64, 'image/jpeg');
        setResult({ type: 'photo', ...data });
      } catch {
        Alert.alert('Error', 'Failed to analyze meal. Make sure your API URL is configured.');
      } finally {
        setAnalyzing(false);
      }
    }
  }

  async function takeCameraPhoto() {
    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0].base64) {
      setImageUri(res.assets[0].uri);
      setMode('photo');
      setAnalyzing(true);
      try {
        const data = await analyzeMeal(res.assets[0].base64, 'image/jpeg');
        setResult({ type: 'photo', ...data });
      } catch {
        Alert.alert('Error', 'Failed to analyze meal.');
      } finally {
        setAnalyzing(false);
      }
    }
  }

  async function handleBarcodeScan({ data: barcode }: { data: string }) {
    if (!scanning) return;
    setScanning(false);
    setAnalyzing(true);
    try {
      const data = await lookupBarcode(barcode);
      setResult({ type: 'barcode', ...data });
      setMode('choose');
    } catch {
      Alert.alert('Not found', 'Product not found in database.');
      setScanning(true);
    } finally {
      setAnalyzing(false);
    }
  }

  async function addToLog(meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks') {
    if (!session?.user || !result) return;
    setAdding(true);
    try {
      const log = await getTodayLog(session.user.id, today()) ?? {
        user_id: session.user.id,
        log_date: today(),
        breakfast: [], lunch: [], dinner: [], snacks: [],
        total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0,
        water_ml: 0, mood: null, notes: null,
      };

      let items: MealItem[] = [];
      if (result.type === 'photo' && result.foods) {
        items = result.foods.map((f: any) => ({
          name: f.name,
          calories: f.calories ?? 0,
          protein: f.protein ?? 0,
          carbs: f.carbs ?? 0,
          fat: f.fat ?? 0,
          quantity: 1,
          unit: 'serving',
        }));
      } else if (result.type === 'barcode') {
        items = [{
          name: result.name ?? 'Scanned product',
          calories: result.calories ?? 0,
          protein: result.protein ?? 0,
          carbs: result.carbs ?? 0,
          fat: result.fat ?? 0,
          quantity: 1,
          unit: result.serving_size ?? 'serving',
        }];
      }

      const updated: DailyLog = { ...log, [meal]: [...(log as any)[meal], ...items] };
      await upsertDailyLog(updated);
      Alert.alert('Added!', `Food added to ${meal}.`);
      setResult(null);
      setImageUri(null);
    } catch {
      Alert.alert('Error', 'Failed to add to log.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
        <Text style={styles.headerTitle}>Food Scanner</Text>
        <Text style={styles.headerSub}>AI-powered meal & barcode scanner</Text>
      </LinearGradient>

      {mode === 'choose' && !result && (
        <ScrollView contentContainerStyle={styles.center}>
          {analyzing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primaryLight} />
              <Text style={styles.loadingText}>Analyzing food...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.chooseTitle}>Choose scan method</Text>
              <TouchableOpacity style={styles.modeCard} onPress={openPhotoMode}>
                <LinearGradient colors={Colors.gradients.primary as any} style={styles.modeIcon}>
                  <Ionicons name="camera" size={32} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>Photo Analysis</Text>
                  <Text style={styles.modeDesc}>Take a photo or pick from gallery — AI identifies the food</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.modeCard} onPress={openBarcodeMode}>
                <LinearGradient colors={Colors.gradients.accent as any} style={styles.modeIcon}>
                  <Ionicons name="barcode" size={32} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>Barcode Scanner</Text>
                  <Text style={styles.modeDesc}>Scan product barcode to get nutrition info instantly</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* Photo mode */}
      {mode === 'photo' && !result && !analyzing && (
        <View style={styles.center}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : null}
          <TouchableOpacity style={styles.bigBtn} onPress={pickImage}>
            <Ionicons name="images" size={24} color="#fff" />
            <Text style={styles.bigBtnText}>Pick from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} onPress={takeCameraPhoto}>
            <Ionicons name="camera" size={24} color={Colors.primaryLight} />
            <Text style={[styles.bigBtnText, { color: Colors.primaryLight }]}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.backLink}>
            <Ionicons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={styles.backLinkText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Barcode mode */}
      {mode === 'barcode' && (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanning ? handleBarcodeScan : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
          />
          <View style={styles.barcodeOverlay}>
            <View style={styles.barcodeFrame} />
            <Text style={styles.barcodeHint}>Point camera at barcode</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('choose')}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Result */}
      {result && (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <View style={styles.resultCard}>
            <Ionicons name="checkmark-circle" size={40} color={Colors.success} style={{ marginBottom: 8 }} />
            <Text style={styles.resultTitle}>{result.type === 'photo' ? 'Meal Analyzed!' : result.name ?? 'Product Found'}</Text>

            {result.type === 'photo' && result.foods && result.foods.map((f: any, i: number) => (
              <View key={i} style={styles.foodChip}>
                <Text style={styles.foodChipName}>{f.name}</Text>
                <Text style={styles.foodChipCal}>{f.calories} kcal</Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalVal}>
                {result.type === 'photo'
                  ? `${result.total_calories ?? 0} kcal`
                  : `${result.calories ?? 0} kcal`}
              </Text>
            </View>

            <Text style={styles.addLabel}>Add to meal:</Text>
            <View style={styles.mealBtns}>
              {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(m => (
                <TouchableOpacity key={m} style={styles.mealBtn} onPress={() => addToLog(m)} disabled={adding}>
                  <Text style={styles.mealBtnText}>{m.charAt(0).toUpperCase() + m.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.scanAgainBtn} onPress={() => { setResult(null); setImageUri(null); setMode('choose'); }}>
              <Text style={styles.scanAgainText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  center: { flex: 1, padding: 20, justifyContent: 'center' },
  loadingBox: { alignItems: 'center', gap: 16 },
  loadingText: { color: Colors.textMuted, fontSize: 16 },
  chooseTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  modeIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modeDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  bigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginBottom: 12 },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 },
  backLinkText: { color: Colors.textMuted, fontSize: 15 },
  preview: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16 },
  barcodeOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  barcodeFrame: { width: 250, height: 150, borderWidth: 2, borderColor: Colors.primaryLight, borderRadius: 16 },
  barcodeHint: { color: '#fff', fontSize: 14, marginTop: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  cancelBtn: { marginTop: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  cancelBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  resultContainer: { padding: 20 },
  resultCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  resultTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  foodChip: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  foodChipName: { color: Colors.textSecondary, fontSize: 14 },
  foodChipCal: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12, marginBottom: 20 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalVal: { fontSize: 16, fontWeight: '700', color: Colors.primaryLight },
  addLabel: { fontSize: 14, color: Colors.textMuted, marginBottom: 10, alignSelf: 'flex-start' },
  mealBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  mealBtn: { flex: 1, minWidth: '45%', backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  mealBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scanAgainBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  scanAgainText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
});
