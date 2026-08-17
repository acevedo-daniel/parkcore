export function Plate({ plate }: { plate: string }) {
  return (
    <span className="plate" aria-label={`Vehicle plate ${plate}`}>
      {plate}
    </span>
  );
}
