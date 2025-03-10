import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onPhoneAuth?: () => void;
}

export function AuthForm({ onSuccess, onForgotPassword, onPhoneAuth }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="w-full">
      {isLogin ? (
        <LoginForm 
          onToggleForm={toggleForm} 
          onSuccess={onSuccess}
          onForgotPassword={onForgotPassword || (() => {})}
        />
      ) : (
        <SignupForm 
          onToggleForm={toggleForm} 
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
} 