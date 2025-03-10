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
  Mail, 
  Phone 
} from 'lucide-react';

interface LoginFormProps {
  onToggleForm: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onToggleForm, onSuccess }: LoginFormProps) {
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
      <CardHeader className="pb-2">
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to access your dashboard</CardDescription>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password" 
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="relative w-full my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500">or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          <Button 
            variant="outline" 
            onClick={() => handleSocialSignIn('google')}
            disabled={isLoading}
            className="w-full"
            size="icon"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSocialSignIn('github')}
            disabled={isLoading}
            className="w-full"
            size="icon"
          >
            <Github className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSocialSignIn('twitter')}
            disabled={isLoading}
            className="w-full"
            size="icon"
          >
            <Twitter className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSocialSignIn('facebook')}
            disabled={isLoading}
            className="w-full"
            size="icon"
          >
            <Facebook className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSocialSignIn('apple')}
            disabled={isLoading}
            className="w-full"
            size="icon"
          >
            <Apple className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSocialSignIn('microsoft')}
            disabled={isLoading}
            className="w-full"
            size="icon"
          >
            <svg className="h-4 w-4" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f25022" d="M1 1h10v10H1z"/>
              <path fill="#00a4ef" d="M1 12h10v10H1z"/>
              <path fill="#7fba00" d="M12 1h10v10H12z"/>
              <path fill="#ffb900" d="M12 12h10v10H12z"/>
            </svg>
          </Button>
        </div>
        <Button 
          variant="link" 
          onClick={onToggleForm} 
          className="text-sm"
          type="button"
        >
          Need an account? Sign up
        </Button>
      </CardFooter>
    </div>
  );
} 