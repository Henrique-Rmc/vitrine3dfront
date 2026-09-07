import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StoreEditPanel, { type StoreDraft } from '../components/StoreEditPanel'
import { useStoreInfo } from '../hooks/useStoreInfo'
import { updateUserProfile, uploadCoverImage, deleteCoverImage } from '../services/authService'
import { findTheme } from '../constants/storeThemes'
import QRCodeModal from '../components/QRCodeModal'
import { resolveTemplate } from '../templates'

export default function StorePage() {
  const { storeSlug = '' } = useParams<{ storeSlug: string }>()
  const { isAuthenticated, user } = useAuth()
  const {
    storeId,
    storeName,
    storeDescription,
    whatsappNumber,
    logoUrl,
    coverImageUrl,
    coverColor,
    storeNameFont,
    storeTheme,
    storeTemplateType,
    cityName,
    products,
    featuredProducts,
    loading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    applyTheme,
  } = useStoreInfo(storeSlug)

  const isOwner = isAuthenticated && !!user?.slug && user.slug === storeSlug

  // ── Live edit draft (owner only) ─────────────────────────────────────────
  const [draft, setDraft]   = useState<StoreDraft>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const isDirty = Object.keys(draft).length > 0

  function patchDraft(patch: Partial<StoreDraft>) {
    setDraft((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined) {
          delete (next as Record<string, unknown>)[k]
        } else {
          (next as Record<string, unknown>)[k] = v
        }
      }
      return next
    })
  }

  function discardDraft() { setDraft({}) }

  const handleSave = useCallback(async () => {
    if (!user || !storeId) return
    setIsSaving(true)
    try {
      const themePatch: Parameters<typeof applyTheme>[0] = {}

      if (draft.coverFile) {
        const res = await uploadCoverImage(user.id, draft.coverFile)
        if (res.coverImageUrl !== undefined) themePatch.coverImageUrl = res.coverImageUrl
      }

      if (draft.storeNameFont !== undefined || 'coverColor' in draft || 'storeTheme' in draft) {
        await updateUserProfile(user.id, {
          userName: user.userName,
          storeName: user.storeName,
          whatsappNumber: user.whatsappNumber,
          storeDescription: user.storeDescription,
          storeNameFont: draft.storeNameFont !== undefined ? draft.storeNameFont : (storeNameFont ?? null),
          coverColor: 'coverColor' in draft ? draft.coverColor : (coverColor ?? null),
          storeTheme: 'storeTheme' in draft ? draft.storeTheme : (storeTheme ?? null),
        })
        if (draft.storeNameFont !== undefined) themePatch.storeNameFont = draft.storeNameFont
        if ('storeTheme' in draft) themePatch.storeTheme = draft.storeTheme
        if ('coverColor' in draft) {
          themePatch.coverColor = draft.coverColor
          if (coverImageUrl && !draft.coverFile) {
            await deleteCoverImage(user.id)
            themePatch.coverImageUrl = null
          }
        }
      }

      applyTheme(themePatch)
      setDraft({})
    } finally {
      setIsSaving(false)
    }
  }, [draft, user, storeId, applyTheme, coverImageUrl, coverColor, storeTheme, storeNameFont])

  // Resolved values: draft takes priority over server values
  const resolvedFont       = draft.storeNameFont !== undefined ? draft.storeNameFont : storeNameFont
  const resolvedCoverUrl   = draft.coverPreviewUrl !== undefined ? draft.coverPreviewUrl : coverImageUrl
  const resolvedCoverColor = 'coverColor' in draft ? draft.coverColor : coverColor
  const resolvedTheme      = 'storeTheme' in draft ? draft.storeTheme : storeTheme

  // Apply store theme to document root (page bg + mobile header follow the theme)
  useEffect(() => {
    const root = document.documentElement
    if (!resolvedTheme || resolvedTheme === 'padrao') {
      for (const k of Object.keys(findTheme('padrao').vars)) root.style.removeProperty(k)
      return
    }
    const theme = findTheme(resolvedTheme)
    for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v)
    return () => { for (const k of Object.keys(theme.vars)) root.style.removeProperty(k) }
  }, [resolvedTheme])

  const StoreTemplate = resolveTemplate(storeTemplateType)

  if (!loading && error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <p className="text-ink-2 text-sm mb-2">{error}</p>
        <p className="text-ink-4 text-xs">/{storeSlug}</p>
      </div>
    )
  }

  return (
    <>
      <StoreTemplate
        storeId={storeId}
        storeName={storeName}
        storeDescription={storeDescription}
        whatsappNumber={whatsappNumber}
        logoUrl={logoUrl}
        coverImageUrl={resolvedCoverUrl}
        coverColor={resolvedCoverColor}
        storeNameFont={resolvedFont}
        storeTheme={resolvedTheme}
        products={products}
        featuredProducts={featuredProducts}
        loading={loading}
        error={error}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadMore={loadMore}
        cityName={cityName}
        isOwner={isOwner}
        isAuthenticated={isAuthenticated}
      />

      {/* Edit panel + QR modal — outside template so tokens stay neutral (data-neutral-ui) */}
      {isOwner && (
        <StoreEditPanel
          storeName={storeName}
          draft={draft}
          currentFont={storeNameFont}
          currentCoverUrl={coverImageUrl}
          currentCoverColor={coverColor}
          currentTheme={storeTheme}
          onDraftChange={patchDraft}
          onSave={handleSave}
          onDiscard={discardDraft}
          isDirty={isDirty}
          isSaving={isSaving}
          onQRCode={() => setShowQR(true)}
        />
      )}
      {showQR && user?.slug && (
        <QRCodeModal
          storeSlug={user.slug}
          storeName={user.storeName}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  )
}
