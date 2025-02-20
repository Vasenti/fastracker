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

        const orsUrl = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
        const orsRes = await fetch(orsUrl, {
            method: 'POST',
            headers: {
                'Authorization': ORS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ coordinates })
        });
        if (!orsRes.ok) {
            const errorText = await orsRes.text();
            throw new Error(`Error al obtener la ruta desde ORS: ${errorText}`);
        }
        const orsData = await orsRes.json();
        return NextResponse.json(orsData);
    }catch (e: any){
        console.error(e);
        return NextResponse.json({ error: e.message || 'Error interno del servidor' }, { status: 500 });
    }
}