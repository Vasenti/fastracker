import { NextRequest, NextResponse } from "next/server";

// Función para dividir las coordenadas en grupos más pequeños
const chunkArray = <T>(arr: T[], size: number): T[][] => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { coordinates, profile } = body;

        if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
            return NextResponse.json(
                { error: "Faltan parámetros obligatorios o las coordenadas no son válidas." },
                { status: 400 }
            );
        }

        if (!profile || !["foot", "car"].includes(profile)) {
            return NextResponse.json(
                { error: "Perfil de ruta no válido. Usa 'foot' o 'car'." },
                { status: 400 }
            );
        }

        const MAX_POINTS_PER_REQUEST = 200;
        const chunks = chunkArray(coordinates, MAX_POINTS_PER_REQUEST);

        const combinedCoordinates: number[][] = [];
        let combinedWaypoints: any[] = [];
        let totalDistance = 0;
        let totalDuration = 0;
        const allLegs: any[] = [];

        for (const chunk of chunks) {
            const coordinatesString = chunk.map(coord => coord.join(",")).join(";");
            const OSRM_URL = `https://router.project-osrm.org/route/v1/${profile}/${coordinatesString}?overview=full&geometries=geojson`;

            const response = await fetch(OSRM_URL);
            if (!response.ok) {
                console.warn(`Error en una de las peticiones OSRM: ${response.statusText}`);
                continue;
            }

            const data = await response.json();
            if (data.code === "Ok" && data.routes.length > 0) {
                // Agregamos las coordenadas al resultado combinado
                combinedCoordinates.push(...data.routes[0].geometry.coordinates);

                // Sumamos distancia y duración
                totalDistance += data.routes[0].distance;
                totalDuration += data.routes[0].duration;

                // Guardamos los waypoints (sin duplicados)
                combinedWaypoints = [...new Map([...combinedWaypoints, ...data.waypoints].map(wp => [wp.location.join(","), wp])).values()];

                // Guardamos las legs (fragmentos de ruta)
                allLegs.push(...data.routes[0].legs);
            }
        }

        if (combinedCoordinates.length === 0) {
            return NextResponse.json({ error: "No se pudo obtener una ruta válida desde OSRM" }, { status: 400 });
        }

        // Construimos la respuesta combinada con el mismo formato que antes
        const responseBody = {
            code: "Ok",
            routes: [
                {
                    geometry: {
                        type: "LineString",
                        coordinates: combinedCoordinates
                    },
                    legs: allLegs,
                    weight_name: "routability",
                    weight: totalDuration,
                    duration: totalDuration,
                    distance: totalDistance
                }
            ],
            waypoints: combinedWaypoints
        };

        return NextResponse.json(responseBody);
    } catch (error) {
        console.error("Error en la API de OSRM:", error);
        return NextResponse.json(
            { error: "Error interno del servidor al comunicarse con OSRM", details: error },
            { status: 500 }
        );
    }
}
