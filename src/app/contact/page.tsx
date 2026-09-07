import { Metadata } from 'next';
import { Mail, MessageCircle, Shield, Bug, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | Boredflix',
  description: 'Get in touch with the Boredflix team. Report issues, provide feedback, or ask questions about our streaming service.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-8">Contact Us</h1>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Get in Touch</h2>
            <p className="text-gray-300">
              We'd love to hear from you! Whether you have questions, feedback, or need support, our team is here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Contact Methods */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">How to Reach Us</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Email Support</h3>
                    <p className="text-gray-300 mb-2">For general inquiries and support</p>
                    <a 
                      href="mailto:support@boredflix.com" 
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      support@boredflix.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                  <Bug className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Report Issues</h3>
                    <p className="text-gray-300 mb-2">Technical problems or bugs</p>
                    <a 
                      href="mailto:bugs@boredflix.com" 
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      bugs@boredflix.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Feedback</h3>
                    <p className="text-gray-300 mb-2">Suggestions and feature requests</p>
                    <a 
                      href="mailto:feedback@boredflix.com" 
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      feedback@boredflix.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                  <Shield className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">Security & Privacy</h3>
                    <p className="text-gray-300 mb-2">Security concerns and privacy inquiries</p>
                    <a 
                      href="mailto:security@boredflix.com" 
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      security@boredflix.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Send us a Message</h2>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a topic</option>
                    <option value="support">General Support</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="feedback">Feedback</option>
                    <option value="privacy">Privacy Concern</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Send Message
                </button>
              </form>

              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  <strong>Note:</strong> This is a demo form. In a production environment, this would be connected to a backend service to handle form submissions.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="border-t border-gray-700 pt-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-700/30 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">How quickly will you respond to my message?</h3>
                <p className="text-gray-300">
                  We aim to respond to all inquiries within 24-48 hours during business days. For urgent technical issues, we prioritize responses and typically reply within a few hours.
                </p>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">What information should I include when reporting a bug?</h3>
                <p className="text-gray-300">
                  Please include your browser type and version, operating system, steps to reproduce the issue, and any error messages you see. Screenshots or screen recordings are also very helpful.
                </p>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">Can I suggest new features or content?</h3>
                <p className="text-gray-300">
                  Absolutely! We love hearing from our users about features they'd like to see or content they'd like us to add. Send your suggestions to our feedback email.
                </p>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">Do you offer live chat support?</h3>
                <p className="text-gray-300">
                  Currently, we provide support primarily through email. We're working on implementing live chat features for the future to provide even better support.
                </p>
              </div>
            </div>
          </div>

          {/* Response Time Notice */}
          <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Response Times</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <strong className="text-white">General Inquiries:</strong> 24-48 hours
              </div>
              <div>
                <strong className="text-white">Technical Issues:</strong> 2-6 hours
              </div>
              <div>
                <strong className="text-white">Security Concerns:</strong> 1-2 hours
              </div>
              <div>
                <strong className="text-white">Feature Requests:</strong> 3-5 business days
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
