import {NextRequest, NextResponse} from "next/server";

export async function POST (
    req: NextRequest
) {
    try{
        const body = await req.json();

        const { coordinates } = body;

        if (!coordinates || !coordinates.length) {
            return NextResponse.json(
                { error: "Parámetros invalidos para coordenadas" },
                { status: 400 }
            )
        }

        const ORS_API_KEY = process.env.ORS_API_KEY;
        if (!ORS_API_KEY) {
            return NextResponse.json(
                { error: 'Falta configurar la clave API de ORS.' },
                { status: 500 }
            );
        }

        const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
        const MAX_COORDINATES = 70;

        const chunkArray = <T>(arr: T[], size: number): T[][] => {
            const chunks = [];
            for (let i = 0; i < arr.length; i += size) {
                chunks.push(arr.slice(i, i + size));
            }
            return chunks;
        };

        const coordinateChunks = chunkArray(coordinates, MAX_COORDINATES);
        const routePromises = coordinateChunks.map(async (chunk) => {
            const response = await fetch(ORS_URL, {
                method: "POST",
                headers: {
                    Authorization: ORS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ coordinates: chunk }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al obtener la ruta desde ORS: ${errorText}`);
            }

            return response.json();
        });

        const routes = await Promise.all(routePromises);

        // Unimos las rutas en una sola respuesta
        const combinedRoute = {
            type: "FeatureCollection",
            features: routes.flatMap((route) => route.features),
        };

        return NextResponse.json(combinedRoute);
    }catch (e: any){
        console.error(e);
        return NextResponse.json({ error: e.message || 'Error interno del servidor' }, { status: 500 });
    }
}
