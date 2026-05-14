import { useEffect, useRef, useState } from 'react';
import { editor, Range } from 'monaco-editor';
import type { Contributor } from '../../types/interfaces';
import { getDeterministicColor } from '../../utils/colors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useBlameTracking = (editorInstance: editor.IStandaloneCodeEditor | null, localDoc: any, user: any, safeActiveFile: string, isPrivileged: boolean) => {
  const [uniqueBlameUsers, setUniqueBlameUsers] = useState<Record<string, Contributor>>({});
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null);

  useEffect(() => {
    if (editorInstance && !decorationsRef.current) {
      decorationsRef.current = editorInstance.createDecorationsCollection([]);
    }
  }, [editorInstance]);

  useEffect(() => {
    if (!editorInstance || !localDoc || !safeActiveFile) return;

    const blameMap = localDoc.getMap('blame-tracking-v3');
    const userColor = getDeterministicColor(user.username);

    const changeDisposable = editorInstance.onDidChangeModelContent((e) => {
      if (editorInstance.hasTextFocus()) {
        e.changes.forEach(change => {
          const normalizedText = change.text.replace(/\r/g, '');
          const charsAdded = normalizedText.length;
          const charsDeleted = change.rangeLength;
          
          if (charsAdded === 0 && charsDeleted === 0) {
            return; 
          }

          const { startLineNumber, endLineNumber, startColumn, endColumn } = change.range;
          const newLines = change.text.split('\n');
          
          const linesAdded = newLines.length - 1;
          const linesRemoved = endLineNumber - startLineNumber;
          const lineDelta = linesAdded - linesRemoved;

          const filePrefix = `${safeActiveFile}::`;

          const eraseStart = startColumn === 1 ? startLineNumber : startLineNumber + 1;
          const eraseEnd = endColumn === 1 ? endLineNumber - 1 : endLineNumber;
          const shiftHorizon = endColumn === 1 ? endLineNumber : endLineNumber + 1;

          localDoc.transact(() => {
            if (eraseStart <= eraseEnd) {
              (Array.from(blameMap.keys()) as string[]).forEach(key => {
                if (key.startsWith(filePrefix)) {
                  const line = parseInt(key.split('::')[1], 10);
                  if (line >= eraseStart && line <= eraseEnd) {
                    blameMap.delete(key);
                  }
                }
              });
            }

            if (lineDelta !== 0) {
              const keysToShift: { oldKey: string; line: number; user: string; data: Contributor }[] = [];

              (Array.from(blameMap.keys()) as string[]).forEach(key => {
                if (key.startsWith(filePrefix)) {
                  const parts = key.split('::');
                  const line = parseInt(parts[1], 10);
                  
                  if (line >= shiftHorizon) {
                    keysToShift.push({ oldKey: key, line, user: parts[2], data: blameMap.get(key)! });
                  }
                }
              });

              keysToShift.sort((a, b) => lineDelta > 0 ? b.line - a.line : a.line - b.line);

              keysToShift.forEach(({ oldKey, line, user, data }) => {
                blameMap.delete(oldKey);
                const newKey = `${filePrefix}${line + lineDelta}::${user}`;
                blameMap.set(newKey, data);
              });
            }
            
            newLines.forEach((_, index) => {
              const currentLine = startLineNumber + index;
              const lineKey = `${filePrefix}${currentLine}::${user.username}`;
              const existingContrib = blameMap.get(lineKey);

              let newCount = existingContrib ? existingContrib.count : 0;

              if (index === 0) {
                newCount = Math.max(0, newCount + charsAdded - charsDeleted);
              } else {
                newCount += 1;
              }

              blameMap.set(lineKey, {
                name: user.username,
                color: userColor,
                count: newCount,
                lastEdited: Date.now()
              });
            });
          });
        });
      }
    });

    const updateDecorations = () => {
      if (!isPrivileged) {
        decorationsRef.current?.set([]);
        return;
      }

      const newDecorations: editor.IModelDeltaDecoration[] = [];
      
      const currentBlameState = blameMap.toJSON() as Record<string, Contributor>;

      const fileUniqueUsers: Record<string, Contributor> = {};
      const aggregatedByLine: Record<string, Contributor[]> = {};

      Object.entries(currentBlameState).forEach(([key, contributor]) => {
        const parts = key.split('::');
        if (parts.length < 3) return;
        const file = parts[0];
        const lineStr = parts[1];

        if (file === safeActiveFile) {
          if (!aggregatedByLine[lineStr]) {
            aggregatedByLine[lineStr] = [];
          }
          aggregatedByLine[lineStr].push(contributor);
        }
      });

      Object.entries(aggregatedByLine).forEach(([lineStr, contributors]) => {
        const line = parseInt(lineStr, 10);
        if (isNaN(line)) return;

        const sortedContributors = contributors.sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return b.lastEdited - a.lastEdited;
        });

        if (sortedContributors.length === 0) return;

        const primary = sortedContributors[0];
        const safeClass = 'u-' + primary.name.replace(/[^a-zA-Z0-9]/g, '');

        sortedContributors.forEach(c => {
          if (!fileUniqueUsers[c.name]) fileUniqueUsers[c.name] = c;
        });

        const hoverMarkdown = sortedContributors.map((c, i) =>
          `${i === 0 ? '🏆' : '•'} **${c.name}**: ${c.count} contributions`
        ).join('\n\n');

        newDecorations.push({
          range: new Range(line, 1, line, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: `blame-marker-${safeClass}`,
            glyphMarginHoverMessage: { value: `### Line Authors\n\n${hoverMarkdown}` }
          }
        });
      });

      setUniqueBlameUsers(fileUniqueUsers);
      decorationsRef.current?.set(newDecorations);
    };

    blameMap.observe(updateDecorations);
    updateDecorations();

    return () => {
      changeDisposable.dispose();
      blameMap.unobserve(updateDecorations);
    };
  }, [editorInstance, localDoc, user, safeActiveFile, isPrivileged]);

  return uniqueBlameUsers;
};