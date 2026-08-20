import { gsap } from 'gsap'

// Suppress GSAP "no valid targets" warnings for SSR/hydration timing
gsap.config({
  nullTargetWarn: false,
})

/** GSAP animation presets for the admin panel */
export const ANIMATION_PRESETS = {
  fadeInUp:        { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out' },
  fadeIn:          { opacity: 0, duration: 0.4, ease: 'power2.out' },
  scaleIn:         { scale: 0.95, opacity: 0, duration: 0.3, ease: 'back.out(1.4)' },
  slideInRight:    { x: '100%', duration: 0.4, ease: 'expo.out' },
  slideInLeft:     { x: '-100%', duration: 0.4, ease: 'expo.out' },
  staggerChildren: { opacity: 0, y: 30, stagger: 0.08, duration: 0.6, ease: 'power3.out' },
  counterUp:       { snap: { innerText: 1 }, duration: 1.2, ease: 'power2.out' },
} as const

export { gsap }
