import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Boredflix',
  description: 'Terms of Service for Boredflix - Understand the terms and conditions for using our streaming platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-8">Terms of Service</h1>
          <div className="prose prose-invert max-w-none">
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-300 mb-2">Last Updated: June 14, 2025</h2>
              <p className="text-gray-300">
                These Terms of Service ("Terms") govern your use of Boredflix and the services we provide. By using our platform, you agree to these terms.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing or using Boredflix, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our service.
              </p>
              <p className="text-gray-300">
                We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Description</h2>
              <p className="text-gray-300 mb-4">
                Boredflix is a streaming aggregation platform that provides access to movies, TV shows, and other video content from various third-party sources.
              </p>
              
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-red-300 mb-2">Important Disclaimer</h3>
                <p className="text-red-200">
                  Boredflix does not host, store, or upload any video content. All content is sourced from third-party providers. We act solely as an aggregation service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">User Eligibility</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>You must be at least 13 years old to use this service</li>
                <li>Users under 18 must have parental consent</li>
                <li>You must provide accurate registration information</li>
                <li>You are responsible for maintaining account security</li>
                <li>One account per user; sharing accounts is prohibited</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-gray-200 mb-3">Permitted Uses</h3>
              <ul className="list-disc list-inside text-gray-300 mb-6 space-y-2">
                <li>Personal, non-commercial streaming of available content</li>
                <li>Creating watchlists and managing your library</li>
                <li>Participating in community features (ratings, reviews)</li>
                <li>Using the platform in accordance with applicable laws</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-200 mb-3">Prohibited Activities</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Attempting to download or redistribute content</li>
                <li>Using automated tools or bots to access the service</li>
                <li>Circumventing technical limitations or security measures</li>
                <li>Uploading malicious code or viruses</li>
                <li>Impersonating other users or entities</li>
                <li>Violating intellectual property rights</li>
                <li>Using the service for commercial purposes without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
              <p className="text-gray-300 mb-4">
                The Boredflix platform, including its design, code, and original content, is protected by intellectual property laws. Content accessed through our platform remains the property of their respective owners.
              </p>
              <p className="text-gray-300">
                We respect intellectual property rights and respond to valid DMCA takedown notices. If you believe your content has been used without permission, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Content</h2>
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-200">
                  <strong>Content Disclaimer:</strong> We do not control third-party content and are not responsible for its accuracy, legality, or availability.
                </p>
              </div>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Third-party content may be subject to separate terms and licenses</li>
                <li>Content availability may change without notice</li>
                <li>We are not liable for content quality or interruptions</li>
                <li>Users are responsible for complying with content licensing terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Privacy and Data</h2>
              <p className="text-gray-300 mb-4">
                Your privacy is important to us. Please review our <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a> to understand how we collect, use, and protect your information.
              </p>
              <p className="text-gray-300">
                By using our service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                <li>Maintenance and updates may temporarily affect availability</li>
                <li>We reserve the right to modify or discontinue features</li>
                <li>Geographic restrictions may apply to certain content</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
              <p className="text-gray-300 mb-4">
                Boredflix is provided "as is" without warranties of any kind. We are not liable for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Damages arising from use or inability to use the service</li>
                <li>Third-party content or external website interactions</li>
                <li>Data loss, service interruptions, or security breaches</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Indemnification</h2>
              <p className="text-gray-300">
                You agree to indemnify and hold harmless Boredflix and its operators from any claims, damages, or expenses arising from your use of the service or violation of these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
              <p className="text-gray-300 mb-4">
                We may terminate or suspend your account at any time for violation of these terms or for any other reason. You may also delete your account at any time.
              </p>
              <p className="text-gray-300">
                Upon termination, your access to the service will cease, but certain provisions of these terms will survive termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Governing Law</h2>
              <p className="text-gray-300">
                These Terms are governed by the laws of the jurisdiction where Boredflix operates. Any disputes will be resolved through binding arbitration or in appropriate courts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
              <p className="text-gray-300 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-white">Email: legal@boredflix.com</p>
                <p className="text-white">Contact Form: <a href="/contact" className="text-blue-400 hover:text-blue-300">boredflix.com/contact</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
