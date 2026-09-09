import { Moon, Sun } from 'lucide-react';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';

export function AppearanceControls({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t, theme, toggleTheme } = useAppearance();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div className={cn('flex items-center gap-2', compact && 'w-full justify-between')}>
      <div
        aria-label="Select language"
        className="flex items-center rounded-full border border-[#121417]/15 bg-white p-1 shadow-sm"
        role="group"
      >
        <button
          aria-pressed={language === 'es'}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] transition-colors',
            language === 'es' ? 'bg-[#121417] text-white' : 'text-[#121417] hover:bg-[#ffcc00]',
          )}
          onClick={() => {
            setLanguage('es');
          }}
          type="button"
        >
          ES
        </button>
        <button
          aria-pressed={language === 'en'}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] transition-colors',
            language === 'en' ? 'bg-[#121417] text-white' : 'text-[#121417] hover:bg-[#ffcc00]',
          )}
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
        className="flex size-9 items-center justify-center rounded-full border border-[#121417]/15 bg-white text-[#121417] shadow-sm transition-colors hover:bg-[#ffcc00]"
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
