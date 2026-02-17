import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  title: string
  initialPosition?: number
  onProgressUpdate?: (seconds: number, percent: number) => void
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  initialPosition = 0,
  onProgressUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [seeking, setSeeking] = useState(false)
  const controlsTimeoutRef = useRef<number | null>(null)
  const lastSaveRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoadedMetadata = () => {
      setDuration(video.duration)
      if (initialPosition > 0 && initialPosition < video.duration) {
        video.currentTime = initialPosition
        setCurrentTime(initialPosition)
      }
    }

    const onTimeUpdate = () => {
      if (!seeking) {
        setCurrentTime(video.currentTime)
      }
      if (onProgressUpdate && video.duration > 0) {
        const now = Date.now()
        if (now - lastSaveRef.current > 5000) {
          lastSaveRef.current = now
          const percent = Math.round((video.currentTime / video.duration) * 100)
          onProgressUpdate(Math.round(video.currentTime), percent)
        }
      }
    }

    const onEnded = () => {
      setPlaying(false)
      setShowControls(true)
      if (onProgressUpdate && video.duration > 0) {
        onProgressUpdate(Math.round(video.duration), 100)
      }
    }

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)
    document.addEventListener('fullscreenchange', onFullscreenChange)

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [initialPosition, onProgressUpdate, seeking])

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (playing) {
      controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000)
    }
  }, [playing])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
    } else {
      video.play()
    }
    setPlaying(!playing)
    resetControlsTimeout()
  }, [playing, resetControlsTimeout])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const handleSpeedChange = () => {
    const idx = SPEEDS.indexOf(speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next)
    if (videoRef.current) {
      videoRef.current.playbackRate = next
    }
  }

  const toggleMute = () => {
    setMuted(!muted)
    if (videoRef.current) {
      videoRef.current.muted = !muted
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (videoRef.current) {
      videoRef.current.volume = v
      videoRef.current.muted = false
      setMuted(false)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-xl overflow-hidden group"
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        preload="metadata"
      />

      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
        >
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
            <Play className="h-7 w-7 text-gray-900 ml-1" />
          </div>
        </button>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="mb-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            style={{
              background: `linear-gradient(to right, #3b82f6 ${progressPercent}%, rgba(255,255,255,0.3) ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2
                  [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <span className="text-xs text-gray-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSpeedChange}
              className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 transition-colors"
            >
              {speed}x
            </button>

            <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
