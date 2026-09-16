import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';
import { gsap } from 'gsap';
import { MotionService } from './motion.service';

/** Fades and lifts an element in when it scrolls into view. Pass an index to stagger siblings: `[appReveal]="$index"`. */
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly appReveal = input<number | ''>(0);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);
  private tween?: gsap.core.Tween;

  constructor() {
    afterNextRender(() => {
      if (!this.motion.enabled()) return;
      const inView = this.el.getBoundingClientRect().top < window.innerHeight;
      // First paint comes prerendered: leave what is already visible alone instead of blinking it out and back.
      if (inView && !this.motion.navigated()) return;
      const index = Number(this.appReveal()) || 0;
      this.tween = gsap.fromTo(
        this.el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'expo.out',
          delay: (index % 4) * 0.07,
          scrollTrigger: { trigger: this.el, start: 'top 92%', once: true },
        },
      );
    });
    inject(DestroyRef).onDestroy(() => {
      this.tween?.scrollTrigger?.kill();
      this.tween?.kill();
    });
  }
}
