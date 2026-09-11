import { useState, useEffect, useCallback, useRef } from 'react'
import { useNetworkStatus } from './useNetworkStatus'
import { syncPendingItems, getPendingCount, type SyncResult } from '../services/pdvSyncManager'

export function usePdvSync() {
  const isOnline = useNetworkStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)
  const prevOnline = useRef(isOnline)

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {
      // IndexedDB unavailable — non-blocking
    }
  }, [])

  // Keep pendingCount fresh on mount
  useEffect(() => { refreshPendingCount() }, [refreshPendingCount])

  const syncNow = useCallback(async () => {
    if (isSyncing) return
    try {
      setIsSyncing(true)
      const result = await syncPendingItems()
      setLastSyncResult(result)
      await refreshPendingCount()
    } catch {
      setLastSyncResult({ synced: 0, errors: ['Erro de conexão ao sincronizar.'] })
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, refreshPendingCount])

  // Auto-sync when reconnecting, with 1s debounce for the connection to stabilize
  useEffect(() => {
    const wasOffline = !prevOnline.current
    prevOnline.current = isOnline

    if (!isOnline || !wasOffline) return

    const timer = setTimeout(async () => {
      const count = await getPendingCount().catch(() => 0)
      if (count > 0) syncNow()
    }, 1000)

    return () => clearTimeout(timer)
  }, [isOnline, syncNow])

  // Auto-dismiss sync success after 4 seconds
  useEffect(() => {
    if (!lastSyncResult || lastSyncResult.errors.length > 0) return
    const timer = setTimeout(() => setLastSyncResult(null), 4000)
    return () => clearTimeout(timer)
  }, [lastSyncResult])

  return { isOnline, isSyncing, pendingCount, lastSyncResult, syncNow, refreshPendingCount }
}
