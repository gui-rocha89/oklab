import { Button } from '@/components/ui/button';
import { nav } from '@/mkt/content';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Nav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 glass-nav ${
        isScrolled ? 'scrolled' : ''
      }`}
    >
      <div className="container px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center logo-glint logo-pop" aria-label="OK Lab - Página inicial">
            <img 
              src="/mkt/brand-mark.svg" 
              alt="OK Lab" 
              className="h-5 w-auto"
              style={{ height: '20px' }}
            />
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {nav.links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="text-sm text-foreground/80 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {nav.ctas.map((cta, idx) => (
              <Button key={idx} variant={cta.variant} size="sm" asChild>
                <a href={cta.href}>{cta.label}</a>
              </Button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <div className="py-4 space-y-4">
              {nav.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="block text-sm text-foreground/80 hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-3 border-t border-border">
                {nav.ctas.map((cta, idx) => (
                  <Button
                    key={idx}
                    variant={cta.variant}
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a href={cta.href}>{cta.label}</a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
