'use client'
import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { useAuth } from '@/contexts/auth-context'
import { fetchSettings, updateSettings } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import { Loader2, AlertCircle, CheckCircle2, Save, CreditCard, Truck } from 'lucide-react'
import type { SiteSettings } from '@/types'

interface Toast { id: string; type: 'success' | 'error'; message: string }

export default function SettingsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: Toast['type'], message: string) => { const id = Math.random().toString(36).substr(2, 9); setToasts((p) => [...p, { id, type, message }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000) }

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      try { const t = await user.getIdToken(); setSettings(await fetchSettings(t)) } catch { addToast('error', 'Failed to load') }
      finally { setLoading(false) }
    })()
  }, [user, authLoading])
  useGSAP(() => {
    gsap.fromTo('.page-header', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, clearProps: 'opacity,y' })
    const s = document.querySelectorAll('.form-section')
    if (s.length) gsap.fromTo('.form-section', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, delay: 0.2, clearProps: 'opacity,y' })
  }, { scope: containerRef, dependencies: [loading] })

  const handleSave = async () => {
    if (!user || !settings) return; setSaving(true)
    try { const t = await user.getIdToken(); await updateSettings(t, settings); addToast('success', 'Settings saved') }
    catch { addToast('error', 'Failed to save') } finally { setSaving(false) }
  }

  const update = (key: keyof SiteSettings, value: unknown) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : null)
  }

  if (loading || !settings) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" /></div>

  return (
    <div ref={containerRef} className="max-w-3xl space-y-6 pb-12">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAF8F5]">Settings</h1>
          <p className="text-[#8A8478] text-sm mt-1">Store configuration and integrations</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#F7F4EE] text-[#0B0B0B] rounded-lg text-sm font-semibold hover:bg-[#FFFFFF] disabled:opacity-50 transition-all shadow-xs"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Store Info */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Store Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Store Name</label>
            <input
              value={settings.siteName}
              onChange={(e) => update('siteName', e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Owner Email</label>
            <input
              type="email"
              value={settings.ownerEmail}
              onChange={(e) => update('ownerEmail', e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Phone</label>
            <input
              value={settings.ownerPhone}
              onChange={(e) => update('ownerPhone', e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Description</label>
          <textarea
            rows={2}
            value={settings.siteDescription || ''}
            onChange={(e) => update('siteDescription', e.target.value)}
            className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
          />
        </div>
      </div>

      {/* Payment */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#F7F4EE]" /> Payment Gateways
        </h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#0B0B0B] border border-[#24221F]">
          <div>
            <p className="text-sm text-[#FAF8F5] font-semibold">Cash on Delivery</p>
            <p className="text-xs text-[#8A8478]">Collect payment upon parcel arrival</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1A1A1A] border border-[#24221F] text-[#FAF8F5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F7F4EE]" /> Active
          </span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#0B0B0B] border border-[#24221F]/60 opacity-60">
          <div>
            <p className="text-sm text-[#FAF8F5] font-semibold">Card Payments</p>
            <p className="text-xs text-[#8A8478]">Visa / Mastercard integration</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#181818] border border-[#24221F] text-[#8A8478]">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Social Links */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Social Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">TikTok</label>
            <input
              value={settings.socialLinks?.tiktok || ''}
              onChange={(e) => update('socialLinks', { ...settings.socialLinks, tiktok: e.target.value })}
              placeholder="https://tiktok.com/@..."
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/40 outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Instagram</label>
            <input
              value={settings.socialLinks?.instagram || ''}
              onChange={(e) => update('socialLinks', { ...settings.socialLinks, instagram: e.target.value })}
              placeholder="https://instagram.com/..."
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/40 outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Facebook</label>
            <input
              value={settings.socialLinks?.facebook || ''}
              onChange={(e) => update('socialLinks', { ...settings.socialLinks, facebook: e.target.value })}
              placeholder="https://facebook.com/..."
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] placeholder:text-[#8A8478]/40 outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Tracking Pixels */}
      <div className="form-section bg-[#121212] rounded-xl border border-[#24221F] p-6 space-y-4">
        <h2 className="text-xs font-semibold text-[#8A8478] uppercase tracking-wider">Tracking Pixels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">Meta Pixel ID</label>
            <input
              value={settings.metaPixelId || ''}
              onChange={(e) => update('metaPixelId', e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-[#8A8478] mb-1.5 block font-medium">TikTok Pixel ID</label>
            <input
              value={settings.tiktokPixelId || ''}
              onChange={(e) => update('tiktokPixelId', e.target.value)}
              className="w-full bg-[#0B0B0B] border border-[#24221F] rounded-lg px-3 py-2.5 text-sm text-[#FAF8F5] outline-none focus:border-[#F7F4EE] transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto border shadow-lg',
              t.type === 'success' ? 'bg-[#121212] text-[#FAF8F5] border-[#24221F]' : 'bg-[#E05252]/10 text-[#E05252] border-[#E05252]/30'
            )}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#FAF8F5]" /> : <AlertCircle className="w-4 h-4" />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}

