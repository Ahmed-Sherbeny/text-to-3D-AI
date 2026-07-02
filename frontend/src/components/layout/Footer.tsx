import { Heart, Box } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="OptiForge3D" className="h-6 w-6" />
              <span className="font-bold">OptiForge3D</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered 3D model generation platform
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/generate" className="text-muted-foreground hover:text-foreground">
                  Generate
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-muted-foreground hover:text-foreground">
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {currentYear} OptiForge3D. All rights reserved.
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            Made with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> and{' '}
            <Box className="h-4 w-4 text-primary" />
          </p>
        </div>
      </div>
    </footer>
  );
}
