import Link from "next/link";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop/mens", label: "Men's" },
      { href: "/shop/womens", label: "Women's" },
      { href: "/shop/kids", label: "Kids'" },
      { href: "/shop/sale", label: "Sale" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/policies/delivery", label: "Delivery" },
      { href: "/policies/returns", label: "Returns & Exchange" },
      { href: "/product/velocity-runner-white#size-guide", label: "Size Guide" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/policies/privacy", label: "Privacy Policy" },
      { href: "/policies/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-paper">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="display text-2xl">
            New<span className="text-muted">Step</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-white/60">
            Footwear for everyday Sri Lanka. Island-wide delivery, cash on
            delivery, real stock you can see before you order.
          </p>
          <div className="mt-5 flex gap-3">
            {["Facebook", "TikTok", "Instagram"].map((s) => (
              <a
                key={s}
                href="https://www.facebook.com/share/1EQy25r3Xz/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/25 px-3 py-1.5 text-xs text-white/80 transition-colors hover:border-white hover:text-white"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow text-white/50">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/80 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} New Step Footwear Store. All rights reserved.</p>
          <p>Colombo, Sri Lanka &middot; +94 77 000 0000 &middot; Cash on Delivery</p>
        </div>
      </div>
    </footer>
  );
}
