"use client";

import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

const containerStyle = { width: "100%", height: "500px" };

const TestMap = () => {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (!mapLoaded || typeof google === "undefined" || !google.maps) {
            console.warn("⚠️ Google Maps API aún no está disponible o el mapa no ha cargado.");
            return;
        }

        if (mapRef.current) {
            console.log("✅ Mapa cargado, aplicando fitBounds...");

            const bounds = new google.maps.LatLngBounds();

            const testPoints = [
                { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
                { lat: -34.6070, lng: -58.3843 }, // Punto cercano
            ];

            testPoints.forEach((point, index) => {
                console.log(`📍 Agregando punto ${index + 1}:`, point);
                bounds.extend(new google.maps.LatLng(point.lat, point.lng));
            });

            console.log("📌 `bounds.toJSON()` antes de aplicar:", bounds.toJSON());

            if (!bounds.isEmpty()) {
                console.log("✅ Aplicando `fitBounds()`...");
                mapRef.current.fitBounds(bounds);
            } else {
                console.warn("⚠️ No se encontraron coordenadas válidas para aplicar `fitBounds()`");
            }
        }
    }, [mapLoaded]);

    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                zoom={12}
                center={{ lat: -34.6037, lng: -58.3816 }} // Buenos Aires
                onLoad={(map) => {
                    console.log("✅ `onLoad` ejecutado. Mapa listo.");
                    mapRef.current = map;
                    setMapLoaded(true); // ✅ Marcamos que el mapa ya está cargado
                }}
            />
        </LoadScript>
    );
};

export default TestMap;

