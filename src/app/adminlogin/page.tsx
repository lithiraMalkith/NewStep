'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, signInWithEmail, signInWithGoogle, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useGSAP(() => {
    const tl = gsap.timeline()
    tl.from('.login-logo', { opacity: 0, y: -20, duration: 0.5, ease: 'power3.out' })
    tl.from('.login-card', { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out' }, '-=0.2')
    tl.from('.login-field', { opacity: 0, y: 15, stagger: 0.1, duration: 0.4, ease: 'power2.out' }, '-=0.3')
  }, { scope: containerRef })

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/admin')
    }
  }, [user, authLoading, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C9A84C]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="login-logo text-center mb-8">
          <h1 className="text-3xl font-bold text-[#F0EDE8] tracking-tight">
            New<span className="text-[#6B6B6B]">Step</span>
          </h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="login-card bg-[#161616] rounded-xl border border-[#2A2A2A] p-8">
          <h2 className="text-xl font-semibold text-[#F0EDE8] mb-1">Welcome back</h2>
          <p className="text-[#6B6B6B] text-sm mb-6">Sign in to your admin account</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-[#E05252]/10 border border-[#E05252]/30 text-[#E05252] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="login-field">
              <label className="block text-[#F0EDE8] text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@newstepfootwear.lk"
                  required
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-3 text-[#F0EDE8] text-sm placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C] transition-colors"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="block text-[#F0EDE8] text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg pl-10 pr-12 py-3 text-[#F0EDE8] text-sm placeholder:text-[#6B6B6B]/50 outline-none focus:border-[#C9A84C] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#F0EDE8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-field w-full bg-[#C9A84C] text-[#0D0D0D] font-semibold rounded-lg py-3 text-sm hover:bg-[#E2C270] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-field relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2A2A]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#161616] px-3 text-xs text-[#6B6B6B]">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="login-field w-full bg-[#0D0D0D] border border-[#2A2A2A] text-[#F0EDE8] rounded-lg py-3 text-sm font-medium hover:bg-[#1A1A1A] hover:border-[#3A3A3A] disabled:opacity-50 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="login-field text-center text-xs text-[#6B6B6B] mt-6">
            Demo: admin@newstep.lk / NewStep@2026
          </p>
        </div>
      </div>
    </div>
  )
}
