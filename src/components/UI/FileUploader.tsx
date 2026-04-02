import React, { useState, useRef } from 'react'
import { Upload, X, FileText, Music, Video, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface FileUploaderProps {
  bucket: string
  path: string
  accept: string
  maxSize: number
  onUploadComplete: (url: string, fileName: string, fileSize: number) => void
  currentFileUrl?: string
  label: string
}

const FileUploader: React.FC<FileUploaderProps> = ({
  bucket,
  path,
  accept,
  maxSize,
  onUploadComplete,
  currentFileUrl,
  label,
}) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getIcon = () => {
    if (accept.includes('pdf')) return <FileText className="h-8 w-8 text-gray-400" />
    if (accept.includes('audio')) return <Music className="h-8 w-8 text-gray-400" />
    if (accept.includes('video')) return <Video className="h-8 w-8 text-gray-400" />
    return <Upload className="h-8 w-8 text-gray-400" />
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${formatSize(maxSize)}`)
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)
    setFileName(file.name)

    if (currentFileUrl && bucket !== 'course-covers') {
      const extractPath = (url: string) => {
        const marker = '/storage/v1/object/public/' + bucket + '/'
        const idx = url.indexOf(marker)
        if (idx !== -1) return url.slice(idx + marker.length)
        if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('blob:')) return url
        return null
      }
      const oldPath = extractPath(currentFileUrl) || currentFileUrl
      await supabase.storage.from(bucket).remove([oldPath])
    }

    const ext = file.name.split('.').pop()
    const filePath = `${path}/${Date.now()}.${ext}`

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '0',
        upsert: true,
      })

    clearInterval(progressInterval)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(100)

    let publicUrl: string
    if (bucket === 'course-covers') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      publicUrl = data.publicUrl
    } else {
      publicUrl = filePath
    }

    onUploadComplete(publicUrl, file.name, file.size)
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInputRef.current.files = dt.files
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          uploading ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <Upload className="h-4 w-4 animate-bounce" />
              Uploading {fileName}...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{progress}%</p>
          </div>
        ) : (currentFileUrl || fileName) ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-700 truncate max-w-xs">
              {fileName || 'File uploaded'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFileName(null)
                onUploadComplete('', '', 0)
              }}
              className="text-gray-400 hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {getIcon()}
            <p className="text-sm text-gray-600 mt-2">
              Drop file here or click to browse
            </p>
            <p className="text-xs text-gray-400">
              Max size: {formatSize(maxSize)}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}

export default FileUploader
