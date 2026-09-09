import { LicensePlateBadge } from '../ui/license-plate-badge.js';

export function Plate({ plate }: { plate: string }) {
  return <LicensePlateBadge plate={plate} title={plate} />;
}
