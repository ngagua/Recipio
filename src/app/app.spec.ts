import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { MotionService } from './core/motion.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: MotionService, useValue: { start: () => undefined } },
      ],
    }).compileComponents();
  });

  it('renders the shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header a')?.textContent).toContain('Recipio');
    expect(el.querySelector('main')).toBeTruthy();
    expect(el.querySelectorAll('nav').length).toBeGreaterThan(0);
  });
});
