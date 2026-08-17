export function RoutePending({ title }: { title: string }) {
  return (
    <section className="route-pending">
      <p className="type-label">ParkCore</p>
      <h1 className="type-page-title">{title}</h1>
      <p className="field-help">This route is prepared for its dedicated implementation phase.</p>
    </section>
  );
}
