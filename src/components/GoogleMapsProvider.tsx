"use client"; // Solo se ejecuta en el cliente

import { LoadScript } from "@react-google-maps/api";
import React from "react";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface GoogleMapsProviderProps {
    children: React.ReactNode;
}

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string} libraries={libraries}>
            {children}
        </LoadScript>
    );
};

export default GoogleMapsProvider;
