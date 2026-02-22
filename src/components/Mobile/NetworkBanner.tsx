import React, { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { nativeNetwork } from '../../lib/nativeBridge'

const NetworkBanner: React.FC = () => {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let mounted = true

    nativeNetwork.getStatus().then((status) => {
      if (mounted) setOnline(status.connected)
    })

    const removeListener = nativeNetwork.onChange((connected) => {
      if (mounted) setOnline(connected)
    })

    return () => {
      mounted = false
      removeListener()
    }
  }, [])

  if (online) return null

  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 z-[60]">
      <WifiOff className="h-4 w-4" />
      <span>You are offline. Some features may be unavailable.</span>
    </div>
  )
}

export default NetworkBanner
