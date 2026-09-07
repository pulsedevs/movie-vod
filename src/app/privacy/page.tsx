import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Boredflix',
  description: 'Privacy Policy for Boredflix - Learn how we protect your privacy while you stream movies and TV shows.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-8">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none">
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-300 mb-2">Last Updated: June 14, 2025</h2>
              <p className="text-gray-300">
                This Privacy Policy explains how Boredflix ("we," "our," or "us") collects, uses, and protects your information when you use our streaming service.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-200 mb-3">Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>Account registration information (email, username)</li>
                <li>Profile preferences and settings</li>
                <li>Watch history and viewing preferences</li>
                <li>Ratings and reviews you submit</li>
                <li>Contact form submissions</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-200 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Usage analytics and interaction data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>To provide and improve our streaming service</li>
                <li>To personalize content recommendations</li>
                <li>To communicate with you about service updates</li>
                <li>To analyze usage patterns and improve user experience</li>
                <li>To prevent fraud and ensure service security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
              <p className="text-gray-300 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>With service providers who assist in operating our platform</li>
                <li>When required by law or legal process</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Content</h2>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-200">
                  <strong>Important Notice:</strong> Boredflix aggregates content from third-party sources. When you access external content, you may be subject to the privacy policies of those third-party providers.
                </p>
              </div>
              <p className="text-gray-300">
                We recommend reviewing the privacy policies of any third-party services you interact with through our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure hosting infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="text-gray-300 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of certain data collection</li>
                <li>Download your data in a portable format</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking</h2>
              <p className="text-gray-300 mb-4">
                We use cookies and similar technologies to enhance your experience. You can control cookie settings through your browser preferences.
              </p>
              <p className="text-gray-300">
                Essential cookies are required for basic functionality, while optional cookies help us improve our service and provide personalized recommendations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <p className="text-gray-300">
                Boredflix is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-white">Email: privacy@boredflix.com</p>
                <p className="text-white">Contact Form: <a href="/contact" className="text-blue-400 hover:text-blue-300">boredflix.com/contact</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
