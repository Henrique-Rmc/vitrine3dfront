import apiClient from './apiClient'

// ── Shared types ──────────────────────────────────────────────────────────────

export type PaymentMethod = 'CASH' | 'PIX' | 'CARD' | 'CREDIT'
export type SaleStatus = 'COMPLETED' | 'CANCELLED'
export type EmployeeRole = 'OWNER' | 'MANAGER' | 'CASHIER'
export type CreditStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'OVERDUE'
export type FlowType = 'IN' | 'OUT'
export type FlowCategory = 'SALE' | 'CREDIT_PAYMENT' | 'OPENING' | 'EXPENSE' | 'WITHDRAWAL' | 'OTHER'

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export interface PdvSaleItemRequest {
  productId?: number | null
  productName: string
  unitPrice: number
  quantity: number
}

export interface PdvSaleRequest {
  offlineId: string
  customerId?: string | null
  operatorId?: string | null
  paymentMethod: PaymentMethod
  amountPaid: number
  saleDate: string
  note?: string | null
  items: PdvSaleItemRequest[]
}

export interface PdvSaleItemResponse {
  id: number
  productId: number | null
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface PdvSaleResponse {
  id: string
  offlineId: string
  customerId: string | null
  customerName: string | null
  operatorId: string | null
  operatorName: string | null
  paymentMethod: PaymentMethod
  totalAmount: number
  amountPaid: number
  changeAmount: number
  status: SaleStatus
  note: string | null
  saleDate: string
  syncedAt: string
  items: PdvSaleItemResponse[]
}

export async function listSales(params?: {
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<Page<PdvSaleResponse>> {
  const { data } = await apiClient.get<Page<PdvSaleResponse>>('/api/pdv/sales', { params })
  return data
}

export async function getSale(id: string): Promise<PdvSaleResponse> {
  const { data } = await apiClient.get<PdvSaleResponse>(`/api/pdv/sales/${id}`)
  return data
}

export async function createSale(payload: PdvSaleRequest): Promise<PdvSaleResponse> {
  const { data } = await apiClient.post<PdvSaleResponse>('/api/pdv/sales', payload)
  return data
}

export async function cancelSale(id: string): Promise<PdvSaleResponse> {
  const { data } = await apiClient.patch<PdvSaleResponse>(`/api/pdv/sales/${id}/cancel`)
  return data
}

// ── Employees ─────────────────────────────────────────────────────────────────

export interface PdvEmployeeRequest {
  name: string
  pin?: string | null
  role?: EmployeeRole
}

export interface PdvEmployeeResponse {
  id: string
  name: string
  role: EmployeeRole
  isActive: boolean
  createdAt: string
}

export async function listEmployees(): Promise<PdvEmployeeResponse[]> {
  const { data } = await apiClient.get<PdvEmployeeResponse[]>('/api/pdv/employees')
  return data
}

export async function createEmployee(payload: PdvEmployeeRequest): Promise<PdvEmployeeResponse> {
  const { data } = await apiClient.post<PdvEmployeeResponse>('/api/pdv/employees', payload)
  return data
}

export async function updateEmployee(id: string, payload: PdvEmployeeRequest): Promise<PdvEmployeeResponse> {
  const { data } = await apiClient.put<PdvEmployeeResponse>(`/api/pdv/employees/${id}`, payload)
  return data
}

export async function deactivateEmployee(id: string): Promise<void> {
  await apiClient.delete(`/api/pdv/employees/${id}`)
}

export interface PdvPinAuthRequest {
  pin: string
}

export async function verifyPin(payload: PdvPinAuthRequest): Promise<PdvEmployeeResponse> {
  const { data } = await apiClient.post<PdvEmployeeResponse>('/api/pdv/employees/pin', payload)
  return data
}

// ── Customers ─────────────────────────────────────────────────────────────────

export interface PdvCustomerRequest {
  name: string
  phone?: string | null
  cpf?: string | null
  address?: string | null
}

export interface PdvCustomerResponse {
  id: string
  name: string
  phone: string | null
  cpf: string | null
  address: string | null
  createdAt: string
  openCreditsCount: number
  totalBalance: number
}

export async function listCustomers(): Promise<PdvCustomerResponse[]> {
  const { data } = await apiClient.get<PdvCustomerResponse[]>('/api/pdv/customers')
  return data
}

export async function createCustomer(payload: PdvCustomerRequest): Promise<PdvCustomerResponse> {
  const { data } = await apiClient.post<PdvCustomerResponse>('/api/pdv/customers', payload)
  return data
}

export async function updateCustomer(id: string, payload: PdvCustomerRequest): Promise<PdvCustomerResponse> {
  const { data } = await apiClient.put<PdvCustomerResponse>(`/api/pdv/customers/${id}`, payload)
  return data
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/api/pdv/customers/${id}`)
}

// ── Credits (Fiado) ───────────────────────────────────────────────────────────

export interface PdvCustomerCreditRequest {
  originSaleId?: string | null
  totalDue: number
  dueDate?: string | null
  note?: string | null
}

export interface PdvCreditPaymentRequest {
  amount: number
  paymentMethod: PaymentMethod
  paidAt?: string | null
}

export interface PdvCreditPaymentResponse {
  id: number
  amount: number
  paymentMethod: PaymentMethod
  paidAt: string
  createdAt: string
}

export interface PdvCustomerCreditResponse {
  id: string
  originSaleId: string | null
  totalDue: number
  amountPaid: number
  balance: number
  dueDate: string | null
  status: CreditStatus
  note: string | null
  createdAt: string
  payments: PdvCreditPaymentResponse[]
}

export async function listCredits(customerId: string): Promise<PdvCustomerCreditResponse[]> {
  const { data } = await apiClient.get<PdvCustomerCreditResponse[]>(`/api/pdv/customers/${customerId}/credits`)
  return data
}

export async function addCredit(customerId: string, payload: PdvCustomerCreditRequest): Promise<PdvCustomerCreditResponse> {
  const { data } = await apiClient.post<PdvCustomerCreditResponse>(`/api/pdv/customers/${customerId}/credits`, payload)
  return data
}

export async function addPayment(
  customerId: string,
  creditId: string,
  payload: PdvCreditPaymentRequest,
): Promise<PdvCreditPaymentResponse> {
  const { data } = await apiClient.post<PdvCreditPaymentResponse>(
    `/api/pdv/customers/${customerId}/credits/${creditId}/payments`,
    payload,
  )
  return data
}

// ── Cash Flow ─────────────────────────────────────────────────────────────────

export interface PdvCashFlowRequest {
  offlineId: string
  type: FlowType
  category: FlowCategory
  amount: number
  description?: string | null
  operatorId?: string | null
  flowDate: string
}

export interface PdvCashFlowResponse {
  id: string
  offlineId: string
  operatorId: string | null
  operatorName: string | null
  type: FlowType
  category: FlowCategory
  amount: number
  description: string | null
  flowDate: string
  syncedAt: string
}

export interface PdvCashFlowSummaryResponse {
  totalIn: number
  totalOut: number
  balance: number
  countIn: number
  countOut: number
}

export async function listCashFlow(params?: {
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<Page<PdvCashFlowResponse>> {
  const { data } = await apiClient.get<Page<PdvCashFlowResponse>>('/api/pdv/cash-flow', { params })
  return data
}

export async function getCashFlowSummary(params?: { from?: string; to?: string }): Promise<PdvCashFlowSummaryResponse> {
  const { data } = await apiClient.get<PdvCashFlowSummaryResponse>('/api/pdv/cash-flow/summary', { params })
  return data
}

export async function addCashFlow(payload: PdvCashFlowRequest): Promise<PdvCashFlowResponse> {
  const { data } = await apiClient.post<PdvCashFlowResponse>('/api/pdv/cash-flow', payload)
  return data
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export interface PdvStockPatchRequest {
  quantityDelta: number
  trackStock?: boolean
}

export interface PdvStockResponse {
  productId: number
  productName: string
  trackStock: boolean
  stockQuantity: number
}

export async function adjustStock(productId: number, payload: PdvStockPatchRequest): Promise<PdvStockResponse> {
  const { data } = await apiClient.patch<PdvStockResponse>(`/api/pdv/products/${productId}/stock`, payload)
  return data
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export interface PdvSyncRequest {
  sales?: PdvSaleRequest[]
  cashFlows?: PdvCashFlowRequest[]
}

export interface PdvSyncResponse {
  salesProcessed: number
  salesSkipped: number
  cashFlowsProcessed: number
  cashFlowsSkipped: number
  errors: string[]
}

export async function syncPdv(payload: PdvSyncRequest): Promise<PdvSyncResponse> {
  const { data } = await apiClient.post<PdvSyncResponse>('/api/pdv/sync', payload)
  return data
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateOfflineId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function fmtMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  CARD: 'Cartão',
  CREDIT: 'Fiado',
}

export const FLOW_CATEGORY_LABELS: Record<FlowCategory, string> = {
  SALE: 'Venda',
  CREDIT_PAYMENT: 'Pgto. Fiado',
  OPENING: 'Abertura',
  EXPENSE: 'Despesa',
  WITHDRAWAL: 'Retirada',
  OTHER: 'Outro',
}

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  OWNER: 'Proprietário',
  MANAGER: 'Gerente',
  CASHIER: 'Caixa',
}

export const CREDIT_STATUS_LABELS: Record<CreditStatus, string> = {
  OPEN: 'Em aberto',
  PARTIAL: 'Parcial',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
}
