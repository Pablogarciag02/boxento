import React, { useState } from 'react';
import { useAuth, AuthContextType } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Github, 
  Twitter, 
  Facebook, 
  Apple, 
  Phone 
} from 'lucide-react';
import { SocialLoginButtons } from './SocialLoginButtons';

interface SignupFormProps {
  onToggleForm: () => void;
  onSuccess?: () => void;
}

export function SignupForm({ onToggleForm, onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    signup, 
    googleSignIn,
    githubSignIn,
    twitterSignIn,
    facebookSignIn,
    appleSignIn,
    microsoftSignIn,
    phoneSignIn
  } = useAuth() as AuthContextType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    setError('');
    setIsLoading(true);
    
    try {
      switch (provider) {
        case 'google':
          await googleSignIn();
          break;
        case 'github':
          await githubSignIn();
          break;
        case 'twitter':
          await twitterSignIn();
          break;
        case 'facebook':
          await facebookSignIn();
          break;
        case 'apple':
          await appleSignIn();
          break;
        case 'microsoft':
          await microsoftSignIn();
          break;
        case 'phone':
          await phoneSignIn();
          break;
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to sign up with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <SocialLoginButtons />

        <div className="text-center">
          <Button variant="link" onClick={onToggleForm} type="button">
            Already have an account? Sign in
          </Button>
        </div>
      </CardContent>
    </div>
  );
} 