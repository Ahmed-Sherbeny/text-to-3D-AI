# Quick Start Guide

Get the AI Image Generator frontend up and running in minutes.

## 🚀 Quick Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start development server
npm run dev
```

The application will open at `http://localhost:3000`

## 🔑 Environment Setup

Edit `.env` file:

```env
# Point to your backend API
VITE_API_URL=http://localhost:8000

# API timeout in milliseconds
VITE_API_TIMEOUT=30000

# Environment
VITE_ENV=development
```

## 🎯 First Steps

1. **Home Page** (`/`) - Landing page with overview
2. **Generate** (`/generate`) - Create AI images
3. **Gallery** (`/gallery`) - View generated images
4. **Settings** (`/settings`) - Configure preferences

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Building
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Check code
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run type-check       # Check TypeScript types
```

## 🔌 API Connection

The frontend connects to the backend API at:
- Development: `http://localhost:8000`
- All API requests are proxied through `/api`

Example API endpoints:
- `GET /api/health` - Health check
- `POST /api/generate` - Generate image
- `GET /api/images` - Get image gallery

## 🎨 Customization

### Theme

Toggle dark mode using the theme switcher in the navigation bar.

### Colors

Edit CSS variables in `src/index.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... more variables */
}
```

## 📱 Responsive Design

The application is mobile-first and responsive:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.ts or use environment variable
PORT=3001 npm run dev
```

### API Connection Issues

1. Ensure backend is running on port 8000
2. Check VITE_API_URL in .env
3. Verify CORS settings on backend

### Build Errors

```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build
```

### Type Errors

```bash
# Check TypeScript errors
npm run type-check
```

## 📚 Next Steps

- Read the full [README.md](./README.md)
- Explore the [component library](./src/components/ui/)
- Check out [store documentation](./src/store/)
- Review [API service](./src/services/api.ts)

## 💡 Tips

- Use React DevTools browser extension
- Enable hot module replacement (HMR) automatically via Vite
- Check console for helpful error messages
- Use TypeScript for better IntelliSense

## 🆘 Getting Help

- Check browser console for errors
- Review network tab for API issues
- Read error messages carefully
- Ensure all dependencies are installed

Happy coding! 🎉
