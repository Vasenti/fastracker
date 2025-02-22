import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { coordinates } = body;

        if (!coordinates || !coordinates.length) {
            return NextResponse.json(
                { error: "Parámetros inválidos para coordenadas" },
                { status: 400 }
            );
        }

        const ORS_API_KEY = process.env.ORS_API_KEY;
        if (!ORS_API_KEY) {
            return NextResponse.json(
                { error: "Falta configurar la clave API de ORS." },
                { status: 500 }
            );
        }

        const ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
        const MAX_COORDINATES = 70;

        const fetchRoute = async (coords: number[][]) => {
            console.log("coords", coords.length);
            const response = await fetch(ORS_URL, {
                method: "POST",
                headers: {
                    Authorization: ORS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ coordinates: coords }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al obtener la ruta desde ORS: ${errorText}`);
            }

            return response.json();
        };

        const allRoutes = [];
        for (let i = 0; i < coordinates.length; i += MAX_COORDINATES - 1) {
            const chunk = coordinates.slice(i, i + MAX_COORDINATES);
            if (chunk.length < 2) break; // Se necesita al menos dos coordenadas

            const routeData = await fetchRoute(chunk);
            allRoutes.push(routeData);
        }

        const combinedRoute = {
            type: "FeatureCollection",
            features: allRoutes.flatMap((route) => route.features),
        };

        return NextResponse.json(combinedRoute);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json(
            { error: e.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
