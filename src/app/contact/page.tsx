import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact New Step Footwear Store",
  description:
    "Call, WhatsApp or message New Step Footwear Store. Shop location, opening hours and enquiry form.",
};

import { STORE_CONTACT, getWhatsAppLink } from "@/lib/config";

const DETAILS = [
  { label: "Phone", value: STORE_CONTACT.phoneFormatted, href: `tel:${STORE_CONTACT.phoneTel}` },
  { label: "WhatsApp", value: "Chat with us", href: getWhatsAppLink("Hi New Step Footwear, I'd like to make an enquiry") },
  { label: "Email", value: STORE_CONTACT.email, href: `mailto:${STORE_CONTACT.email}` },
  {
    label: "Facebook",
    value: "New Step Footwear Store",
    href: "https://www.facebook.com/share/1EQy25r3Xz/",
  },
];

export default function ContactPage() {
  return (
    <div className="container-x py-12">
      <Reveal>
        <h1 className="display text-[clamp(2rem,7vw,3.5rem)]">Contact us</h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted">
          Prefer to message? That still works. Reach us however is easiest — we
          answer WhatsApp fastest.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <Reveal>
          <dl className="divide-y divide-line border-y border-line">
            {DETAILS.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-4 py-4">
                <dt className="eyebrow text-muted">{d.label}</dt>
                <dd>
                  <a
                    href={d.href}
                    target={d.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="link-underline text-[15px]"
                  >
                    {d.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <h2 className="display text-xl">Visit the shop</h2>
            <p className="mt-2 text-[15px] text-muted">
              No. 123, Galle Road, Colombo 06, Sri Lanka
              <br />
              Open Monday – Saturday, 9:00am – 7:00pm
              <br />
              Sunday, 10:00am – 4:00pm
            </p>
          </div>

          <div className="mt-6 aspect-[16/10] w-full bg-mist">
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Map embed placeholder — Galle Road, Colombo 06
            </div>
          </div>
        </Reveal>

        <Reveal>
          <h2 className="display text-xl">Send an enquiry</h2>
          <div className="mt-5">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
