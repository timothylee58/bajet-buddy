import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Bajet Buddy",
  description: "How Bajet Buddy collects, uses, and protects your personal and financial data.",
};

const LAST_UPDATED = "30 May 2026";
const CONTACT_EMAIL = "privacy@bajetbuddy.app";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10 pb-20">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="font-headline text-4xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">

          <Section title="1. Introduction">
            <p>
              Bajet Buddy (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is a personal budgeting
              application designed for Malaysians. This Privacy Policy explains how we collect, use, store,
              and protect your personal data when you use our web application at{" "}
              <span className="font-semibold">bajet-buddy.netlify.app</span>.
            </p>
            <p className="mt-3">
              By using Bajet Buddy you agree to the practices described in this policy. This policy complies
              with Malaysia&rsquo;s <strong>Personal Data Protection Act 2010 (PDPA)</strong>.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p className="font-semibold mb-2">Account &amp; identity data</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email address and display name (collected on sign-up)</li>
              <li>Profile picture URL (if provided via OAuth)</li>
              <li>Authentication tokens (managed by Supabase Auth)</li>
            </ul>

            <p className="font-semibold mt-4 mb-2">Financial &amp; spending data</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Transaction records you enter: merchant name, amount, category, date</li>
              <li>Budget allocations you configure per category</li>
              <li>Income figures you provide</li>
              <li>Bank statement images or text you upload for OCR scanning</li>
            </ul>

            <p className="font-semibold mt-4 mb-2">Behavioural &amp; usage data</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Questionnaire answers from the onboarding flow</li>
              <li>Spending persona and AI analysis results</li>
              <li>XP points, streaks, and gamification state</li>
              <li>Feature usage patterns (pages visited, features used)</li>
            </ul>

            <p className="font-semibold mt-4 mb-2">Technical data</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>IP address and browser/device type (standard server logs)</li>
              <li>Session identifiers stored in browser cookies and localStorage</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Provide the service:</strong> store and display your budgets, transactions, and
                financial summaries.
              </li>
              <li>
                <strong>AI analysis:</strong> your spending data and questionnaire answers are sent to our
                AI pipeline (powered by Anthropic Claude and/or DeepSeek) to generate your spending persona,
                nudges, and risk assessments. Prompts are processed server-side and are not used to train
                third-party models.
              </li>
              <li>
                <strong>OCR scanning:</strong> bank statement images you upload are processed by our OCR
                service to extract transactions. Images are not retained after processing.
              </li>
              <li>
                <strong>Gamification:</strong> calculate your XP, streaks, and level based on your activity.
              </li>
              <li>
                <strong>Product improvement:</strong> aggregate, anonymised usage statistics to understand
                which features are most helpful.
              </li>
              <li>
                <strong>Security:</strong> detect fraud, abuse, and unauthorised access.
              </li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell, rent, or trade your personal data to third parties for
              marketing purposes.
            </p>
          </Section>

          <Section title="4. Data Storage &amp; Security">
            <p>
              Your data is stored in a Supabase PostgreSQL database hosted on servers in the closest
              available region. Data in transit is encrypted using TLS 1.2+. Data at rest is encrypted by
              the hosting provider.
            </p>
            <p className="mt-3">
              We apply row-level security (RLS) policies in our database so that each user can only access
              their own records. Authentication is handled by Supabase Auth using industry-standard JWT tokens.
            </p>
            <p className="mt-3">
              Despite these measures, no system is completely secure. In the event of a data breach that
              affects your personal data, we will notify you as required by applicable law.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <ul className="list-disc pl-5 space-y-2">
              <li>Account data is retained for as long as your account is active.</li>
              <li>
                Transaction and budget records are retained indefinitely to support historical analysis
                unless you request deletion.
              </li>
              <li>
                Guest mode data is stored only in your browser&rsquo;s localStorage and is never sent to our
                servers unless you choose to sign up.
              </li>
              <li>Bank statement images uploaded for OCR are deleted immediately after processing.</li>
              <li>
                Server access logs are retained for up to 90 days for security purposes.
              </li>
            </ul>
          </Section>

          <Section title="6. Sharing With Third Parties">
            <p>We share data only with the following categories of service providers:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Supabase</strong> — database, authentication, and file storage. Data processing
                is governed by Supabase&rsquo;s Data Processing Agreement.
              </li>
              <li>
                <strong>Anthropic / DeepSeek</strong> — AI inference for persona generation and spending
                nudges. Only the minimum data required (anonymised spending summaries and questionnaire
                responses) is included in API calls.
              </li>
              <li>
                <strong>Netlify / Railway</strong> — hosting and serverless compute for the web frontend
                and API backend.
              </li>
            </ul>
            <p className="mt-3">
              All third-party providers are contractually required to process data only as instructed and
              to maintain appropriate security standards.
            </p>
          </Section>

          <Section title="7. Cookies &amp; Local Storage">
            <p>
              We use browser cookies and localStorage for authentication sessions and user preferences
              (e.g. font size, guest mode state). We do <strong>not</strong> use advertising or
              cross-site tracking cookies.
            </p>
            <p className="mt-3">
              You can clear cookies and localStorage at any time through your browser settings. This will
              sign you out of the application.
            </p>
          </Section>

          <Section title="8. Your Rights Under PDPA">
            <p>Under Malaysia&rsquo;s Personal Data Protection Act 2010, you have the right to:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Access</strong> the personal data we hold about you.
              </li>
              <li>
                <strong>Correct</strong> inaccurate or incomplete personal data.
              </li>
              <li>
                <strong>Delete</strong> your account and all associated personal data.
              </li>
              <li>
                <strong>Object</strong> to the processing of your personal data for certain purposes.
              </li>
              <li>
                <strong>Withdraw consent</strong> at any time (note that withdrawal may affect your
                ability to use parts of the service).
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-primary underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              . We will respond within 21 days.
            </p>
          </Section>

          <Section title="9. Children">
            <p>
              Bajet Buddy is not intended for users under 13 years of age. We do not knowingly collect
              personal data from children. If you believe a child has provided us with personal data,
              please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this policy from time to time. When we do, we will revise the &ldquo;Last
              updated&rdquo; date at the top of this page. For significant changes, we will notify active
              users by email or via an in-app banner. Continued use of Bajet Buddy after changes are
              posted constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we
              handle your data, please contact:
            </p>
            <div className="mt-3 rounded-2xl border border-border bg-surface-muted p-4 text-sm">
              <p className="font-semibold">Bajet Buddy</p>
              <p className="mt-1 text-muted">
                Email:{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="text-muted">Malaysia</p>
            </div>
          </Section>

        </div>

        <p className="mt-12 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} Bajet Buddy. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-headline text-xl font-bold text-foreground mb-3">{title}</h2>
      <div className="text-muted">{children}</div>
    </section>
  );
}
