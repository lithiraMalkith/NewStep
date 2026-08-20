"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCart } from "./CartProvider";
import { DISTRICTS, LKR, deliveryFor } from "@/lib/format";
import { orderNumber, saveOrder } from "@/lib/orders";
import { useAuth } from "@/contexts/auth-context";
import { getDefaultAddress } from "@/lib/customer-account";

type Errors = Partial<Record<string, string>>;

const FIELDS = [
  { name: "fullName", label: "Full name", type: "text", autoComplete: "name", placeholder: "Lithira Gunasekara" },
  { name: "phone", label: "Mobile number", type: "tel", autoComplete: "tel", placeholder: "07X XXX XXXX" },
  { name: "email", label: "Email (for order confirmation)", type: "email", autoComplete: "email", placeholder: "you@email.com" },
] as const;

export default function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, clear, ready } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from default address & auth user
  useEffect(() => {
    const defaultAddr = getDefaultAddress();
    if (defaultAddr) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || defaultAddr.fullName || user?.displayName || "",
        phone: prev.phone || defaultAddr.phone || "",
        email: prev.email || user?.email || "",
        address: prev.address || defaultAddr.address || "",
        city: prev.city || defaultAddr.city || "",
        district: prev.district || defaultAddr.district || "",
        notes: prev.notes || defaultAddr.notes || "",
      }));
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.displayName || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const delivery = deliveryFor(form.district, subtotal);
  const total = subtotal + delivery;

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: Errors = {};
    if (form.fullName.trim().length < 3) e.fullName = "Enter your full name.";
    if (!/^0\d{9}$/.test(form.phone.replace(/\s|-/g, "")))
      e.phone = "Enter a valid 10-digit mobile number, e.g. 0771234567.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email address.";
    if (form.address.trim().length < 8) e.address = "Enter your full delivery address.";
    if (!form.city.trim()) e.city = "Enter your city or town.";
    if (!form.district) e.district = "Select your district.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      document.querySelector<HTMLElement>("[data-error='true']")?.focus();
      return;
    }
    setSubmitting(true);
    const fallbackId = orderNumber();
    const cleanPhone = form.phone.replace(/\s|-/g, "");

    const orderPayload = {
      fullName: form.fullName.trim(),
      phone: cleanPhone,
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      city: form.city.trim(),
      district: form.district,
      notes: form.notes.trim() || undefined,
      items: lines.map((l) => ({
        productId: l.productId,
        slug: l.slug,
        name: l.name,
        colour: l.colour,
        image: l.image,
        size: l.size,
        price: l.price,
        qty: l.qty,
      })),
    };

    let targetRef = fallbackId;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        targetRef = data.data.orderRef || fallbackId;
        const savedOrderObj: import("@/lib/types").Order = {
          id: targetRef,
          createdAt: new Date().toISOString(),
          customer: { ...form, phone: cleanPhone },
          lines,
          subtotal,
          delivery,
          total: data.data.total ?? total,
          paymentMethod: "COD",
          status: "Pending",
        };
        saveOrder(savedOrderObj);
        if (data.data.id && data.data.id !== targetRef) {
          saveOrder({ ...savedOrderObj, id: data.data.id });
        }
      } else {
        // Fallback local save if server responds with error
        saveOrder({
          id: fallbackId,
          createdAt: new Date().toISOString(),
          customer: { ...form, phone: cleanPhone },
          lines,
          subtotal,
          delivery,
          total,
          paymentMethod: "COD",
          status: "Pending",
        });
      }
    } catch (err) {
      console.error("Order submission network error, saving locally:", err);
      saveOrder({
        id: fallbackId,
        createdAt: new Date().toISOString(),
        customer: { ...form, phone: cleanPhone },
        lines,
        subtotal,
        delivery,
        total,
        paymentMethod: "COD",
        status: "Pending",
      });
    } finally {
      clear();
      router.push(`/order/confirmation/${targetRef}`);
    }
  };

  if (ready && lines.length === 0) {
    return (
      <div className="container-x flex flex-col items-center gap-5 py-24 text-center">
        <h1 className="display text-3xl">Nothing to check out</h1>
        <Link href="/shop" className="btn btn-solid">
          Shop all shoes
        </Link>
      </div>
    );
  }

  const inputClass = (name: string) =>
    `mt-1.5 w-full border px-4 py-3 text-[16px] outline-none transition-colors focus:border-ink ${
      errors[name] ? "border-sale" : "border-line"
    }`;

  return (
    <div className="container-x py-8">
      <h1 className="display text-[clamp(1.75rem,6vw,3rem)]">Checkout</h1>
      <p className="mt-2 text-[15px] text-muted">
        Guest checkout &mdash; no account needed. Pay cash when your order arrives.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
        <div className="space-y-8">
          <fieldset>
            <legend className="display text-lg">Contact details</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.name} className={f.name === "email" ? "sm:col-span-2" : ""}>
                  <span className="text-sm font-medium">{f.label}</span>
                  <input
                    type={f.type}
                    inputMode={f.type === "tel" ? "numeric" : undefined}
                    autoComplete={f.autoComplete}
                    placeholder={f.placeholder}
                    value={form[f.name]}
                    data-error={!!errors[f.name]}
                    onChange={(e) => set(f.name, e.target.value)}
                    className={inputClass(f.name)}
                  />
                  {errors[f.name] && <span className="mt-1 block text-sm text-sale">{errors[f.name]}</span>}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="display text-lg">Delivery address</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Address</span>
                <textarea
                  rows={3}
                  autoComplete="street-address"
                  placeholder="House / street / landmark"
                  value={form.address}
                  data-error={!!errors.address}
                  onChange={(e) => set("address", e.target.value)}
                  className={inputClass("address")}
                />
                {errors.address && <span className="mt-1 block text-sm text-sale">{errors.address}</span>}
              </label>

              <label>
                <span className="text-sm font-medium">City / town</span>
                <input
                  type="text"
                  value={form.city}
                  data-error={!!errors.city}
                  onChange={(e) => set("city", e.target.value)}
                  className={inputClass("city")}
                />
                {errors.city && <span className="mt-1 block text-sm text-sale">{errors.city}</span>}
              </label>

              <label>
                <span className="text-sm font-medium">District</span>
                <select
                  value={form.district}
                  data-error={!!errors.district}
                  onChange={(e) => set("district", e.target.value)}
                  className={inputClass("district")}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.district && <span className="mt-1 block text-sm text-sale">{errors.district}</span>}
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Order notes (optional)</span>
                <textarea
                  rows={2}
                  placeholder="Delivery instructions, alternate number…"
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className={inputClass("notes")}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="display text-lg">Payment</legend>
            <div className="mt-4 flex items-start gap-3 border border-ink p-4">
              <input type="radio" checked readOnly className="mt-1 h-4 w-4 accent-[#0a0a0a]" />
              <div>
                <p className="text-[15px] font-medium">Cash on Delivery</p>
                <p className="text-sm text-muted">
                  Pay the courier in cash when your parcel arrives. Please keep the
                  exact amount ready.
                </p>
              </div>
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="display text-lg">Order summary</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {lines.map((l) => (
              <li key={`${l.productId}-${l.size}`} className="flex gap-3 py-3">
                <div className="relative h-16 w-16 shrink-0 bg-mist">
                  <Image src={l.image} alt={l.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-sm text-muted">
                    EU {l.size} &middot; Qty {l.qty}
                  </p>
                </div>
                <p className="whitespace-nowrap text-sm">{LKR(l.price * l.qty)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-[15px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{LKR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery{form.district ? ` — ${form.district}` : ""}</dt>
              <dd>{form.district ? (delivery === 0 ? "Free" : LKR(delivery)) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
              <dt>Total payable</dt>
              <dd>{LKR(total)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={submitting} className="btn btn-solid mt-6 w-full">
            {submitting ? "Placing order…" : "Confirm COD order"}
          </button>
          <p className="mt-3 text-sm text-muted">
            By confirming you agree to our{" "}
            <Link href="/policies/terms" className="underline underline-offset-4">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/policies/returns" className="underline underline-offset-4">
              returns policy
            </Link>
            .
          </p>
        </aside>
      </form>
    </div>
  );
}
