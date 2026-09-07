'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { authLimiter, validateEmail, validatePassword, validateName, sanitizeInput } from '@/lib/auth-security'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

type AuthMode = 'signin' | 'signup' | 'forgot-password'

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTime, setBlockTime] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)

  const { signIn, signUp, resetPassword } = useAuth()

  useEffect(() => {
    if (isOpen) setMode(initialMode)
  }, [isOpen, initialMode])

  useEffect(() => {
    if (email) {
      const blocked = authLimiter.isBlocked(email)
      setIsBlocked(blocked)
      if (blocked) setBlockTime(authLimiter.getResetTime(email))
    }
  }, [email])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isBlocked && blockTime > 0) {
      interval = setInterval(() => {
        const newTime = authLimiter.getResetTime(email)
        setBlockTime(newTime)
        if (newTime <= 0) setIsBlocked(false)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isBlocked, blockTime, email])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  const resetForm = () => {
    setEmail(''); setPassword(''); setFullName('')
    setMessage(null); setShowPassword(false)
    setValidationErrors({}); setIsBlocked(false); setBlockTime(0)
  }

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}
    const emailError = validateEmail(email)
    if (emailError) errors.email = emailError
    if (mode !== 'forgot-password') {
      const passwordError = validatePassword(password)
      if (passwordError) errors.password = passwordError
    }
    if (mode === 'signup' && fullName) {
      const nameError = validateName(fullName)
      if (nameError) errors.fullName = nameError
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleClose = () => { resetForm(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (authLimiter.isBlocked(email)) {
      const resetTime = authLimiter.getResetTime(email)
      setMessage({ type: 'error', text: `Too many attempts. Wait ${Math.ceil(resetTime / 60)} minutes.` })
      setIsBlocked(true); setBlockTime(resetTime)
      return
    }
    if (!validateForm()) return
    setLoading(true); setMessage(null)
    const sanitizedEmail = sanitizeInput(email.toLowerCase())
    const sanitizedFullName = fullName ? sanitizeInput(fullName) : undefined

    try {
      if (mode === 'signin') {
        const { error } = await signIn(sanitizedEmail, password)
        if (error) {
          authLimiter.recordAttempt(sanitizedEmail)
          setMessage({ type: 'error', text: error.message })
        } else {
          authLimiter.reset(sanitizedEmail)
          setMessage({ type: 'success', text: 'Signed in successfully!' })
          setTimeout(handleClose, 800)
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(sanitizedEmail, password, sanitizedFullName)
        if (error) {
          authLimiter.recordAttempt(sanitizedEmail)
          setMessage({ type: 'error', text: error.message })
        } else {
          authLimiter.reset(sanitizedEmail)
          setMessage({ type: 'success', text: 'Account created! Welcome to BoredFlix.' })
          setTimeout(handleClose, 900)
        }
      } else if (mode === 'forgot-password') {
        const { error } = await resetPassword(sanitizedEmail)
        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          setMessage({ type: 'success', text: 'Password reset email sent!' })
          setTimeout(() => setMode('signin'), 2000)
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode); setMessage(null); setValidationErrors({})
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === overlayRef.current) handleClose() }}
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            className="relative w-full max-w-sm"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Card */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(160deg, rgba(22,22,26,0.98) 0%, rgba(14,14,16,0.99) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.9), 0 8px 24px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.06]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">BoredFlix</p>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {mode === 'signin' && 'Welcome back'}
                    {mode === 'signup' && 'Create account'}
                    {mode === 'forgot-password' && 'Reset password'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Full Name — signup only */}
                {mode === 'signup' && (
                  <Field
                    id="fullName"
                    label="Full name"
                    type="text"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Your name (optional)"
                    icon={<User className="w-4 h-4" />}
                    error={validationErrors.fullName}
                  />
                )}

                {/* Email */}
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={validationErrors.email}
                  required
                />

                {/* Password */}
                {mode !== 'forgot-password' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400">Password</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors duration-150"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${validationErrors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)'}`,
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = validationErrors.password ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {validationErrors.password}
                      </p>
                    )}
                    {mode === 'signup' && !validationErrors.password && (
                      <p className="text-[11px] text-zinc-600">
                        Min 8 chars · uppercase · lowercase · number · special char
                      </p>
                    )}
                  </div>
                )}

                {/* Rate limit warning */}
                {isBlocked && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-400">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    Locked — try again in {Math.ceil(blockTime / 60)} min
                  </p>
                )}

                {/* Message */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                      message.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || isBlocked}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background: loading || isBlocked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
                    color: loading || isBlocked ? '#a1a1aa' : '#09090b',
                  }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Please wait...' : isBlocked
                    ? `Locked · ${Math.ceil(blockTime / 60)}m`
                    : mode === 'signin' ? 'Sign in'
                    : mode === 'signup' ? 'Create account'
                    : 'Send reset email'}
                </button>

                {/* Footer links */}
                <div className="pt-1 space-y-2 text-center">
                  {mode === 'signin' && (
                    <>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot-password')}
                        className="block w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
                      >
                        Forgot password?
                      </button>
                      <p className="text-xs text-zinc-600">
                        No account?{' '}
                        <button
                          type="button"
                          onClick={() => switchMode('signup')}
                          className="text-zinc-300 hover:text-white font-medium transition-colors duration-150"
                        >
                          Sign up
                        </button>
                      </p>
                    </>
                  )}
                  {mode === 'signup' && (
                    <p className="text-xs text-zinc-600">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="text-zinc-300 hover:text-white font-medium transition-colors duration-150"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                  {mode === 'forgot-password' && (
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
                    >
                      Back to sign in
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({
  id, label, type, value, onChange, placeholder, icon, error, required,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon: React.ReactNode
  error?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-zinc-400">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors duration-150"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)'}`,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)')}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
