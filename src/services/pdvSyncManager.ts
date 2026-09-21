import { syncPdv } from './pdvService'
import {
  getAllPendingSales,
  getAllPendingCashFlows,
  getAllPendingExpenseBatches,
  clearSyncedSales,
  clearSyncedCashFlows,
  clearSyncedExpenseBatches,
  getPendingCount,
} from './pdvOfflineStore'

export interface SyncResult {
  synced: number
  errors: string[]
}

export async function syncPendingItems(): Promise<SyncResult> {
  const [sales, cashFlows, expenseBatches] = await Promise.all([
    getAllPendingSales(),
    getAllPendingCashFlows(),
    getAllPendingExpenseBatches(),
  ])

  if (sales.length === 0 && cashFlows.length === 0 && expenseBatches.length === 0) {
    return { synced: 0, errors: [] }
  }

  const response = await syncPdv({ sales, cashFlows, expenseBatches })

  const salesIds = sales.map((s) => s.offlineId)
  const flowIds = cashFlows.map((f) => f.offlineId)
  const batchIds = expenseBatches.map((b) => b.offlineId)

  await Promise.all([
    clearSyncedSales(salesIds),
    clearSyncedCashFlows(flowIds),
    clearSyncedExpenseBatches(batchIds),
  ])

  const synced =
    response.salesProcessed +
    response.cashFlowsProcessed +
    (response.expenseBatchesProcessed ?? 0)
  return { synced, errors: response.errors }
}

export { getPendingCount }
