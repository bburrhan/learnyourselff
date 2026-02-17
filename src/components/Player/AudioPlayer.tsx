import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  title: string
  initialPosition?: number
  onProgressUpdate?: (seconds: number, percent: number) => void
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  initialPosition = 0,
  onProgressUpdate,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [seeking, setSeeking] = useState(false)
  const lastSaveRef = useRef(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => {
      setDuration(audio.duration)
      if (initialPosition > 0 && initialPosition < audio.duration) {
        audio.currentTime = initialPosition
        setCurrentTime(initialPosition)
      }
    }

    const onTimeUpdate = () => {
      if (!seeking) {
        setCurrentTime(audio.currentTime)
      }
      if (onProgressUpdate && audio.duration > 0) {
        const now = Date.now()
        if (now - lastSaveRef.current > 5000) {
          lastSaveRef.current = now
          const percent = Math.round((audio.currentTime / audio.duration) * 100)
          onProgressUpdate(Math.round(audio.currentTime), percent)
        }
      }
    }

    const onEnded = () => {
      setPlaying(false)
      if (onProgressUpdate && audio.duration > 0) {
        onProgressUpdate(Math.round(audio.duration), 100)
      }
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [initialPosition, onProgressUpdate, seeking])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }, [playing])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const skip = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration))
  }

  const handleSpeedChange = () => {
    const idx = SPEEDS.indexOf(speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next)
    if (audioRef.current) {
      audioRef.current.playbackRate = next
    }
  }

  const toggleMute = () => {
    setMuted(!muted)
    if (audioRef.current) {
      audioRef.current.muted = !muted
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    setVolume(v)
    if (audioRef.current) {
      audioRef.current.volume = v
      audioRef.current.muted = false
      setMuted(false)
    }
  }

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
      <audio ref={audioRef} src={src} preload="metadata" />

      <p className="text-sm text-gray-300 mb-4 truncate">{title}</p>

      <div className="mb-4">
        <div className="relative group">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={() => setSeeking(true)}
            onMouseUp={() => setSeeking(false)}
            className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:group-hover:opacity-100
              [&::-webkit-slider-thumb]:transition-opacity"
            style={{
              background: `linear-gradient(to right, #3b82f6 ${progressPercent}%, #4b5563 ${progressPercent}%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip(-10)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white text-gray-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          <button
            onClick={() => skip(10)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSpeedChange}
            className="text-xs font-medium text-gray-400 hover:text-white bg-gray-700 px-2 py-1 rounded transition-colors"
          >
            {speed}x
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
