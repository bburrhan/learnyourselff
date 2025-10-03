import React from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useCourses } from '../hooks/useCourses'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import LanguageAwareLink from '../components/Layout/LanguageAwareLink'
import { 
  ArrowRight, 
  Clock, 
  DollarSign, 
  Sparkles, 
  Star,
  CheckCircle,
  Play,
  Users,
  TrendingUp,
  Heart,
  Briefcase,
  Brain,
  Baby,
  Zap
} from 'lucide-react'

const Home: React.FC = () => {
  const { t } = useTranslation()
  const { courses: sampleCourses, loading: sampleLoading } = useCourses({ priceRange: [0, 10] })

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const transformationStories = [
    {
      beforeKey: "alwaysBroke",
      afterKey: "saved50Month",
      categoryKey: "money"
    },
    {
      beforeKey: "noSideIncome",
      afterKey: "earned10Online",
      categoryKey: "income"
    },
    {
      beforeKey: "constantStress",
      afterKey: "sleepingBetter",
      categoryKey: "wellness"
    }
  ]

  const lifeCategories = [
    { titleKey: "saveMoney", icon: DollarSign, color: "bg-emerald-100 text-emerald-600" },
    { titleKey: "makeExtraIncome", icon: TrendingUp, color: "bg-royal-blue-100 text-royal-blue-600" },
    { titleKey: "feelLessStressed", icon: Heart, color: "bg-pink-100 text-pink-600" },
    { titleKey: "nailJobInterviews", icon: Briefcase, color: "bg-purple-100 text-purple-600" },
    { titleKey: "boostDigitalSkills", icon: Zap, color: "bg-yellow-100 text-yellow-600" },
    { titleKey: "organizeLifeFaster", icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { titleKey: "parentSmarter", icon: Baby, color: "bg-orange-100 text-orange-600" },
    { titleKey: "unlockOpportunities", icon: Star, color: "bg-indigo-100 text-indigo-600" }
  ]

  // Get first 3 affordable courses for sample section
  const displaySampleCourses = sampleCourses.slice(0, 3)

  const testimonials = [
    "testimonial1",
    "testimonial2", 
    "testimonial3"
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-20 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/4050291/pexels-photo-4050291.jpeg"
            alt="Person working on computer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-royal-blue-900/90 via-royal-blue-800/85 to-emerald-700/80"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 text-center">
            <div className="w-full">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-8">
                {t('heroTitleHome').split(' ').slice(0, -1).join(' ')} <span className="text-yellow-300">{t('heroTitleHome').split(' ').slice(-1)[0]}</span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed max-w-4xl mx-auto">
                {t('heroSubtitleHome')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <LanguageAwareLink
                  to="/courses"
                  className="inline-flex items-center justify-center px-8 py-4 bg-warm-orange-500 text-white rounded-lg font-bold text-lg hover:bg-warm-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-warm-orange-400"
                >
                  {t('startYourTransformation')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </LanguageAwareLink>
                <LanguageAwareLink
                  to="/courses"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-royal-blue-600 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white"
                >
                  {t('browseLifeChangingCourses')}
                </LanguageAwareLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('realLearning')}
            </h2>
            <div className="w-24 h-1 bg-warm-orange-500 mx-auto mb-8"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-warm-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-warm-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('practicalResults')}</h3>
              <p className="text-gray-600">
                {t('practicalResultsDesc')}
              </p>
            </div>

            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('affordableCourses')}</h3>
              <p className="text-gray-600">
                {t('affordableCoursesDesc')}
              </p>
            </div>

            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-royal-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-royal-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('designedForBusy')}</h3>
              <p className="text-gray-600">
                {t('designedForBusyDesc')}
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('everyCourseMatter')}
            </p>
          </div>
        </div>
      </section>

      {/* Transformations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('seeHowPeople')}
            </h2>
            <div className="w-24 h-1 bg-warm-orange-500 mx-auto mb-8"></div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {transformationStories.map((story, index) => (
                <div key={index} className="group flex flex-col">
                  {/* Category Label */}
                  <div className="text-center mb-6">
                    <span className="inline-block bg-royal-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                      {t(story.categoryKey)}
                    </span>
                  </div>

                  {/* Before Card */}
                  <div className="bg-white rounded-xl shadow-md border-l-4 border-red-400 p-6 mb-4 group-hover:shadow-lg transition-all duration-300 flex-1 flex flex-col justify-center min-h-[120px]">
                    <div className="flex items-center space-x-4 h-full">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold text-sm">{t('before')}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 font-medium leading-relaxed">
                          {t(story.beforeKey)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-warm-orange-500 rounded-full p-3 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <ArrowRight className="h-5 w-5 text-white transform rotate-90" />
                    </div>
                  </div>

                  {/* After Card */}
                  <div className="bg-white rounded-xl shadow-md border-l-4 border-green-400 p-6 group-hover:shadow-lg transition-all duration-300 flex-1 flex flex-col justify-center min-h-[120px]">
                    <div className="flex items-center space-x-4 h-full">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase">
                            {t('after')}
                          </span>
                        </div>
                        <p className="text-gray-900 font-semibold leading-relaxed">
                          {t(story.afterKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Life Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('transformParts')}
            </h2>
            <div className="w-24 h-1 bg-warm-orange-500 mx-auto mb-8"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {lifeCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <LanguageAwareLink
                  key={index}
                  to="/courses"
                  className="group bg-white border-2 border-gray-100 rounded-xl p-6 text-center hover:border-royal-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`${category.color} rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-royal-blue-600 transition-colors text-sm">
                    {t(category.titleKey)}
                  </h3>
                </LanguageAwareLink>
              )
            })}
          </div>
        </div>
      </section>

      {/* Sample Courses */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('startChanging')}
            </h2>
            <div className="w-24 h-1 bg-warm-orange-500 mx-auto mb-8"></div>
          </div>

          {sampleLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : displaySampleCourses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {displaySampleCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                    <img
                      src={course.cover_image_url || 'https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg'}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-royal-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: course.currency || 'USD',
                      }).format(course.price)}
                    </span>
                    <span className="bg-warm-orange-100 text-warm-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      2-3h
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>
                  <LanguageAwareLink
                    to={`/course/${course.id}`}
                    className="w-full bg-royal-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-royal-blue-700 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('startNow')}
                  </LanguageAwareLink>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No courses available at the moment.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <LanguageAwareLink
                  to="/courses"
                  className="inline-flex items-center justify-center px-8 py-4 bg-warm-orange-500 text-white rounded-xl font-bold text-lg hover:bg-warm-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {t('startYourTransformation')}
                </LanguageAwareLink>
                <LanguageAwareLink
                  to="/courses"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-warm-orange-500 text-warm-orange-600 rounded-xl font-semibold text-lg hover:bg-warm-orange-500 hover:text-white transition-all duration-300"
                >
                  {t('browseCourses')}
                </LanguageAwareLink>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('changeSimple')}
            </h2>
            <div className="w-24 h-1 bg-warm-orange-500 mx-auto mb-8"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-warm-orange-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-warm-orange-200 transition-colors">
                <span className="text-2xl font-bold text-warm-orange-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('chooseLifeChange')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('chooseLifeChangeDesc')}
              </p>
            </div>

            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-royal-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-royal-blue-200 transition-colors">
                <span className="text-2xl font-bold text-royal-blue-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('watchMicroCourse')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('watchMicroCourseDesc')}
              </p>
            </div>

            <div className="text-center group hover:transform hover:scale-105 transition-all duration-300">
              <div className="bg-warm-orange-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-warm-orange-200 transition-colors">
                <span className="text-2xl font-bold text-warm-orange-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">{t('followSteps')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t('followStepsDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('realPeople')}
            </h2>
            <div className="w-24 h-1 bg-warm-orange-500 mx-auto mb-8"></div>
            <p className="text-xl text-gray-300 mb-8">
              {t('everyCourseMatter')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-2">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-warm-orange-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 italic text-lg leading-relaxed mb-6">
                  "{t(testimonial)}"
                </p>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-royal-blue-600 rounded-full flex items-center justify-center mr-3">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t('verifiedStudent')}</p>
                      <p className="text-sm text-gray-400">{t('learnYourselfMember')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-royal-blue-600 to-warm-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            {t('lifeCanChange')}
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            {t('noSubscriptions')}
          </p>
          <LanguageAwareLink
            to="/courses"
            className="inline-flex items-center justify-center px-12 py-5 bg-warm-orange-500 text-white rounded-lg font-bold text-xl hover:bg-warm-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {t('startTransformation')}
            <ArrowRight className="ml-3 h-6 w-6" />
          </LanguageAwareLink>
        </div>
      </section>
    </div>
  )
}

export default Home