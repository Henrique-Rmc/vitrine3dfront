// JWT kept in module-level memory — never written to localStorage or sessionStorage.
// Cleared automatically on page reload, which is intentional: a stolen token
// cannot be replayed across browser sessions.
let _token: string | null = null

export const tokenStore = {
  get: (): string | null => _token,
  set: (token: string | null): void => { _token = token },
}
