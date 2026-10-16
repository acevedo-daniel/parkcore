import { Monitor, Moon, Sun } from 'lucide-react';
import { useAppearance } from '../../app/appearance-provider.js';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group.js';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip.js';
import { cn } from '../../lib/cn.js';

const segmentClassName =
  'shrink-0 gap-0.5 rounded-xl border border-border-subtle bg-transparent p-0.5';
const segmentItemClassName =
  'min-h-11 min-w-11 rounded-lg border border-transparent px-2.5 text-xs font-bold text-foreground-secondary data-[state=on]:bg-brand-soft data-[state=on]:text-foreground';

export function AppearanceControls({
  className,
  compact = false,
  layout = 'inline',
  presentation = 'compact',
}: {
  className?: string;
  compact?: boolean;
  layout?: 'inline' | 'stacked';
  presentation?: 'compact' | 'profile';
}) {
  const { locale, preference, setLanguage, setThemePreference, t } = useAppearance();
  const isProfile = presentation === 'profile';

  return (
    <div
      className={cn(
        isProfile
          ? 'flex w-full min-w-0 flex-col gap-5'
          : layout === 'stacked'
            ? 'flex w-full min-w-0 flex-col items-start gap-2'
            : 'flex min-w-0 items-center gap-2',
        compact && !isProfile && layout === 'inline' && 'w-full justify-between',
        className,
      )}
      data-layout={layout}
      data-presentation={presentation}
      data-slot="appearance-controls"
    >
      <div
        className={cn(
          isProfile
            ? 'min-w-0 space-y-2'
            : layout === 'stacked'
              ? 'flex flex-col gap-2'
              : 'flex items-center',
        )}
      >
        {isProfile ? (
          <p className="type-label text-muted-foreground">{t('appearance.languageLabel')}</p>
        ) : null}
        <ToggleGroup
          aria-label={isProfile ? t('appearance.languageLabel') : t('appearance.language')}
          className={segmentClassName}
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
            className={segmentItemClassName}
            value="es-AR"
          >
            ES
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label={t('appearance.languageEnglish')}
            className={segmentItemClassName}
            value="en-US"
          >
            EN
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        className={cn(
          'flex min-w-0 items-center gap-2',
          isProfile && 'flex-col items-start',
          compact && !isProfile && layout === 'inline' && 'grow justify-end',
        )}
      >
        {isProfile ? (
          <span className="type-label text-muted-foreground">
            {t('appearance.appearanceLabel')}
          </span>
        ) : null}
        <TooltipProvider delayDuration={300}>
          <ToggleGroup
            aria-label={isProfile ? t('appearance.appearanceLabel') : t('appearance.theme')}
            className={segmentClassName}
            onValueChange={(value) => {
              if (value === 'system' || value === 'light' || value === 'dark') {
                setThemePreference(value);
              }
            }}
            type="single"
            value={preference}
          >
            {(
              [
                { Icon: Monitor, label: t('theme.system'), value: 'system' },
                { Icon: Sun, label: t('theme.light'), value: 'light' },
                { Icon: Moon, label: t('theme.dark'), value: 'dark' },
              ] as const
            ).map(({ Icon, label, value }) => {
              const item = (
                <ToggleGroupItem
                  aria-label={isProfile ? undefined : label}
                  className={cn(segmentItemClassName, isProfile ? 'gap-2 px-3' : 'size-11 p-0')}
                  key={value}
                  value={value}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {isProfile ? <span>{label}</span> : null}
                </ToggleGroupItem>
              );

              return isProfile ? (
                item
              ) : (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>{item}</TooltipTrigger>
                  <TooltipContent side="bottom">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </ToggleGroup>
        </TooltipProvider>
      </div>
    </div>
  );
}
