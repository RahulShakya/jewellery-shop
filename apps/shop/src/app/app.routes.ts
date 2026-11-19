import { Routes } from '@angular/router';
import { authGuard } from '@carat-line/auth';

export const routes: Routes = [
  {
    path: '',
    title: 'Carat Line - Modern fine jewellery Shop',
    loadComponent: () => import('./features/home/home').then((component) => component.Home),
  },
  {
    path: 'products',
    title: 'The Collection - Carat Line',
    loadComponent: () =>
      import('@carat-line/products-list').then((component) => component.FeatureList),
  },
  {
    path: 'products/:slug',
    title: 'Product - Carat Line',
    loadComponent: () =>
      import('@carat-line/products-list').then((component) => component.ProductDetail),
  },
  {
    path: 'wishlist',
    title: 'Wishlist - Carat Line',
    loadComponent: () =>
      import('@carat-line/products-list').then((component) => component.Wishlist),
  },
  {
    path: 'cart',
    title: 'Shopping Bag - Carat Line',
    loadComponent: () => import('@carat-line/cart').then((component) => component.FeatureCart),
  },
  {
    path: 'checkout',
    title: 'Checkout - Carat Line',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@carat-line/checkout').then((component) => component.FeatureCheckout),
  },
  {
    path: 'order-confirmation/:orderNumber',
    title: 'Order Confirmed - Carat Line',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@carat-line/checkout').then((component) => component.OrderConfirmation),
  },
  {
    path: 'login',
    title: 'Sign in - Carat Line',
    loadComponent: () => import('./features/login/login').then((component) => component.Login),
  },
  {
    path: 'register',
    title: 'Create account - Carat Line',
    loadComponent: () =>
      import('./features/register/register').then((component) => component.Register),
  },
  { path: '**', redirectTo: '' },
];
