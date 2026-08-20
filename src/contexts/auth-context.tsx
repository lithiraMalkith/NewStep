'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { BUILT_IN_ROLE_PERMISSIONS, type Permission } from '@/lib/permissions'

interface AuthContextValue {
  user: User | null
  role: string
  permissions: Permission[]
  loading: boolean
  hasPermission: (p: string) => boolean
  isAdmin: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updateUser: (data: { displayName?: string; photoURL?: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string>('')
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const localAvatar = typeof window !== 'undefined'
          ? localStorage.getItem(`newstep.avatar.${firebaseUser.uid}`)
          : null
        setUser(localAvatar ? ({ ...firebaseUser, photoURL: localAvatar } as User) : firebaseUser)
        const tokenResult = await firebaseUser.getIdTokenResult()
        const userRole = (tokenResult.claims.role as string) || 'support'
        setRole(userRole)

        // Resolve permissions
        const rolePerms = BUILT_IN_ROLE_PERMISSIONS[userRole]
        if (rolePerms) {
          setPermissions(rolePerms)
        } else {
          // Custom role — permissions will be fetched from claims or API
          setPermissions([])
        }
      } else {
        setUser(null)
        setRole('')
        setPermissions([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const hasPermission = useCallback(
    (p: string) => {
      if (role === 'superadmin') return true
      return permissions.includes(p as Permission)
    },
    [role, permissions]
  )

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const token = await credential.user.getIdToken()
    // Sync custom claims (best effort)
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      await credential.user.getIdToken(true)
    } catch {
      /* ignore if sync is not needed for customers */
    }
  }, [])

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName) {
        await updateProfile(credential.user, { displayName })
      }
      const token = await credential.user.getIdToken()
      try {
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
        await credential.user.getIdToken(true)
      } catch {
        /* ignore */
      }
    },
    []
  )

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, googleProvider)
    const token = await credential.user.getIdToken()
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      await credential.user.getIdToken(true)
    } catch {
      /* ignore */
    }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  const updateUser = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      if (!auth.currentUser) throw new Error('Not authenticated')
      
      const profileUpdates: { displayName?: string; photoURL?: string } = {}
      if (data.displayName !== undefined) {
        profileUpdates.displayName = data.displayName
      }

      if (data.photoURL !== undefined) {
        // Firebase Auth only accepts short URLs (< 2048 chars).
        // Long Data URLs (base64) are stored in localStorage to prevent auth/invalid-profile-attribute
        if (data.photoURL.startsWith('data:') || data.photoURL.length > 2000) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`newstep.avatar.${auth.currentUser.uid}`, data.photoURL)
          }
        } else {
          profileUpdates.photoURL = data.photoURL
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`newstep.avatar.${auth.currentUser.uid}`)
          }
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(auth.currentUser, profileUpdates)
      }

      // Create a shallow copy with the updated photoURL (or local avatar fallback)
      const localAvatar = typeof window !== 'undefined'
        ? localStorage.getItem(`newstep.avatar.${auth.currentUser.uid}`)
        : null

      const updatedUser = {
        ...auth.currentUser,
        photoURL: localAvatar || auth.currentUser.photoURL,
      } as User

      setUser(updatedUser)
    },
    []
  )

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      permissions,
      loading,
      hasPermission,
      isAdmin: !!role && role !== '',
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      sendPasswordReset,
      updateUser,
      signOut,
    }),
    [
      user,
      role,
      permissions,
      loading,
      hasPermission,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      sendPasswordReset,
      updateUser,
      signOut,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
