import { nativeStorage, nativeNetwork } from '../lib/nativeBridge'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'
import { isNative } from '../utils/platform'

interface QueuedMutation {
  id: string
  table: string
  operation: 'insert' | 'update' | 'upsert'
  data: Record<string, unknown>
  matchColumns?: string[]
  createdAt: string
}

const QUEUE_KEY = 'offline_mutation_queue'
const CACHE_PREFIX = 'cache_'

class OfflineManager {
  private connected = true
  private removeNetworkListener: (() => void) | null = null
  private syncInProgress = false

  async init(): Promise<void> {
    const status = await nativeNetwork.getStatus()
    this.connected = status.connected

    this.removeNetworkListener = nativeNetwork.onChange((connected) => {
      this.connected = connected
      logger.info('Network status changed', { connected })
      if (connected) {
        this.processMutationQueue()
      }
    })
  }

  destroy(): void {
    this.removeNetworkListener?.()
  }

  isOnline(): boolean {
    return this.connected
  }

  async queueMutation(
    table: string,
    operation: 'insert' | 'update' | 'upsert',
    data: Record<string, unknown>,
    matchColumns?: string[]
  ): Promise<void> {
    if (this.connected) {
      await this.executeMutation(table, operation, data, matchColumns)
      return
    }

    const queue = await this.getQueue()
    const mutation: QueuedMutation = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      table,
      operation,
      data,
      matchColumns,
      createdAt: new Date().toISOString(),
    }
    queue.push(mutation)
    await nativeStorage.set(QUEUE_KEY, JSON.stringify(queue))
    logger.info('Mutation queued for offline sync', { table, operation, id: mutation.id })
  }

  private async getQueue(): Promise<QueuedMutation[]> {
    const raw = await nativeStorage.get(QUEUE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as QueuedMutation[]
    } catch {
      return []
    }
  }

  private async executeMutation(
    table: string,
    operation: 'insert' | 'update' | 'upsert',
    data: Record<string, unknown>,
    matchColumns?: string[]
  ): Promise<void> {
    let query
    if (operation === 'insert') {
      query = supabase.from(table).insert(data)
    } else if (operation === 'update') {
      query = supabase.from(table).update(data).eq('id', data.id as string)
    } else {
      query = supabase.from(table).upsert(data, {
        onConflict: matchColumns?.join(',') ?? 'id',
      })
    }
    const { error } = await query
    if (error) {
      logger.error('Mutation execution failed', { table, operation, error })
      throw error
    }
  }

  async processMutationQueue(): Promise<void> {
    if (this.syncInProgress || !this.connected) return
    this.syncInProgress = true

    try {
      const queue = await this.getQueue()
      if (queue.length === 0) {
        this.syncInProgress = false
        return
      }

      logger.info('Processing offline mutation queue', { count: queue.length })
      const remaining: QueuedMutation[] = []

      for (const mutation of queue) {
        try {
          await this.executeMutation(
            mutation.table,
            mutation.operation,
            mutation.data,
            mutation.matchColumns
          )
          logger.info('Queued mutation synced', { id: mutation.id, table: mutation.table })
        } catch {
          remaining.push(mutation)
        }
      }

      await nativeStorage.set(QUEUE_KEY, JSON.stringify(remaining))
      logger.info('Offline queue processing complete', {
        synced: queue.length - remaining.length,
        remaining: remaining.length,
      })
    } finally {
      this.syncInProgress = false
    }
  }

  async cacheData(key: string, data: unknown, ttlMs = 300000): Promise<void> {
    const cacheEntry = {
      data,
      expiresAt: Date.now() + ttlMs,
    }
    await nativeStorage.set(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheEntry))
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    const raw = await nativeStorage.get(`${CACHE_PREFIX}${key}`)
    if (!raw) return null
    try {
      const entry = JSON.parse(raw) as { data: T; expiresAt: number }
      if (Date.now() > entry.expiresAt) {
        await nativeStorage.remove(`${CACHE_PREFIX}${key}`)
        return null
      }
      return entry.data
    } catch {
      return null
    }
  }

  async clearCache(): Promise<void> {
    if (!isNative()) {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX))
      keys.forEach((k) => localStorage.removeItem(k))
    }
  }
}

export const offlineManager = new OfflineManager()
