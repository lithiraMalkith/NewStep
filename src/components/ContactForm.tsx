"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function ContactForm() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.displayName || "",
        contact: prev.contact || user.email || user.phoneNumber || "",
      }));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="border border-line p-6 bg-mist/30 text-center rounded-xl">
        <h3 className="text-[15px] font-medium text-ink">Sign in required</h3>
        <p className="mt-2 text-sm text-muted">
          Only registered users can send messages.
        </p>
        <Link href="/account/login" className="btn btn-solid mt-4 text-xs inline-flex">
          Sign in or Register
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="border border-ink p-6 rounded-xl text-center">
        <h3 className="display text-xl">Message sent</h3>
        <p className="mt-2 text-[15px] text-muted">
          Thanks {form.name.split(" ")[0]} — we will get back to you shortly.
        </p>
        <button
          onClick={() => {
            setForm({ ...form, message: "" });
            setSent(false);
          }}
          className="btn btn-outline mt-5"
        >
          Send another message
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
      } else {
        setError(data.error || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-[#E05252]/10 px-4 py-3 text-xs font-medium text-[#E05252]">
          {error}
        </div>
      )}
      <label className="block">
        <span className="text-sm font-medium">Your name</span>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[16px] outline-none focus:border-ink bg-transparent"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Phone or email</span>
        <input
          required
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[16px] outline-none focus:border-ink bg-transparent"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">How can we help?</span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[16px] outline-none focus:border-ink bg-transparent"
        />
      </label>
      <button disabled={loading} type="submit" className="btn btn-solid w-full sm:w-auto">
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
