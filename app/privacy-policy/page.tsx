import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | My Points Butler",
  description: "Privacy Policy for My Points Butler.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.legalPage}>
      <div className={styles.legalShell}>
        <div className={styles.legalKicker}>Legal · Privacy Policy</div>
        <h1 className={styles.legalBrand}>My Points Butler</h1>
        <p className={styles.legalIntro}>
          This Privacy Policy explains how My Points Butler collects and uses information when you visit the
          site or use its services.
        </p>

        <div className={styles.legalGrid}>
          <section className={styles.legalSection}>
            <h2>Effective date and scope</h2>
            <p>Effective date: May 1, 2026.</p>
            <p>
              This policy applies to information collected through mypointsbutler.com. The website is intended
              for individuals over 18, and if you do not agree with this policy, you should not use the site.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>Information we collect</h2>
            <p>We collect information you submit directly, including your name and email address.</p>
            <p>
              We also automatically collect technical and usage data such as IP address, browser details,
              device information, and activity on the site.
            </p>
            <p>
              We may use analytics and advertising tools, including Google Analytics and Meta / Google pixels.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>How we use information</h2>
            <p>We use information to operate the site, test new ideas, and analyze interest in features and content.</p>
            <p>We may also use your information to send updates about related services.</p>
            <p>We use cookies and similar technologies and provide opt-out choices where required by law.</p>
          </section>

          <section className={styles.legalSection}>
            <h2>Where data is processed</h2>
            <p>My Points Butler operates in the United States. Your information may be processed in the United States.</p>
          </section>

          <section className={styles.legalSection}>
            <h2>Questions?</h2>
            <p>
              Email{" "}
              <Link href="mailto:hello@mypointsbutler.com">hello@mypointsbutler.com</Link> with any questions
              about this policy.
            </p>
          </section>
        </div>

        <div className={styles.legalLinkRow}>
          <Link href="/">Back to homepage</Link>
          <Link href="/terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
