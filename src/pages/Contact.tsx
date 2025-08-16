import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Send, MessageCircle, HelpCircle, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type ContactForm = z.infer<typeof contactSchema>

const Contact: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    setLoading(true)
    try {
      // In a real application, you would send this to your backend
      console.log('Contact form submission:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      reset()
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('contactUs')}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question, suggestion, or need support? We'd love to hear from you. Get in touch and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('getInTouch')}</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{t('email')}</p>
                    <p className="text-sm text-gray-600">support@learnyourself.co</p>
                    <p className="text-sm text-gray-600">hello@learnyourself.co</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{t('phone')}</p>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{t('office')}</p>
                    <p className="text-sm text-gray-600">
                      123 Education Street<br />
                      Learning District<br />
                      Knowledge City, KC 12345
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t('commonQuestions')}
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 text-blue-600" />
                    {t('howDownloadCourse')}
                  </h4>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    {t('howDownloadCourseAnswer')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 text-blue-600" />
                    {t('refundPolicy')}
                  </h4>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    {t('refundPolicyAnswer')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 text-blue-600" />
                    {t('offerCertificates')}
                  </h4>
                  <p className="text-sm text-gray-600 ml-6 mt-1">
                    {t('offerCertificatesAnswer')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {t('sendMessage')}
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('fullName')}
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emailAddress')}
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('subject')}
                  </label>
                  <input
                    {...register('subject')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What is this regarding?"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('message')}
                  </label>
                  <textarea
                    {...register('message')}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide details about your inquiry..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {loading ? (
                    t('sendingMessage')
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t('sendMessage')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Additional Support Options */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {t('otherWaysHelp')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('liveChat')}</h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('getLiveChat')}
              </p>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                {t('startChat')}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <HelpCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('helpCenter')}</h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('browseHelpCenter')}
              </p>
              <button className="text-green-600 hover:text-green-700 font-medium">
                {t('visitHelpCenter')}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('community')}</h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('joinCommunity')}
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium">
                {t('joinCommunityBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact