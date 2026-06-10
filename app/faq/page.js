import Link from 'next/link';

export const metadata = {
  title: 'FAQ — Halalgotos',
  description: 'Frequently asked questions about Halalgotos — the halal restaurant directory.',
};

const FAQS = [
  {
    section: 'General',
    items: [
      {
        q: 'What is Halalgotos?',
        a: 'Halalgotos is an online directory of halal-certified restaurants. Every listing on the platform has been verified — restaurant owners must submit their halal certification documents before their listing goes live. Customers can browse restaurants, read community reviews, and leave their own ratings.',
      },
      {
        q: 'Is Halalgotos free to use for customers?',
        a: 'Yes, completely free. Browsing restaurants, reading reviews, and leaving reviews costs nothing. There is no account required to browse — you only need to sign in (via Google) if you want to leave a review or save favourites.',
      },
      {
        q: 'How do I search for restaurants near me?',
        a: 'Use the search bar on the homepage to search by restaurant name, cuisine, or keyword. You can narrow results using the location filter (city, state, or ZIP code), the cuisine filter pills, and the "Open Now" toggle. Results can also be sorted by rating, most reviewed, or newest.',
      },
      {
        q: 'What do the rating labels mean?',
        a: 'Instead of a numeric star system, Halalgotos uses three descriptive ratings: Excellent, Good, and Average. We find these give a clearer picture of the overall dining experience.',
      },
    ],
  },
  {
    section: 'Halal Verification',
    items: [
      {
        q: 'How does Halalgotos verify that a restaurant is halal?',
        a: 'Restaurant owners submit their halal certification documents, certifying body, and certificate number during onboarding. Our admin team reviews the submission — including the certifying body, certificate number, and expiry date — before approving the listing. Only approved listings appear on the platform.',
      },
      {
        q: 'What does the "Cert Expired" badge mean?',
        a: 'It means the halal certificate on file for that restaurant has passed its expiry date. We display this transparently so customers can make an informed decision. The restaurant owner has been notified and needs to submit updated certification.',
      },
      {
        q: 'What does "Expiring Soon" mean?',
        a: 'The restaurant\'s halal certificate is within 30 days of its expiry date. The listing is still active, but the owner should renew their certification shortly.',
      },
      {
        q: 'Can I trust that every listed restaurant is truly halal?',
        a: 'We do our best to verify every listing by reviewing submitted certification documents and cross-checking with the certifying body where possible. That said, Halalgotos is a directory platform — we verify certification documents but cannot conduct on-site inspections. We always recommend checking directly with the restaurant if you have specific concerns.',
      },
    ],
  },
  {
    section: 'Reviews',
    items: [
      {
        q: 'How do I leave a review?',
        a: 'Open any restaurant listing and scroll to the Reviews section. Sign in with your Google account, choose a rating, write your comment, and optionally add a photo. Once submitted your review is live immediately.',
      },
      {
        q: 'Can I add a photo to my review?',
        a: 'Yes. You can attach one photo per review. All uploaded photos go through automated content moderation before being displayed — inappropriate images are rejected.',
      },
      {
        q: 'Can I report a review that seems fake or inappropriate?',
        a: 'Yes. On any review there is a report option. Reported reviews are flagged for our admin team to investigate. We take fake or abusive reviews seriously and will remove any that violate our guidelines.',
      },
      {
        q: 'Can restaurant owners reply to reviews?',
        a: 'Yes. Verified restaurant owners can post a single public reply to any review on their listing directly from their owner dashboard.',
      },
    ],
  },
  {
    section: 'Restaurant Owners',
    items: [
      {
        q: 'How do I list my restaurant on Halalgotos?',
        a: 'Click "List my restaurant" on the homepage and follow the five-step onboarding flow. You\'ll provide your restaurant details, halal certification information, and supporting documents. You don\'t need to create an account upfront — you sign in with Google at the final step before submitting.',
      },
      {
        q: 'What documents do I need to submit?',
        a: 'You will need: (1) your Halal Certificate issued by a recognised certifying body, (2) a Business License, and (3) a Health Permit or Food Safety Certificate. Documents can be uploaded as JPG, PNG, or PDF files up to 5 MB each.',
      },
      {
        q: 'How long does the verification review take?',
        a: 'Our team reviews submissions within 7 business days. You will receive an in-app notification when your listing is approved or if further information is needed.',
      },
      {
        q: 'How much does it cost to list my restaurant?',
        a: 'There are two plans: Basic at $30/month and Pro at $50/month. Both include a 7-day free trial — no credit card charge until the trial ends. Pro includes an AI-powered analytics report in addition to everything in Basic.',
      },
      {
        q: 'Can I upgrade or cancel my subscription?',
        a: 'Yes. You can upgrade from Basic to Pro at any time from your owner dashboard — the Pro rate takes effect at your next billing cycle with no proration charge today. You can cancel at any time; your listing stays visible until the end of the current billing period. Downgrading from Pro to Basic is not currently supported.',
      },
      {
        q: 'What happens to my listing if I cancel?',
        a: 'Your listing is hidden from the public directory once your paid period ends. There is a 2-day grace window after cancellation during which you can re-subscribe without losing your listing data.',
      },
      {
        q: 'Can I edit my restaurant profile after it goes live?',
        a: 'Yes. From your owner dashboard you can update your restaurant description, opening hours, website, Google Maps link, and cover photo at any time.',
      },
    ],
  },
  {
    section: 'Account & Privacy',
    items: [
      {
        q: 'How do I sign in?',
        a: 'Halalgotos uses Google Sign-In only — there are no separate usernames or passwords to manage. You\'ll be prompted to sign in when you try to leave a review, save a favourite, or list your restaurant.',
      },
      {
        q: 'How is my data handled?',
        a: 'We collect only the information needed to operate the platform. We do not sell your personal data to third parties. For full details, please read our Privacy Policy.',
      },
      {
        q: 'How do I contact Halalgotos?',
        a: 'You can reach us by email at halalgotos@gmail.com. We aim to respond within 2 business days.',
      },
    ],
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100">
      {/* Header */}
      <header className="bg-[#111111] border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Halalgotos
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-14">
        {/* Page heading */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-xs font-semibold mb-4">
            ☪️ Help Center
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h1>
          <p className="mt-3 text-gray-500 text-sm">Can't find what you're looking for? Email us at{' '}
            <a href="mailto:halalgotos@gmail.com" className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">
              halalgotos@gmail.com
            </a>
          </p>
        </div>

        {/* FAQ sections */}
        <div className="space-y-12">
          {FAQS.map(({ section, items }) => (
            <div key={section}>
              <h2 className="text-xs font-bold text-green-500 uppercase tracking-widest mb-5">{section}</h2>
              <div className="space-y-3">
                {items.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-white/[0.03] transition-colors">
                      <span className="text-sm font-semibold text-white">{q}</span>
                      <svg
                        className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-45"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-5">
                      <div className="h-px bg-white/[0.06] mb-4" />
                      <p className="text-sm text-gray-400 leading-relaxed">{a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center border border-white/[0.06] rounded-2xl p-8 bg-[#111111]">
          <p className="text-sm font-semibold text-white mb-1">Still have questions?</p>
          <p className="text-xs text-gray-500 mb-4">We're happy to help. Send us an email and we'll get back to you.</p>
          <a
            href="mailto:halalgotos@gmail.com"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 active:scale-95 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            halalgotos@gmail.com
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-8 px-5 py-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Halalgotos. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
