import { syncPdv } from './pdvService'
import {
  getAllPendingSales,
  getAllPendingCashFlows,
  clearSyncedSales,
  clearSyncedCashFlows,
  getPendingCount,
} from './pdvOfflineStore'

export interface SyncResult {
  synced: number
  errors: string[]
}

export async function syncPendingItems(): Promise<SyncResult> {
  const [sales, cashFlows] = await Promise.all([
    getAllPendingSales(),
    getAllPendingCashFlows(),
  ])

  if (sales.length === 0 && cashFlows.length === 0) {
    return { synced: 0, errors: [] }
  }

  const response = await syncPdv({ sales, cashFlows })

  // Build processed offlineId sets from the sync response.
  // The backend returns counts, not IDs — so we clear all items that were sent
  // assuming the backend processed or skipped them (idempotent by offlineId).
  // Only keep items if the call itself threw (network error), handled by caller.
  const salesIds = sales.map((s) => s.offlineId)
  const flowIds = cashFlows.map((f) => f.offlineId)

  await Promise.all([
    clearSyncedSales(salesIds),
    clearSyncedCashFlows(flowIds),
  ])

  const synced = response.salesProcessed + response.cashFlowsProcessed
  return { synced, errors: response.errors }
}

export { getPendingCount }
