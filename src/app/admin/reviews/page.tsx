'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap-config'
import { fetchReviews, moderateReview, deleteReview } from '@/lib/admin-client'
import { cn } from '@/lib/utils'
import {
  Star,
  Search,
  Check,
  X,
  Trash2,
  Loader2,
  MessageSquare,
  ShieldCheck,
  ShieldX,
  Clock,
} from 'lucide-react'
import type { Review } from '@/types'
import toast from 'react-hot-toast'

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

export default function AdminReviewsPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user) return
    const load = async () => {
      try {
        const token = await user.getIdToken()
        const data = await fetchReviews(token, { admin: 'true' })
        setReviews(data)
      } catch (err) {
        console.error('Failed to load reviews:', err)
        toast.error('Failed to load reviews')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, authLoading])

  useGSAP(() => {
    if (loading) return
    gsap.from('.page-header', { opacity: 0, y: -10, duration: 0.4, ease: 'power2.out', clearProps: 'all' })
    const rows = document.querySelectorAll('.item-row')
    if (rows.length > 0) {
      gsap.from('.item-row', { opacity: 0, y: 15, stagger: 0.04, duration: 0.4, ease: 'power2.out', delay: 0.15, clearProps: 'all' })
    }
  }, { scope: containerRef, dependencies: [loading, filter] })

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await moderateReview(token, id, status)
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      toast.success(`Review ${status} successfully`)
    } catch (err) {
      console.error('Moderation failed:', err)
      toast.error('Failed to update review')
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteId) return
    try {
      const token = await user.getIdToken()
      await deleteReview(token, deleteId)
      setReviews((prev) => prev.filter((r) => r.id !== deleteId))
      toast.success('Review deleted')
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Failed to delete review')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = reviews.filter((r) => {
    const statusMatch = filter === 'all' || r.status === filter
    const q = search.toLowerCase()
    const searchMatch =
      !q ||
      r.customerName?.toLowerCase().includes(q) ||
      r.customerEmail?.toLowerCase().includes(q) ||
      r.productName?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    return statusMatch && searchMatch
  })

  const pendingCount = reviews.filter((r) => r.status === 'pending').length

  const FILTERS: { label: string; value: FilterStatus; count?: number }[] = [
    { label: 'All', value: 'all', count: reviews.length },
    { label: 'Pending', value: 'pending', count: pendingCount },
    { label: 'Approved', value: 'approved', count: reviews.filter((r) => r.status === 'approved').length },
    { label: 'Rejected', value: 'rejected', count: reviews.filter((r) => r.status === 'rejected').length },
  ]

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <ShieldCheck className="w-3.5 h-3.5" />
      case 'rejected': return <ShieldX className="w-3.5 h-3.5" />
      default: return <Clock className="w-3.5 h-3.5" />
    }
  }

  const statusClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#4CAF7D]/10 text-[#4CAF7D] border-[#4CAF7D]/30'
      case 'rejected': return 'bg-[#E05252]/10 text-[#E05252] border-[#E05252]/30'
      default: return 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-10">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#F0EDE8]">Reviews</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">
            Manage customer product reviews · {reviews.length} total
            {pendingCount > 0 && (
              <span className="ml-2 text-[#C9A84C]">({pendingCount} pending approval)</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                filter === f.value
                  ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]'
                  : 'bg-[#161616] border-[#2A2A2A] text-[#6B6B6B] hover:text-[#F0EDE8] hover:border-[#3A3A3A]'
              )}
            >
              {f.label}
              {f.count !== undefined && (
                <span className="ml-1.5 opacity-60">{f.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="w-full rounded-lg bg-[#161616] border border-[#2A2A2A] pl-10 pr-4 py-2 text-sm text-[#F0EDE8] placeholder:text-[#6B6B6B] outline-none focus:border-[#C9A84C]/50"
          />
        </div>
      </div>

      {/* Reviews Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] p-12 text-center">
          <MessageSquare className="w-10 h-10 text-[#6B6B6B] mx-auto" />
          <p className="mt-3 text-sm text-[#6B6B6B]">No reviews found</p>
        </div>
      ) : (
        <div className="bg-[#161616] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A2A] text-[#6B6B6B]">
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Rating</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Review</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((review) => (
                  <tr
                    key={review.id}
                    className="item-row border-b border-[#2A2A2A] last:border-0 hover:bg-[#1E1E1E] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[#F0EDE8] font-medium truncate max-w-[140px]">
                        {review.customerName || 'Unknown'}
                      </p>
                      <p className="text-[#6B6B6B] text-xs truncate max-w-[140px]">
                        {review.customerEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#F0EDE8] truncate max-w-[160px]">
                        {review.productName || review.productId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3.5 h-3.5',
                              i < review.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#2A2A2A]'
                            )}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-[#F0EDE8] text-xs leading-relaxed line-clamp-2 max-w-[300px]">
                        {review.title && <strong>{review.title}: </strong>}
                        {review.comment}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        statusClass(review.status as string)
                      )}>
                        {statusIcon(review.status as string)}
                        {(review.status as string).charAt(0).toUpperCase() + (review.status as string).slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#6B6B6B] text-xs">
                      {new Date(review.createdAt as unknown as string).toLocaleDateString('en-LK', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {review.status !== 'approved' && (
                          <button
                            onClick={() => handleModerate(review.id, 'approved')}
                            title="Approve"
                            className="p-1.5 rounded-lg text-[#4CAF7D] hover:bg-[#4CAF7D]/10 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            onClick={() => handleModerate(review.id, 'rejected')}
                            title="Reject"
                            className="p-1.5 rounded-lg text-[#E05252] hover:bg-[#E05252]/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(review.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#E05252] hover:bg-[#E05252]/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/60" />
          <div className="relative bg-[#161616] rounded-xl border border-[#2A2A2A] p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-[#F0EDE8]">Delete Review</h3>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm text-[#F0EDE8] bg-[#1E1E1E] border border-[#2A2A2A] hover:bg-[#2A2A2A] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm text-white bg-[#E05252] hover:bg-[#C84040] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
