"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  if (sent) {
    return (
      <div className="border border-ink p-6">
        <h3 className="display text-xl">Message received</h3>
        <p className="mt-2 text-[15px] text-muted">
          Thanks {form.name.split(" ")[0]} — we usually reply within a few hours
          during shop hours.
        </p>
        <button
          onClick={() => {
            setForm({ name: "", contact: "", message: "" });
            setSent(false);
          }}
          className="btn btn-outline mt-5"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm font-medium">Your name</span>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mt-1.5 w-full border border-line px-4 py-3 text-[16px] outline-none focus:border-ink"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Phone or email</span>
        <input
          required
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          className="mt-1.5 w-full border border-line px-4 py-3 text-[16px] outline-none focus:border-ink"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">How can we help?</span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1.5 w-full border border-line px-4 py-3 text-[16px] outline-none focus:border-ink"
        />
      </label>
      <button type="submit" className="btn btn-solid w-full sm:w-auto">
        Send enquiry
      </button>
    </form>
  );
}
