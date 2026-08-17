import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

import { useDocumentMeta } from '../../lib/document-meta.js';

export function LandingRoute() {
  useDocumentMeta({
    description:
      'Find active parking facilities or operate your own parking with clear sessions, capacity and rates.',
    title: 'ParkCore | Parking operations',
  });
  return (
    <div className="landing stack-landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-copy">
          <p className="type-label">Parking operations</p>
          <h1 className="type-hero" id="landing-title">
            Parking,
            <br />
            under control.
          </h1>
          <p className="landing-intro">
            Find active parking facilities or run your own operation with a clear view of sessions,
            capacity and rate.
          </p>
          <div className="landing-actions">
            <Link className="button button-primary" to="/parkings">
              Explore parkings <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <Link className="button button-secondary" to="/login">
              Owner login
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
              <span className="type-label">Current sessions</span>
            </div>
            <div>
              <strong className="type-operational">USD 24.00</strong>
              <span className="type-label">Per hour</span>
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
          <p className="type-label">Discover</p>
          <h2 className="type-section-title">Find active parking.</h2>
          <p className="field-help">Location, rate, capacity and operational status.</p>
        </div>
        <div>
          <p className="type-label">Operate</p>
          <h2 className="type-section-title">Run your facility.</h2>
          <p className="field-help">Capacity, check-ins, active sessions and checkout.</p>
        </div>
      </section>
    </div>
  );
}
