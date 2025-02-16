"use client";

import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

const containerStyle = { width: "100%", height: "500px" };

const MapComponent = ({ routeData }: { routeData: any }) => {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [markers, setMarkers] = useState<{ lat: number; lng: number; label: string }[]>([]);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    useEffect(() => {
        if (!mapLoaded || !routeData || typeof google === "undefined" || !google.maps) {
            console.warn("⚠️ Google Maps API aún no está disponible o el mapa no ha cargado.");
            return;
        }

        if (mapRef.current) {
            console.log("✅ Mapa cargado, aplicando fitBounds...");

            const bounds = new google.maps.LatLngBounds();

            if (routeData.route?.bounds) {
                const { northeast, southwest } = routeData.route.bounds;

                if (northeast && southwest) {
                    bounds.extend(new google.maps.LatLng(northeast.lat, northeast.lng));
                    bounds.extend(new google.maps.LatLng(southwest.lat, southwest.lng));
                    console.log("✅ Bounds aplicados correctamente:", bounds);
                } else {
                    console.warn("⚠️ No se encontraron bounds válidos en la respuesta.");
                }
            } else {
                console.warn("⚠️ La API de Google no devolvió bounds.");
            }

            setMarkers([
                {
                    lat: routeData.route.legs[0].start_location.lat,
                    lng: routeData.route.legs[0].start_location.lng,
                    label: "Inicio",
                },
                {
                    lat: routeData.route.legs[routeData.route.legs.length - 1].end_location.lat,
                    lng: routeData.route.legs[routeData.route.legs.length - 1].end_location.lng,
                    label: "Destino",
                },
            ]);

            if (!bounds.isEmpty()) {
                mapRef.current.fitBounds(bounds);
            }

            setDirections({
                request: {
                    origin: routeData.route.legs[0].start_address,
                    destination: routeData.route.legs[routeData.route.legs.length - 1].end_address,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                routes: routeData.route.routes,
            } as google.maps.DirectionsResult);
        }
    }, [routeData, mapLoaded]);

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            zoom={12}
            center={{ lat: -34.6037, lng: -58.3816 }}
            onLoad={(map) => {
                console.log("✅ `onLoad` ejecutado. Mapa listo.");
                mapRef.current = map;
                setMapLoaded(true);
            }}
        >
            {directions && <DirectionsRenderer directions={directions} />}
            {markers.map((marker, index) => (
                <Marker key={index} position={{ lat: marker.lat, lng: marker.lng }} label={marker.label} />
            ))}
        </GoogleMap>
    );
};

export default MapComponent;

