import { useState } from 'react';

import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';

import { type LoginProps } from '../types/interfaces';

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="flex justify-center items-center h-screen bg-black text-white font-sans">
      <div className="bg-zinc-900 p-10 rounded-xl w-100 border border-zinc-800 shadow-2xl">
        <h2 className="mt-0 text-2xl font-bold text-center mb-6">
          {isRegistering ? 'Create Account' : 'Collab-IDE Login'}
        </h2>

        {isRegistering ? (
          <RegisterForm
            onSuccess={onLoginSuccess}
            onToggleMode={() => setIsRegistering(false)}
          />
        ) : (
          <LoginForm
            onSuccess={onLoginSuccess}
            onToggleMode={() => setIsRegistering(true)}
          />
        )}
      </div>
    </div>
  );
}