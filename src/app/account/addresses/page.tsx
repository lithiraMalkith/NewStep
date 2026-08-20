'use client'

import { useState, useEffect } from 'react'
import AccountNav from '@/components/AccountNav'
import { DISTRICTS } from '@/lib/format'
import {
  getLocalAddresses,
  addLocalAddress,
  updateLocalAddress,
  deleteLocalAddress,
  setDefaultLocalAddress,
  type SavedAddress,
} from '@/lib/customer-account'

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form fields
  const [label, setLabel] = useState('Home')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [notes, setNotes] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [formError, setFormError] = useState('')

  const loadAddresses = () => {
    setAddresses(getLocalAddresses())
  }

  useEffect(() => {
    loadAddresses()
  }, [])

  const handleOpenAdd = () => {
    setEditingId(null)
    setLabel('Home')
    setFullName('')
    setPhone('')
    setAddress('')
    setCity('')
    setDistrict('')
    setNotes('')
    setIsDefault(addresses.length === 0)
    setFormError('')
    setModalOpen(true)
  }

  const handleOpenEdit = (addr: SavedAddress) => {
    setEditingId(addr.id)
    setLabel(addr.label)
    setFullName(addr.fullName)
    setPhone(addr.phone)
    setAddress(addr.address)
    setCity(addr.city)
    setDistrict(addr.district)
    setNotes(addr.notes || '')
    setIsDefault(addr.isDefault)
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return setFormError('Enter recipient full name.')
    if (!phone.trim() || !/^0\d{9}$/.test(phone.replace(/\s|-/g, '')))
      return setFormError('Enter a valid 10-digit mobile number, e.g. 0771234567.')
    if (!address.trim()) return setFormError('Enter street delivery address.')
    if (!city.trim()) return setFormError('Enter city / town.')
    if (!district) return setFormError('Select district.')

    if (editingId) {
      updateLocalAddress(editingId, {
        label,
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        district,
        notes: notes.trim() || undefined,
        isDefault,
      })
    } else {
      addLocalAddress({
        label,
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        district,
        notes: notes.trim() || undefined,
        isDefault,
      })
    }

    loadAddresses()
    setModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this saved address?')) {
      const updated = deleteLocalAddress(id)
      setAddresses(updated)
    }
  }

  const handleSetDefault = (id: string) => {
    const updated = setDefaultLocalAddress(id)
    setAddresses(updated)
  }

  return (
    <div className="min-h-[80vh] bg-paper">
      <AccountNav activeTab="addresses" />

      <div className="container-x py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6 mb-8">
          <div>
            <h1 className="display text-3xl font-bold tracking-tight">Address Book</h1>
            <p className="text-sm text-muted mt-1">
              Save your delivery addresses for seamless, instant checkout.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn btn-solid text-xs py-2.5 px-4 flex items-center gap-1.5 shrink-0"
          >
            <span>+ Add New Address</span>
          </button>
        </div>

        {/* Address Cards Grid */}
        {addresses.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-line bg-paper p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mist text-muted mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h2 className="display text-xl font-semibold">No saved addresses</h2>
            <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
              Add your delivery addresses to make checking out faster with Cash on Delivery.
            </p>
            <button
              onClick={handleOpenAdd}
              className="btn btn-solid mt-6 text-xs"
            >
              Add Your First Address
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 bg-paper transition-all ${
                  addr.isDefault
                    ? 'border-ink shadow-sm ring-1 ring-ink'
                    : 'border-line hover:border-ink/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink uppercase tracking-wide">
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-semibold text-paper">
                        DEFAULT
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-ink">{addr.fullName}</h3>
                  <p className="text-xs text-muted mt-0.5">{addr.phone}</p>

                  <div className="mt-3 text-xs leading-relaxed text-ink/85">
                    <p>{addr.address}</p>
                    <p>
                      {addr.city}, {addr.district}
                    </p>
                    {addr.notes && (
                      <p className="mt-2 text-[11px] text-muted italic border-t border-line/60 pt-1.5">
                        Note: {addr.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs">
                  <div>
                    {!addr.isDefault ? (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="font-medium text-ink hover:underline"
                      >
                        Set as default
                      </button>
                    ) : (
                      <span className="text-muted text-[11px]">Primary delivery address</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="text-ink hover:underline font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="text-muted hover:text-ink transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Address Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-paper p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
              <h2 className="display text-xl font-bold">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-2xl leading-none text-muted hover:text-ink"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-xl border border-line bg-mist/70 px-4 py-2.5 text-xs font-medium text-ink">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Address Label</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                        label === l
                          ? 'border-ink bg-ink text-paper'
                          : 'border-line text-muted hover:border-ink'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Lithira Gunasekara"
                    className="w-full rounded-xl border border-line bg-mist/30 px-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07X XXX XXXX"
                    className="w-full rounded-xl border border-line bg-mist/30 px-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Street Address</label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House number, building, street name"
                  className="w-full rounded-xl border border-line bg-mist/30 px-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">City / Town</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Maharagama"
                    className="w-full rounded-xl border border-line bg-mist/30 px-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">District</label>
                  <select
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink"
                  >
                    <option value="">Select district</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Near town hall, call before delivery"
                  className="w-full rounded-xl border border-line bg-mist/30 px-3.5 py-2.5 text-xs text-ink placeholder:text-muted outline-none focus:border-ink focus:bg-paper"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 accent-[#0a0a0a]"
                />
                <span className="text-xs text-ink font-medium">
                  Set as my default delivery address
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline py-2 px-4 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-solid py-2 px-5 text-xs font-semibold"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
