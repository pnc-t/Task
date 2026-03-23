'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Check, X, Pencil } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  type?: 'text' | 'textarea' | 'date' | 'number';
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  type = 'text',
  placeholder,
  className = '',
  displayClassName = '',
  emptyText = '未設定',
  disabled = false,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'textarea') {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (disabled) {
    return (
      <span className={`${displayClassName}`}>
        {value || emptyText}
      </span>
    );
  }

  if (!isEditing) {
    return (
      <span
        onClick={() => setIsEditing(true)}
        className={`group inline-flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-gray-100 transition-colors ${displayClassName}`}
      >
        <span className={value ? '' : 'text-gray-400 italic'}>{value || emptyText}</span>
        <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </span>
    );
  }

  const inputClasses = `w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`;

  return (
    <div className="flex items-start gap-1">
      {type === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className={`${inputClasses} min-h-[80px] resize-y`}
          disabled={isSaving}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          className={inputClasses}
          disabled={isSaving}
        />
      )}
      <div className="flex gap-0.5 flex-shrink-0 pt-0.5">
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
          disabled={isSaving}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
          disabled={isSaving}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
