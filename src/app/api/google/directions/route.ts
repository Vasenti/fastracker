import {TravelMode} from "@/shared/enums";
import {NextResponse} from "next/server";

export async function GET(request: Request) {
    // Obtener los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const mode = searchParams.get('mode') as TravelMode;

    if (!origin || !destination || !mode) {
        return NextResponse.json(
            { error: 'Faltan parámetros obligatorios: origin, destination y mode' },
            { status: 400 }
        );
    }

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
        return NextResponse.json(
            { error: 'Error en la configuración del servidor: API key no encontrada' },
            { status: 500 }
        );
    }

    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
    )}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${GOOGLE_API_KEY}`;

    try {
        const response = await fetch(directionsUrl);
        const data = await response.json();

        if (data.status !== 'OK') {
            return NextResponse.json(
                { error: 'Error al obtener la ruta', details: data },
                { status: 400 }
            );
        }

        const distanceInMeters = data.routes[0].legs[0].distance.value;
        const distanceInKm = distanceInMeters / 1000;

        return NextResponse.json({ distance: distanceInKm });
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al comunicarse con la API de Google', details: error },
            { status: 500 }
        );
    }
}