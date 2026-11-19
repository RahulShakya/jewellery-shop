# Carat Line

Carat Line is an Angular 21/Nx jewellery commerce workspace backed by a Laravel 13 REST API.

- `shop` — customer storefront with catalogue, filters, wishlist, persistent cart, guest checkout, COD payment, and order confirmation
- `admin` — role-protected dashboard for products, categories, inventory, and order management
- `api` — Laravel/Sanctum API with seeded catalogue data and transactional order creation

Both Angular applications use the same relative API configuration in `libs/shared/api` and the root development proxy in `proxy.conf.json`.

## Requirements

- Node.js 22 or newer
- npm 11
- Composer
- PHP 8.3 with the PDO MySQL extension enabled
- MySQL-compatible database server (MySQL or MariaDB)

## First-time setup

```bash
npm install
cd api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Before running the migrations, create a MySQL database named `carat_line`. The example environment connects to `127.0.0.1:3306` as `root` with an empty password; update the `DB_*` values in `api/.env` when your local credentials differ.

## Development

Run the API from `api/`:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

From the workspace root, start either Angular application:

```bash
npx nx serve shop --port=4200
npx nx serve admin --port=4201
```

The shared proxy forwards `/api` and `/sanctum` to Laravel, so feature code contains no environment-specific API domain.

## Demo accounts Cridentials..

Admin= `admin@caratline.test`,`password`
Shop customer= `customer@caratline.test`,`password`
