import React from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Users, Globe, Award, Heart, Target } from 'lucide-react'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import useSeo from '../hooks/useSeo'

const About: React.FC = () => {
  const { t } = useTranslation()

  useSeo({
    title: t('about'),
    description: t('aboutHeroDesc'),
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-royal-blue-600 to-royal-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t('aboutTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-royal-blue-100 mb-8 max-w-3xl mx-auto">
            {t('aboutHeroDesc')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('ourMission')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('ourMissionDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-royal-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-royal-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('accessibility')}</h3>
              <p className="text-gray-600">{t('accessibilityDesc')}</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('quality')}</h3>
              <p className="text-gray-600">{t('qualityDesc')}</p>
            </div>

            <div className="text-center">
              <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">{t('impact')}</h3>
              <p className="text-gray-600">{t('impactDesc')}</p>
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
                {t('ourStory')}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>{t('ourStoryP1')}</p>
                <p>{t('ourStoryP2')}</p>
                <p>{t('ourStoryP3')}</p>
                <p>{t('ourStoryP4')}</p>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg"
                alt="Students learning online"
                className="rounded-xl shadow-lg w-full object-cover"
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
              {t('ourValues')}
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {t('ourValuesDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-royal-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('educationFirst')}</h3>
              <p className="text-gray-300 text-sm">{t('educationFirstDesc')}</p>
            </div>

            <div className="text-center">
              <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('communityValue')}</h3>
              <p className="text-gray-300 text-sm">{t('communityValueDesc')}</p>
            </div>

            <div className="text-center">
              <Globe className="h-12 w-12 text-royal-blue-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('inclusivity')}</h3>
              <p className="text-gray-300 text-sm">{t('inclusivityDesc')}</p>
            </div>

            <div className="text-center">
              <Award className="h-12 w-12 text-warm-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('excellence')}</h3>
              <p className="text-gray-300 text-sm">{t('excellenceDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('meetOurTeam')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('meetOurTeamDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                roleKey: "founderCEO",
                bioKey: "founderBio",
                image: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg"
              },
              {
                name: "Michael Chen",
                roleKey: "headOfContent",
                bioKey: "headContentBio",
                image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg"
              },
              {
                name: "Elena Rodriguez",
                roleKey: "communityManager",
                bioKey: "communityManagerBio",
                image: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg"
              }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-md"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg'
                  }}
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-royal-blue-600 font-medium mb-2">{t(member.roleKey)}</p>
                <p className="text-gray-600 text-sm">{t(member.bioKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-royal-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('joinOurMission')}
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('joinOurMissionDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <LanguageAwareLink
              to="/courses"
              className="inline-flex items-center justify-center px-8 py-3 bg-royal-blue-600 text-white rounded-xl font-semibold hover:bg-royal-blue-700 transition-colors"
            >
              {t('startLearningToday')}
            </LanguageAwareLink>
            <LanguageAwareLink
              to="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-royal-blue-600 text-royal-blue-600 rounded-xl font-semibold hover:bg-royal-blue-600 hover:text-white transition-colors"
            >
              {t('getInTouchBtn')}
            </LanguageAwareLink>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About