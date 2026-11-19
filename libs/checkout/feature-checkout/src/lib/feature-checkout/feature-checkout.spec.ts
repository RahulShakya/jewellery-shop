import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeatureCheckout } from './feature-checkout';

describe('FeatureCheckout', () => {
  it('creates the guest checkout flow', async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCheckout],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
    expect(TestBed.createComponent(FeatureCheckout).componentInstance).toBeTruthy();
  });
});
