import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="OptiForge3D" className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight">OptiForge3D</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              AI-powered 3D model generation platform for creators and developers
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link 
                  to="/" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/generate" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Generate
                </Link>
              </li>
              <li>
                <Link 
                  to="/gallery" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Gallery
                </Link>
              </li>
              <li>
                <Link 
                  to="/settings" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Community
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cookie Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} OptiForge3D. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
