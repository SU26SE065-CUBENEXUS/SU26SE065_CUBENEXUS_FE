import React, { useRef, useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface DateTimeInputProps {
  value: string; // "YYYY-MM-DDTHH:mm" or ISO string
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateTimeInput({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'YYYY-MM-DD HH:mm',
}: DateTimeInputProps) {
  const [textValue, setTextValue] = useState('');
  const pickerRef = useRef<HTMLInputElement>(null);

  // Format incoming value to text presentation: YYYY-MM-DD HH:mm
  useEffect(() => {
    if (!value) {
      setTextValue('');
      return;
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        setTextValue(value);
        return;
      }
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      setTextValue(`${yyyy}-${mm}-${dd} ${hh}:${min}`);
    } catch {
      setTextValue(value);
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawText = e.target.value;
    setTextValue(rawText);

    // If fully matches YYYY-MM-DD HH:mm, update parent state immediately
    const match = rawText.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (match) {
      const [_, yyyy, mm, dd, hh, min] = match;
      const parsedDate = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
      if (!isNaN(parsedDate.getTime())) {
        onChange(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
      }
    }
  };

  const handleBlur = () => {
    if (!textValue) {
      onChange('');
      return;
    }

    let parsedDate = new Date(textValue);

    // Try slash-separated DD/MM/YYYY HH:mm
    const slashMatch = textValue.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
    if (slashMatch) {
      const [_, dd, mm, yyyy, hh, min] = slashMatch;
      parsedDate = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
    }

    if (!isNaN(parsedDate.getTime())) {
      const yyyy = parsedDate.getFullYear();
      const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(parsedDate.getDate()).padStart(2, '0');
      const hh = String(parsedDate.getHours()).padStart(2, '0');
      const min = String(parsedDate.getMinutes()).padStart(2, '0');
      
      const newVal = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
      onChange(newVal);
      setTextValue(`${yyyy}-${mm}-${dd} ${hh}:${min}`);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickerVal = e.target.value;
    if (pickerVal) {
      onChange(pickerVal);
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl border border-border bg-muted/10 pl-3.5 pr-10 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition ${className}`}
      />
      <button
        type="button"
        onClick={() => {
          try {
            pickerRef.current?.showPicker();
          } catch (e) {
            pickerRef.current?.focus();
          }
        }}
        className="absolute right-3 text-muted-foreground hover:text-foreground transition p-1"
      >
        <Calendar className="h-4 w-4" />
      </button>
      <input
        type="datetime-local"
        ref={pickerRef}
        value={value}
        onChange={handlePickerChange}
        className="absolute opacity-0 pointer-events-none w-0 h-0"
      />
    </div>
  );
}
