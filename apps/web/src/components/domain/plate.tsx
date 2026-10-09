import { useAppearance } from '../../app/appearance-provider.js';
import { Badge } from '../ui/badge.js';

export function Plate({ plate }: { plate: string }) {
  const { t } = useAppearance();
  const normalizedPlate = plate.trim().toUpperCase();

  return (
    <Badge
      aria-label={t('parking.vehiclePlate', { plate: normalizedPlate })}
      className="plate"
      title={normalizedPlate}
      variant="plate"
    >
      {normalizedPlate}
    </Badge>
  );
}
