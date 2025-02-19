"use client";

import React, {useEffect, useState} from "react";
import {type LatLngExpression} from "leaflet";
import dynamic from "next/dynamic";
import {useMap} from "react-leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then(mod => mod.Polyline), { ssr: false });

let L: any = null;

interface MapProps {
    routePath: LatLngExpression[] | LatLngExpression[][];
    editableMarkers: Array<any>;
    updateMarkerPosition: (index: number, lat: number, lng: number, newDireccion: string) => void;
    isEditing: boolean;
    center: LatLngExpression;
}

const RepositionZoomControl = () => {
    const map = useMap();
    useEffect(() => {
        if (!map || !map.zoomControl) return;
        map.zoomControl.remove();
        const zoomControl = L.control.zoom({ position: "bottomright" });
        zoomControl.addTo(map);
        return () => {
            zoomControl.remove();
        };
    }, [map]);
    return null;
};

const MapCenterUpdater = ({ center }: { center: LatLngExpression }) => {
    const map = useMap();

    useEffect(() => {
        if (map && map.setView) { // ✅ Verifica si `map` está disponible antes de llamar a `setView`
            map.setView(center, map.getZoom(), { animate: true });
        }
    }, [center, map]);

    return null;
};

const createNumberedMarker = (number: number) => {
    return new L.DivIcon({
        className: "custom-marker",
        html: `<div style="
            background-color: #007bff;
            color: white;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-size: 14px;
            font-weight: bold;
            border: 2px solid white;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        ">${number}</div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        popupAnchor: [1, -12]
    });
};

const Map = (
    {
        center,
        routePath,
        editableMarkers,
        updateMarkerPosition,
        isEditing
    }: MapProps
) => {
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            if (typeof window !== "undefined") {
                const leaflet = await import("leaflet");
                L = leaflet;
                setLeafletLoaded(true);
            }
        })();
    }, []);

    if (!leafletLoaded) return <p>Cargando mapa...</p>;
    return (
        <MapContainer center={center} zoom={10} style={{width: "100vw", height: "100vh"}}>
            <MapCenterUpdater center={center} />
            <RepositionZoomControl/>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {routePath.length > 0 && <Polyline positions={routePath} color="blue" />}
            {editableMarkers.map((row, index) => (
                <Marker
                    key={index}
                    position={[
                        parseFloat(row.coordenadas.split(", ")[0]),
                        parseFloat(row.coordenadas.split(", ")[1])
                    ]}
                    icon={createNumberedMarker(index + 1)}
                    draggable={false}
                    eventHandlers={
                        isEditing
                        ? {
                            dragend: (e) => {
                                const { lat, lng } = e.target.getLatLng();
                                const newDireccion = `Nueva dirección para (${lat.toFixed(6)}, ${lng.toFixed(6)})`; // Esto debería ser obtenido de una API
                                updateMarkerPosition(index, lat, lng, newDireccion);
                            },
                        }
                        : {}
                    }
                />
            ))}
        </MapContainer>
    );
};
export default Map;
