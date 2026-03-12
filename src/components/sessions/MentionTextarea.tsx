import { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { EspacoMember } from '@/hooks/useEspacoMembers';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  members: EspacoMember[];
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

export function MentionTextarea({
  value,
  onChange,
  onKeyDown,
  members,
  placeholder,
  maxLength,
  disabled,
  className,
}: MentionTextareaProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 6);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);

    // Find the last @ before cursor that is either at start or preceded by whitespace
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex >= 0 && (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show if no space in query (i.e. still typing the mention)
      if (!query.includes('\n')) {
        setMentionQuery(query);
        setMentionStart(lastAtIndex);
        setShowDropdown(true);
        setSelectedIndex(0);
        return;
      }
    }

    setShowDropdown(false);
  }, [onChange]);

  const insertMention = useCallback((member: EspacoMember) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + mentionQuery.length + 1); // +1 for @
    const mention = `@${member.full_name} `;
    const newValue = before + mention + after;
    onChange(newValue);
    setShowDropdown(false);

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const cursorPos = before.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }, [value, mentionStart, mentionQuery, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }
    onKeyDown?.(e);
  }, [showDropdown, filteredMembers, selectedIndex, insertMention, onKeyDown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      const item = dropdownRef.current.children[selectedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, showDropdown]);

  return (
    <div className="relative flex-1 min-w-0">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          "flex w-full rounded-xl border border-border/40 bg-muted/50 px-3 py-2 text-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className,
        )}
        rows={3}
      />

      {showDropdown && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1 w-full max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg z-50"
        >
          {filteredMembers.map((member, idx) => {
            const initials = member.full_name
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <button
                key={member.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent textarea blur
                  insertMention(member);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors",
                  idx === selectedIndex
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground hover:bg-muted/50"
                )}
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={member.profile_photo_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium">{member.full_name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
