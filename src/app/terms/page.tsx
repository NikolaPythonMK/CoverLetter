// app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

const GOVERNING_LAW = process.env.NEXT_PUBLIC_GOVERNING_LAW ?? "the laws of the Republic of North Macedonia";

export const metadata: Metadata = {
  title: `Terms of Service | ${process.env.APP_NAME}`,
  description: `Terms and conditions for using ${process.env.APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-white/60">Last updated: {process.env.LAST_UPDATED}</p>
      </header>

      <section className="space-y-8 text-white/90">
        <p className="text-white/80">
          These Terms govern your access to and use of {process.env.APP_NAME}. By using {process.env.APP_NAME}, you agree to these Terms.
          If you do not agree, do not use the service.
        </p>

        <Section title="Who we are">
          <p>
            {process.env.APP_NAME} is operated by <strong>{process.env.CONTROLLER_NAMES}</strong>. Contact us at{" "}
            <a className="text-blue-300 underline" href={`mailto:${process.env.CONTACT_EMAIL}`}>{process.env.CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="Eligibility & accounts">
          <ul className="list-disc space-y-2 pl-6">
            <li>You must be at least 16 to use {process.env.APP_NAME}.</li>
            <li>You are responsible for your account credentials and all activity under your account.</li>
            <li>We may suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </Section>

        <Section title="The service & AI outputs">
          <ul className="list-disc space-y-2 pl-6">
            <li>{process.env.APP_NAME} generates cover letters from your prompts and files.</li>
            <li>
              Outputs may be inaccurate or incomplete and are provided “as is.” Review before use. {process.env.APP_NAME} does not
              provide legal, employment, or professional advice.
            </li>
            <li>
              You are responsible for your use of outputs and for complying with applicable laws and third-party rights.
            </li>
          </ul>
        </Section>

        <Section title="Your content & rights">
          <ul className="list-disc space-y-2 pl-6">
            <li>You retain all rights to content you provide (e.g., job posts, resumes) and to your generated cover letters.</li>
            <li>
              You grant us a limited license to process your content solely to operate {process.env.APP_NAME} (e.g., generate,
              store in your Library, display to you, back up, and secure the service).
            </li>
            <li>Do not upload unlawful, harmful, or infringing content.</li>
          </ul>
        </Section>

        <Section title="Content storage (Library)">
          <ul className="list-disc space-y-2 pl-6">
            <li>Generated cover letters saved to your Library are stored in your account until you delete them.</li>
            <li>Routine backups may briefly retain deleted items until overwritten.</li>
          </ul>
          <p>
            See our <Link className="text-blue-300 underline" href="/privacy">Privacy Policy</Link> for data handling details.
          </p>
        </Section>

        <Section title="Plans, payments, and renewals">
          <ul className="list-disc space-y-2 pl-6">
            <li>Some features require a paid plan. Prices and features are shown at checkout.</li>
            <li>
              Payments are processed by Paddle. Invoices/receipts are issued by Paddle on our behalf. You must provide
              accurate billing information and agree to Paddle’s terms.
            </li>
            <li>Subscriptions renew automatically each billing period unless you cancel before the renewal date.</li>
            <li>Cancel anytime from your account; access continues until the end of the current period.</li>
            <li>Unless stated otherwise, we do not offer pro-rated refunds for partial billing periods.</li>
          </ul>
        </Section>

        <Section title="Right of withdrawal (EU/EEA consumers)">
          <p>
            If you are an EU/EEA consumer, you may have a 14-day right to withdraw from online purchases. By starting
            generation or accessing paid features immediately after purchase, you request and consent to immediate
            performance and acknowledge you may lose the right to withdraw once the service has been fully performed.
          </p>
        </Section>

        <Section title="Acceptable use">
          <ul className="list-disc space-y-2 pl-6">
            <li>No illegal, harmful, harassing, or infringing use.</li>
            <li>No attempt to bypass rate limits or service protections.</li>
            <li>No reverse engineering or scraping except as permitted by law.</li>
          </ul>
        </Section>

        <Section title="Intellectual property">
          <p>
            We own the {process.env.APP_NAME} platform, software, and brand. These Terms do not transfer any IP rights except the
            limited rights necessary for you to use the service.
          </p>
        </Section>

        <Section title="Disclaimers">
          <p>
            {process.env.APP_NAME} is provided “as is” and “as available.” To the fullest extent permitted by law, we disclaim all
            warranties, express or implied.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, we will not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits or revenues.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these Terms as {process.env.APP_NAME} evolves. We will post changes here and update the “Last updated”
            date above. Continued use after changes means you accept the updated Terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these Terms? Email{" "}
            <a className="text-blue-300 underline" href={`mailto:${process.env.CONTACT_EMAIL}`}>{process.env.CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <p className="text-xs text-white/50">
          This page is for general information and does not constitute legal advice.
        </p>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-white/80">{children}</div>
    </section>
  );
}
