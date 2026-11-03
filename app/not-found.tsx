import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>Nothing at this address</h1>
      <p>That page isn&rsquo;t in the catalogue.</p>
      <p>
        <Link href="/">Back to the sky</Link> · <Link href="/learn">Learn</Link>
      </p>
    </main>
  );
}
