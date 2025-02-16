import axios from "axios";
import {Coordinates, RouteData} from "@/types";

export const getOptimizedRoute = async (locations: Coordinates[]): Promise<RouteData | null> => {
    if (locations.length < 2) {
        console.error("Se requieren al menos dos ubicaciones para calcular una ruta.");
        return null;
    }

    try {
        const origin = `${locations[0].lat},${locations[0].lng}`;
        const destination = `${locations[locations.length - 1].lat},${locations[locations.length - 1].lng}`;
        const waypoints = locations.slice(1, -1).map((loc) => `${loc.lat},${loc.lng}`).join("|");

        const response = await axios.get("/api/directions", {
            params: {
                origin: origin,
                destination: destination,
                waypoints: `optimize:true|${waypoints}`,
                mode: "DRIVING" },
        });

        if (response.data.status !== "OK") {
            console.error("❌ Error en la respuesta de Google Directions API:", response.data);
            return null;
        }

        console.log("✅ Ruta optimizada recibida:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error al obtener la ruta optimizada:", error);
        return null;
    }
};

