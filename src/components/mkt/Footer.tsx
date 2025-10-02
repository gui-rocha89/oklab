import { Logo } from '@/components/ui/logo';
import { footer } from '@/mkt/content';
import { Instagram, Linkedin, Twitter } from 'lucide-react';

const iconMap = {
  Instagram,
  Linkedin,
  Twitter,
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Logo className="h-8 w-auto mb-4" />
            <p className="text-sm text-muted-foreground max-w-xs">
              {footer.company.tagline}
            </p>
          </div>

          {/* Links */}
          {footer.sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">{footer.copyright}</p>
          <div className="flex gap-4">
            {footer.social.map((social, idx) => {
              const Icon = iconMap[social.icon as keyof typeof iconMap];
              return (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.name}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
