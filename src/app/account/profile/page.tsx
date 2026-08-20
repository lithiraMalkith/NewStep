'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import AccountNav from '@/components/AccountNav'
import { useAuth } from '@/contexts/auth-context'

export default function CustomerProfilePage() {
  const { user, updateUser, loading: authLoading } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setPhotoURL(user.photoURL || '')
      // Check stored phone
      const storedPhone = localStorage.getItem(`newstep.phone.${user.uid}`) || user.phoneNumber || ''
      setPhone(storedPhone)
    }
  }, [user])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller photo.')
      return
    }

    setUploading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result as string
        setPhotoURL(base64)

        try {
          const token = user ? await user.getIdToken() : null
          if (token) {
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                image: base64,
                folder: 'newstep-profiles',
              }),
            })
            const data = await res.json()
            if (data.success && data.data?.url) {
              setPhotoURL(data.data.url)
              await updateUser({ photoURL: data.data.url })
              setSuccessMsg('Profile picture updated successfully!')
              return
            }
          }
        } catch {
          // Fall back to client local storage preview
        }

        // Safe local update without crashing Firebase Auth
        await updateUser({ photoURL: base64 })
        setSuccessMsg('Profile picture updated!')
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      setErrorMsg('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      await updateUser({
        displayName: displayName.trim(),
        photoURL: photoURL || undefined,
      })

      if (phone.trim()) {
        localStorage.setItem(`newstep.phone.${user.uid}`, phone.trim())
      }

      setSuccessMsg('Profile details saved successfully!')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[80vh] bg-paper">
      <AccountNav activeTab="profile" />

      <div className="container-x py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="border-b border-line pb-6 mb-8">
            <h1 className="display text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-sm text-muted mt-1">
              Manage your personal information, profile photo, and contact details.
            </p>
          </div>

          {!user && !authLoading ? (
            <div className="rounded-2xl border border-line bg-paper p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mist text-muted mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
              </div>
              <h2 className="display text-xl font-semibold">Sign in to edit your profile</h2>
              <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                Create an account or sign in to save your personal details and manage orders.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/account/login" className="btn btn-solid text-xs">
                  Sign in
                </Link>
                <Link href="/account/register" className="btn btn-outline text-xs">
                  Register
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-paper p-6 sm:p-8 shadow-sm">
              {errorMsg && (
                <div className="mb-6 rounded-xl border border-line bg-mist/70 px-4 py-3 text-xs font-medium text-ink">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-6 rounded-xl border border-ink bg-ink px-4 py-3 text-xs font-medium text-paper">
                  {successMsg}
                </div>
              )}

              {/* Profile Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-line pb-8 mb-8">
                <div className="relative group">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-line bg-mist shadow-sm">
                    {photoURL ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photoURL}
                        alt="Profile photo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted">
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M20 21a8 8 0 0 0-16 0" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-base font-semibold text-ink">Profile Photo</h2>
                  <p className="text-xs text-muted mt-1 max-w-sm">
                    Upload a square PNG, JPG, or WebP photo up to 5MB.
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-outline py-1.5 px-3 text-xs font-medium"
                    >
                      {uploading ? 'Uploading…' : 'Change photo'}
                    </button>
                    {photoURL && (
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={async () => {
                          setPhotoURL('')
                          await updateUser({ photoURL: '' })
                          setSuccessMsg('Profile photo removed.')
                        }}
                        className="rounded-full px-3 py-1.5 text-xs text-muted hover:text-ink transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details Edit Form */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-line bg-mist/30 px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full rounded-xl border border-line bg-mist/60 px-4 py-3 text-sm text-muted cursor-not-allowed outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full border border-line bg-mist px-2.5 py-0.5 text-[10px] font-semibold text-ink">
                      Verified
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    Email address is tied to your account login.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07X XXX XXXX (e.g. 0771234567)"
                    className="w-full rounded-xl border border-line bg-mist/30 px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-muted">
                    Used for delivery driver communication and Cash on Delivery confirmation.
                  </p>
                </div>

                <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-solid py-2.5 px-6 text-xs font-semibold"
                  >
                    {saving ? 'Saving changes…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
