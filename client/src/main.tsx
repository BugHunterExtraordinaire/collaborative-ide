import { Toaster } from 'react-hot-toast';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { App } from './App.tsx';

import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position='top-center' reverseOrder={false} toastOptions={{
      style: {
        background: '#18181B',
        color: '#fff'
      },
    }} />
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
