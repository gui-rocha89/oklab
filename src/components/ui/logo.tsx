import { useTheme } from 'next-themes';
import logoWhite from '@/assets/logo-white-bg.png';
import logoDark from '@/assets/logo-dark-mode.svg';

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-16 w-auto", alt = "OK Lab Logo" }: LogoProps) {
  const { theme, resolvedTheme } = useTheme();
  
  // Use the resolved theme to avoid hydration issues
  const currentTheme = resolvedTheme || theme;
  const logoSrc = currentTheme === 'dark' ? logoDark : logoWhite;
  
  return (
    <img 
      src={logoSrc} 
      alt={alt}
      className={className}
    />
  );
}