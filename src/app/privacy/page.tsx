// app/privacy/page.tsx
import type { Metadata } from "next";



export const metadata: Metadata = {
  title: `Privacy Policy | ${process.env.APP_NAME}`,
  description:
    `How ${process.env.APP_NAME} collects, uses, and protects your personal data (GDPR-friendly).`,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Last updated: {process.env.LAST_UPDATED}
        </p>
      </header>

      <section className="space-y-8 text-white/90">
      <p className="text-white/80">
        This Privacy Policy describes how {process.env.APP_NAME} collects and processes personal data. We aim to keep this simple and
        transparent—so you can quickly understand what we do and why.
      </p>


        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/80">
            <strong>Quick summary:</strong> we collect only what we need to run{" "}
            {process.env.APP_NAME} (account data, usage limits, payment info via Paddle).
            Your inputs (e.g., job posts/resumes) are used to generate your
            cover letter and aren’t used by us to train models. You can email us
            any time to access or delete your data.
          </p>
        </div>

      <Section title="Who is the data controller?">
        <p>
          The data controller is <strong>{process.env.APP_NAME}</strong>, operated by{" "}
          <strong>{process.env.CONTROLLER_NAMES}</strong>. <br/>Contact:{" "}
          <a className="text-blue-300 underline" href={`mailto:${process.env.CONTACT_EMAIL}`}>
            {process.env.CONTACT_EMAIL}
          </a>.
        </p>
      </Section>


        <Section title="What data we collect">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account & Login:</strong> name (if provided), email,
              password hash or OAuth provider ID (via NextAuth), session IDs,
              and essential auth cookies.
            </li>
            <li>
              <strong>Content you provide:</strong> text you paste or upload
              (e.g., job post, resume) to generate your cover letter.
            </li>
            <li>
              <strong>Usage & Limits:</strong> counts of generations per period
              (e.g., per month) and plan tier to enforce fair use.
            </li>
            <li>
              <strong>Payments (via Paddle):</strong> subscription status,
              transaction IDs, and billing details needed for invoices/receipts.
              We don’t store full card numbers; Paddle processes payments.
            </li>
            <li>
              <strong>Technical data:</strong> IP address, device/browser info,
              and basic logs for security and abuse prevention.
            </li>
          </ul>
        </Section>

        <Section title="How we use your data (purposes & legal bases)">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Provide the service</strong> (create accounts, sign in,
              generate cover letters, enforce plan limits).{" "}
              <em>Legal basis: contract</em>.
            </li>
            <li>
              <strong>Payments & invoicing</strong> through Paddle.{" "}
              <em>Legal basis: contract & legal obligation</em>.
            </li>
            <li>
              <strong>Support & communications</strong> (important service
              emails, responding to requests). <em>Legal basis: legitimate interest</em>.
            </li>
            <li>
              <strong>Security & fraud prevention</strong> (rate limiting,
              abuse prevention). <em>Legal basis: legitimate interest</em>.
            </li>
            <li>
              <strong>Optional marketing/newsletters</strong> (only if you opt
              in). <em>Legal basis: consent</em>.
            </li>
          </ul>
        </Section>

        <Section title="AI processing specifics">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Your inputs</strong> (job post, resume, prompts) are sent
              to our model provider (e.g., OpenAI via API) <em>solely to generate your requested output</em>.
            </li>
            <li>
              <strong>We don’t use your inputs to train our own models.</strong>
              We configure our integrations to process your data only to perform
              the service.
            </li>
            <li>
              <strong>Retention:</strong> Generation requests are processed in real time. 
              Generated outputs (cover letters) saved to your Library are stored in your account until you delete them. 
              Minimal diagnostic logs may be kept temporarily for reliability and abuse prevention.
            </li>

          </ul>
        </Section>

        <Section title="Content storage (Library)">
  <p>
    {process.env.APP_NAME} includes a Library so you can keep, edit, and download your generated cover letters later. 
    By default, cover letters you generate are saved to your account. You can delete any item at any time.
  </p>
  <ul className="list-disc space-y-2 pl-6">
    <li><strong>Scope:</strong> stored items are the generated cover letters (outputs).</li>
    <li><strong>Control:</strong> delete items from the Library in the app or contact us at <a className="text-blue-300 underline" href={`mailto:${process.env.CONTACT_EMAIL}`}>{process.env.CONTACT_EMAIL}</a>.</li>
    <li><strong>Backups:</strong> routine backups may briefly retain deleted items until overwritten.</li>
  </ul>
</Section>


        <Section title="Cookies & tracking">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Essential cookies</strong> for authentication/session
              (NextAuth) are required for the app to work.
            </li>
            <li>
              <strong>Non-essential cookies</strong> (analytics/ads) are not set
              without consent. If we add optional analytics, we’ll show a proper
              consent banner and honor your choice.
            </li>
          </ul>
        </Section>

        <Section title="Sharing your data (processors)">
          <p className="mb-2">
            We share data with service providers who help us run {process.env.APP_NAME}. They
            only process data on our instructions:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Paddle</strong> (payments, subscriptions, invoicing).
            </li>
            <li>
              <strong>OpenAI</strong> (model inference for generating outputs).
            </li>
            <li>
              <strong>Database & infrastructure providers</strong> (e.g., our
              cloud host, Prisma database). We may also use a managed cache/queue
              (e.g., Redis/Upstash) for rate limiting and reliability.
            </li>
          </ul>
          <p className="mt-2">
            We do not sell your personal data.
          </p>
        </Section>

        <Section title="International transfers">
          <p>
            Some processors may be located outside your country. Where required,
            we rely on appropriate safeguards (e.g., standard contractual
            clauses) to protect your data.
          </p>
        </Section>

        <Section title="Data retention">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account data</strong>: kept while your account is active;
              deleted upon request (subject to legal retention obligations).
            </li>
            <li>
              <strong>Usage counters</strong>: kept as long as needed to enforce
              plan limits and prevent abuse.
            </li>
            <li>
              <strong>Logs</strong>: kept short-term for security and
              troubleshooting, then deleted.
            </li>
            <li><strong>Library items (cover letters):</strong> kept until you delete them.</li>
            <li><strong>Billing records:</strong> retained as required by law.</li>
          </ul>
        </Section>

        <Section title="Your rights (GDPR/EEA users)">
          <p className="mb-2">
            If you are in the EU/EEA (or similar jurisdictions), you may:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Access a copy of your personal data</li>
            <li>Request correction or deletion</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability</li>
            <li>Withdraw consent (where processing is based on consent)</li>
          </ul>
          <p className="mt-2">
            To exercise your rights, email{" "}
            <a className="text-blue-300 underline" href={`mailto:${process.env.CONTACT_EMAIL}`}>
              {process.env.CONTACT_EMAIL}
            </a>
            . We’ll respond as required by law.
          </p>
        </Section>

        <Section title="Children">
          <p>
            {process.env.APP_NAME} is not directed to children under 16. If you believe a
            child has provided us personal data, contact us so we can delete it.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use industry-standard measures to protect personal data (HTTPS,
            hashed passwords, least-privilege access, monitoring). No method is
            100% secure, but we work to keep your data safe.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy as our service evolves. We’ll post the new
            version here and update the “Last updated” date above.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or requests? Email{" "}
            <a className="text-blue-300 underline" href={`mailto:${process.env.CONTACT_EMAIL}`}>
              {process.env.CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="text-xs text-white/50">
          This page is provided for transparency and does not constitute legal
          advice.
        </p>
      </section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-white/80">{children}</div>
    </section>
  );
}
