import { useState, useRef, useCallback, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Scan, Camera, Keyboard, Search, CheckCircle,
  Flame, Beef, Wheat, Droplets, PlusCircle, X,
  Package, AlertCircle,
} from 'lucide-react'

type NutritionData = {
  barcode: string
  name: string
  brand: string
  serving_size: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  image_url: string | null
}

// Minimal BarcodeDetector type for browsers that support it
type BarcodeFormat = 'ean_13' | 'ean_8' | 'upc_a' | 'upc_e' | 'code_128' | 'qr_code' | string

declare class BarcodeDetector {
  constructor(options?: { formats: BarcodeFormat[] })
  detect(image: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<Array<{ rawValue: string; format: string }>>
  static getSupportedFormats(): Promise<string[]>
}

export default function BarcodeScannerPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<'idle' | 'camera' | 'manual'>('idle')
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [looking, setLooking] = useState(false)
  const [product, setProduct] = useState<NutritionData | null>(null)
  const [logging, setLogging] = useState(false)
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('snacks')
  const [barcodeSupported, setBarcodeSupported] = useState<boolean | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const detectorRef = useRef<BarcodeDetector | null>(null)

  useEffect(() => {
    // Check if BarcodeDetector is available
    setBarcodeSupported(typeof BarcodeDetector !== 'undefined')
  }, [])

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setMode('idle')
    setScanning(false)
  }, [])

  const lookupBarcode = useCallback(async (code: string) => {
    const clean = code.replace(/\D/g, '')
    if (!clean || clean.length < 8) {
      toast.error('Invalid barcode. Please try again.')
      return
    }

    setLooking(true)
    setProduct(null)
    stopCamera()

    try {
      const response = await fetch(`/api/barcode/lookup?barcode=${encodeURIComponent(clean)}`)
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Product not found.')
        setMode('idle')
        return
      }

      setProduct(data as NutritionData)
    } catch {
      toast.error('Network error. Please try again.')
      setMode('idle')
    } finally {
      setLooking(false)
    }
  }, [stopCamera])

  const startCamera = useCallback(async () => {
    if (!barcodeSupported) {
      toast.error('Barcode scanning is not supported in this browser. Please use manual entry.')
      setMode('manual')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setMode('camera')
        setScanning(true)

        // Initialize BarcodeDetector
        detectorRef.current = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'],
        })

        // Scan every 500ms
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !detectorRef.current) return
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current)
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              const code = barcodes[0].rawValue
              toast.success(`Barcode detected: ${code}`)
              lookupBarcode(code)
            }
          } catch {
            // Ignore detection errors (frame not ready)
          }
        }, 500)
      }
    } catch {
      toast.error('Camera access denied. Please use manual entry.')
      setMode('manual')
    }
  }, [barcodeSupported, lookupBarcode])

  const logProduct = useCallback(async () => {
    if (!product) return
    setLogging(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const today = todayISO()
      const newItem = {
        name: `${product.name} (${product.brand})`,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fat,
        quantity: product.serving_size,
      }

      const { data: existing } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single()

      if (existing) {
        const currentItems = (existing[mealType] as typeof newItem[] | null) || []
        const merged = [...currentItems, newItem]
        const allMeals = {
          breakfast: mealType === 'breakfast' ? merged : (existing.breakfast as typeof newItem[] || []),
          lunch: mealType === 'lunch' ? merged : (existing.lunch as typeof newItem[] || []),
          dinner: mealType === 'dinner' ? merged : (existing.dinner as typeof newItem[] || []),
          snacks: mealType === 'snacks' ? merged : (existing.snacks as typeof newItem[] || []),
        }
        const allFoods = [...allMeals.breakfast, ...allMeals.lunch, ...allMeals.dinner, ...allMeals.snacks]
        const totals = allFoods.reduce((acc, f) => ({
          total_calories: acc.total_calories + (f.calories || 0),
          total_protein: acc.total_protein + (f.protein || 0),
          total_carbs: acc.total_carbs + (f.carbs || 0),
          total_fat: acc.total_fat + (f.fat || 0),
        }), { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 })

        await supabase.from('daily_logs').update({ [mealType]: merged, ...totals }).eq('id', existing.id)
      } else {
        await supabase.from('daily_logs').insert({
          user_id: user.id,
          log_date: today,
          [mealType]: [newItem],
          total_calories: product.calories,
          total_protein: product.protein,
          total_carbs: product.carbs,
          total_fat: product.fat,
        })
      }

      toast.success(`${product.name} logged to ${mealType}!`)
      router.push('/dashboard')
    } catch {
      toast.error('Failed to log product. Please try again.')
    } finally {
      setLogging(false)
    }
  }, [product, mealType, router])

  const reset = useCallback(() => {
    stopCamera()
    setProduct(null)
    setManualCode('')
    setMode('idle')
  }, [stopCamera])

  return (
    <DashboardLayout title="Barcode Scanner">
      <Head><title>Barcode Scanner – NutriCoach</title></Head>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Barcode Scanner</h1>
          <p className="text-gray-500 mt-1 text-sm">Scan food packaging for instant nutrition data.</p>
        </div>

        {/* Main scan area */}
        {!product && (
          <Card>
            <div className="p-6">
              {mode === 'idle' && (
                <div className="flex flex-col items-center gap-5 py-6">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Scan size={36} className="text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">Scan a barcode</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {barcodeSupported === false
                        ? 'Your browser doesn\'t support camera scanning. Use manual entry.'
                        : 'Point your camera at a product barcode or enter it manually.'}
                    </p>
                  </div>

                  {barcodeSupported === false && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      Camera barcode scanning requires Chrome on Android/Desktop. Use manual entry instead.
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap justify-center">
                    {barcodeSupported !== false && (
                      <Button onClick={startCamera} className="flex items-center gap-2">
                        <Camera size={16} /> Scan with Camera
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => setMode('manual')} className="flex items-center gap-2">
                      <Keyboard size={16} /> Enter Manually
                    </Button>
                  </div>
                </div>
              )}

              {mode === 'camera' && (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    {/* Scan overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-32 relative">
                        <div className="absolute inset-0 border-2 border-white/70 rounded-lg" />
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                        <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400/70 animate-pulse" />
                      </div>
                    </div>
                    {scanning && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                        <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                          Scanning for barcode...
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button variant="ghost" onClick={stopCamera} className="flex items-center gap-2">
                      <X size={16} /> Cancel
                    </Button>
                    <Button variant="secondary" onClick={() => { stopCamera(); setMode('manual') }} className="flex items-center gap-2">
                      <Keyboard size={16} /> Enter Manually
                    </Button>
                  </div>
                </div>
              )}

              {mode === 'manual' && (
                <div className="space-y-4 py-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter barcode number</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => e.key === 'Enter' && lookupBarcode(manualCode)}
                        placeholder="e.g. 5000159484695"
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono tracking-wider"
                        maxLength={14}
                      />
                      <Button
                        onClick={() => lookupBarcode(manualCode)}
                        disabled={looking || manualCode.length < 8}
                        className="flex items-center gap-2"
                      >
                        <Search size={16} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">Enter the barcode number found on the product packaging (EAN-13, UPC-A)</p>
                  </div>
                  <Button variant="ghost" onClick={reset} className="flex items-center gap-2 text-sm">
                    <X size={14} /> Cancel
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Loading */}
        {looking && (
          <Card>
            <div className="p-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-gray-600 font-medium">Looking up product...</p>
              <p className="text-xs text-gray-400">Searching nutrition database</p>
            </div>
          </Card>
        )}

        {/* Product result */}
        {product && (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" />
                  Product Found
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6 space-y-4">
                <div className="flex gap-4">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-20 h-20 object-contain rounded-xl border border-gray-100 bg-white flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package size={28} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.brand}</p>
                    <p className="text-xs text-gray-400 mt-1">Per serving: {product.serving_size}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{product.barcode}</p>
                  </div>
                </div>

                {/* Nutrition grid */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Calories', value: product.calories, unit: 'kcal', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Protein', value: product.protein, unit: 'g', icon: Beef, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Carbs', value: product.carbs, unit: 'g', icon: Wheat, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Fat', value: product.fat, unit: 'g', icon: Droplets, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map(({ label, value, unit, icon: Icon, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                      <Icon size={16} className={`${color} mx-auto mb-1`} />
                      <p className={`text-lg font-bold ${color}`}>{value}{unit}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Extra nutrients */}
                {(product.fiber > 0 || product.sugar > 0 || product.sodium > 0) && (
                  <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    {product.fiber > 0 && <span>Fiber: <strong>{product.fiber}g</strong></span>}
                    {product.sugar > 0 && <span>Sugar: <strong>{product.sugar}g</strong></span>}
                    {product.sodium > 0 && <span>Sodium: <strong>{product.sodium}g</strong></span>}
                  </div>
                )}
              </div>
            </Card>

            {/* Log product */}
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Add to Meal</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMealType(type)}
                      className={`py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                        mealType === type
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={logProduct}
                    disabled={logging}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {logging ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} /> Log to {mealType}
                      </>
                    )}
                  </Button>
                  <Button variant="secondary" onClick={reset} className="flex items-center gap-2">
                    <Scan size={16} /> Scan Another
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
