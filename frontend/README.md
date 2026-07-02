# AI Image Generator - Frontend

A modern, responsive React + TypeScript frontend for the AI Image Generator platform.

## 🚀 Features

- **Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **State Management**: Zustand for efficient global state
- **Routing**: React Router v6 for navigation
- **API Integration**: Axios with interceptors and error handling
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme Support**: Light/dark mode toggle
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint, Prettier, and TypeScript checks

## 📦 Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.2.2
- **Build Tool**: Vite 5.3.1
- **Styling**: Tailwind CSS 3.4.4
- **State Management**: Zustand 4.5.2
- **Routing**: React Router 6.24.1
- **HTTP Client**: Axios 1.7.2
- **Icons**: Lucide React

## 🛠️ Development

### Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:8000)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components
│   ├── layouts/         # Layout wrappers
│   ├── store/           # Zustand stores
│   ├── services/        # API services
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── config/          # Configuration files
│   ├── App.tsx          # Main App component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json         # Dependencies
```

## 🎨 Styling

The project uses Tailwind CSS with custom CSS variables for theming:

- Colors defined via HSL variables
- Dark mode support via `class` strategy
- Consistent design tokens
- Responsive utilities

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_ENV=development
```

### Path Aliases

The following path aliases are configured:

- `@/` → `src/`
- `@/components` → `src/components`
- `@/store` → `src/store`
- `@/services` → `src/services`
- `@/utils` → `src/utils`
- `@/types` → `src/types`
- `@/config` → `src/config`
- `@/layouts` → `src/layouts`
- `@/pages` → `src/pages`

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🧪 Code Quality

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Formatting

```bash
npm run format       # Format all files
npm run format:check # Check formatting
```

### Type Checking

```bash
npm run type-check
```

## 📝 Contributing

1. Follow the existing code style
2. Run linting and formatting before committing
3. Ensure type checking passes
4. Write meaningful commit messages

## 📄 License

This project is part of the AI Image Generator platform.
