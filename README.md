# BoardCo

A modern, full-stack web application built with Laravel and React, featuring a comprehensive authentication system and user management capabilities.

## 🚀 Features

### Authentication & Security

- **User Registration** - Secure user registration with validation
- **Email Verification** - Verify user email addresses
- **Login System** - Email-based authentication with rate limiting
- **Password Reset** - Forgot password and reset functionality
- **Two-Factor Authentication (2FA)** - Enhanced security with TOTP support
- **Session Management** - Secure session handling with database storage

### User Management

- **Profile Settings** - Update name, email, and profile information
- **Password Management** - Change password with current password verification
- **Account Deletion** - Soft delete user accounts with password confirmation
- **Appearance Settings** - Theme customization support

### UI/UX

- **Modern Interface** - Built with Radix UI components and Tailwind CSS
- **Responsive Design** - Mobile-first, fully responsive layouts
- **Dark Mode Support** - Built-in theme switching capability
- **Type-Safe** - Full TypeScript support for enhanced developer experience
- **Fast Refresh** - Hot module replacement for rapid development

## 🛠️ Tech Stack

### Backend

- **[Laravel 12](https://laravel.com/)** - Modern PHP framework
- **[Laravel Fortify](https://laravel.com/docs/fortify)** - Authentication backend
- **[Inertia.js](https://inertiajs.com/)** - Server-side routing with SPA feel
- **SQLite** - Default database (configurable)
- **PHP 8.2+** - Latest PHP features

### Frontend

- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[Vite 7](https://vitejs.dev/)** - Next-generation build tool

### Development Tools

- **[Pest](https://pestphp.com/)** - Testing framework
- **[Laravel Pint](https://laravel.com/docs/pint)** - PHP code style fixer
- **[ESLint](https://eslint.org/)** - JavaScript linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[React Compiler](https://react.dev/learn/react-compiler)** - Automatic optimization

## 📋 Requirements

- **PHP** >= 8.2
- **Composer** >= 2.0
- **Node.js** >= 18.0
- **NPM** >= 9.0

## 🔧 Installation

### Quick Setup

Run the automated setup script:

```bash
composer setup
```

This will:

1. Install PHP dependencies
2. Create `.env` file from `.env.example`
3. Generate application key
4. Run database migrations
5. Install Node.js dependencies
6. Build frontend assets

### Manual Setup

1. **Clone the repository**

    ```bash
    git clone <your-repository-url>
    cd boardco
    ```

2. **Install PHP dependencies**

    ```bash
    composer install
    ```

3. **Environment configuration**

    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

4. **Configure database**

    By default, the application uses SQLite. The database file will be created automatically at `database/database.sqlite`.

    For other databases, update the `.env` file:

    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=your_database
    DB_USERNAME=your_username
    DB_PASSWORD=your_password
    ```

5. **Run migrations**

    ```bash
    php artisan migrate
    ```

6. **Install Node.js dependencies**

    ```bash
    npm install
    ```

7. **Build frontend assets**
    ```bash
    npm run build
    ```

## 🚀 Development

### Start Development Server

Run all development services concurrently:

```bash
composer dev
```

This starts:

- Laravel development server (http://localhost:8000)
- Queue worker
- Vite dev server with HMR

### Individual Commands

**Backend server:**

```bash
php artisan serve
```

**Frontend development:**

```bash
npm run dev
```

**Queue worker:**

```bash
php artisan queue:listen
```

### Server-Side Rendering (SSR)

For improved SEO and performance:

```bash
composer dev:ssr
```

This enables:

- SSR support with Inertia.js
- Log monitoring with Laravel Pail
- Automatic restarts on changes

## 🧪 Testing

Run the test suite:

```bash
composer test
```

Or directly with Pest:

```bash
php artisan test
```

## 📁 Project Structure

```
boardco/
├── app/
│   ├── Actions/Fortify/      # Authentication actions
│   ├── Http/Controllers/     # Application controllers
│   ├── Models/                # Eloquent models
│   └── Providers/             # Service providers
├── config/                    # Configuration files
├── database/
│   ├── factories/             # Model factories
│   ├── migrations/            # Database migrations
│   └── seeders/               # Database seeders
├── resources/
│   ├── css/                   # Stylesheets
│   └── js/
│       ├── components/        # React components
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utility functions
│       └── pages/             # Inertia pages
│           ├── auth/          # Authentication pages
│           ├── settings/      # User settings pages
│           ├── dashboard.tsx  # User dashboard
│           └── welcome.tsx    # Landing page
├── routes/
│   ├── web.php                # Web routes
│   └── settings.php           # Settings routes
├── tests/                     # Test files
└── public/                    # Public assets
```

## 🔐 Authentication Features

### Available Routes

**Public Routes:**

- `/` - Welcome page
- `/login` - User login
- `/register` - User registration
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset form

**Authenticated Routes:**

- `/dashboard` - User dashboard
- `/settings/profile` - Profile management
- `/settings/password` - Password change
- `/settings/appearance` - Theme settings
- `/settings/two-factor` - 2FA setup

### Configuration

Authentication settings can be modified in:

- `config/fortify.php` - Fortify features and options
- `app/Providers/FortifyServiceProvider.php` - Custom authentication logic

## 🎨 Code Quality

**Format code:**

```bash
npm run format
```

**Lint code:**

```bash
npm run lint
```

**Type check:**

```bash
npm run types
```

**PHP code style:**

```bash
./vendor/bin/pint
```

## 🌐 Deployment

1. **Build production assets:**

    ```bash
    npm run build
    ```

2. **Optimize Laravel:**

    ```bash
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ```

3. **Set proper permissions:**

    ```bash
    chmod -R 775 storage bootstrap/cache
    ```

4. **Configure environment:**
    - Set `APP_ENV=production`
    - Set `APP_DEBUG=false`
    - Configure production database
    - Set up queue workers
    - Configure mail settings

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:

- Code follows the existing style guidelines
- All tests pass
- New features include tests
- Documentation is updated

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Laravel](https://laravel.com/) - The PHP framework for web artisans
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [Inertia.js](https://inertiajs.com/) - The modern monolith
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components

## 📧 Support

For issues and questions:

- Create an issue in the repository
- Check existing documentation
- Review closed issues for solutions

---

**Built with ❤️ using Laravel and React**
