import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './lib/i18n'
import ErrorBoundary from './components/ErrorBoundary'
import logger from './utils/logger'

// Layout components
import Header from './components/Layout/Header'
import Footer from './components/Layout/Footer'
import { LanguageRouter } from './components/Layout/LanguageRouter'
import ProtectedRoute from './components/Auth/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Checkout from './pages/Checkout'
import CheckoutSuccess from './pages/CheckoutSuccess'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import SetPassword from './pages/Auth/SetPassword'
import Dashboard from './pages/Dashboard/Dashboard'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminCourses from './pages/Admin/AdminCourses'
import AdminBlogs from './pages/Admin/AdminBlogs'
import AdminUsers from './pages/Admin/AdminUsers'
import AdminAnalytics from './pages/Admin/AdminAnalytics'
import AdminCategories from './pages/Admin/AdminCategories'
import CourseLearning from './pages/Learn/CourseLearning'
import About from './pages/About'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import NotFound from './pages/NotFound'

function App() {
  // Log app initialization
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
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-1">
              <ErrorBoundary>
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
                  
                  {/* Fallback routes without language prefix - redirect to default language */}
                  <Route path="/" element={<Home />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/set-password" element={<SetPassword />} />
                  <Route path="/*" element={<Home />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
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