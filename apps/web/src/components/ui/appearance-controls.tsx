import { useId } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { cn } from '../../lib/cn.js';

export function AppearanceControls({
  className,
  compact = false,
  presentation = 'compact',
}: {
  className?: string;
  compact?: boolean;
  presentation?: 'compact' | 'profile';
}) {
  const { locale, preference, setLanguage, setThemePreference, t } = useAppearance();
  const languageLabelId = useId();
  const themeControlId = useId();
  const themeLabelId = useId();
  const isProfile = presentation === 'profile';

  return (
    <div
      className={cn(
        isProfile ? 'flex w-full min-w-0 flex-col gap-5' : 'flex min-w-0 items-center gap-2',
        compact && !isProfile && 'w-full justify-between',
        className,
      )}
      data-presentation={presentation}
      data-slot="appearance-controls"
    >
      <div
        aria-label={isProfile ? undefined : t('appearance.language')}
        aria-labelledby={isProfile ? languageLabelId : undefined}
        className={cn(isProfile ? 'min-w-0 space-y-2' : 'flex items-center')}
        role="group"
      >
        {isProfile ? (
          <span className="type-label text-foreground-muted" id={languageLabelId}>
            {t('appearance.languageLabel')}
          </span>
        ) : null}
        <div className="inline-flex max-w-full shrink-0 items-center rounded-full border border-border bg-surface p-1 shadow-sm">
          <button
            aria-label={t('appearance.languageSpanish')}
            aria-pressed={locale === 'es-AR'}
            className={cn(
              'inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset',
              locale === 'es-AR'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={() => {
              setLanguage('es-AR');
            }}
            type="button"
          >
            ES
          </button>
          <button
            aria-label={t('appearance.languageEnglish')}
            aria-pressed={locale === 'en-US'}
            className={cn(
              'inline-flex min-h-[var(--touch-target-min)] min-w-[var(--touch-target-min)] items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-focus-ring-offset',
              locale === 'en-US'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            onClick={() => {
              setLanguage('en-US');
            }}
            type="button"
          >
            EN
          </button>
        </div>
      </div>
      <label
        className={cn(
          isProfile
            ? 'flex min-w-0 flex-col items-start gap-2'
            : 'appearance-theme flex min-w-0 items-center gap-2',
          compact && !isProfile && 'grow justify-end',
        )}
        htmlFor={themeControlId}
      >
        <span
          className={cn(isProfile ? 'type-label text-foreground-muted' : 'visually-hidden')}
          id={themeLabelId}
        >
          {isProfile ? t('appearance.appearanceLabel') : t('appearance.theme')}
        </span>
        <select
          aria-label={isProfile ? undefined : t('appearance.theme')}
          aria-labelledby={isProfile ? themeLabelId : undefined}
          className={cn(
            'min-h-[var(--touch-target-min)] max-w-full cursor-pointer rounded-[var(--radius-pill)] border border-border bg-surface px-3 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus-ring',
            isProfile && 'w-full',
          )}
          onChange={(event) => {
            setThemePreference(event.target.value as 'system' | 'light' | 'dark');
          }}
          id={themeControlId}
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
