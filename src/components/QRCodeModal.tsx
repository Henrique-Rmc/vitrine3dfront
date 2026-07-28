import { useRef, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

interface QRCodeModalProps {
  storeSlug: string
  storeName?: string
  onClose: () => void
}

export default function QRCodeModal({ storeSlug, storeName, onClose }: QRCodeModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const storeUrl = `${window.location.origin}/${storeSlug}`

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function downloadQR() {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `qrcode-${storeSlug}.png`
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-cta/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-canvas rounded-2xl shadow-2xl border border-border p-6 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-ink">QR Code da Sua loja</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-3 hover:text-ink rounded-lg hover:bg-surface-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {storeName && (
          <p className="text-xs text-ink-3 mb-4">{storeName}</p>
        )}

        {/* QR Code */}
        <div
          ref={containerRef}
          className="flex justify-center my-5 p-4 bg-canvas border border-border rounded-xl"
        >
          <QRCodeCanvas
            value={storeUrl}
            size={192}
            bgColor="#ffffff"
            fgColor="#1c1813"
            level="H"
          />
        </div>

        {/* URL */}
        <p className="text-[11px] text-center text-ink-3 mb-5 font-mono break-all leading-relaxed">
          {storeUrl}
        </p>

        {/* Download */}
        <button
          onClick={downloadQR}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-cta hover:bg-cta-2 text-cta-fg text-sm font-semibold py-2.5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Baixar QR Code (PNG)
        </button>
      </div>
    </div>
  )
}
