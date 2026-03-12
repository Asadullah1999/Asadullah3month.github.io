import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadDropzoneProps {
  onImageSelected: (imageData: string) => void;
  loading?: boolean;
}

export function ImageUploadDropzone({ onImageSelected, loading }: ImageUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreview(imageData);
      onImageSelected(imageData);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition',
        dragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      )}
    >
      {preview ? (
        <div className="space-y-4">
          <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
          <label className="block">
            <span className="sr-only">Choose another photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              disabled={loading}
              className="hidden"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
              className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Choose another photo'}
            </button>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <Upload className="w-12 h-12 mx-auto text-gray-400" />
          <div>
            <p className="text-lg font-semibold text-gray-700">Drop your food photo here</p>
            <p className="text-sm text-gray-500">or click to browse</p>
          </div>
          <label>
            <span className="sr-only">Upload photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              disabled={loading}
              className="hidden"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Select Photo'}
            </button>
          </label>
          <p className="text-xs text-gray-500">Max 10MB • JPG, PNG, WebP supported</p>
        </div>
      )}
    </div>
  );
}
