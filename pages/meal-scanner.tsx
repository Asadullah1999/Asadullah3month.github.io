import { useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { ImageUploadDropzone } from '@/components/ai/ImageUploadDropzone';
import { MealDetectionCard } from '@/components/ai/MealDetectionCard';
import { Camera } from 'lucide-react';

interface DetectedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function MealScannerPage() {
  const [loading, setLoading] = useState(false);
  const [detection, setDetection] = useState<{
    meals: DetectedMeal[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    confidence: number;
    scanId: string;
  } | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const handleImageSelected = async (imageData: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/scan-meal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          date: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze meal');
      }

      const data = await response.json();
      if (data.success) {
        setDetection({
          meals: data.scan.meals,
          totalCalories: data.scan.totalCalories,
          totalProtein: data.scan.totalProtein,
          totalCarbs: data.scan.totalCarbs,
          totalFat: data.scan.totalFat,
          confidence: data.scan.confidence,
          scanId: data.scan.id,
        });
        toast.success('Meal analyzed successfully!');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze meal');
      setDetection(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (meal: DetectedMeal) => {
    toast.success('Meal added to today\'s log!');
    // TODO: Integrate with actual daily log saving
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Camera className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Meal Scanner</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Take a Photo</h2>
              <ImageUploadDropzone onImageSelected={handleImageSelected} loading={loading} />
            </Card>

            {/* Instructions */}
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Tips for best results:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Take photos in good lighting</li>
                <li>• Include the entire meal in frame</li>
                <li>• Show portion sizes clearly</li>
                <li>• Avoid blurry or angled shots</li>
              </ul>
            </Card>
          </div>

          {/* Detection Results */}
          <div className="space-y-6">
            {detection ? (
              <MealDetectionCard
                meals={detection.meals}
                confidence={detection.confidence}
                onAddMeal={handleAddMeal}
                loading={loading}
              />
            ) : (
              <Card className="p-8 text-center text-gray-500">
                <p>Upload a food photo to see nutritional analysis</p>
              </Card>
            )}
          </div>
        </div>

        {/* Scan History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Scans</h2>
          {recentScans.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scans yet. Start by uploading a photo!</p>
          ) : (
            <div className="grid gap-4">
              {recentScans.map((scan) => (
                <div key={scan.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{scan.detected_meals[0]?.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {scan.total_calories} cal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
