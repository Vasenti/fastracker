import {NextRequest, NextResponse} from "next/server";
import axios from 'axios';

export async function GET(
    req: NextRequest,
) {
    const { searchParams } = new URL(req.url);
    const direction = searchParams.get("direction");

    if (!direction) {
        return NextResponse.json({ message: "Al menos una dirección debe haber." }, { status: 400 });
    }
    try{
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                direction
            )}&key=${process.env.GOOGLE_API_KEY}`
        );

        if(response.status >= 400){
            return NextResponse.json({ message: response.data }, { status: response.status });
        }

        return NextResponse.json(response.data);
    }catch (err){
        return NextResponse.json({ message: "Ocurrió un error inesperado", error: err}, { status: 400 });
    }
}