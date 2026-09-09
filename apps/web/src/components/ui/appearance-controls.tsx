import { Moon, Sun } from 'lucide-react';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';

export function AppearanceControls({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t, theme, toggleTheme } = useAppearance();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className={cn('appearance-controls', compact && 'appearance-controls-compact')}>
      <div aria-label="Select language" className="language-selector" role="group">
        <button
          aria-pressed={language === 'es'}
          className={cn('language-option', language === 'es' && 'is-active')}
          onClick={() => {
            setLanguage('es');
          }}
          type="button"
        >
          ES
        </button>
        <button
          aria-pressed={language === 'en'}
          className={cn('language-option', language === 'en' && 'is-active')}
          onClick={() => {
            setLanguage('en');
          }}
          type="button"
        >
          EN
        </button>
      </div>
      <button
        aria-label={t(`theme.${nextTheme}`)}
        className="icon-button theme-toggle"
        onClick={toggleTheme}
        type="button"
      >
        {theme === 'dark' ? (
          <Sun aria-hidden="true" size={17} />
        ) : (
          <Moon aria-hidden="true" size={17} />
        )}
      </button>
    </div>
  );
}
