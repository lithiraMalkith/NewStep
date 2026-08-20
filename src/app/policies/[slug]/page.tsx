import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicy, policies } from "@/lib/policies";

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return {};
  return { title: policy.title, description: policy.description };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <div className="container-x grid gap-12 py-12 lg:grid-cols-[220px_1fr] lg:gap-20">
      <nav aria-label="Policies">
        <h2 className="eyebrow text-muted">Policies</h2>
        <ul className="mt-4 space-y-2 text-[15px]">
          {policies.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/policies/${p.slug}`}
                className={p.slug === slug ? "font-semibold" : "text-muted hover:text-ink"}
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="max-w-2xl">
        <h1 className="display text-[clamp(1.9rem,6vw,3rem)]">{policy.title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated {policy.updated}</p>

        <div className="mt-8 space-y-8">
          {policy.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-lg font-semibold">{s.heading}</h2>
              {s.body.map((b) => (
                <p key={b} className="mt-2 text-[15px] leading-relaxed text-muted">
                  {b}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
