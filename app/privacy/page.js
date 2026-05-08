import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Halalgotos',
};

export default function PrivacyPolicy() {
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
        <span className="font-semibold text-white">Privacy Policy</span>
        <div className="w-16" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8 text-sm text-gray-300 leading-relaxed">
        <p className="text-gray-500 text-xs">Last updated: May 2026</p>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">1. Who We Are</h2>
          <p>
            Halalgotos is an online platform that helps users discover halal-certified restaurants and
            allows restaurant owners to list and manage their businesses. Our contact email is{' '}
            <a href="mailto:halalgotos@gmail.com" className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">halalgotos@gmail.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>
              <strong className="text-gray-300">Account information:</strong> Your name, email address, and profile
              photo from Google Sign-In when you create an account.
            </li>
            <li>
              <strong className="text-gray-300">Restaurant owner information:</strong> Business name, address, halal
              certification documents, and payment information (processed by Stripe — we never store card details).
            </li>
            <li>
              <strong className="text-gray-300">Reviews and ratings:</strong> Content you submit when reviewing
              a restaurant.
            </li>
            <li>
              <strong className="text-gray-300">Usage data:</strong> Anonymous page view events to help restaurant
              owners understand their listing performance. No personal data is attached to anonymous views.
            </li>
            <li>
              <strong className="text-gray-300">Uploaded files:</strong> Certification documents and images uploaded
              during the verification process, stored securely in Firebase Storage.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>To operate and provide the Halalgotos platform.</li>
            <li>To verify restaurant halal certification submissions.</li>
            <li>To process subscription payments via Stripe.</li>
            <li>To send email notifications about your listings and reviews (if enabled).</li>
            <li>To improve platform performance and user experience.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">4. Third-Party Services</h2>
          <p>We use the following third-party services to operate Halalgotos:</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li><strong className="text-gray-300">Firebase (Google):</strong> Authentication, database, and file storage.</li>
            <li><strong className="text-gray-300">Stripe:</strong> Payment processing. Stripe's privacy policy governs how your payment data is handled.</li>
            <li><strong className="text-gray-300">Anthropic:</strong> AI-powered review summaries and image moderation.</li>
            <li><strong className="text-gray-300">Resend:</strong> Transactional email delivery.</li>
          </ul>
          <p>
            These services have their own privacy policies. We encourage you to review them. We do not sell
            your personal data to any third party.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">5. Data Security</h2>
          <p>
            We take the security of your data seriously. We implement reasonable technical and organisational
            measures to protect your information, including:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>Encrypted data transmission (HTTPS / TLS).</li>
            <li>Firebase security rules restricting access to authorised users only.</li>
            <li>Server-side token verification on all sensitive API endpoints.</li>
            <li>Role-based access control — only admin accounts can access verification documents.</li>
            <li>Image content moderation before storage.</li>
          </ul>
          <p className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400">
            <strong className="text-gray-200">Limitation of liability:</strong> While we do our best to protect
            your data, no system is completely immune to security threats. In the event of a data breach,
            cyberattack, or unauthorised access — whether caused by external actors, technical failure, or
            any other reason beyond our reasonable control — Halalgotos and its operators shall not be held
            liable for any resulting loss, damage, or harm. By using this platform, you acknowledge and accept
            this inherent risk of online services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide services.
            You may request deletion of your account and associated data by contacting us at{' '}
            <a href="mailto:halalgotos@gmail.com" className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">halalgotos@gmail.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-400">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and data.</li>
            <li>Withdraw consent at any time (e.g. by deleting your account).</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:halalgotos@gmail.com" className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">halalgotos@gmail.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">8. Cookies</h2>
          <p>
            Halalgotos does not use tracking or advertising cookies. Firebase Auth may use session cookies
            strictly necessary for authentication. No third-party advertising networks are used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with
            an updated date. Continued use of Halalgotos after changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">10. Contact</h2>
          <p>
            For any privacy-related questions, contact us at{' '}
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
