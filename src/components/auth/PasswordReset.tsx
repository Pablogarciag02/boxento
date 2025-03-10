import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/AuthContext';

interface PasswordResetProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export function PasswordReset({ onBack, onSuccess }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email" 
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && (
            <p className="text-sm text-green-500">
              Check your email for password reset instructions
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          variant="link" 
          onClick={onBack}
          className="w-full"
          type="button"
        >
          Back to Sign In
        </Button>
      </CardFooter>
    </div>
  );
} 