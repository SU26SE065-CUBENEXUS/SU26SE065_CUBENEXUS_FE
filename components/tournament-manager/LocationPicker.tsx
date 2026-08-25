'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  ExternalLink,
  Loader2,
  X,
  Compass,
  History,
  CheckCircle2,
  Navigation,
  Eye,
  EyeOff
} from 'lucide-react';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

interface PlaceSuggestion {
  place_id: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  address?: {
    amenity?: string;
    building?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

const STORAGE_KEY = 'cubenexus_recent_tournament_locations';
const DEFAULT_RECENT_VENUES = [
  'FPT University HCMC, D1 Street, High-Tech Park, Thu Duc City',
  'Phu Tho Indoor Stadium, 1 Lu Gia, District 11, HCMC',
];

export function LocationPicker({
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Enter venue name or tournament address...',
}: LocationPickerProps) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(true);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent search history from localStorage (max 3 items)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentLocations(parsed.slice(0, 3));
        }
      } else {
        setRecentLocations(DEFAULT_RECENT_VENUES);
      }
    } catch {
      setRecentLocations(DEFAULT_RECENT_VENUES);
    }
  }, []);

  // Sync external value prop
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToRecentHistory = (newLocation: string) => {
    if (!newLocation.trim()) return;
    try {
      const updated = [newLocation, ...recentLocations.filter(loc => loc !== newLocation)].slice(0, 3);
      setRecentLocations(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Perform OpenStreetMap search with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 3) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Query Nominatim API with priority in Vietnam
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              val
            )}&countrycodes=vn&addressdetails=1&limit=5`,
            {
              headers: {
                'Accept-Language': 'en,vi',
              },
            }
          );
          if (res.ok) {
            const data: PlaceSuggestion[] = await res.json();
            setSuggestions(data || []);
            setShowDropdown(data && data.length > 0);
          }
        } catch {
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 400);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    const selectedAddress = place.display_name;
    setQuery(selectedAddress);
    onChange(selectedAddress);
    setShowDropdown(false);
    saveToRecentHistory(selectedAddress);
  };

  const handleSelectRecent = (loc: string) => {
    setQuery(loc);
    onChange(loc);
    setShowDropdown(false);
    saveToRecentHistory(loc);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const encodedQuery = encodeURIComponent(query.trim() || 'Ho Chi Minh City, Vietnam');
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

  return (
    <div className="space-y-2 text-left" ref={dropdownRef}>
      {/* Input container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <MapPin className="h-4 w-4 text-indigo-500" />
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-9 pr-16 py-2.5 rounded-xl border bg-white text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition outline-none shadow-2xs ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
          }`}
        />

        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600 mr-1" />
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Clear input"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMapPreview(!showMapPreview)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              showMapPreview
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
            title={showMapPreview ? 'Hide map preview' : 'Show map preview'}
          >
            <Compass className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="h-3 w-3 text-indigo-500" />
              Address Suggestions
            </div>
            {suggestions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/60 transition flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer group"
              >
                <MapPin className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-indigo-700 truncate">
                    {item.name || item.display_name.split(',')[0]}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.display_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}

      {/* Recent Search History Chips */}
      {recentLocations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <History className="h-3 w-3 text-slate-400" />
            Recent venues:
          </span>
          {recentLocations.map((loc, idx) => {
            const shortLabel = loc.split(',')[0] || loc;
            return (
              <button
                key={`${loc}-${idx}`}
                type="button"
                onClick={() => handleSelectRecent(loc)}
                title={loc}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer border max-w-[200px] truncate ${
                  query === loc
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <MapPin className="h-2.5 w-2.5 opacity-70 shrink-0 text-indigo-500" />
                <span className="truncate">{shortLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Map Preview Card */}
      {showMapPreview && query.trim().length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs transition-all">
          <div className="px-3.5 py-2 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Venue location: {query}</span>
            </div>
            <a
              href={googleMapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition shrink-0 ml-2"
            >
              <Navigation className="h-3 w-3" /> Open in Google Maps
            </a>
          </div>

          <div className="relative w-full h-48 bg-slate-100">
            <iframe
              title="Tournament Venue Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={googleMapEmbedUrl}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
