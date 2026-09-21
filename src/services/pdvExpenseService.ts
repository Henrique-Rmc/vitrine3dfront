import apiClient from './apiClient'
import type { Page } from './pdvService'

// ── Expense Products ──────────────────────────────────────────────────────────

export interface ExpenseProduct {
  id: number
  name: string
  unit: string
  stockQuantity: number
  lowStock: boolean
}

export async function listExpenseProducts(q?: string): Promise<ExpenseProduct[]> {
  const params = q ? { q } : undefined
  const { data } = await apiClient.get<ExpenseProduct[]>('/api/pdv/expenses/products', { params })
  return data
}

export async function createExpenseProduct(payload: { name: string; unit: string }): Promise<ExpenseProduct> {
  const { data } = await apiClient.post<ExpenseProduct>('/api/pdv/expenses/products', payload)
  return data
}

export async function adjustExpenseProductStock(
  id: number,
  quantityDelta: number,
): Promise<ExpenseProduct> {
  const { data } = await apiClient.patch<ExpenseProduct>(
    `/api/pdv/expenses/products/${id}/stock`,
    { quantityDelta },
  )
  return data
}

export async function listLowStockProducts(): Promise<ExpenseProduct[]> {
  const { data } = await apiClient.get<ExpenseProduct[]>('/api/pdv/expenses/products/low-stock')
  return data
}

// ── Expense Batches ───────────────────────────────────────────────────────────

export interface ExpenseBatchItemRequest {
  productName: string
  unit: string
  unitPrice: number
  quantity: number
}

export interface ExpenseBatchRequest {
  offlineId: string
  batchDate: string
  operatorId?: string
  note?: string
  items: ExpenseBatchItemRequest[]
}

export interface ExpenseBatchItemResponse {
  id: string
  productName: string
  unit: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface ExpenseBatchResponse {
  id: string
  offlineId: string
  batchDate: string
  note?: string
  totalAmount: number
  items: ExpenseBatchItemResponse[]
}

export interface ExpenseBatchSummaryResponse {
  totalSpent: number
}

export async function createExpenseBatch(payload: ExpenseBatchRequest): Promise<ExpenseBatchResponse> {
  const { data } = await apiClient.post<ExpenseBatchResponse>('/api/pdv/expenses/batches', payload)
  return data
}

export async function listExpenseBatches(params?: {
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<Page<ExpenseBatchResponse>> {
  const { data } = await apiClient.get<Page<ExpenseBatchResponse>>('/api/pdv/expenses/batches', { params })
  return data
}

export async function getExpenseBatch(id: string): Promise<ExpenseBatchResponse> {
  const { data } = await apiClient.get<ExpenseBatchResponse>(`/api/pdv/expenses/batches/${id}`)
  return data
}

export async function getExpenseBatchSummary(params?: {
  from?: string
  to?: string
}): Promise<ExpenseBatchSummaryResponse> {
  const { data } = await apiClient.get<ExpenseBatchSummaryResponse>(
    '/api/pdv/expenses/batches/summary',
    { params },
  )
  return data
}

// ── Recurring Expenses ────────────────────────────────────────────────────────

export type RecurringFrequency = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'

export interface RecurringExpenseRequest {
  name: string
  description?: string
  amount: number
  frequency: RecurringFrequency
  dueDay: number
  alertDaysBefore: number
  nextDueDate: string
}

export interface RecurringExpenseResponse {
  id: string
  name: string
  description?: string
  amount: number
  frequency: RecurringFrequency
  dueDay: number
  alertDaysBefore: number
  nextDueDate: string
  lastPaidDate?: string
  daysUntilDue: number
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
}

export async function listRecurring(): Promise<RecurringExpenseResponse[]> {
  const { data } = await apiClient.get<RecurringExpenseResponse[]>('/api/pdv/expenses/recurring')
  return data
}

export async function createRecurring(
  payload: RecurringExpenseRequest,
): Promise<RecurringExpenseResponse> {
  const { data } = await apiClient.post<RecurringExpenseResponse>(
    '/api/pdv/expenses/recurring',
    payload,
  )
  return data
}

export async function updateRecurring(
  id: string,
  payload: RecurringExpenseRequest,
): Promise<RecurringExpenseResponse> {
  const { data } = await apiClient.put<RecurringExpenseResponse>(
    `/api/pdv/expenses/recurring/${id}`,
    payload,
  )
  return data
}

export async function deleteRecurring(id: string): Promise<void> {
  await apiClient.delete(`/api/pdv/expenses/recurring/${id}`)
}

export async function payRecurring(id: string): Promise<RecurringExpenseResponse> {
  const { data } = await apiClient.post<RecurringExpenseResponse>(
    `/api/pdv/expenses/recurring/${id}/pay`,
  )
  return data
}

export async function listRecurringAlerts(): Promise<RecurringExpenseResponse[]> {
  const { data } = await apiClient.get<RecurringExpenseResponse[]>(
    '/api/pdv/expenses/recurring/alerts',
  )
  return data
}
