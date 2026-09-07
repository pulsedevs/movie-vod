import { Metadata } from 'next';
import { Film, Users, Shield, Zap, Heart, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Boredflix',
  description: 'Learn about Boredflix - your ultimate destination for streaming movies, TV shows, and anime. Discover our mission and values.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-800 rounded-lg p-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-8">About Boredflix</h1>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Your Gateway to Entertainment</h2>
            <p className="text-gray-300">
              Boredflix is your ultimate destination for streaming movies, TV shows, and anime. We're passionate about bringing you the best entertainment experience, whenever and wherever you want it.
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Our Mission</h2>
            <div className="bg-gray-700/30 rounded-lg p-6">
              <p className="text-gray-300 text-lg leading-relaxed">
                We believe entertainment should be accessible, enjoyable, and tailored to your preferences. Our mission is to create a platform that connects you with the content you love while discovering new favorites along the way.
              </p>
            </div>
          </section>

          {/* What We Offer */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                <Film className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Vast Content Library</h3>
                  <p className="text-gray-300">
                    Access thousands of movies, TV shows, and anime series across all genres and languages.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                <Zap className="w-8 h-8 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">High-Quality Streaming</h3>
                  <p className="text-gray-300">
                    Enjoy crisp, high-definition content with adaptive streaming for the best viewing experience.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                <Users className="w-8 h-8 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Personalized Experience</h3>
                  <p className="text-gray-300">
                    Smart recommendations based on your viewing history and preferences.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-gray-700/50 rounded-lg">
                <Globe className="w-8 h-8 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Global Content</h3>
                  <p className="text-gray-300">
                    Discover content from around the world with subtitles and multiple language options.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Our Values</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-6 bg-gray-700/30 rounded-lg">
                <Heart className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">User-Centric</h3>
                  <p className="text-gray-300">
                    Everything we do is designed with our users in mind. Your feedback shapes our platform and helps us improve continuously.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-gray-700/30 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">Privacy & Security</h3>
                  <p className="text-gray-300">
                    We take your privacy seriously and implement robust security measures to protect your data and ensure a safe streaming environment.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-gray-700/30 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">Innovation</h3>
                  <p className="text-gray-300">
                    We constantly evolve and adopt new technologies to enhance your streaming experience and stay ahead of the curve.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Platform Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <h4 className="font-medium text-white mb-2">Watch Parties</h4>
                <p className="text-sm text-gray-300">Watch together with friends in real-time</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <h4 className="font-medium text-white mb-2">Personal Library</h4>
                <p className="text-sm text-gray-300">Save your favorite content for later</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <h4 className="font-medium text-white mb-2">Smart Search</h4>
                <p className="text-sm text-gray-300">Find content quickly with advanced filters</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <h4 className="font-medium text-white mb-2">Multiple Genres</h4>
                <p className="text-sm text-gray-300">Action, Drama, Comedy, Anime, and more</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <h4 className="font-medium text-white mb-2">Mobile Friendly</h4>
                <p className="text-sm text-gray-300">Optimized for all devices and screen sizes</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <h4 className="font-medium text-white mb-2">Regular Updates</h4>
                <p className="text-sm text-gray-300">Fresh content added regularly</p>
              </div>
            </div>
          </section>

          {/* Technology Stack */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Built with Modern Technology</h2>
            <div className="bg-gray-700/30 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Boredflix is built using cutting-edge web technologies to ensure fast, reliable, and scalable performance:
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded p-3 text-center">
                  <div className="font-medium text-white">Next.js 14</div>
                  <div className="text-gray-400">React Framework</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 text-center">
                  <div className="font-medium text-white">TypeScript</div>
                  <div className="text-gray-400">Type Safety</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 text-center">
                  <div className="font-medium text-white">Tailwind CSS</div>
                  <div className="text-gray-400">Modern Styling</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3 text-center">
                  <div className="font-medium text-white">Supabase</div>
                  <div className="text-gray-400">Backend Services</div>
                </div>
              </div>
            </div>
          </section>

          {/* Legal Notice */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Important Notice</h2>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-300 mb-3">Content Sourcing</h3>
              <p className="text-gray-300 mb-4">
                Boredflix does not host or store any media files. All content is sourced from third-party services and platforms. We act as an aggregator and streaming interface, connecting users with publicly available content sources.
              </p>
              <p className="text-gray-300">
                We respect intellectual property rights and comply with all applicable laws and regulations, including DMCA guidelines. If you have concerns about content availability or copyright issues, please contact us through our support channels.
              </p>
            </div>
          </section>

          {/* Community */}
          <section className="border-t border-gray-700 pt-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Join Our Community</h2>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Boredflix is more than just a streaming platform - it's a community of entertainment enthusiasts. Whether you're a movie buff, TV series addict, or anime fan, you'll find like-minded viewers here.
              </p>
              <p className="text-gray-300">
                Share your thoughts, discover new content through recommendations, and join watch parties with friends from around the world. Together, we're building the future of entertainment.
              </p>
            </div>
          </section>

          {/* Contact Call-to-Action */}
          <div className="mt-8 text-center">
            <p className="text-gray-300 mb-4">
              Have questions or want to learn more? We'd love to hear from you!
            </p>
            <a 
              href="/contact" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
