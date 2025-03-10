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

interface LoginFormProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onToggleForm, onForgotPassword, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { 
    login, 
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
    setIsLoading(true);

    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="bg-background border-input"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" style={{borderColor: "oklch(var(--border))"}} />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <SocialLoginButtons />

        <div className="flex flex-col space-y-2 text-center text-sm">
          <Button variant="link" onClick={onForgotPassword} type="button" className="text-primary">
            Forgot password?
          </Button>
          <Button variant="link" onClick={onToggleForm} type="button" className="text-primary">
            Don't have an account? Sign up
          </Button>
        </div>
      </CardContent>
    </div>
  );
} 