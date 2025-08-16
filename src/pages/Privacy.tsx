import React from 'react'
import { Shield, Lock, Eye, Database, Mail, Globe } from 'lucide-react'

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: January 15, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <div>
            <p className="text-gray-600 mb-6">
              At LearnYourself ("we," "our," or "us"), we are committed to protecting your privacy and 
              ensuring the security of your personal information. This Privacy Policy explains how we 
              collect, use, and safeguard your information when you use our platform.
            </p>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Information We Collect</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Name and email address when you create an account</li>
                  <li>Payment information processed securely through Stripe</li>
                  <li>Profile information you choose to provide</li>
                  <li>Communication preferences and language settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Information</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Courses you view, purchase, and download</li>
                  <li>Platform navigation and interaction patterns</li>
                  <li>Device information and browser type</li>
                  <li>IP address and approximate location</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Eye className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">How We Use Your Information</h2>
            </div>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Provide and maintain our educational platform</li>
              <li>Process payments and deliver purchased courses</li>
              <li>Send transactional emails about your purchases</li>
              <li>Improve our platform based on usage analytics</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Comply with legal obligations and prevent fraud</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Globe className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Information Sharing</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              We do not sell, trade, or rent your personal information. We may share information with:
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Service Providers:</strong> Stripe for payment processing, Supabase for data storage</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition</li>
              <li><strong>Your Consent:</strong> When you explicitly agree to sharing</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Data Security</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and monitoring</li>
              <li>Secure payment processing through Stripe</li>
              <li>Access controls and authentication measures</li>
              <li>Regular backups and disaster recovery procedures</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-orange-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Your Rights</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              You have the following rights regarding your personal information:
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            
            <p className="text-gray-600 mb-4">
              We use cookies and similar technologies to enhance your experience:
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            
            <p className="text-gray-600 mt-4">
              You can control cookie settings through your browser preferences.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Transfers</h2>
            
            <p className="text-gray-600">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data during such transfers, 
              in compliance with applicable data protection laws.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibent text-gray-900 mb-4">Children's Privacy</h2>
            
            <p className="text-gray-600">
              Our platform is not intended for children under 13 years of age. We do not knowingly 
              collect personal information from children under 13. If you believe we have collected 
              information from a child under 13, please contact us immediately.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to This Policy</h2>
            
            <p className="text-gray-600">
              We may update this Privacy Policy periodically to reflect changes in our practices or 
              legal requirements. We will notify you of significant changes by email or through our platform. 
              Your continued use of our services after such changes indicates your acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600">
                <strong>Email:</strong> privacy@learnyourself.co<br />
                <strong>Address:</strong> 123 Education Street, Learning District, Knowledge City, KC 12345<br />
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy