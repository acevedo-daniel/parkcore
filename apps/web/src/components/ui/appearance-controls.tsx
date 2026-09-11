import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';

export function AppearanceControls({ compact = false }: { compact?: boolean }) {
  const { language, preference, setLanguage, setThemePreference, t } = useAppearance();

  return (
    <div className={cn('flex items-center gap-2', compact && 'w-full justify-between')}>
      <div
        aria-label={t('appearance.language')}
        className="flex items-center rounded-full border border-border bg-surface p-1 shadow-sm"
        role="group"
      >
        <button
          aria-pressed={language === 'es'}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] transition-colors',
            language === 'es'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground',
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
            language === 'en'
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground',
          )}
          onClick={() => {
            setLanguage('en');
          }}
          type="button"
        >
          EN
        </button>
      </div>
      <label
        className={cn('appearance-theme flex items-center gap-2', compact && 'grow justify-end')}
      >
        <span className="visually-hidden">{t('appearance.theme')}</span>
        <select
          aria-label={t('appearance.theme')}
          className="h-9 rounded-[var(--radius-pill)] border border-border bg-surface px-3 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus-ring"
          onChange={(event) => {
            setThemePreference(event.target.value as 'system' | 'light' | 'dark');
          }}
          value={preference}
        >
          <option value="system">{t('theme.system')}</option>
          <option value="light">{t('theme.light')}</option>
          <option value="dark">{t('theme.dark')}</option>
        </select>
      </label>
    </div>
  );
}
