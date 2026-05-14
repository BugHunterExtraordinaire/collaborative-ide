import type { ActiveUser, Contributor } from '../../types/interfaces';

interface DynamicStylesProps {
  awarenessUsers: Array<ActiveUser>;
  uniqueBlameUsers: Record<string, Contributor>;
  user: any;
  isPrivileged: boolean;
}

export default function DynamicStyles({ awarenessUsers, uniqueBlameUsers, user, isPrivileged }: DynamicStylesProps) {
  const dynamicCursorCSS = awarenessUsers.map(({ clientId, state }) => {
    if (!state || !state.user || !state.user.color) return '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { color, name, role } = state.user as any;

    if (role === 'System Administrator') return '';
    if (name === user.username) return '';

    return `
      .yRemoteSelection-${clientId} { background-color: ${color}40 !important; }
      .yRemoteSelectionHead-${clientId} {
        border-left: 2px solid ${color} !important;
        position: absolute;
        box-sizing: border-box;
        height: 100%;
        pointer-events: auto !important;
      }
      .yRemoteSelectionHead-${clientId}::after {
        position: absolute; content: ' ';
        border: 5px solid ${color}; border-radius: 4px;
        left: -6px; top: -5px;
      }
      .yRemoteSelectionHead-${clientId}::before {
        position: absolute; content: '${name}';
        top: -24px; left: -2px;
        background-color: ${color}; color: white;
        font-size: 11px; font-weight: bold;
        padding: 2px 6px; border-radius: 4px;
        white-space: nowrap; z-index: 50;
        opacity: 0; transition: opacity 0.15s ease-in-out;
      }
      .yRemoteSelectionHead-${clientId}:hover::before { opacity: 1; }
    `;
  }).join('\n');

  const dynamicBlameCSS = isPrivileged ? Object.values(uniqueBlameUsers).map((blameUser) => {
    const initials = blameUser.name.substring(0, 2).toUpperCase();
    const safeClass = 'u-' + blameUser.name.replace(/[^a-zA-Z0-9]/g, '');

    const activeMatch = awarenessUsers.find(a => a.state.user && a.state.user.name === blameUser.name);
    const liveColor = activeMatch?.state.user?.color || blameUser.color;

    return `
      .blame-marker-${safeClass} {
        background-color: ${liveColor} !important;
        color: #ffffff !important;
        font-size: 10px;
        font-weight: 900;
        display: flex !important;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        margin-left: 4px;
        width: 18px !important;
        opacity: 0.85;
      }
      .blame-marker-${safeClass}::after {
        content: '${initials}';
      }
    `;
  }).join('\n') : '';

  return <style dangerouslySetInnerHTML={{ __html: dynamicCursorCSS + '\n' + dynamicBlameCSS }} />;
}