import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './lib/i18n'
import ErrorBoundary from './components/ErrorBoundary'
import logger from './utils/logger'
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import { LanguageRouter } from './components/Layout/LanguageRouter'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import LoadingSpinner from './components/UI/LoadingSpinner'
import Home from './pages/Home'

const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Lazily loaded pages
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Checkout = lazy(() => import('./pages/Checkout'))
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Auth pages (lazily loaded)
const Login = lazy(() => import('./pages/Auth/Login'))
const Signup = lazy(() => import('./pages/Auth/Signup'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'))
const SetPassword = lazy(() => import('./pages/Auth/SetPassword'))
const AdminLogin = lazy(() => import('./pages/Auth/AdminLogin'))

// Protected pages (lazily loaded)
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const CourseLearning = lazy(() => import('./pages/Learn/CourseLearning'))

// Admin pages (lazily loaded - rarely accessed)
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'))
const AdminCourses = lazy(() => import('./pages/Admin/AdminCourses'))
const AdminBlogs = lazy(() => import('./pages/Admin/AdminBlogs'))
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'))
const AdminAnalytics = lazy(() => import('./pages/Admin/AdminAnalytics'))
const AdminCategories = lazy(() => import('./pages/Admin/AdminCategories'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
)

function App() {
  React.useEffect(() => {
    logger.info('Application initialized', {
      version: '1.0.0',
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString(),
    })
  }, [])

  return (
    <ErrorBoundary>
      <Router>
        <LanguageRouter>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Language-prefixed routes */}
                    <Route path="/:lang" element={<Home />} />
                    <Route path="/:lang/courses" element={<Courses />} />
                    <Route path="/:lang/course/:slug" element={<CourseDetail />} />
                    <Route path="/:lang/checkout/:courseId" element={<Checkout />} />
                    <Route path="/:lang/checkout/success" element={<CheckoutSuccess />} />
                    <Route path="/:lang/blog" element={<Blog />} />
                    <Route path="/:lang/blog/:slug" element={<BlogPost />} />
                    <Route path="/:lang/login" element={<Login />} />
                    <Route path="/:lang/signup" element={<Signup />} />
                    <Route path="/:lang/forgot-password" element={<ForgotPassword />} />
                    <Route path="/:lang/reset-password" element={<ResetPassword />} />
                    <Route path="/:lang/set-password" element={<SetPassword />} />
                    <Route path="/:lang/admin-login" element={<AdminLogin />} />
                    <Route path="/:lang/about" element={<About />} />
                    <Route path="/:lang/contact" element={<Contact />} />
                    <Route path="/:lang/privacy" element={<Privacy />} />
                    <Route path="/:lang/terms" element={<Terms />} />

                    {/* Protected Routes */}
                    <Route
                      path="/:lang/learn/:courseId"
                      element={
                        <ProtectedRoute>
                          <CourseLearning />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/:lang/dashboard/*"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/:lang/admin"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/:lang/admin/courses"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminCourses />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/:lang/admin/blogs"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminBlogs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/:lang/admin/categories"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminCategories />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/:lang/admin/users"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminUsers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/:lang/admin/analytics"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminAnalytics />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback routes without language prefix */}
                    <Route path="/" element={<Home />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/set-password" element={<SetPassword />} />
                    <Route path="/*" element={<Home />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </LanguageRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  )
}

export default App
