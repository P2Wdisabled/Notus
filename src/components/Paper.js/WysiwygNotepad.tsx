"use client";
import { useState, useCallback } from "react";
import WysiwygEditor from "./Editor/WysiwygEditor";
import WysiwygToolbar from "./Toolbar/WysiwygToolbar";
import { useCollaborativeNote } from "@/lib/paper.js/useCollaborativeNote";

interface WysiwygNotepadProps {
  initialData?: { text: string };
  onContentChange?: (content: { text: string; drawings: any[]; textFormatting: any; timestamp: number }) => void;
  onRemoteContentChange?: (content: { text: string; drawings: any[]; textFormatting: any; timestamp: number }) => void;
  placeholder?: string;
  className?: string;
  showDebug?: boolean;
  readOnly?: boolean;
  roomId?: string;
}

export default function WysiwygNotepad({
  initialData = { text: "" },
  onContentChange,
  onRemoteContentChange,
  placeholder = "Commencez à écrire votre document...",
  className = "",
  showDebug = false,
  readOnly = false,
  roomId,
}: WysiwygNotepadProps) {
  const [markdown, setMarkdown] = useState(initialData.text || "");
  const [debugMode, setDebugMode] = useState(showDebug);
  const { emitLocalChange: emitChange, isConnected } = useCollaborativeNote({
    roomId,
    onRemoteContent: (remote: string) => {
      console.log('📝 WysiwygNotepad received remote content:', { 
        remoteLength: remote.length, 
        currentLength: markdown.length 
      });
      setMarkdown(remote);
      
      // Notify parent component about remote content change for localStorage update
      if (onRemoteContentChange) {
        const remoteContent = {
          text: remote,
          drawings: [],
          textFormatting: {},
          timestamp: Date.now(),
        };
        onRemoteContentChange(remoteContent);
      }
    },
  });

  // Handle markdown content change
  const handleMarkdownChange = useCallback((newMarkdown: string) => {
    console.log('📝 WysiwygNotepad local change:', { 
      newLength: newMarkdown.length, 
      isConnected, 
      hasRoomId: !!roomId 
    });
    
    // Emit to other clients if connected and has roomId
    if (roomId && emitChange && isConnected) {
      console.log('📝 Emitting to other clients');
      emitChange(newMarkdown);
    }
    
    // Also apply the change locally after a delay to normalize the markdown
    // This ensures the sender sees the same normalized markdown as receivers
    // The delay allows the markdown to be processed and normalized through the same path as remote updates
    if (roomId && isConnected) {
      setTimeout(() => {
        // Apply the markdown locally to ensure it's normalized the same way
        // This will trigger the same normalization process as remote updates
        setMarkdown(newMarkdown);
      }, 100);
    }
    
    // Notify parent with the expected format
    if (onContentChange) {
      onContentChange({
        text: newMarkdown,
        drawings: [],
        textFormatting: {},
        timestamp: Date.now(),
      });
    }
  }, [onContentChange, emitChange, isConnected, roomId]);

  // Handle formatting change
  const handleFormatChange = useCallback((command: string, value?: string) => {
    // Call the wysiwyg editor's formatting function
    if ((window as any).applyWysiwygFormatting) {
      (window as any).applyWysiwygFormatting(command, value);
    }
  }, []);

  // Handle debug toggle
  const handleToggleDebug = useCallback(() => {
    setDebugMode(prev => !prev);
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar - only show if not read-only */}
      {!readOnly && (
        <WysiwygToolbar
          onFormatChange={handleFormatChange}
          showDebug={debugMode}
          onToggleDebug={handleToggleDebug}
        />
      )}

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <WysiwygEditor
          content={markdown}
          onContentChange={readOnly ? () => {} : handleMarkdownChange}
          placeholder={placeholder}
          className="h-full"
          showDebug={debugMode}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
