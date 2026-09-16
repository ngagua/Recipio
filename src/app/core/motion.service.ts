import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/** Lenis smooth scrolling + GSAP ScrollTrigger, browser only, off when the user prefers reduced motion. */
@Service()
export class MotionService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private lenis?: Lenis;
  private navigations = 0;
  /** Scroll-driven animation is running. */
  readonly enabled = signal(false);
  /** True after the first client-side navigation. The initial page is prerendered and must not re-animate what is already on screen. */
  readonly navigated = signal(false);

  constructor() {
    if (this.browser) gsap.registerPlugin(ScrollTrigger);
    inject(Router).events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      if (++this.navigations > 1) this.navigated.set(true);
      this.lenis?.scrollTo(0, { immediate: true });
      if (this.browser) requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  }

  /** Called once from the root component after the first render. */
  start(): void {
    if (!this.browser) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.enabled.set(!reduced);
    if (reduced) return;
    this.lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: true });
    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => this.lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /** Freeze the page behind an overlay such as cook mode. */
  lock(locked: boolean): void {
    if (!this.browser) return;
    if (locked) this.lenis?.stop();
    else this.lenis?.start();
    document.documentElement.style.overflow = locked ? 'hidden' : '';
  }
}
