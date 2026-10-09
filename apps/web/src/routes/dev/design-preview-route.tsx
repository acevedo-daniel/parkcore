import { LoaderCircle, Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { AppearanceControls } from '../../components/domain/appearance-controls.js';
import { Combobox } from '../../components/domain/combobox.js';
import { EmptyState, ErrorState } from '../../components/domain/feedback.js';
import { FormField } from '../../components/domain/form-field.js';
import { OccupancyMeter } from '../../components/domain/parking.js';
import { PageHeader } from '../../components/domain/page-header.js';
import { Plate } from '../../components/domain/plate.js';
import { ParkingStatus, SessionStatus } from '../../components/domain/status.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import { Button } from '../../components/ui/button.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import { Input } from '../../components/ui/input.js';
import { Label } from '../../components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { Switch } from '../../components/ui/switch.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { Textarea } from '../../components/ui/textarea.js';

const colorTokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'destructive-soft',
  'destructive-soft-foreground',
  'success',
  'success-foreground',
  'success-soft',
  'success-soft-foreground',
  'warning',
  'warning-foreground',
  'warning-soft',
  'warning-soft-foreground',
  'info',
  'info-foreground',
  'info-soft',
  'info-soft-foreground',
  'brand',
  'brand-foreground',
  'brand-soft',
  'brand-strong',
  'foreground-secondary',
  'border',
  'border-subtle',
  'border-strong',
  'input',
  'ring',
  'inverse',
  'inverse-foreground',
  'overlay',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

const typeRoles = [
  ['Display', 'type-display', 'Aa 123'],
  ['Page title', 'type-page-title', 'Aa 123'],
  ['Heading', 'type-heading', 'Aa 123'],
  ['Section title', 'type-section-title', 'Aa 123'],
  ['Body', 'text-base', 'Aa 123'],
  ['Small text', 'text-sm', 'Aa 123'],
  ['Label', 'type-label', 'Aa 123'],
  ['Eyebrow', 'type-eyebrow', 'Aa 123'],
  ['Metric', 'type-metric', 'Aa 123'],
  ['Operational', 'type-operational', 'Aa 123'],
  ['Code', 'type-code', 'AB123CD'],
] as const;

const buttonVariants = [
  'default',
  'brand',
  'secondary',
  'outline',
  'ghost',
  'destructive',
  'link',
] as const;

const buttonSizes = ['default', 'sm', 'lg', 'icon', 'icon-sm'] as const;

const showcaseParkings = [
  { title: 'Central Corrientes', value: 'central-corrientes' },
  { title: 'Palermo Plaza', value: 'palermo-plaza' },
  { title: 'Recoleta Patio', value: 'recoleta-patio' },
] as const;

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="space-y-4">
      <h2 className="type-section-title">{title}</h2>
      {children}
    </section>
  );
}

export function DesignPreviewRoute() {
  const { t } = useAppearance();
  const activeColors = getComputedStyle(document.documentElement);

  return (
    <main
      className="mx-auto w-full max-w-owner space-y-12 px-4 py-8 sm:px-6 sm:py-12"
      data-slot="design-preview"
    >
      <div className="rounded-signature bg-inverse p-6 text-inverse-foreground sm:p-8">
        <PageHeader
          actions={
            <div className="w-full rounded-2xl border-2 border-border-strong bg-card p-1.5 text-foreground shadow-xs sm:w-auto">
              <AppearanceControls compact />
            </div>
          }
          className="border-inverse-foreground/20"
          description={
            <span className="text-inverse-foreground">{t('parking.fallbackMessage')}</span>
          }
          eyebrow={
            <span className="text-inverse-foreground">{t('public.landing.heroEyebrow')}</span>
          }
          title={<span className="type-display">PageHeader</span>}
        />
      </div>

      <PreviewSection title="type-scale">
        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {typeRoles.map(([role, className, sample]) => (
            <div className="grid min-w-0 grid-cols-2 items-center gap-4 py-4" key={role}>
              <span className="type-label text-muted-foreground">{role}</span>
              <p className={className}>{sample}</p>
            </div>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="color-registry">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {colorTokens.map((token) => (
            <li className="min-w-0 space-y-2" key={token}>
              <div
                aria-label={`${token} color token`}
                className="h-12 rounded-md border border-border"
                role="img"
                style={{
                  backgroundColor: activeColors.getPropertyValue(`--${token}`),
                }}
              />
              <p className="type-operational break-words text-xs text-foreground-secondary">
                {token}
              </p>
            </li>
          ))}
        </ul>
      </PreviewSection>

      <PreviewSection title="Button">
        <div className="space-y-6">
          {buttonVariants.map((variant) => (
            <div className="space-y-3" key={variant}>
              <h3 className="type-label text-muted-foreground">{variant}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {buttonSizes.map((size) => (
                  <Button
                    aria-label={
                      size === 'icon' || size === 'icon-sm'
                        ? t('parkingOperation.searchPlate')
                        : undefined
                    }
                    className="min-w-0"
                    key={`${variant}-${size}`}
                    size={size}
                    type="button"
                    variant={variant}
                  >
                    {size === 'icon' || size === 'icon-sm' ? (
                      <Search aria-hidden="true" />
                    ) : (
                      t('common.tryAgain')
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <div className="space-y-3 border-t border-border-subtle pt-5">
            <h3 className="type-label text-muted-foreground">hover / focus / disabled / loading</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <p className="type-label text-muted-foreground">hover</p>
                <Button
                  className="data-[preview-state=hover]:bg-primary/90"
                  data-preview-state="hover"
                  type="button"
                >
                  {t('common.tryAgain')}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="type-label text-muted-foreground">focus</p>
                <Button
                  className="outline-2 outline-solid outline-ring outline-offset-1"
                  type="button"
                  variant="outline"
                >
                  {t('parkingForm.saveChanges')}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="type-label text-muted-foreground">disabled</p>
                <Button disabled type="button" variant="secondary">
                  {t('common.tryAgain')}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="type-label text-muted-foreground">loading</p>
                <Button aria-busy="true" disabled type="button">
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                  {t('auth.actions.signingIn')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection title="FormField">
        <div className="grid gap-6 lg:grid-cols-2">
          <FormField
            error={t('checkIn.lookupInvalid')}
            htmlFor="preview-plate"
            label={t('checkIn.plate')}
          >
            <Input
              autoComplete="off"
              defaultValue="AB123CD"
              id="preview-plate"
              placeholder={t('checkIn.platePlaceholder')}
            />
          </FormField>
          <div className="space-y-2">
            <Label htmlFor="preview-notes">{t('checkIn.notes')}</Label>
            <Textarea id="preview-notes" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preview-select">{t('parking.facility')}</Label>
            <Select defaultValue="central-corrientes">
              <SelectTrigger id="preview-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {showcaseParkings.map((parking) => (
                  <SelectItem key={parking.value} value={parking.value}>
                    {parking.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Combobox
            defaultValue="central-corrientes"
            label={t('parking.facility')}
            options={showcaseParkings.map(({ title, value }) => ({ label: title, value }))}
          />
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox defaultChecked id="preview-checkbox" />
            <Label htmlFor="preview-checkbox">{t('parking.active')}</Label>
          </div>
          <div className="flex min-h-11 items-center gap-3">
            <Switch defaultChecked id="preview-switch" />
            <Label htmlFor="preview-switch">{t('parking.active')}</Label>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection title="Card">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <CardTitle className="type-heading">{t('parkingOperation.eyebrow')}</CardTitle>
              <CardDescription>{t('parking.fallbackMessage')}</CardDescription>
            </div>
            <ParkingStatus isActive />
          </CardHeader>
          <CardContent>
            <p className="type-operational">Central Corrientes</p>
          </CardContent>
        </Card>
      </PreviewSection>

      <PreviewSection title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{t('parking.facility')}</TableHead>
              <TableHead scope="col">ParkingStatus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showcaseParkings.map((parking) => (
              <TableRow key={parking.value}>
                <TableCell className="font-medium">{parking.title}</TableCell>
                <TableCell>
                  <ParkingStatus isActive />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PreviewSection>

      <PreviewSection title="ParkingStatus / SessionStatus / Plate">
        <div className="flex flex-wrap items-center gap-3">
          <ParkingStatus isActive />
          <ParkingStatus isActive={false} />
          <SessionStatus status="ACTIVE" />
          <SessionStatus status="COMPLETED" />
          <SessionStatus status="CANCELLED" />
          <Plate plate="AB123CD" />
        </div>
      </PreviewSection>

      <PreviewSection title="CapacityGauge">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="type-label text-muted-foreground">success</p>
            <OccupancyMeter active={4} capacity={30} />
          </div>
          <div className="space-y-2">
            <p className="type-label text-muted-foreground">warning</p>
            <OccupancyMeter active={16} capacity={20} />
          </div>
          <div className="space-y-2">
            <p className="type-label text-muted-foreground">destructive</p>
            <OccupancyMeter active={12} capacity={12} />
          </div>
        </div>
      </PreviewSection>

      <PreviewSection title="EmptyState">
        <EmptyState title={t('calculator.emptyEyebrow')}>
          {t('calculator.emptyDescription')}
        </EmptyState>
      </PreviewSection>

      <PreviewSection title="ErrorState">
        <ErrorState>{t('api.loadParkings')}</ErrorState>
      </PreviewSection>
    </main>
  );
}
