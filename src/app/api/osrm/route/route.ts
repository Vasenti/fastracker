import {NextRequest, NextResponse} from "next/server";

export async function GET (
    req: NextRequest,
) {
    const { searchParams } = new URL(req.url);
    const coordinates = searchParams.get("coordinates");
    const profile = searchParams.get("profile");

    if (!coordinates || !profile) {
        return NextResponse.json(
            { error: 'Faltan parámetros obligatorios: coordinates y profile' },
            { status: 400 }
        );
    }

    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.code !== 'Ok') {
            return NextResponse.json(
                { error: 'Error al obtener la ruta', details: data },
                { status: 400 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al comunicarse con la API de Google', details: error },
            { status: 500 }
        );
    }
}