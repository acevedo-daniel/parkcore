import { Link } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';

export function OwnerNotFoundRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  return (
    <section
      className="owner-page flex min-h-[55vh] items-center"
      aria-labelledby="owner-not-found-title"
    >
      <div className="max-w-xl rounded-[2rem] border border-[#121417] bg-[#ffcc00] p-7 shadow-[0_10px_0_rgba(18,20,23,0.16)] sm:p-10">
        <p className="font-mono text-xs font-bold tracking-[0.16em] text-[#121417] uppercase">
          404
        </p>
        <h1
          className="mt-5 font-display text-4xl font-bold leading-[0.95] tracking-[-0.055em] text-[#121417] sm:text-5xl"
          id="owner-not-found-title"
        >
          {es ? 'Esta vista no está disponible.' : 'This view is unavailable.'}
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-[#34342f]">
          {es
            ? 'Volvé al resumen para continuar con la operación.'
            : 'Return to the overview to continue operating.'}
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#121417] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#121417]"
          to="/app"
        >
          {es ? 'Ir al resumen' : 'Go to overview'}
        </Link>
      </div>
    </section>
  );
}
