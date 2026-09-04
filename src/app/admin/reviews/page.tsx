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
  Eye,
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
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

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
  }, { scope: containerRef, dependencies: [loading, filter, starFilter] })

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await moderateReview(token, id, status)
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      if (selectedReview?.id === id) {
        setSelectedReview((prev) => prev ? { ...prev, status } : null)
      }
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
      if (selectedReview?.id === deleteId) {
        setSelectedReview(null)
      }
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
    const starMatch = starFilter === null || r.rating === starFilter
    const q = search.toLowerCase()
    const searchMatch =
      !q ||
      r.customerName?.toLowerCase().includes(q) ||
      r.customerEmail?.toLowerCase().includes(q) ||
      r.productName?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    return statusMatch && starMatch && searchMatch
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
      case 'approved': return 'bg-white/10 text-white border-white/20'
      case 'rejected': return 'bg-[#E05252]/10 text-[#E05252] border-[#E05252]/30'
      default: return 'bg-[#F7F4EE]/10 text-[#F7F4EE] border-[#F7F4EE]/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F7F4EE] animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6 pb-10">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#FAF8F5]">Reviews</h1>
          <p className="text-[#8A8478] text-sm mt-1">
            Manage customer product reviews · {reviews.length} total
            {pendingCount > 0 && (
              <span className="ml-2 text-[#F7F4EE]">({pendingCount} pending approval)</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  filter === f.value
                    ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B] font-semibold'
                    : 'bg-[#121212] border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5] hover:border-[#3A352F]'
                )}
              >
                {f.label}
                {f.count !== undefined && (
                  <span className="ml-1.5 opacity-60">{f.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-l border-[#24221F] pl-3">
            <button
              onClick={() => setStarFilter(null)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                starFilter === null
                  ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B] font-semibold'
                  : 'bg-[#121212] border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5]'
              )}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setStarFilter(starFilter === s ? null : s)}
                className={cn(
                  'px-2 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1',
                  starFilter === s
                    ? 'bg-[#F7F4EE] border-[#F7F4EE] text-[#0B0B0B] font-semibold'
                    : 'bg-[#121212] border-[#24221F] text-[#8A8478] hover:text-[#FAF8F5]'
                )}
              >
                <span>{s}</span>
                <Star className="w-3 h-3 text-[#FAF8F5] fill-[#FAF8F5]" />
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8478]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full rounded-lg bg-[#121212] border border-[#24221F] pl-10 pr-4 py-2 text-sm text-[#FAF8F5] placeholder:text-[#8A8478] outline-none focus:border-[#F7F4EE]"
            />
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] p-12 text-center">
          <MessageSquare className="w-10 h-10 text-[#8A8478] mx-auto" />
          <p className="mt-3 text-sm text-[#8A8478]">No reviews found</p>
        </div>
      ) : (
        <div className="bg-[#121212] rounded-xl border border-[#24221F] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#24221F] text-[#8A8478]">
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
                    className="item-row border-b border-[#24221F]/50 last:border-0 hover:bg-[#181818] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-[#FAF8F5] font-medium truncate max-w-[140px]">
                        {review.customerName || 'Unknown'}
                      </p>
                      <p className="text-[#8A8478] text-xs truncate max-w-[140px]">
                        {review.customerEmail}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#FAF8F5] truncate max-w-[160px]">
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
                              i < review.rating ? 'text-[#FAF8F5] fill-[#FAF8F5]' : 'text-[#24221F]'
                            )}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-[#FAF8F5] text-xs leading-relaxed line-clamp-2 max-w-[300px]">
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
                    <td className="px-4 py-3 hidden md:table-cell text-[#8A8478] text-xs">
                      {new Date(review.createdAt as unknown as string).toLocaleDateString('en-LK', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedReview(review)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#F7F4EE] hover:bg-[#F7F4EE]/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {review.status !== 'approved' && (
                          <button
                            onClick={() => handleModerate(review.id, 'approved')}
                            title="Approve"
                            className="p-1.5 rounded-lg text-[#FAF8F5] hover:bg-white/10 transition-colors"
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
                          className="p-1.5 rounded-lg text-[#8A8478] hover:text-[#E05252] hover:bg-[#E05252]/10 transition-colors"
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

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div onClick={() => setSelectedReview(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#141414] rounded-xl border border-[#24221F] p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#24221F]">
              <div>
                <h3 className="text-lg font-semibold text-[#FAF8F5]">Review Details</h3>
                <p className="text-xs text-[#8A8478] mt-0.5">
                  Product: <strong className="text-[#FAF8F5]">{selectedReview.productName || selectedReview.productId}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 text-[#8A8478] hover:text-[#FAF8F5] rounded-lg hover:bg-[#1C1C1C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < selectedReview.rating ? 'text-[#FAF8F5] fill-[#FAF8F5]' : 'text-[#24221F]'
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold text-[#FAF8F5]">{selectedReview.rating} / 5</span>
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  statusClass(selectedReview.status as string)
                )}>
                  {statusIcon(selectedReview.status as string)}
                  {(selectedReview.status as string).toUpperCase()}
                </span>
              </div>

              <div className="bg-[#0B0B0B] rounded-lg p-3 border border-[#24221F] text-xs space-y-1">
                <p><span className="text-[#8A8478]">Customer:</span> <strong className="text-[#FAF8F5]">{selectedReview.customerName}</strong> ({selectedReview.customerEmail})</p>
                <p><span className="text-[#8A8478]">Verified Buyer:</span> <strong className={selectedReview.isVerifiedPurchase ? 'text-[#F7F4EE]' : 'text-[#8A8478]'}>{selectedReview.isVerifiedPurchase ? 'Yes (Verified)' : 'No'}</strong></p>
                <p><span className="text-[#8A8478]">Date:</span> {new Date(selectedReview.createdAt as unknown as string).toLocaleString('en-LK')}</p>
              </div>

              <div>
                {selectedReview.title && (
                  <h4 className="text-sm font-semibold text-[#FAF8F5] mb-1.5">
                    &ldquo;{selectedReview.title}&rdquo;
                  </h4>
                )}
                <p className="text-sm text-[#FAF8F5]/90 leading-relaxed whitespace-pre-wrap bg-[#181818] p-3 rounded-lg border border-[#24221F]">
                  {selectedReview.comment}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#24221F] flex items-center justify-between">
              <button
                onClick={() => {
                  setDeleteId(selectedReview.id)
                }}
                className="px-3 py-2 text-xs text-[#E05252] hover:bg-[#E05252]/10 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              <div className="flex items-center gap-2">
                {selectedReview.status !== 'rejected' && (
                  <button
                    onClick={() => handleModerate(selectedReview.id, 'rejected')}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-[#E05252] bg-[#E05252]/10 border border-[#E05252]/30 hover:bg-[#E05252]/20 transition-colors"
                  >
                    Reject Review
                  </button>
                )}
                {selectedReview.status !== 'approved' && (
                  <button
                    onClick={() => handleModerate(selectedReview.id, 'approved')}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-[#0B0B0B] bg-[#F7F4EE] hover:bg-[#FFFFFF] transition-all shadow-xs"
                  >
                    Approve Review
                  </button>
                )}
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 rounded-lg text-xs text-[#FAF8F5] bg-[#1C1C1C] border border-[#24221F] hover:bg-[#24221F] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          <div className="relative bg-[#141414] rounded-xl border border-[#24221F] p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#FAF8F5]">Delete Review</h3>
            <p className="mt-2 text-sm text-[#8A8478]">
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm text-[#FAF8F5] bg-[#1C1C1C] border border-[#24221F] hover:bg-[#24221F] transition-colors"
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
