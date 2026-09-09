import { useState } from 'react';

import { Button } from '../../components/ui/button.js';
import { ApiError } from '../../lib/api/api-error.js';
import { useAuth } from './use-auth.js';

export function DemoLoginButton({
  onSuccess,
  variant = 'secondary',
}: {
  onSuccess: () => void;
  variant?: 'primary' | 'secondary';
}) {
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
      setError(
        reason instanceof ApiError ? reason.message : 'Unable to start the demo. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="stack-tight">
      <Button
        disabled={isSubmitting}
        onClick={() => void startDemo()}
        type="button"
        variant={variant}
      >
        {isSubmitting ? 'Opening demo…' : 'Try the demo'}
      </Button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
