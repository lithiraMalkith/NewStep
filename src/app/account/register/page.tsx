'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function CustomerRegisterPage() {
  const router = useRouter()
  const { user, signUpWithEmail, signInWithGoogle, loading: authLoading } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/account/profile')
    }
  }, [user, authLoading, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }
    setLoading(true)
    try {
      await signUpWithEmail(email, password, displayName)
      router.push('/account/profile')
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account.'
      if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.push('/account/profile')
    } catch (err: any) {
      setError(err?.message || 'Google sign-up could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="display text-2xl tracking-tight">
            New<span className="text-muted">Step</span>
          </Link>
          <h1 className="display text-3xl mt-4 font-bold">Create Account</h1>
          <p className="mt-2 text-sm text-muted">
            Join New Step for easy checkout, live order tracking, and saved delivery addresses.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-xl border border-line bg-mist/70 px-4 py-3 text-xs font-medium text-ink">
              {error}
            </div>
          )}

          {/* Google 1-Click Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-paper py-3 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-mist disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-line" />
            <span className="absolute bg-paper px-3 text-xs text-muted">or create with email</span>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Full name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Lithira Gunasekara"
                autoComplete="name"
                className="w-full rounded-xl border border-line bg-mist/30 px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="w-full rounded-xl border border-line bg-mist/30 px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-line bg-mist/30 px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-solid w-full mt-2 py-3 text-sm font-medium"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Footer Link to Login */}
          <div className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link href="/account/login" className="font-semibold text-ink underline underline-offset-4 hover:opacity-80">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
