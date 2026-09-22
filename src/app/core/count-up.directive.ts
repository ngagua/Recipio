import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { gsap } from 'gsap';
import { MotionService } from './motion.service';

/**
 * Counts the element's number up from zero when it comes into view: `<span [appCountUp]="n">{{ n }}</span>`.
 * The interpolation stays for prerendering and reduced motion; the tween only rewrites that text node.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUpDirective {
  readonly appCountUp = input.required<number>();
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);
  private observer?: IntersectionObserver;
  private tween?: gsap.core.Tween;

  constructor() {
    afterNextRender(() => {
      if (!this.motion.enabled()) return;
      this.observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        this.observer?.unobserve(this.el);
        this.play();
      });
      this.observer.observe(this.el);
    });
    effect(() => {
      this.appCountUp();
      // A new value (another recipe on the same route) counts up again once it is on screen.
      this.observer?.unobserve(this.el);
      this.observer?.observe(this.el);
    });
    inject(DestroyRef).onDestroy(() => {
      this.observer?.disconnect();
      this.tween?.kill();
    });
  }

  private play(): void {
    const node = this.el.firstChild;
    if (!(node instanceof Text)) return;
    this.tween?.kill();
    const counter = { value: 0 };
    this.tween = gsap.to(counter, {
      value: this.appCountUp(),
      duration: 1.1,
      ease: 'expo.out',
      onUpdate: () => (node.data = String(Math.round(counter.value))),
    });
  }
}
