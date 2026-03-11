'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Fingerprint, Key, Github } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement API call
    console.log('Login:', { email, password });
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-indigo-950/30 to-black" />
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

        {/* Glowing Orb */}
        <motion.div
          className="absolute w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            left: '20%',
            top: '30%',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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
              Welcome back to<br />
              <span className="text-white/60">your secure vault.</span>
            </h1>

            <p className="text-white/40 leading-relaxed mb-8">
              Your personal data is encrypted and waiting. Sign in to manage your vault,
              control access permissions, and review your audit trail.
            </p>

            <div className="flex items-center gap-6 text-sm text-white/30">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Zero Knowledge</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Full Audit</span>
              </div>
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
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-bold">DataVault</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Sign in</h2>
            <p className="text-sm text-white/40">
              Don't have an account?{' '}
              <Link href="/register" className="text-white hover:text-white/80 underline underline-offset-4">
                Create one
              </Link>
            </p>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
              <Github className="w-4 h-4" />
              GitHub
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or continue with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                icon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <Link href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-2" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-[11px] text-white/20 text-center mt-8 leading-relaxed">
            By signing in, you agree to our{' '}
            <Link href="#" className="underline underline-offset-2">Terms of Service</Link> and{' '}
            <Link href="#" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
