'use client';

import { useCallback, useState } from 'react';

interface AddressSuggestion {
  value: string;
  label: string;
  city: string;
  street: string;
  postalCode: string;
  fullAddress?: string;
  country?: string;
}

interface UseAddressAutocompleteReturn {
  suggestions: AddressSuggestion[];
  loading: boolean;
  searchAddresses: (query: string, type: 'city' | 'street', country: string) => Promise<void>;
  clearSuggestions: () => void;
}

// Mapowanie kodów krajów do nazw w Nominatim API
const countryMapping: Record<string, string> = {
  Albania: 'Albania',
  Armenia: 'Armenia',
  Austria: 'Austria',
  Azerbejdżan: 'Azerbaijan',
  Belgia: 'Belgium',
  Białoruś: 'Belarus',
  'Bośnia i Hercegowina': 'Bosnia and Herzegovina',
  Bułgaria: 'Bulgaria',
  Kanada: 'Canada',
  Chorwacja: 'Croatia',
  Cypr: 'Cyprus',
  Czechy: 'Czech Republic',
  Dania: 'Denmark',
  Egipt: 'Egypt',
  Estonia: 'Estonia',
  Finlandia: 'Finland',
  Francja: 'France',
  Grecja: 'Greece',
  Hiszpania: 'Spain',
  Holandia: 'Netherlands',
  Irlandia: 'Ireland',
  Izrael: 'Israel',
  Japonia: 'Japan',
  Kazachstan: 'Kazakhstan',
  Kirgistan: 'Kyrgyzstan',
  Litwa: 'Lithuania',
  Łotwa: 'Latvia',
  'Macedonia Północna': 'North Macedonia',
  Malta: 'Malta',
  Mołdawia: 'Moldova',
  Maroko: 'Morocco',
  Niemcy: 'Germany',
  Norwegia: 'Norway',
  Polska: 'Poland',
  Portugalia: 'Portugal',
  Rumunia: 'Romania',
  Serbia: 'Serbia',
  Słowacja: 'Slovakia',
  Słowenia: 'Slovenia',
  Szwajcaria: 'Switzerland',
  Szwecja: 'Sweden',
  Turcja: 'Turkey',
  Ukraina: 'Ukraine',
  'Wielka Brytania': 'United Kingdom',
  Węgry: 'Hungary',
  Włochy: 'Italy',
  'Zjednoczone Emiraty Arabskie': 'United Arab Emirates',
};

export function useAddressAutocomplete(): UseAddressAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAddresses = useCallback(
    async (query: string, type: 'city' | 'street', country: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      try {
        // Pobierz kod kraju dla Nominatim
        const countryCode = countryMapping[country] || 'Poland';

        // Używamy Nominatim API (OpenStreetMap) do wyszukiwania adresów
        const searchType = type === 'city' ? 'city' : 'highway';
        const url =
          `https://nominatim.openstreetmap.org/search?` +
          `country=${encodeURIComponent(countryCode)}&` +
          `${searchType}=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=10&` +
          `accept-language=pl`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'PalkaMTM-App/1.0',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch addresses');
        }

        const data = await response.json();

        const addressSuggestions: AddressSuggestion[] = data
          .map((item: any) => {
            const address = item.address || {};
            const city =
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              address.county ||
              '';
            const street =
              address.road || address.highway || address.street || address.pedestrian || '';
            const postalCode = address.postcode || '';
            const resultCountry = address.country || country;

            let label = '';
            if (type === 'city') {
              label = city || item.display_name.split(',')[0];
            } else {
              // Dla ulicy lepiej parsować display_name jeśli nie ma street
              if (street) {
                label = street;
              } else {
                // Spróbuj wyciągnąć nazwę ulicy z display_name (zazwyczaj pierwszy element przed miastem)
                const parts = item.display_name.split(',');
                // Pierwszy element to zazwyczaj numer domu lub nazwa, drugi to ulica
                // Dla Polski: "ulica, miasto, kod pocztowy, Polska"
                label =
                  parts.find((part: string) => {
                    const trimmed = part.trim();
                    // Pomiń numer domu (tylko cyfry), kody pocztowe, i nazwy krajów
                    return (
                      trimmed.length > 0 &&
                      !trimmed.match(/^\d+$/) &&
                      !trimmed.match(/^\d{2}-\d{3}$/) &&
                      trimmed.toLowerCase() !== 'poland' &&
                      trimmed.toLowerCase() !== 'polska' &&
                      !trimmed.match(/^[A-Z]{2}$/)
                    ); // Pomija kody ISO krajów
                  }) ||
                  parts[0] ||
                  item.display_name.split(',')[0];
              }
            }

            return {
              value: item.place_id.toString(),
              label: label.trim(),
              city: city.trim(),
              street: street.trim(),
              postalCode: postalCode.trim(),
              fullAddress: item.display_name,
              country: resultCountry,
            };
          })
          .filter((item: AddressSuggestion) => {
            // Filtruj puste labele i te które są tylko "Polska" lub kod kraju
            const label = item.label.toLowerCase().trim();
            return (
              item.label.length > 0 &&
              label !== 'poland' &&
              label !== 'polska' &&
              !label.match(/^[a-z]{2}$/)
            );
          });

        // Usuwamy duplikaty
        const uniqueSuggestions = addressSuggestions.filter(
          (item, index, self) => index === self.findIndex(t => t.label === item.label),
        );

        setSuggestions(uniqueSuggestions.slice(0, 10));
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    searchAddresses,
    clearSuggestions,
  };
}
