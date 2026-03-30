'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  Clock,
  Check,
  X,
  ArrowRight,
  Fingerprint,
  FileKey,
  Share2,
  History,
  Zap,
  Code2,
  KeyRound,
  ShieldCheck,
  ScanFace,
  Binary,
  Menu,
  Vault,
  ChevronDown,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== MAGNETIC BUTTON EFFECT ====================

function MagneticWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

// ==================== SPOTLIGHT CARD EFFECT ====================

function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const background = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.06), transparent 80%)`;

  return (
    <motion.div
      ref={divRef}
      className={cn('relative overflow-hidden', className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{ background }}
      />
      {children}
    </motion.div>
  );
}

// ==================== TEXT REVEAL ON SCROLL ====================

function TextReveal({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20%' });
  
  const words = children.split(' ');

  return (
    <span ref={ref} className={cn('inline', className)}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: '100%', opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ 
              duration: 0.5, 
              delay: i * 0.05,
              ease: [0.33, 1, 0.68, 1]
            }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// ==================== SCROLL REVEAL WRAPPER ====================

function ScrollReveal({ 
  children, 
  direction = 'up',
  delay = 0,
  className 
}: { 
  children: React.ReactNode; 
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const variants = {
    up: { initial: { y: 60, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    down: { initial: { y: -60, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    left: { initial: { x: 60, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    right: { initial: { x: -60, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    fade: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  };

  const variant = variants[direction];

  return (
    <motion.div
      ref={ref}
      initial={variant.initial}
      animate={isInView ? variant.animate : variant.initial}
      transition={{ duration: 0.6, delay, ease: [0.33, 1, 0.68, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==================== STAGGER CHILDREN ====================

function StaggerChildren({ 
  children, 
  staggerDelay = 0.1,
  className 
}: { 
  children: React.ReactNode; 
  staggerDelay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ==================== PARALLAX SECTION ====================

function ParallaxSection({ 
  children, 
  speed = 0.5,
  className 
}: { 
  children: React.ReactNode; 
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// ==================== COUNTER ANIMATION ====================

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const end = value;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / end), 20);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / stepTime));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ==================== SHUFFLE/DECRYPT TEXT EFFECT ====================

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!?<>[]{}αβγδεζηθ';

function ShuffleText({ 
  text, 
  className,
  speed = 30,
  delay = 0,
  hover = false 
}: { 
  text: string; 
  className?: string;
  speed?: number;
  delay?: number;
  hover?: boolean;
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(!hover);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animate = useCallback(() => {
    let iteration = 0;
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );
      
      iteration += 1/3;
      
      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsAnimating(false);
      }
    }, speed);
  }, [text, speed]);

  useEffect(() => {
    if (!hover && isAnimating) {
      const timeout = setTimeout(animate, delay);
      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [hover, isAnimating, delay, animate]);

  const handleMouseEnter = () => {
    if (hover && !isAnimating) {
      setIsAnimating(true);
      animate();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <span 
      className={cn('font-mono', className)}
      onMouseEnter={handleMouseEnter}
    >
      {displayText}
    </span>
  );
}

function ContinuousDecrypt({ text, className }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let iteration = 0;
    let direction = 1; // 1 = encrypting, -1 = decrypting
    
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            const threshold = direction === 1 ? iteration : text.length - iteration;
            if (index >= threshold) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );
      
      iteration += 0.5;
      
      if (iteration >= text.length) {
        iteration = 0;
        direction *= -1;
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={cn('font-mono', className)}>{displayText}</span>;
}

// ==================== FLOATING SECURITY ICONS ====================

function FloatingSecurityIcons() {
  const icons = [
    { Icon: Lock, x: '5%', y: '20%', size: 24, delay: 0, duration: 4.5 },
    { Icon: Key, x: '90%', y: '15%', size: 28, delay: 0.5, duration: 5.2 },
    { Icon: Shield, x: '8%', y: '60%', size: 32, delay: 1, duration: 4.8 },
    { Icon: Fingerprint, x: '85%', y: '55%', size: 26, delay: 1.5, duration: 5.5 },
    { Icon: KeyRound, x: '15%', y: '85%', size: 22, delay: 2, duration: 4.3 },
    { Icon: ShieldCheck, x: '92%', y: '80%', size: 30, delay: 2.5, duration: 5.0 },
    { Icon: ScanFace, x: '3%', y: '40%', size: 20, delay: 3, duration: 4.7 },
    { Icon: Vault, x: '88%', y: '35%', size: 24, delay: 3.5, duration: 5.3 },
    { Icon: Binary, x: '12%', y: '75%', size: 18, delay: 4, duration: 4.6 },
    { Icon: FileKey, x: '95%', y: '70%', size: 22, delay: 4.5, duration: 5.1 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, x, y, size, delay, duration }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay * 0.3, duration: 0.5 }}
        >
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay * 0.2,
            }}
            className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <Icon size={size} className="text-white/20" strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ==================== ANIMATED GRID BACKGROUND ====================

function GridBackground() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -100]);

  return (
    <motion.div className="absolute inset-0 overflow-hidden" style={{ y }}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_70%)]" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Glowing orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          left: '10%',
          top: '20%',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
          right: '15%',
          bottom: '30%',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 2 }}
      />
    </motion.div>
  );
}

// ==================== GLASS CARD ====================

function GlassCard({ 
  children, 
  className,
  hover = true,
  glow = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
  glow?: boolean;
}) {
  return (
    <SpotlightCard
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-white/2 backdrop-blur-xl',
        'border border-white/5',
        hover && 'hover:bg-white/4 hover:border-white/10 transition-all duration-500',
        glow && 'shadow-[0_0_50px_rgba(255,255,255,0.03)]',
        className
      )}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/2 via-transparent to-transparent pointer-events-none" />
      <motion.div
        className="relative h-full"
        whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.div>
    </SpotlightCard>
  );
}

// ==================== BUTTONS ====================

function PrimaryButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <MagneticWrapper>
      <motion.button
        className={cn(
          'relative px-8 py-4 rounded-xl font-semibold text-black bg-white',
          'overflow-hidden group',
          'shadow-[0_0_30px_rgba(255,255,255,0.1)]',
          'hover:shadow-[0_0_50px_rgba(255,255,255,0.2)]',
          'transition-shadow duration-300',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </motion.button>
    </MagneticWrapper>
  );
}

function SecondaryButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <MagneticWrapper>
      <motion.button
        className={cn(
          'px-8 py-4 rounded-xl font-semibold',
          'bg-transparent border border-white/20 text-white',
          'hover:bg-white/5 hover:border-white/30',
          'transition-all duration-300',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
      >
        <span className="flex items-center justify-center gap-2">{children}</span>
      </motion.button>
    </MagneticWrapper>
  );
}

// ==================== ANIMATED LOGO ====================

function AnimatedLogo({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <motion.div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
    >
      {/* Outer rotating ring */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-white/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner rotating ring - opposite direction */}
      <motion.div
        className="absolute inset-1.5 rounded-lg border-2 border-white/30"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Core background */}
      <div className="absolute inset-3 rounded-lg bg-white flex items-center justify-center overflow-hidden">
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        {/* Vault icon */}
        <div className="relative z-10 flex items-center justify-center">
          <Vault className="w-6 h-6 text-black" />
        </div>
      </div>
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-white/10 blur-md"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* Security indicator dot */}
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black z-20"
        animate={{
          scale: [1, 1.2, 1],
          boxShadow: [
            "0 0 0 0 rgba(16, 185, 129, 0.4)",
            "0 0 0 6px rgba(16, 185, 129, 0)",
            "0 0 0 0 rgba(16, 185, 129, 0)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

// ==================== SCROLL PROGRESS INDICATOR ====================

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-white/20 origin-left z-100"
      style={{ scaleX }}
    />
  );
}

// ==================== HEADER ====================

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => router.push('/')}
          >
            <AnimatedLogo size={44} />
            <div>
              <div className="text-white font-bold text-lg tracking-tight">Gaia Sovereign</div>
              <div className="text-white/30 text-xs font-mono">v1.0.0</div>
            </div>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Security', 'Developers', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-white/50 hover:text-white text-sm font-medium transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/login')}
              className="hidden md:block text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Sign In
            </button>
            <PrimaryButton onClick={() => router.push('/register')} className="hidden md:flex px-6! py-2.5! text-sm">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4"
            >
              {['Features', 'Security', 'Developers', 'Pricing'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="block py-3 text-white/70 hover:text-white">
                  {item}
                </a>
              ))}
              <div className="flex gap-3 mt-4">
                <SecondaryButton onClick={() => router.push('/login')} className="flex-1 py-2.5! text-sm">Sign In</SecondaryButton>
                <PrimaryButton onClick={() => router.push('/register')} className="flex-1 py-2.5! text-sm">Get Started</PrimaryButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

// ==================== HERO SECTION ====================

function HeroSection() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 400], [0, 100]);
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <GridBackground />
      <FloatingSecurityIcons />

      <motion.div 
        className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20"
        style={{ opacity, y }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/3 border border-white/10 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Lock className="w-4 h-4 text-white/50" />
          <ShuffleText text="ZERO-KNOWLEDGE ENCRYPTION" className="text-xs text-white/50 tracking-widest" delay={500} />
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        </motion.div>

        {/* Main Headline */}
        <div className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="text-white block">Your Data.</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-white/90 block">
              <ShuffleText text="Your Vault." delay={800} speed={40} />
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-white/70 block">
              <ContinuousDecrypt text="Your Rules." />
            </span>
          </motion.div>
        </div>

        {/* Subheadline */}
        <motion.p
          className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TextReveal>
            Store your personal data encrypted. Grant apps field-level access with time-bound tokens. Revoke anytime. See every access.
          </TextReveal>
        </motion.p>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <PrimaryButton onClick={() => router.push('/register')}>
            Create Your Vault
            <ArrowRight className="w-5 h-5" />
          </PrimaryButton>
          <SecondaryButton onClick={() => router.push('/developer')}>
            <Code2 className="w-5 h-5" />
            Developer Portal
          </SecondaryButton>
        </motion.div>

        {/* Trust signals with counters */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-12 text-sm mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[
            { value: 99, suffix: '.9%', label: 'Uptime' },
            { value: 256, suffix: '-bit', label: 'Encryption' },
            { value: 100, prefix: '<', suffix: 'ms', label: 'Response Time' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              whileHover={{ scale: 1.1, y: -5 }}
            >
              <div className="text-3xl font-bold text-white mb-1">
                {stat.prefix}
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-white/30 text-xs font-mono">{stat.label}</div>
            </motion.div>
          ))}
          <div className="hidden sm:block w-px h-12 bg-white/10" />
          <div className="hidden sm:block w-px h-12 bg-white/10" />
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { icon: Shield, text: 'GDPR Compliant' },
            { icon: Lock, text: 'AES-256' },
            { icon: Eye, text: 'Full Audit Trail' },
          ].map(({ icon: Icon, text }) => (
            <motion.div 
              key={text} 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.1 }}
            >
              <Icon className="w-4 h-4" />
              <span className="font-mono text-xs">{text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border border-white/20 flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-1 bg-white/40 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ==================== INTERACTIVE DEMO ====================

function InteractiveDemo() {
  const [activeApp, setActiveApp] = useState<number | null>(null);
  const [revealedFields, setRevealedFields] = useState<string[]>([]);
  const ref = useRef(null);

  const dataFields = [
    { id: 'name', label: 'Full Name', value: 'Wassim El Mourabit', encrypted: '8f7a9c2e4b1d6f8a' },
    { id: 'email', label: 'Email', value: 'user@email.com', encrypted: 'd4e6f8a2c9b71e3f' },
    { id: 'phone', label: 'Phone', value: '+212 6XX XXX XXX', encrypted: '3a8f2c7e9d1b5a4c' },
    { id: 'payment', label: 'Payment', value: '**** 4829', encrypted: 'f2d8c4a6e3b97d1f' },
    { id: 'address', label: 'Address', value: 'Casablanca, Morocco', encrypted: '7c3e9a1f4d8b2e6a' },
  ];

  const apps = [
    { name: 'ShopNow', fields: ['name', 'email', 'payment'] },
    { name: 'DeliverIt', fields: ['name', 'phone', 'address'] },
    { name: 'SocialHub', fields: ['name', 'email'] },
  ];

  const handleApprove = (index: number) => {
    setActiveApp(index);
    const app = apps[index];
    
    app.fields.forEach((field, i) => {
      setTimeout(() => {
        setRevealedFields(prev => [...prev, field]);
      }, i * 400);
    });

    setTimeout(() => {
      setActiveApp(null);
      setRevealedFields([]);
    }, 6000);
  };

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/3 border border-white/10 mb-6">
              <Eye className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/50 tracking-widest font-mono">LIVE DEMO</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              <ShuffleText text="See How It Works" delay={300} />
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Click approve to watch the secure consent flow in action
            </p>
          </div>
        </ScrollReveal>

        {/* Demo Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Vault Panel */}
          <ScrollReveal direction="right" delay={0.2}>
            <GlassCard className="p-6 h-full" hover={false} glow>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Your Vault</h3>
                  <p className="text-xs text-white/30 font-mono">ENCRYPTED</p>
                </div>
              </div>

              <div className="space-y-3">
                {dataFields.map((field, index) => {
                  const isRevealed = revealedFields.includes(field.id);
                  
                  return (
                    <motion.div
                      key={field.id}
                      className={cn(
                        'p-4 rounded-xl border transition-all duration-500',
                        isRevealed 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-white/2 border-white/5'
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{field.label}</div>
                          {isRevealed ? (
                            <ShuffleText 
                              text={field.value} 
                              className="text-sm text-white font-medium" 
                              speed={25}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Lock className="w-3 h-3 text-white/20" />
                              <code className="text-xs text-white/20 font-mono">{field.encrypted}</code>
                            </div>
                          )}
                        </div>
                        {isRevealed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-5 h-5 text-emerald-500" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </ScrollReveal>

          {/* Center - Token */}
          <ScrollReveal direction="fade" delay={0.3} className="flex items-center justify-center py-8">
            <div className="relative">
              {/* Rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-white/5"
                  style={{ 
                    width: 140 + i * 50, 
                    height: 140 + i * 50,
                    left: -(i * 25),
                    top: -(i * 25),
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20 + i * 10, repeat: Infinity, ease: 'linear' }}
                />
              ))}

              {/* Core */}
              <motion.div
                className={cn(
                  'relative z-10 w-32 h-32 rounded-full flex items-center justify-center',
                  'bg-white/5 border border-white/10',
                  activeApp !== null && 'bg-white/10 border-white/20'
                )}
                animate={activeApp !== null ? { 
                  scale: [1, 1.1, 1],
                  boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 30px 10px rgba(255,255,255,0.1)', '0 0 0 0 rgba(255,255,255,0)']
                } : {}}
                transition={{ duration: 1.5, repeat: activeApp !== null ? Infinity : 0 }}
              >
                <Key className="w-10 h-10 text-white/50" />
              </motion.div>

              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <div className="text-sm text-white/70 font-medium">Access Token</div>
                <div className="text-xs text-white/30 font-mono">SCOPED • TEMPORARY</div>
              </div>

              {/* Data particles */}
              <AnimatePresence>
                {activeApp !== null && (
                  <>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white/50 rounded-full"
                        initial={{ x: -80, y: 0, opacity: 0 }}
                        animate={{
                          x: [-80, 0, 80],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          delay: i * 0.15,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>

          {/* Apps Panel */}
          <ScrollReveal direction="left" delay={0.4}>
            <GlassCard className="p-6 h-full" hover={false} glow>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Apps Requesting</h3>
                  <p className="text-xs text-white/30 font-mono">PENDING</p>
                </div>
              </div>

              <div className="space-y-4">
                {apps.map((app, index) => (
                  <motion.div
                    key={app.name}
                    className={cn(
                      'p-4 rounded-xl border transition-all duration-300',
                      activeApp === index 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-white/2 border-white/5 hover:border-white/10'
                    )}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    whileHover={{ scale: 1.02, x: -3 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
                        {app.name[0]}
                      </div>
                      <div>
                        <div className="text-white font-medium">{app.name}</div>
                        <div className="text-xs text-white/30">{app.fields.length} fields</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {app.fields.map(fieldId => {
                        const field = dataFields.find(f => f.id === fieldId);
                        return (
                          <span key={fieldId} className="px-2 py-1 text-xs bg-white/5 rounded text-white/50 font-mono">
                            {field?.label}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/20 mb-3">
                      <Clock className="w-3 h-3" />
                      <span>Expires in 24h</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(index)}
                        disabled={activeApp !== null}
                        className={cn(
                          'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all',
                          activeApp === index
                            ? 'bg-emerald-500 text-black'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        )}
                      >
                        <Check className="w-4 h-4" />
                        {activeApp === index ? 'Approved' : 'Approve'}
                      </button>
                      <button className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/10 flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        Deny
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ==================== FEATURES SECTION ====================

function FeaturesSection() {
  const ref = useRef(null);

  const features = [
    {
      icon: FileKey,
      title: 'Field-Level Access',
      description: 'Share your name without your email. Your address without payment info. You decide exactly what each app can see.',
    },
    {
      icon: Clock,
      title: 'Time-Bound Tokens',
      description: 'Every permission expires automatically. Set custom durations. No perpetual access ever.',
    },
    {
      icon: History,
      title: 'Complete Audit Trail',
      description: 'See every access in real-time. Know who read what data and when. Full transparency always.',
    },
    {
      icon: Unlock,
      title: 'Instant Revocation',
      description: 'Changed your mind? Revoke any token immediately. Access is cut in milliseconds.',
    },
    {
      icon: Lock,
      title: 'Zero-Knowledge',
      description: 'Your data is encrypted with keys only you control. Even we cannot read your information.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built for performance. Sub-100ms API responses. No compromise between security and speed.',
    },
  ];

  return (
    <section ref={ref} id="features" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      
      {/* Subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <ScrollReveal direction="up">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/3 border border-white/10 mb-6">
              <Zap className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/50 tracking-widest font-mono">FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Built for the <ShuffleText text="Privacy-First" delay={500} className="text-white/70" /> Era
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Every feature designed with one goal: complete control over your personal data
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren staggerDelay={0.15}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <GlassCard className="p-6 h-full group">
                  <motion.div 
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    <ShuffleText text={feature.title} hover speed={20} />
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
                  
                  {/* Hover reveal arrow */}
                  <motion.div 
                    className="mt-4 flex items-center gap-2 text-white/0 group-hover:text-white/50 transition-colors"
                    initial={{ x: -10, opacity: 0 }}
                    whileHover={{ x: 0, opacity: 1 }}
                  >
                    <span className="text-xs font-medium">Learn more</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </motion.div>
                </GlassCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerChildren>
      </div>
    </section>
  );
}

// ==================== CTA SECTION ====================

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const router = useRouter();

  return (
    <section ref={ref} className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-black" />
      
      {/* Gradient glow */}
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.02),transparent_50%)]"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 1 }}
      />

      {/* Animated rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
          style={{
            width: 400 + i * 200,
            height: 400 + i * 200,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 1, delay: i * 0.2 }}
        />
      ))}

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          {/* Icon */}
          <motion.div
            className="inline-block mb-8"
            whileHover={{ scale: 1.15, rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="relative"
              animate={{ 
                filter: [
                  "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
                  "drop-shadow(0 0 40px rgba(255,255,255,0.5))",
                  "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <AnimatedLogo size={80} />
            </motion.div>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Ready to <ShuffleText text="Own" delay={300} className="text-white/70" /> Your Data?
          </h2>
          
          <p className="text-xl text-white/40 mb-10 max-w-2xl mx-auto">
            <TextReveal>Join thousands taking control of their digital identity. Start free today.</TextReveal>
          </p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
          >
            <PrimaryButton onClick={() => router.push('/register')}>
              Create Your Vault — Free
              <ArrowRight className="w-5 h-5" />
            </PrimaryButton>
            <SecondaryButton>
              <Code2 className="w-5 h-5" />
              API Documentation
            </SecondaryButton>
          </motion.div>

          <motion.div 
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-white/30"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
          >
            {[
              'No credit card required',
              'Setup in 2 minutes',
              'Cancel anytime',
            ].map((text, i) => (
              <motion.div 
                key={text} 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ scale: 1.05, x: 5 }}
              >
                <Check className="w-4 h-4 text-emerald-500/70" />
                <span>{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ==================== FOOTER ====================

function Footer() {
  return (
    <footer className="relative py-16 border-t border-white/5 bg-black overflow-hidden">
      {/* Animated background */}
      <ParallaxSection speed={0.3} className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.03),transparent_50%)]" />
      </ParallaxSection>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <StaggerChildren staggerDelay={0.1}>
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <StaggerItem>
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AnimatedLogo size={40} />
                  <span className="text-lg font-bold text-white">Gaia Sovereign</span>
                </div>
                <p className="text-sm text-white/30 mb-6">
                  Your data. Your vault. Your rules.
                </p>
              </div>
            </StaggerItem>

            {/* Links */}
            {[
              { title: 'Product', links: ['Features', 'Security', 'Pricing', 'Roadmap'] },
              { title: 'Developers', links: ['Documentation', 'API Reference', 'SDKs', 'Status'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            ].map((section) => (
              <StaggerItem key={section.title}>
                <div>
                  <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                  <ul className="space-y-3">
                    {section.links.map((link) => (
                      <li key={link}>
                        <motion.a 
                          href="#" 
                          className="text-sm text-white/30 hover:text-white transition-colors inline-block"
                          whileHover={{ x: 3 }}
                        >
                          {link}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </div>

          <StaggerItem>
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-white/20">
                © 2026 Gaia Sovereign. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-white/20">
                <motion.a href="#" className="hover:text-white transition-colors" whileHover={{ y: -2 }}>Privacy</motion.a>
                <motion.a href="#" className="hover:text-white transition-colors" whileHover={{ y: -2 }}>Terms</motion.a>
                <motion.a href="#" className="hover:text-white transition-colors" whileHover={{ y: -2 }}>Cookies</motion.a>
              </div>
            </div>
          </StaggerItem>
        </StaggerChildren>
      </div>
    </footer>
  );
}

// ==================== BACK TO TOP BUTTON ====================

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', toggleVisible);
    return () => window.removeEventListener('scroll', toggleVisible);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-white rotate-180" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ==================== MAIN COMPONENT ====================

export default function DataVaultLanding() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <ScrollProgress />
      <Header />
      <HeroSection />
      <InteractiveDemo />
      <FeaturesSection />
      <CTASection />
      <Footer />
      <BackToTop />
    </div>
  );
}
