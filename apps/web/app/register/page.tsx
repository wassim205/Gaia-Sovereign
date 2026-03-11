'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Fingerprint, Key, Github } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { apiClient, type ErrorResponse } from '@/lib/api';

const steps = [
  { id: 1, title: 'Account', description: 'Create your credentials' },
  { id: 2, title: 'Profile', description: 'Tell us about you' },
  { id: 3, title: 'Security', description: 'Secure your vault' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    enableMfa: true,
    agreeTerms: false,
  });

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const update = (field: string, value: string | boolean) => 
    setForm({ ...form, [field]: value });

  const validateStep1 = () => {
    if (!form.email || !form.username || !form.password || !form.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!form.agreeTerms) {
        setError('You must agree to the terms and conditions');
        return;
      }
      
      setIsLoading(true);
      
      try {
        const response = await apiClient.register({
          username: form.username,
          email: form.email,
          password: form.password,
        });
        
        addToast('Account created successfully! Redirecting to login...', 'success');
        
        // Redirect to login
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      } catch (err) {
        const error = err as ErrorResponse;
        const errorMessage = Array.isArray(error.message) 
          ? error.message.join(', ') 
          : error.message || 'Registration failed. Please try again.';
        
        setError(errorMessage);
        addToast(errorMessage, 'error');
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-black text-white flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-linear-to-br from-black via-purple-950/20 to-black" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating Icons */}
        {[
          { Icon: Lock, x: '15%', y: '20%', delay: 0 },
          { Icon: Key, x: '80%', y: '15%', delay: 0.5 },
          { Icon: Shield, x: '10%', y: '70%', delay: 1 },
          { Icon: Fingerprint, x: '85%', y: '65%', delay: 1.5 },
        ].map(({ Icon, x, y, delay }, i) => (
          <motion.div
            key={i}
            className="absolute p-3 rounded-xl bg-white/5 border border-white/10"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { delay: delay * 0.3, duration: 0.5 },
              scale: { delay: delay * 0.3, duration: 0.5 },
              y: { duration: 4, repeat: Infinity, delay: delay * 0.2 },
            }}
          >
            <Icon className="w-5 h-5 text-white/20" />
          </motion.div>
        ))}

        <motion.div
          className="absolute w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147,51,234,0.08) 0%, transparent 70%)',
            left: '20%',
            top: '30%',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10 max-w-md px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-black" />
              </div>
              <div>
                <div className="text-xl font-bold">DataVault</div>
                <div className="text-xs text-white/30 font-mono">v1.0.0</div>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 tracking-tight">
              Create your<br />
              <span className="text-white/60">personal vault.</span>
            </h1>

            <p className="text-white/40 leading-relaxed mb-8">
              Take control of your digital identity. Store your data encrypted with
              zero-knowledge architecture — only you hold the keys.
            </p>

            {/* Step Progress */}
            <div className="space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep >= step.id
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-white' : 'text-white/30'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-white/20">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-bold">DataVault</span>
          </div>

          {/* Mobile Step Indicator */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-all ${
                  currentStep >= step.id ? 'bg-white' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {currentStep === 1 && 'Create account'}
              {currentStep === 2 && 'Your profile'}
              {currentStep === 3 && 'Vault security'}
            </h2>
            <p className="text-sm text-white/40">
              {currentStep === 1 && (
                <>
                  Already have an account?{' '}
                  <Link href="/login" className="text-white hover:text-white/80 underline underline-offset-4">
                    Sign in
                  </Link>
                </>
              )}
              {currentStep === 2 && 'This helps personalize your vault experience.'}
              {currentStep === 3 && 'Set up additional security for your data vault.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <AnimatePresence mode="wait">
              {/* Step 1 */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {/* Social */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </button>
                    <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
                      <Github className="w-4 h-4" />
                      GitHub
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-white/30">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@example.com"
                    icon={<Mail className="w-4 h-4" />}
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    required
                  />

                  <Input
                    label="Username"
                    type="text"
                    placeholder="johndoe"
                    icon={<User className="w-4 h-4" />}
                    value={form.username}
                    onChange={(e) => update('username', e.target.value)}
                    required
                  />

                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    icon={<Lock className="w-4 h-4" />}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    required
                  />

                  <div>
                    <Input
                      label="Confirm Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      icon={<Lock className="w-4 h-4" />}
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 mt-2 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPassword ? 'Hide' : 'Show'} passwords
                    </button>
                  </div>

                  <Button type="submit" className="w-full mt-4" size="lg">
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      type="text"
                      placeholder="John"
                      value={form.firstName}
                      onChange={(e) => update('firstName', e.target.value)}
                    />
                    <Input
                      label="Last Name"
                      type="text"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={(e) => update('lastName', e.target.value)}
                    />
                  </div>

                  <p className="text-xs text-white/30 mt-6">
                    Your profile information is optional and helps personalize your experience.
                  </p>

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => setCurrentStep(1)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" size="lg">
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.enableMfa}
                        onChange={(e) => update('enableMfa', e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/30"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">Enable Two-Factor Authentication</div>
                        <div className="text-xs text-white/40">Add an extra layer of security to your account</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.agreeTerms}
                        onChange={(e) => update('agreeTerms', e.target.checked)}
                        required
                        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-white focus:ring-white/30"
                      />
                      <div className="text-xs text-white/40">
                        I agree to the{' '}
                        <Link href="#" className="text-white underline underline-offset-2">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="#" className="text-white underline underline-offset-2">
                          Privacy Policy
                        </Link>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => setCurrentStep(2)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      size="lg"
                      disabled={isLoading || !form.agreeTerms}
                    >
                      {isLoading ? 'Creating...' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-[11px] text-white/20 text-center mt-8 leading-relaxed">
            Your data is encrypted end-to-end. We never have access to your vault contents.
          </p>
        </motion.div>
      </div>
    </div>
    </>
  );
}
