import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const SetPassword: React.FC = () => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/${i18n.language}/dashboard/courses`, { replace: true })
  }, [navigate, i18n.language])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default SetPassword
