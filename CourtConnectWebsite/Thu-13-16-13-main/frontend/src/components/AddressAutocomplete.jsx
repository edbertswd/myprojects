import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Australian Address Autocomplete Component
 * Uses Nominatim free API for Australian address validation
 *
 * @param {string} value - Current address value
 * @param {function} onChange - Callback when address changes
 * @param {function} onAddressSelect - Callback when full address is selected (receives {address, latitude, longitude})
 * @param {string} className - Additional CSS classes
 * @param {string} placeholder - Input placeholder text
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  className = '',
  placeholder = 'Start typing Australian address...',
  required = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for addresses using Nominatim (OpenStreetMap) 
  const searchAddress = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim API (OpenStreetMap) 
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},Australia&format=json&addressdetails=1&limit=5`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FacilityBookingApp/1.0' // Nominatim requires User-Agent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Transform Nominatim data to our format
        const transformedSuggestions = data.map((item) => ({
          id: item.place_id,
          singleLine: item.display_name,
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          details: item.address
        }));

        setSuggestions(transformedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Address search failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  // Handle address selection
  const handleSelectAddress = (address) => {
    onChange(address.singleLine || address.address);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onAddressSelect) {
      onAddressSelect({
        address: address.singleLine || address.address,
        latitude: address.latitude,
        longitude: address.longitude,
        addressDetails: address.details,
      });
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-xl border px-3 py-2 ${className}`}
        autoComplete="off"
      />

      {loading && (
        <div className="absolute right-3 top-3 text-sm text-gray-500">
          Searching...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              onClick={() => handleSelectAddress(suggestion)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="text-sm">
                {suggestion.singleLine || suggestion.address}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && !loading && value.length >= 3 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg px-4 py-2">
          <div className="text-sm text-gray-500">No addresses found</div>
        </div>
      )}
    </div>
  );
}

AddressAutocomplete.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onAddressSelect: PropTypes.func,
  className: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
};
