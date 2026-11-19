import { Routes } from '@angular/router';
import { adminGuard, authGuard } from '@carat-line/auth';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in | CaratLine Admin',
    loadComponent: () => import('./features/login/login.page').then((page) => page.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./layouts/admin-shell/admin-shell.component').then(
        (component) => component.AdminShellComponent,
      ),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard | CaratLine Admin',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((page) => page.DashboardPage),
      },
      {
        path: 'products/new',
        title: 'Add product | CaratLine Admin',
        loadComponent: () =>
          import('./features/products/product-form.page').then((page) => page.ProductFormPage),
      },
      {
        path: 'products/:id/edit',
        title: 'Edit product | CaratLine Admin',
        loadComponent: () =>
          import('./features/products/product-form.page').then((page) => page.ProductFormPage),
      },
      {
        path: 'products',
        title: 'Products | CaratLine Admin',
        loadComponent: () =>
          import('./features/products/products.page').then((page) => page.ProductsPage),
      },
      {
        path: 'categories/new',
        title: 'Add category | CaratLine Admin',
        loadComponent: () =>
          import('./features/categories/category-form.page').then((page) => page.CategoryFormPage),
      },
      {
        path: 'categories/:id/edit',
        title: 'Edit category | CaratLine Admin',
        loadComponent: () =>
          import('./features/categories/category-form.page').then((page) => page.CategoryFormPage),
      },
      {
        path: 'categories',
        title: 'Categories | CaratLine Admin',
        loadComponent: () =>
          import('./features/categories/categories.page').then((page) => page.CategoriesPage),
      },
      {
        path: 'orders',
        title: 'Orders | CaratLine Admin',
        loadComponent: () =>
          import('./features/orders/orders.page').then((page) => page.OrdersPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
