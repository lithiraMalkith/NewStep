import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size Guide | New Step Footwear",
  description: "Find your perfect fit with our comprehensive shoe size guide.",
};

export default function SizeGuidePage() {
  return (
    <div className="container-x py-16 md:py-24 max-w-4xl">
      <div className="mb-12">
        <h1 className="display text-4xl md:text-5xl font-bold tracking-tight text-ink mb-4">
          Size Guide
        </h1>
        <p className="text-muted text-[15px] md:text-base max-w-2xl">
          Use the chart below to find your perfect fit. Our sizes are primarily based on EU sizing, but we've provided UK, US, and CM equivalents to help you choose accurately.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-mist/50 border-b border-line text-ink">
            <tr>
              <th className="px-6 py-4 font-semibold">EU Size</th>
              <th className="px-6 py-4 font-semibold">UK Size</th>
              <th className="px-6 py-4 font-semibold">US Size (Men)</th>
              <th className="px-6 py-4 font-semibold">US Size (Women)</th>
              <th className="px-6 py-4 font-semibold">Foot Length (CM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-muted">
            {[
              { eu: "36", uk: "3", usm: "4", usw: "5.5", cm: "22.5" },
              { eu: "37", uk: "4", usm: "5", usw: "6.5", cm: "23.5" },
              { eu: "38", uk: "5", usm: "6", usw: "7.5", cm: "24.0" },
              { eu: "39", uk: "6", usm: "7", usw: "8.5", cm: "25.0" },
              { eu: "40", uk: "6.5", usm: "7.5", usw: "9", cm: "25.5" },
              { eu: "41", uk: "7.5", usm: "8.5", usw: "10", cm: "26.5" },
              { eu: "42", uk: "8", usm: "9", usw: "10.5", cm: "27.0" },
              { eu: "43", uk: "9", usm: "10", usw: "11.5", cm: "28.0" },
              { eu: "44", uk: "9.5", usm: "10.5", usw: "12", cm: "28.5" },
              { eu: "45", uk: "10.5", usm: "11.5", usw: "13", cm: "29.5" },
              { eu: "46", uk: "11", usm: "12", usw: "13.5", cm: "30.0" },
            ].map((row) => (
              <tr key={row.eu} className="hover:bg-mist/30 transition-colors">
                <td className="px-6 py-4 font-medium text-ink">{row.eu}</td>
                <td className="px-6 py-4">{row.uk}</td>
                <td className="px-6 py-4">{row.usm}</td>
                <td className="px-6 py-4">{row.usw}</td>
                <td className="px-6 py-4">{row.cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 bg-mist/40 p-6 md:p-8 rounded-2xl border border-line">
        <h2 className="display text-xl md:text-2xl font-semibold text-ink mb-4">
          How to measure your foot
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-muted text-[15px]">
          <li>Place a piece of paper on the floor against a wall.</li>
          <li>Stand on the paper with your heel firmly against the wall.</li>
          <li>Mark the longest part of your foot (usually the big toe) on the paper.</li>
          <li>Measure the distance from the edge of the paper to the mark in centimeters.</li>
          <li>Compare your measurement to the <strong>Foot Length (CM)</strong> column in the chart above.</li>
        </ol>
      </div>

      <div className="mt-12 text-center">
        <Link href="/shop" className="btn btn-solid">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
