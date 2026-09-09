import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { useAppearance } from '../../app/appearance-provider.js';
import { DemoLoginButton } from '../../features/auth/demo-login-button.js';
import { PARKCORE_PUBLIC_URL, useDocumentMeta } from '../../lib/document-meta.js';

export function LandingRoute() {
  const { language } = useAppearance();
  const es = language === 'es';
  const navigate = useNavigate();
  useDocumentMeta({
    description:
      'Find active parking facilities or operate your own parking with clear sessions, capacity and rates.',
    publicUrl: PARKCORE_PUBLIC_URL,
    title: 'ParkCore | Parking Operations',
  });
  return (
    <div className="landing stack-landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="type-label">{es ? 'Operaciones de cocheras' : 'Parking operations'}</p>
          <h1 className="type-hero" id="landing-title">
            {es ? 'Cocheras,' : 'Parking,'}
            <br />
            {es ? 'bajo control.' : 'under control.'}
          </h1>
          <p className="landing-intro">
            {es
              ? 'Encontrá cocheras activas o gestioná tu operación con visibilidad clara de estadías, capacidad y tarifas.'
              : 'Find active parking facilities or run your own operation with a clear view of sessions, capacity and rate.'}
          </p>
          <div className="landing-actions">
            <Link className="button button-primary" to="/parkings">
              {es ? 'Explorar cocheras' : 'Explore parkings'}{' '}
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <DemoLoginButton onSuccess={() => void navigate('/app', { replace: true })} />
            <Link className="button button-secondary" to="/login">
              {es ? 'Acceso operador' : 'Owner login'}
            </Link>
          </div>
        </div>
        <div aria-label="Operational example" className="operation-visual">
          <div className="operation-topline">
            <span className="type-label">P / 01</span>
            <span className="status status-active">Active</span>
          </div>
          <div className="operation-name">CENTRAL</div>
          <div className="operation-metrics">
            <div>
              <strong className="type-metric">18 / 64</strong>
              <span className="type-label">{es ? 'Estadías activas' : 'Current sessions'}</span>
            </div>
            <div>
              <strong className="type-operational">USD 24.00</strong>
              <span className="type-label">{es ? 'Por hora' : 'Per hour'}</span>
            </div>
          </div>
          <div className="operation-meter" aria-hidden="true">
            <span style={{ width: '28%' }} />
          </div>
          <div className="operation-sessions">
            <span className="plate">AB123CD</span>
            <span className="type-operational">01:42</span>
            <span className="plate">AE532LO</span>
            <span className="type-operational">00:17</span>
          </div>
          <p className="operation-coordinates type-operational">27.4518° S&nbsp;&nbsp;58.9867° W</p>
        </div>
      </section>
      <section className="landing-split" aria-label="ParkCore surfaces">
        <div>
          <p className="type-label">{es ? 'Descubrir' : 'Discover'}</p>
          <h2 className="type-section-title">
            {es ? 'Encontrá una cochera activa.' : 'Find active parking.'}
          </h2>
          <p className="field-help">
            {es
              ? 'Ubicación, tarifa, capacidad y estado operativo.'
              : 'Location, rate, capacity and operational status.'}
          </p>
        </div>
        <div>
          <p className="type-label">{es ? 'Operar' : 'Operate'}</p>
          <h2 className="type-section-title">
            {es ? 'Gestioná tu cochera.' : 'Run your facility.'}
          </h2>
          <p className="field-help">
            {es
              ? 'Capacidad, ingresos, estadías activas y cobro.'
              : 'Capacity, check-ins, active sessions and checkout.'}
          </p>
        </div>
      </section>
    </div>
  );
}
