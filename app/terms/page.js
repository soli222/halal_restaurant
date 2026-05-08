import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use — Halalgotos',
};

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100">
      <header className="bg-[#111111] border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <span className="font-semibold text-white">Terms of Use</span>
        <div className="w-16" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8 text-sm text-gray-300 leading-relaxed">
        <p className="text-gray-500 text-xs">Last updated: May 2026</p>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Halalgotos ("the Platform"), you agree to be bound by these Terms of Use.
            If you do not agree, please do not use the Platform. We may update these terms at any time —
            continued use of Halalgotos constitutes acceptance of any changes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">2. Platform Description</h2>
          <p>
            Halalgotos is a directory platform that allows users to discover halal-certified restaurants and
            enables restaurant owners to list and manage their business profiles. Halalgotos does not operate
            any restaurants and is not responsible for the quality, accuracy, or conduct of any listed business.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">3. User Accounts</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>You must sign in with a valid Google account to leave reviews, save favourites, or list a restaurant.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must not attempt to access another user's account or impersonate any person or entity.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">4. Restaurant Listings and Halal Verification</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>
              Restaurant owners must submit accurate and truthful information, including valid halal
              certification documents, during the onboarding process.
            </li>
            <li>
              Halalgotos reviews submitted documents as part of a verification process; however, we do not
              guarantee the ongoing accuracy or validity of halal certifications. We are not a halal
              certifying body.
            </li>
            <li>
              Submitting fraudulent, expired, or misleading certification documents may result in permanent
              removal from the Platform and may be reported to relevant authorities.
            </li>
            <li>
              Approved listings may be removed at any time if we determine the information is inaccurate
              or the subscription lapses.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">5. Reviews and User Content</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>Reviews must be honest, fair, and based on genuine experience.</li>
            <li>You must not post false, defamatory, abusive, hateful, or misleading content.</li>
            <li>You must not post content that contains nudity, violence, or illegal material.</li>
            <li>Halalgotos reserves the right to remove any review or content that violates these terms.</li>
            <li>By submitting a review or photo, you grant Halalgotos a non-exclusive licence to display that
            content on the Platform.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">6. Subscriptions and Payments</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>
              Restaurant listings require an active paid subscription (Basic or Pro). A 7-day free trial
              is offered to new subscribers.
            </li>
            <li>
              Payments are processed by Stripe. By subscribing, you agree to Stripe's terms and
              authorise recurring charges.
            </li>
            <li>
              Subscriptions may be cancelled at any time. Your listing remains active until the end of
              the current billing period.
            </li>
            <li>
              We do not offer refunds for partial billing periods unless required by applicable law.
            </li>
            <li>
              Upgrading from Basic to Pro applies at the next billing cycle; no proration is applied.
              Downgrading from Pro to Basic is not supported.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">7. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>Use the Platform for any unlawful purpose.</li>
            <li>Attempt to gain unauthorised access to any part of the Platform or its infrastructure.</li>
            <li>Scrape, crawl, or systematically extract data from the Platform without permission.</li>
            <li>Upload malicious files, scripts, or code.</li>
            <li>Manipulate ratings, reviews, or analytics data.</li>
            <li>Harass, threaten, or abuse other users or restaurant owners.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">8. Limitation of Liability</h2>
          <p>
            Halalgotos is provided "as is" without warranties of any kind, express or implied. To the
            fullest extent permitted by law:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400 mt-2">
            <li>
              We are not liable for any indirect, incidental, special, or consequential damages arising
              from your use of the Platform.
            </li>
            <li>
              We are not responsible for the accuracy of restaurant information, halal certification
              claims, or the quality of food or service at any listed restaurant.
            </li>
            <li>
              We are not liable for any loss arising from reliance on AI-generated review summaries,
              which are automated and may not be fully accurate.
            </li>
          </ul>
          <p className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400">
            <strong className="text-gray-200">Security incidents:</strong> While we implement reasonable
            security measures to protect user data and documents, no online platform can guarantee complete
            protection against cyberattacks, data breaches, or unauthorised access. In the event of a
            security incident — regardless of cause — Halalgotos and its operators shall not be held liable
            for any resulting loss or damage. By using Halalgotos, you acknowledge this risk and agree that
            use of the Platform is at your own risk.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">9. Intellectual Property</h2>
          <p>
            All platform content, branding, and code is owned by Halalgotos or its licensors. You may not
            reproduce, distribute, or create derivative works without prior written permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">10. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to Halalgotos at any time, with or
            without notice, for conduct that violates these Terms or is otherwise harmful to the Platform,
            its users, or third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">11. Governing Law</h2>
          <p>
            These Terms are governed by applicable law. Any disputes shall be resolved through good-faith
            negotiation. If unresolved, disputes shall be subject to the jurisdiction of the courts
            applicable to the Platform's place of operation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">12. Contact</h2>
          <p>
            For any questions about these Terms, contact us at{' '}
            <a href="mailto:halalgotos@gmail.com" className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">halalgotos@gmail.com</a>.
          </p>
        </section>

        <div className="pt-4 border-t border-white/10 flex gap-6 text-xs text-gray-600">
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Use</Link>
        </div>
      </main>
    </div>
  );
}
