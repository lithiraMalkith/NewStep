import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60svh] flex-col items-center justify-center text-center">
      <p className="display text-[clamp(4rem,18vw,10rem)] leading-none">404</p>
      <h1 className="mt-4 text-xl font-semibold">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-sm text-[15px] text-muted">
        The link may be old, or the product may have sold out and been removed.
      </p>
      <Link href="/shop" className="btn btn-solid mt-8">
        Shop all shoes
      </Link>
    </div>
  );
}
