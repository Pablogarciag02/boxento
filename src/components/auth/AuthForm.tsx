import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="w-full">
      {isLogin ? (
        <LoginForm onToggleForm={toggleForm} onSuccess={onSuccess} />
      ) : (
        <SignupForm onToggleForm={toggleForm} onSuccess={onSuccess} />
      )}
    </div>
  );
} 