import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { gsap } from 'gsap';
import { MotionService } from './motion.service';

/** Lifts an element on hover and tilts it a few degrees toward the pointer. Hover-capable pointers only. */
@Directive({ selector: '[appTilt]' })
export class TiltDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly motion = inject(MotionService);

  constructor() {
    const abort = new AbortController();
    afterNextRender(() => {
      if (!this.motion.enabled() || !window.matchMedia('(hover: hover)').matches) return;
      const el = this.el;
      const tween = { duration: 0.6, ease: 'expo.out' };
      gsap.set(el, { transformPerspective: 900 });
      const rotateX = gsap.quickTo(el, 'rotationX', tween);
      const rotateY = gsap.quickTo(el, 'rotationY', tween);
      const lift = gsap.quickTo(el, 'y', tween);
      const { signal } = abort;
      el.addEventListener('pointerenter', () => lift(-4), { signal });
      el.addEventListener(
        'pointermove',
        (event) => {
          const box = el.getBoundingClientRect();
          rotateX((0.5 - (event.clientY - box.top) / box.height) * 8);
          rotateY(((event.clientX - box.left) / box.width - 0.5) * 8);
        },
        { signal },
      );
      el.addEventListener(
        'pointerleave',
        () => {
          rotateX(0);
          rotateY(0);
          lift(0);
        },
        { signal },
      );
    });
    inject(DestroyRef).onDestroy(() => abort.abort());
  }
}
