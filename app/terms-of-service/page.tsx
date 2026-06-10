import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service | My Points Butler",
  description: "Terms of Service for My Points Butler.",
};

export default function TermsOfServicePage() {
  return (
    <main className={styles.legalPage}>
      <div className={styles.legalShell}>
        <div className={styles.legalKicker}>Legal · Terms of Service</div>
        <h1 className={styles.legalBrand}>My Points Butler</h1>
        <p className={styles.legalIntro}>
          These terms explain how you may use My Points Butler and the services we provide. Please review
          them carefully before using the site.
        </p>

        <div className={styles.legalGrid}>
          <section className={styles.legalSection}>
            <h2>Version and scope</h2>
            <p>Effective date: May 1, 2026.</p>
            <p>
              These terms of service govern your use of mypointsbutler.com and any content or services we
              offer through the site.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>Eligibility and acceptance</h2>
            <p>
              By using the site, you confirm that you are at least 18 years old and that you agree to these
              terms. If you do not agree, do not use the website.
            </p>
            <p>
              We may update, suspend, or discontinue the site or these terms at any time. Continued use after
              changes are posted means you accept the updated terms.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>Acceptable use</h2>
            <p>You agree to follow all applicable laws and not to misuse the site. In particular, you will not:</p>
            <ul>
              <li>access code, content, or systems without authorization;</li>
              <li>interfere with the site’s operation or performance;</li>
              <li>damage, disrupt, or overload the service;</li>
              <li>use bots, scrapers, or automated methods without permission; or</li>
              <li>commit fraud, malicious conduct, or other illegal activity through the service.</li>
            </ul>
          </section>

          <section className={styles.legalSection}>
            <h2>Intellectual property and submissions</h2>
            <p>
              The site and its content are protected intellectual property. You may not modify, publish, or
              exploit our intellectual property without permission.
            </p>
            <p>
              Unless we specifically request it, please do not send confidential, proprietary, or trade-secret
              information. If you voluntarily submit content, you grant us a worldwide, royalty-free,
              transferable license to use, reproduce, adapt, and distribute it for site-related purposes.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>Warranties, liability, and disputes</h2>
            <p>
              The service is provided “as is” and “as available.” We disclaim warranties to the fullest extent
              allowed by law, and our liability is limited to the extent described in the full agreement.
            </p>
            <p>
              The full agreement also includes indemnity terms, dispute resolution through informal
              negotiation and arbitration, a class action waiver, and additional terms about severability,
              assignment, and enforcement.
            </p>
          </section>

          <section className={styles.legalSection}>
            <h2>Questions</h2>
            <p>
              Email{" "}
              <Link href="mailto:hello@mypointsbutler.com">hello@mypointsbutler.com</Link> with any questions
              about these terms.
            </p>
          </section>
        </div>

        <div className={styles.legalLinkRow}>
          <Link href="/">Back to homepage</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </div>

        <p className={styles.legalMeta}>
          This page is a product-facing summary of the legal terms. If you need the complete text, keep the
          canonical version in your legal review process.
        </p>
      </div>
    </main>
  );
}
