// src/components/AddressInput.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AddressInputProps {
    onAddAddress: (address: string) => void;
}

const AddressInput: React.FC<AddressInputProps> = ({ onAddAddress }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (input.length < 3) {
            setSuggestions([]);
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}`)
                .then((res) => res.json())
                .then((data) => {
                    const suggestionList = data.map((item: any) => item.display_name) as string[];
                    setSuggestions(suggestionList);
                })
                .catch((err) => console.error(err));
        }, 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [input]);

    const handleAdd = () => {
        if (input.trim() !== '') {
            onAddAddress(input.trim());
            setInput('');
            setSuggestions([]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleAdd();
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
        setSuggestions([]);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <input
                type="text"
                placeholder="Ingresa una dirección..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ width: '300px', padding: '0.5rem' }}
            />
            <button onClick={handleAdd} style={{ marginLeft: '0.5rem' }}>
                Añadir
            </button>
            {suggestions.length > 0 && (
                <ul
                    style={{
                        listStyle: 'none',
                        padding: 0,
                        border: '1px solid #ccc',
                        width: '300px',
                        background: '#fff',
                        position: 'absolute',
                        zIndex: 1,
                    }}
                >
                    {suggestions.map((suggestion, index) => (
                        <li key={index} style={{ padding: '0.5rem', cursor: 'pointer' }} onClick={() => handleSuggestionClick(suggestion)}>
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AddressInput;

