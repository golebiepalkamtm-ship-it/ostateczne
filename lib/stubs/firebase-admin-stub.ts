// Stub module used to prevent bundling server-only `firebase-admin` into client bundles.
// Any runtime call from client to these functions will throw to prevent accidental usage.
export function initializeApp() {
  throw new Error('firebase-admin is server-only and must not be used in client bundles')
}
export function cert() {
  throw new Error('firebase-admin cert is server-only')
}
export function getAuth() {
  throw new Error('firebase-admin auth is server-only')
}
export function getStorage() {
  throw new Error('firebase-admin storage is server-only')
}
export default {
  initializeApp,
  cert,
  getAuth,
  getStorage,
}
