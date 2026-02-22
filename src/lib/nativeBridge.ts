import { Preferences } from '@capacitor/preferences'
import { Browser } from '@capacitor/browser'
import { Network } from '@capacitor/network'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { StatusBar, Style } from '@capacitor/status-bar'
import { App } from '@capacitor/app'
import { isNative } from '../utils/platform'

export const nativeStorage = {
  async get(key: string): Promise<string | null> {
    if (isNative()) {
      const { value } = await Preferences.get({ key })
      return value
    }
    return localStorage.getItem(key)
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative()) {
      await Preferences.set({ key, value })
    } else {
      localStorage.setItem(key, value)
    }
  },

  async remove(key: string): Promise<void> {
    if (isNative()) {
      await Preferences.remove({ key })
    } else {
      localStorage.removeItem(key)
    }
  },
}

export const nativeBrowser = {
  async open(url: string): Promise<void> {
    if (isNative()) {
      await Browser.open({ url, windowName: '_blank' })
    } else {
      window.location.href = url
    }
  },

  async close(): Promise<void> {
    if (isNative()) {
      await Browser.close()
    }
  },
}

export const nativeNetwork = {
  async getStatus(): Promise<{ connected: boolean; connectionType: string }> {
    if (isNative()) {
      const status = await Network.getStatus()
      return { connected: status.connected, connectionType: status.connectionType }
    }
    return { connected: navigator.onLine, connectionType: 'unknown' }
  },

  onChange(callback: (connected: boolean) => void): () => void {
    if (isNative()) {
      const handle = Network.addListener('networkStatusChange', (status) => {
        callback(status.connected)
      })
      return () => { handle.then(h => h.remove()) }
    }
    const onlineHandler = () => callback(true)
    const offlineHandler = () => callback(false)
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    return () => {
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    }
  },
}

export const nativeFileSystem = {
  async writeFile(path: string, data: string): Promise<void> {
    if (!isNative()) return
    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
  },

  async readFile(path: string): Promise<string | null> {
    if (!isNative()) return null
    try {
      const result = await Filesystem.readFile({
        path,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })
      return typeof result.data === 'string' ? result.data : null
    } catch {
      return null
    }
  },

  async deleteFile(path: string): Promise<void> {
    if (!isNative()) return
    try {
      await Filesystem.deleteFile({ path, directory: Directory.Data })
    } catch {
      // File may not exist
    }
  },

  async downloadFile(url: string, path: string): Promise<string | null> {
    if (!isNative()) return null
    const result = await Filesystem.downloadFile({
      url,
      path,
      directory: Directory.Data,
    })
    return result.path ?? null
  },

  async fileExists(path: string): Promise<boolean> {
    if (!isNative()) return false
    try {
      await Filesystem.stat({ path, directory: Directory.Data })
      return true
    } catch {
      return false
    }
  },

  async getFileUri(path: string): Promise<string | null> {
    if (!isNative()) return null
    try {
      const result = await Filesystem.getUri({ path, directory: Directory.Data })
      return result.uri
    } catch {
      return null
    }
  },
}

export const nativeStatusBar = {
  async setLight(): Promise<void> {
    if (!isNative()) return
    await StatusBar.setStyle({ style: Style.Light })
  },

  async setDark(): Promise<void> {
    if (!isNative()) return
    await StatusBar.setStyle({ style: Style.Dark })
  },

  async setBackgroundColor(color: string): Promise<void> {
    if (!isNative()) return
    await StatusBar.setBackgroundColor({ color })
  },
}

export const nativeApp = {
  onUrlOpen(callback: (url: string) => void): () => void {
    if (!isNative()) return () => {}
    const handle = App.addListener('appUrlOpen', (event) => {
      callback(event.url)
    })
    return () => { handle.then(h => h.remove()) }
  },

  onStateChange(callback: (isActive: boolean) => void): () => void {
    if (!isNative()) return () => {}
    const handle = App.addListener('appStateChange', (state) => {
      callback(state.isActive)
    })
    return () => { handle.then(h => h.remove()) }
  },
}
