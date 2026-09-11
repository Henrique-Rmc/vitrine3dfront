import Dexie, { type Table } from 'dexie'
import type { PdvSaleRequest, PdvCashFlowRequest, PdvCustomerResponse } from './pdvService'

// ── Stored shapes ─────────────────────────────────────────────────────────────

interface PendingSale {
  offlineId: string
  payload: PdvSaleRequest
  createdAt: number
}

interface PendingCashFlow {
  offlineId: string
  payload: PdvCashFlowRequest
  createdAt: number
}

interface CachedProducts {
  storeId: string
  data: { id: number; name: string; price: number | null }[]
  updatedAt: number
}

interface CachedCustomers {
  id: 'all'
  data: PdvCustomerResponse[]
  updatedAt: number
}

// ── Dexie database ────────────────────────────────────────────────────────────

class PdvOfflineDatabase extends Dexie {
  pendingSales!: Table<PendingSale, string>
  pendingCashFlows!: Table<PendingCashFlow, string>
  cachedProducts!: Table<CachedProducts, string>
  cachedCustomers!: Table<CachedCustomers, string>

  constructor() {
    super('pdv-offline')
    this.version(1).stores({
      pendingSales: 'offlineId, createdAt',
      pendingCashFlows: 'offlineId, createdAt',
      cachedProducts: 'storeId',
      cachedCustomers: 'id',
    })
  }
}

const db = new PdvOfflineDatabase()

// ── Pending queue helpers ─────────────────────────────────────────────────────

export async function queueSale(payload: PdvSaleRequest): Promise<void> {
  await db.pendingSales.put({ offlineId: payload.offlineId, payload, createdAt: Date.now() })
}

export async function queueCashFlow(payload: PdvCashFlowRequest): Promise<void> {
  await db.pendingCashFlows.put({ offlineId: payload.offlineId, payload, createdAt: Date.now() })
}

export async function getPendingCount(): Promise<number> {
  const [sales, flows] = await Promise.all([
    db.pendingSales.count(),
    db.pendingCashFlows.count(),
  ])
  return sales + flows
}

export async function getAllPendingSales(): Promise<PdvSaleRequest[]> {
  const rows = await db.pendingSales.orderBy('createdAt').toArray()
  return rows.map((r) => r.payload)
}

export async function getAllPendingCashFlows(): Promise<PdvCashFlowRequest[]> {
  const rows = await db.pendingCashFlows.orderBy('createdAt').toArray()
  return rows.map((r) => r.payload)
}

export async function clearSyncedSales(offlineIds: string[]): Promise<void> {
  await db.pendingSales.bulkDelete(offlineIds)
}

export async function clearSyncedCashFlows(offlineIds: string[]): Promise<void> {
  await db.pendingCashFlows.bulkDelete(offlineIds)
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

export async function cacheProducts(
  storeId: string,
  data: { id: number; name: string; price: number | null }[],
): Promise<void> {
  await db.cachedProducts.put({ storeId, data, updatedAt: Date.now() })
}

export async function getCachedProducts(
  storeId: string,
): Promise<{ id: number; name: string; price: number | null }[] | null> {
  const row = await db.cachedProducts.get(storeId)
  return row?.data ?? null
}

export async function cacheCustomers(data: PdvCustomerResponse[]): Promise<void> {
  await db.cachedCustomers.put({ id: 'all', data, updatedAt: Date.now() })
}

export async function getCachedCustomers(): Promise<PdvCustomerResponse[] | null> {
  const row = await db.cachedCustomers.get('all')
  return row?.data ?? null
}
