import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { todayISO } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Camera, Upload, Zap, CheckCircle, RotateCcw,
  Flame, Beef, Wheat, Droplets, PlusCircle, X,
} from 'lucide-react'

type NutritionItem = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: string
}

type AnalysisResult = {
  foods: NutritionItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  description: string
}

export default function MealScannerPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [logging, setLogging] = useState(false)
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('lunch')

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setMode('camera')
      }
    } catch {
      toast.error('Camera access denied. Please use file upload instead.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    setMode('idle')
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64 = dataUrl.split(',')[1]
    stopCamera()
    setPreviewUrl(dataUrl)
    setImageData({ base64, mimeType: 'image/jpeg' })
    setMode('preview')
  }, [stopCamera])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const base64 = dataUrl.split(',')[1]
      setPreviewUrl(dataUrl)
      setImageData({ base64, mimeType: file.type })
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  const analyzeImage = useCallback(async () => {
    if (!imageData) return
    setAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch('/api/ai/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData.base64, mimeType: imageData.mimeType }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Analysis failed.')
        return
      }

      setResult(data as AnalysisResult)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }, [imageData])

  const logMeal = useCallback(async () => {
    if (!result) return
    setLogging(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const today = todayISO()
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single()

      const newItems = result.foods.map((f) => ({
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        quantity: f.quantity,
      }))

      if (existing) {
        const currentItems = (existing[mealType] as NutritionItem[] | null) || []
        const merged = [...currentItems, ...newItems]
        const allMeals = {
          breakfast: mealType === 'breakfast' ? merged : (existing.breakfast as NutritionItem[] || []),
          lunch: mealType === 'lunch' ? merged : (existing.lunch as NutritionItem[] || []),
          dinner: mealType === 'dinner' ? merged : (existing.dinner as NutritionItem[] || []),
          snacks: mealType === 'snacks' ? merged : (existing.snacks as NutritionItem[] || []),
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
          [mealType]: newItems,
          total_calories: result.total_calories,
          total_protein: result.total_protein,
          total_carbs: result.total_carbs,
          total_fat: result.total_fat,
        })
      }

      toast.success(`Added ${result.foods.length} item${result.foods.length > 1 ? 's' : ''} to ${mealType}!`)
      router.push('/dashboard')
    } catch {
      toast.error('Failed to log meal. Please try again.')
    } finally {
      setLogging(false)
    }
  }, [result, mealType, router])

  const reset = useCallback(() => {
    setMode('idle')
    setPreviewUrl(null)
    setImageData(null)
    setResult(null)
    stopCamera()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [stopCamera])

  return (
    <DashboardLayout title="AI Meal Scanner">
      <Head><title>AI Meal Scanner – NutriCoach</title></Head>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Meal Scanner</h1>
          <p className="text-gray-500 mt-1">Take a photo of your food — AI identifies it and logs calories automatically.</p>
        </div>

        {/* Camera / Preview Area */}
        <Card>
          <div className="p-6">
            {mode === 'idle' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center">
                  <Camera size={36} className="text-green-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">Scan your meal</p>
                  <p className="text-sm text-gray-500 mt-1">Use your camera or upload a photo</p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                  <Button onClick={startCamera} className="flex items-center gap-2">
                    <Camera size={16} /> Open Camera
                  </Button>
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                    <Upload size={16} /> Upload Photo
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
            )}

            {mode === 'camera' && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white/60 rounded-xl w-3/4 h-3/4 opacity-60" />
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-3 justify-center">
                  <Button onClick={capturePhoto} className="flex items-center gap-2">
                    <Camera size={16} /> Capture Photo
                  </Button>
                  <Button variant="ghost" onClick={stopCamera} className="flex items-center gap-2">
                    <X size={16} /> Cancel
                  </Button>
                </div>
              </div>
            )}

            {mode === 'preview' && previewUrl && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Food to analyze" className="w-full max-h-80 object-contain bg-gray-50 rounded-xl" />
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {!result && !analyzing && (
                    <Button onClick={analyzeImage} className="flex items-center gap-2">
                      <Zap size={16} /> Analyze Food
                    </Button>
                  )}
                  <Button variant="ghost" onClick={reset} className="flex items-center gap-2">
                    <RotateCcw size={16} /> Retake
                  </Button>
                </div>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
                <p className="text-sm text-gray-600 font-medium">Analyzing your meal with AI...</p>
                <p className="text-xs text-gray-400">This may take a few seconds</p>
              </div>
            )}
          </div>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            <Card>
              <CardHeader><CardTitle>Identified Foods</CardTitle></CardHeader>
              <div className="px-6 pb-6 space-y-4">
                <p className="text-sm text-gray-600 bg-green-50 rounded-xl p-3 flex items-start gap-2">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  {result.description}
                </p>

                <div className="space-y-3">
                  {result.foods.map((food, i) => (
                    <div key={i} className="flex items-start justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{food.name}</p>
                        <p className="text-xs text-gray-500">{food.quantity}</p>
                      </div>
                      <div className="flex gap-3 text-xs text-right">
                        <div>
                          <p className="font-semibold text-orange-600">{food.calories}</p>
                          <p className="text-gray-400">kcal</p>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-600">{food.protein}g</p>
                          <p className="text-gray-400">protein</p>
                        </div>
                        <div>
                          <p className="font-semibold text-yellow-600">{food.carbs}g</p>
                          <p className="text-gray-400">carbs</p>
                        </div>
                        <div>
                          <p className="font-semibold text-purple-600">{food.fat}g</p>
                          <p className="text-gray-400">fat</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                  {[
                    { label: 'Calories', value: result.total_calories, unit: 'kcal', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Protein', value: result.total_protein, unit: 'g', icon: Beef, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Carbs', value: result.total_carbs, unit: 'g', icon: Wheat, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Fat', value: result.total_fat, unit: 'g', icon: Droplets, color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map(({ label, value, unit, icon: Icon, color, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                      <Icon size={16} className={`${color} mx-auto mb-1`} />
                      <p className={`text-lg font-bold ${color}`}>{value}{unit}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Log to meal */}
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Log to Meal</h3>
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
                <Button
                  onClick={logMeal}
                  disabled={logging}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {logging ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} /> Add to {mealType}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
