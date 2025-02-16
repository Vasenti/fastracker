import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const origin = searchParams.get("origin");
        const destination = searchParams.get("destination");
        const waypoints = searchParams.get("waypoints") || "";

        if (!origin || !destination) {
            return NextResponse.json({ error: "Faltan parámetros en la solicitud." }, { status: 400 });
        }

        const response = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
            params: {
                origin,
                destination,
                waypoints,
                mode: "DRIVING",
                key: API_KEY,
            },
        });

        return NextResponse.json(response.data);
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener la ruta", details: error }, { status: 500 });
    }
}
