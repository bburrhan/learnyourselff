import React from 'react'
import { FileText, Scale, AlertCircle, CreditCard, Shield, Users } from 'lucide-react'

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: January 15, 2025
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <div>
            <p className="text-gray-600 mb-6">
              Welcome to LearnYourself ("we," "our," or "us"). These Terms of Service ("Terms") 
              govern your use of our platform and services. By accessing or using our platform, 
              you agree to be bound by these Terms.
            </p>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Acceptance of Terms</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              By creating an account, making a purchase, or using our platform, you acknowledge 
              that you have read, understood, and agree to these Terms. If you do not agree with 
              any part of these Terms, you may not use our services.
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>You must be at least 18 years old to use our services</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You agree to provide accurate and complete information</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <CreditCard className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Purchases and Payments</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Course Purchases</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>All course prices are clearly displayed before purchase</li>
                  <li>Payments are processed securely through Stripe</li>
                  <li>You will receive a confirmation email after successful payment</li>
                  <li>Course access is granted immediately upon payment confirmation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Refund Policy</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>30-day money-back guarantee on all course purchases</li>
                  <li>Refunds will be processed to the original payment method</li>
                  <li>Digital content that has been downloaded may still be eligible for refund</li>
                  <li>Contact support@learnyourself.co to request a refund</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Intellectual Property</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Course Content</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>All course materials are protected by copyright and other intellectual property laws</li>
                  <li>You may download and use course materials for personal learning purposes only</li>
                  <li>Redistribution, resale, or sharing of course content is strictly prohibited</li>
                  <li>Violating these terms may result in account termination and legal action</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Content</h3>
                <p className="text-gray-600">
                  The LearnYourself platform, including its design, functionality, and branding, 
                  is owned by us and protected by intellectual property laws. You may not copy, 
                  modify, or create derivative works without our express written permission.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <Scale className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">User Conduct</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              You agree to use our platform responsibly and in accordance with these Terms. 
              The following activities are prohibited:
            </p>
            
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Violating any applicable laws or regulations</li>
              <li>Infringing on intellectual property rights</li>
              <li>Attempting to hack, disrupt, or compromise platform security</li>
              <li>Creating fake accounts or providing false information</li>
              <li>Sharing login credentials with others</li>
              <li>Using automated tools to access or scrape content</li>
              <li>Engaging in any activity that could harm other users</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-orange-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Disclaimers and Limitations</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Educational Content</h3>
                <p className="text-gray-600">
                  While we strive to provide high-quality educational content, we make no guarantees 
                  about specific learning outcomes or career advancement. The effectiveness of any 
                  course depends on individual effort and circumstances.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Availability</h3>
                <p className="text-gray-600">
                  We aim to maintain platform availability but cannot guarantee uninterrupted access. 
                  We may need to suspend services for maintenance, updates, or unforeseen circumstances.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Third-Party Services</h3>
                <p className="text-gray-600">
                  Our platform integrates with third-party services (such as Stripe for payments). 
                  We are not responsible for the availability, functionality, or policies of these services.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Termination</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">By You</h3>
                <p className="text-gray-600">
                  You may delete your account at any time through your account settings or by 
                  contacting our support team. Upon account deletion, you will lose access to 
                  any purchased courses and account data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">By Us</h3>
                <p className="text-gray-600">
                  We reserve the right to suspend or terminate accounts that violate these Terms, 
                  engage in fraudulent activity, or pose a risk to our platform or other users. 
                  In such cases, refunds may not be provided.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy and Data</h2>
            
            <p className="text-gray-600">
              Your privacy is important to us. Please review our Privacy Policy to understand 
              how we collect, use, and protect your personal information. By using our services, 
              you consent to our data practices as described in our Privacy Policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Updates to Terms</h2>
            
            <p className="text-gray-600">
              We may update these Terms from time to time to reflect changes in our services, 
              legal requirements, or business practices. We will notify users of significant 
              changes via email or platform notification. Continued use of our services after 
              such changes constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
            
            <p className="text-gray-600">
              These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction]. 
              Any disputes arising from these Terms or your use of our services will be resolved 
              through binding arbitration or in the courts of [Your Jurisdiction].
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600">
                <strong>Email:</strong> legal@learnyourself.co<br />
                <strong>Address:</strong> 123 Education Street, Learning District, Knowledge City, KC 12345<br />
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 text-center">
              By using LearnYourself, you acknowledge that you have read and understood these Terms of Service 
              and agree to be bound by them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms