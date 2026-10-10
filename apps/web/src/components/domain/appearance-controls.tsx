import { SunMoon } from 'lucide-react';
import { useAppearance } from '../../app/appearance-provider.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.js';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group.js';
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
      <div className={cn(isProfile ? 'min-w-0 space-y-2' : 'flex items-center')}>
        {isProfile ? (
          <p className="type-label text-muted-foreground">{t('appearance.languageLabel')}</p>
        ) : null}
        <ToggleGroup
          aria-label={isProfile ? t('appearance.languageLabel') : t('appearance.language')}
          className="shrink-0 gap-0.5 rounded-xl border border-border-subtle bg-transparent p-0.5"
          onValueChange={(value) => {
            if (value === 'es-AR' || value === 'en-US') {
              setLanguage(value);
            }
          }}
          type="single"
          value={locale}
        >
          <ToggleGroupItem
            aria-label={t('appearance.languageSpanish')}
            className="min-h-11 min-w-11 rounded-lg border border-transparent px-2.5 text-xs font-bold text-foreground-secondary data-[state=on]:bg-brand-soft data-[state=on]:text-foreground"
            value="es-AR"
          >
            ES
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label={t('appearance.languageEnglish')}
            className="min-h-11 min-w-11 rounded-lg border border-transparent px-2.5 text-xs font-bold text-foreground-secondary data-[state=on]:bg-brand-soft data-[state=on]:text-foreground"
            value="en-US"
          >
            EN
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <label
        className={cn(
          isProfile
            ? 'flex min-w-0 flex-col items-start gap-2'
            : 'appearance-theme flex min-w-0 items-center gap-2',
          compact && !isProfile && 'grow justify-end',
        )}
      >
        <span className={cn(isProfile ? 'type-label text-muted-foreground' : 'sr-only')}>
          {isProfile ? t('appearance.appearanceLabel') : t('appearance.theme')}
        </span>
        <Select
          onValueChange={(value) => {
            if (value === 'system' || value === 'light' || value === 'dark') {
              setThemePreference(value);
            }
          }}
          value={preference}
        >
          <SelectTrigger
            aria-label={isProfile ? undefined : t('appearance.theme')}
            className={cn(
              'min-h-11 rounded-lg border-2 border-border-strong bg-card px-3 text-xs font-semibold shadow-xs hover:bg-muted',
              isProfile && 'w-full',
            )}
          >
            <SunMoon aria-hidden="true" className="size-4 text-foreground-secondary" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            align="end"
            className="rounded-xl border-2 border-border-strong bg-card p-1.5 shadow-xl"
            position="popper"
          >
            <SelectItem
              className="min-h-11 rounded-lg border border-transparent font-medium focus-visible:border-border-strong"
              value="system"
            >
              {t('theme.system')}
            </SelectItem>
            <SelectItem
              className="min-h-11 rounded-lg border border-transparent font-medium focus-visible:border-border-strong"
              value="light"
            >
              {t('theme.light')}
            </SelectItem>
            <SelectItem
              className="min-h-11 rounded-lg border border-transparent font-medium focus-visible:border-border-strong"
              value="dark"
            >
              {t('theme.dark')}
            </SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
