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

  if (loading || !settings) return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" /></div>

  return (
    <div ref={containerRef} className="max-w-3xl space-y-6">
      <div className="page-header flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-[#F0EDE8]">Settings</h1><p className="text-[#6B6B6B] text-sm mt-1">Store configuration</p></div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#0D0D0D] rounded-lg text-sm font-medium hover:bg-[#E2C270] disabled:opacity-50"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      {/* Store Info */}
      <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider">Store Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">Store Name</label><input value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">Owner Email</label><input type="email" value={settings.ownerEmail} onChange={(e) => update('ownerEmail', e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">Phone</label><input value={settings.ownerPhone} onChange={(e) => update('ownerPhone', e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
        </div>
        <div><label className="text-xs text-[#6B6B6B] mb-1 block">Description</label><textarea rows={2} value={settings.siteDescription || ''} onChange={(e) => update('siteDescription', e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
      </div>

      {/* Payment */}
      <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment</h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A]">
          <div><p className="text-sm text-[#F0EDE8] font-medium">Cash on Delivery</p><p className="text-xs text-[#6B6B6B]">Collect payment at delivery</p></div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#4CAF7D]/10 text-[#4CAF7D]">Active</span>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A] opacity-60">
          <div><p className="text-sm text-[#F0EDE8] font-medium">Card Payments</p><p className="text-xs text-[#6B6B6B]">Visa / Mastercard integration</p></div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#6B6B6B]/10 text-[#6B6B6B]">Coming Soon</span>
        </div>
      </div>

      {/* Social Links */}
      <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider">Social Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">TikTok</label><input value={settings.socialLinks?.tiktok || ''} onChange={(e) => update('socialLinks', { ...settings.socialLinks, tiktok: e.target.value })} placeholder="https://tiktok.com/@..." className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C]" /></div>
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">Instagram</label><input value={settings.socialLinks?.instagram || ''} onChange={(e) => update('socialLinks', { ...settings.socialLinks, instagram: e.target.value })} placeholder="https://instagram.com/..." className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C]" /></div>
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">Facebook</label><input value={settings.socialLinks?.facebook || ''} onChange={(e) => update('socialLinks', { ...settings.socialLinks, facebook: e.target.value })} placeholder="https://facebook.com/..." className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C]" /></div>
        </div>
      </div>

      {/* Tracking Pixels */}
      <div className="form-section bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider">Tracking Pixels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">Meta Pixel ID</label><input value={settings.metaPixelId || ''} onChange={(e) => update('metaPixelId', e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
          <div><label className="text-xs text-[#6B6B6B] mb-1 block">TikTok Pixel ID</label><input value={settings.tiktokPixelId || ''} onChange={(e) => update('tiktokPixelId', e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A84C]" /></div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">{toasts.map((t) => (<div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium pointer-events-auto', t.type === 'success' ? 'bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/30' : 'bg-[#E05252]/10 text-[#E05252] border border-[#E05252]/30')}>{t.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{t.message}</div>))}</div>
    </div>
  )
}
