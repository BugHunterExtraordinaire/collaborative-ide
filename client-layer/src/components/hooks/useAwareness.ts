import { useEffect, useState } from 'react';
import type { ActiveUser, AwarenessState } from '../../types/interfaces';
import { getDeterministicColor } from '../../utils/colors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAwareness = (provider: any, user: any, isAdmin: boolean) => {
  const [awarenessUsers, setAwarenessUsers] = useState<Array<ActiveUser>>([]);

  useEffect(() => {
    if (!provider) return;

    const userColor = getDeterministicColor(user.username);

    if (!isAdmin) {
      provider.awareness.setLocalStateField('user', {
        name: user.username,
        color: userColor,
        role: user.role
      });
    }

    const updateAwareness = () => {
      const rawStates = Array.from(provider.awareness.getStates().entries());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedUsers: ActiveUser[] = rawStates.map((entry: any) => ({
        clientId: entry[0],
        state: entry[1] as AwarenessState
      }));
      setAwarenessUsers(mappedUsers);
    };

    provider.awareness.on('change', updateAwareness);
    updateAwareness();

    const handleBeforeUnload = () => provider.awareness.setLocalState(null);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      provider.awareness.off('change', updateAwareness);
      provider.awareness.setLocalState(null);
    };
  }, [provider, user, isAdmin]);

  return awarenessUsers;
};