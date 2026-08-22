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
  'Đại học FPT TP.HCM, Đường D1, Khu CNC, TP. Thủ Đức',
  'Nhà thi đấu Thể dục Thể thao Phú Thọ, Số 1 Lữ Gia, Quận 11, TP.HCM',
];

export function LocationPicker({
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Nhập tên địa điểm hoặc địa chỉ tổ chức giải đấu...',
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
          return;
        }
      }
    } catch (_) {}
    setRecentLocations(DEFAULT_RECENT_VENUES.slice(0, 2));
  }, []);

  const saveToRecent = (loc: string) => {
    if (!loc || loc.trim().length < 3) return;
    const clean = loc.trim();
    setRecentLocations((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const next = [clean, ...filtered].slice(0, 3);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Sync internal query when external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search places via Nominatim OpenStreetMap (Free, No API Key)
  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text.trim()
          )}&countrycodes=vn&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'vi,en;q=0.9',
            },
          }
        );
        if (response.ok) {
          const data: PlaceSuggestion[] = await response.json();
          setSuggestions(data);
          setShowDropdown(data.length > 0);
        }
      } catch (err) {
        console.error('Failed to search locations:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  const handleSelectSuggestion = (item: PlaceSuggestion) => {
    const cleanAddress = item.display_name;
    setQuery(cleanAddress);
    onChange(cleanAddress);
    setShowDropdown(false);
    saveToRecent(cleanAddress);
  };

  const handleSelectRecent = (address: string) => {
    setQuery(address);
    onChange(address);
    setShowDropdown(false);
    saveToRecent(address);
  };

  const encodedMapQuery = encodeURIComponent(query || value || 'Vietnam');
  const googleMapEmbedUrl = `https://maps.google.com/maps?q=${encodedMapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const googleMapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;

  return (
    <div className="space-y-2.5 text-left" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          Location / Venue {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        {query && (
          <button
            type="button"
            onClick={() => setShowMapPreview(!showMapPreview)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
          >
            {showMapPreview ? (
              <>
                <EyeOff className="h-3 w-3" /> Hide Map
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" /> Show Map
              </>
            )}
          </button>
        )}
      </div>

      {/* Input container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <MapPin className="h-4 w-4 text-indigo-500" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className={`w-full rounded-lg border ${
            error ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-indigo-600'
          } bg-slate-50 pl-9 pr-20 py-2 text-xs text-slate-900 outline-none focus:bg-white transition shadow-2xs`}
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onChange('');
                setSuggestions([]);
                setShowDropdown(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition"
              title="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={googleMapSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition cursor-pointer"
            title="Open in Google Maps (New Tab)"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Autocomplete suggestions dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="h-3 w-3 text-indigo-500" />
              Gợi ý địa chỉ từ bản đồ
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
        <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
          {error}
        </p>
      )}

      {/* Recent Search History Chips (Clean UI: only 1 - 3 items max) */}
      {recentLocations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <History className="h-3 w-3 text-slate-400" />
            Lịch sử tìm kiếm gần đây:
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
              <span className="truncate">Vị trí bản đồ: {query}</span>
            </div>
            <a
              href={googleMapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition shrink-0 ml-2"
            >
              <Navigation className="h-3 w-3" /> Mở Google Maps
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
