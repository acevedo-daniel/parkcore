import { useState } from 'react';

import { useAppearance } from '../../app/appearance-provider.js';
import { Button } from '../../components/ui/button.js';
import { localizeApiError } from '../../lib/api/api-error.js';
import { useAuth } from './use-auth.js';

export function DemoLoginButton({
  onSuccess,
  variant = 'secondary',
  className,
  children,
}: {
  onSuccess: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  children?: React.ReactNode;
}) {
  const { t } = useAppearance();
  const { loginDemo } = useAuth();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startDemo = async () => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      await loginDemo();
      onSuccess();
    } catch (reason) {
      setError(localizeApiError(reason, t, 'demo.startError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stack-tight">
      <Button
        className={className}
        disabled={isSubmitting}
        onClick={() => void startDemo()}
        type="button"
        variant={variant}
      >
        {isSubmitting ? t('demo.opening') : (children ?? t('demo.try'))}
      </Button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
