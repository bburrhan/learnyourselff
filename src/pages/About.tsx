import React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Users, Globe, Award, Heart, Target } from 'lucide-react'

const About: React.FC = () => {
  const { t } = useTranslation()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About LearnYourself
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            We believe that everyone deserves access to quality education, regardless of their economic situation or location.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              To democratize access to quality education by providing affordable, high-quality digital courses 
              that empower individuals worldwide to learn new skills and advance their careers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Accessibility</h3>
              <p className="text-gray-600">
                Making quality education accessible to everyone, especially those in underserved communities 
                with limited resources.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality</h3>
              <p className="text-gray-600">
                Curating high-quality courses from expert instructors who bring real-world experience 
                and proven methodologies.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Impact</h3>
              <p className="text-gray-600">
                Creating meaningful impact by helping learners acquire skills that improve their 
                career prospects and quality of life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  LearnYourself was born from a simple observation: while the internet has made information 
                  more accessible than ever, quality educational content often remains behind expensive paywalls 
                  or locked within institutions.
                </p>
                <p>
                  We recognized that many talented individuals around the world have the motivation to learn 
                  but lack the financial means to access premium educational content. This inequality in 
                  educational access perpetuates socioeconomic disparities.
                </p>
                <p>
                  Our platform bridges this gap by offering carefully curated, high-quality courses at prices 
                  that are accessible to learners regardless of their economic background. We work directly 
                  with expert instructors to create comprehensive, practical courses that deliver real value.
                </p>
                <p>
                  Today, we're proud to serve thousands of learners across multiple countries and languages, 
                  helping them acquire new skills, advance their careers, and pursue their passions.
                </p>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg"
                alt="Students learning online"
                className="rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              These core values guide everything we do and every decision we make.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Education First</h3>
              <p className="text-gray-300 text-sm">
                We prioritize educational value over profit, ensuring every course delivers genuine learning outcomes.
              </p>
            </div>

            <div className="text-center">
              <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-300 text-sm">
                Building a global community of learners who support and inspire each other.
              </p>
            </div>

            <div className="text-center">
              <Globe className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Inclusivity</h3>
              <p className="text-gray-300 text-sm">
                Creating an inclusive platform that welcomes learners from all backgrounds and circumstances.
              </p>
            </div>

            <div className="text-center">
              <Award className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Excellence</h3>
              <p className="text-gray-300 text-sm">
                Continuously improving our platform and content to provide the best learning experience possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our diverse team is passionate about education and committed to making learning accessible to everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Founder & CEO",
                bio: "Former educator with 15 years of experience in online learning platforms.",
                image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg"
              },
              {
                name: "Michael Chen",
                role: "Head of Content",
                bio: "Curriculum designer passionate about creating engaging educational experiences.",
                image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg"
              },
              {
                name: "Elena Rodriguez",
                role: "Community Manager",
                bio: "Dedicated to building connections and supporting our global learning community.",
                image: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg"
              }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  loading="lazy"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join Our Mission
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you're a learner looking to acquire new skills or an instructor wanting to share your knowledge, 
            we invite you to be part of our growing community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/courses"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Learning Today
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About