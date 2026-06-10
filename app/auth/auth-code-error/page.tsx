import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="pb-auth-error-page">
      <section className="pb-auth-error-card">
        <p className="pb-auth-error-kicker">My Points Butler</p>
        <h1>Sign-in link failed</h1>
        <p>
          The auth link was missing, expired, or rejected. Start a fresh sign-in
          from the home page.
        </p>
        <Link href="/">Back to sign in</Link>
      </section>
    </main>
  );
}
