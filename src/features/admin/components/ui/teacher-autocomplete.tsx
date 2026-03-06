import { useState, useRef, useCallback } from 'react';
import type { TeacherDoc } from '../../../../database/types';

interface TeacherAutocompleteProps {
  teachers: TeacherDoc[];
  value: string;
  onChange: (teacherId: string) => void;
  placeholder?: string;
  className?: string;
}

export function TeacherAutocomplete({
  teachers,
  value,
  onChange,
  placeholder = 'Начните вводить имя…',
  className = '',
}: TeacherAutocompleteProps) {
  const [typing, setTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedName = teachers.find((t) => t.id === value)?.full_name ?? '';
  const query = typing ? inputText : selectedName;

  const filtered = query.trim()
    ? teachers.filter((t) =>
        t.full_name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : teachers;

  const handleSelect = useCallback(
    (teacher: TeacherDoc) => {
      onChange(teacher.id);
      setTyping(false);
      setIsOpen(false);
    },
    [onChange],
  );

  const handleInputChange = (text: string) => {
    setInputText(text);
    setTyping(true);
    setIsOpen(true);
    if (value) onChange('');
  };

  const handleFocus = () => {
    setIsOpen(true);
    setInputText(selectedName);
    setTyping(true);
    inputRef.current?.select();
  };

  const handleBlur = () => {
    // Delay to allow click on option to register
    setTimeout(() => {
      setIsOpen(false);
      setTyping(false);
    }, 150);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        name="studhub-teacher"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="one-time-code"
        className={className}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg">
          {filtered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(t)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700 ${
                  t.id === value
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {t.full_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {isOpen && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg text-sm text-neutral-500 dark:text-neutral-400">
          Не найдено
        </div>
      )}
    </div>
  );
}
