import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Phone, ArrowRight, RefreshCw, CheckCircle, ChevronDown } from 'lucide-react'

const COUNTRY_CODES = [
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+7', flag: '🇷🇺', name: 'Russia' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea' },
]

interface WhatsAppOTPInputProps {
  onVerified: (phoneNumber: string, otpId?: string) => void
  purpose?: 'login' | 'signup' | 'checkout'
  language?: string
  loading?: boolean
  className?: string
}

type Step = 'phone' | 'otp' | 'verified'

const OTP_RESEND_SECONDS = 60

const WhatsAppOTPInput: React.FC<WhatsAppOTPInputProps> = ({
  onVerified,
  purpose = 'login',
  language = 'en',
  loading: externalLoading = false,
  className = '',
}) => {
  const [step, setStep] = useState<Step>('phone')
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0])
  const [showDropdown, setShowDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [phoneLocal, setPhoneLocal] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fullPhone = `${selectedCountry.code}${phoneLocal.replace(/\D/g, '')}`

  const filteredCountries = COUNTRY_CODES.filter(
    c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
         c.code.includes(countrySearch)
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startResendTimer = useCallback(() => {
    setResendTimer(OTP_RESEND_SECONDS)
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const sendOtp = useCallback(async () => {
    const digits = phoneLocal.replace(/\D/g, '')
    if (digits.length < 6) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ phone_number: fullPhone, purpose, language }),
        }
      )

      const data = await resp.json()

      if (!resp.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setStep('otp')
      startResendTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [phoneLocal, fullPhone, purpose, language, startResendTimer])

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError(null)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const verifyOtp = useCallback(async () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-whatsapp-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ phone_number: fullPhone, otp_code: code, purpose, language }),
        }
      )

      const data = await resp.json()

      if (!resp.ok) {
        setError(data.error || 'Invalid code')
        if (data.attempts_remaining !== undefined) {
          setAttemptsRemaining(data.attempts_remaining)
        }
        return
      }

      setStep('verified')

      if (data.access_token) {
        sessionStorage.setItem('whatsapp_auth', JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          user: data.user,
          is_new_user: data.is_new_user,
        }))
      }

      onVerified(fullPhone, data.user?.id)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [otp, fullPhone, purpose, language, onVerified])

  useEffect(() => {
    if (otp.every(d => d !== '') && step === 'otp') {
      verifyOtp()
    }
  }, [otp, step, verifyOtp])

  const isLoading = loading || externalLoading

  if (step === 'verified') {
    return (
      <div className={`flex flex-col items-center gap-3 py-4 ${className}`}>
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-sm font-medium text-gray-700">Phone verified</p>
        <p className="text-xs text-gray-500">{fullPhone}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {step === 'phone' && (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span>We'll send a verification code via WhatsApp</span>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              WhatsApp Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors text-sm font-medium min-w-[90px]"
                >
                  <span>{selectedCountry.flag}</span>
                  <span className="text-gray-700">{selectedCountry.code}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-royal-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCountries.map(c => (
                        <button
                          key={c.code + c.name}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c)
                            setShowDropdown(false)
                            setCountrySearch('')
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${
                            selectedCountry.code === c.code && selectedCountry.name === c.name
                              ? 'bg-royal-blue-50 text-royal-blue-700'
                              : 'text-gray-700'
                          }`}
                        >
                          <span>{c.flag}</span>
                          <span className="font-medium text-gray-500 w-10 shrink-0">{c.code}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneLocal}
                  onChange={e => {
                    setPhoneLocal(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  placeholder="5xx xxx xxxx"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-royal-blue-500 focus:border-transparent text-sm"
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="w-4 h-4 inline-flex items-center justify-center bg-red-100 rounded-full text-red-600 text-xs font-bold shrink-0">!</span>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={sendOtp}
            disabled={isLoading || phoneLocal.replace(/\D/g, '').length < 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Send OTP via WhatsApp
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </>
      )}

      {step === 'otp' && (
        <>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Enter the 6-digit code sent to
            </p>
            <p className="text-sm font-semibold text-gray-900">{fullPhone}</p>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError(null) }}
              className="text-xs text-royal-blue-600 hover:underline"
            >
              Change number
            </button>
          </div>

          <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className={`w-11 h-12 text-center text-lg font-semibold border-2 rounded-xl focus:outline-none transition-colors ${
                  error
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : digit
                    ? 'border-royal-blue-500 bg-royal-blue-50 text-royal-blue-700'
                    : 'border-gray-300 bg-white text-gray-900 focus:border-royal-blue-500'
                }`}
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">
              {error}
              {attemptsRemaining !== null && attemptsRemaining > 0 && (
                <span className="block text-xs text-gray-500 mt-0.5">
                  {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                </span>
              )}
            </p>
          )}

          {isLoading && (
            <div className="flex justify-center">
              <RefreshCw className="w-5 h-5 text-royal-blue-500 animate-spin" />
            </div>
          )}

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-xs text-gray-500">
                Resend code in <span className="font-semibold text-gray-700">{resendTimer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => { setOtp(['','','','','','']); setError(null); sendOtp() }}
                disabled={isLoading}
                className="text-xs text-royal-blue-600 hover:underline disabled:opacity-50"
              >
                Didn't receive the code? Resend
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default WhatsAppOTPInput
