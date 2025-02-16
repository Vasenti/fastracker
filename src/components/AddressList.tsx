// src/components/AddressList.tsx
'use client';

import React from 'react';

interface AddressListProps {
    addresses: string[];
    title?: string;
}

const AddressList: React.FC<AddressListProps> = ({ addresses, title }) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            {title && <h3>{title}</h3>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {addresses.map((address, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem' }}>
                        {index + 1} - {address}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AddressList;
