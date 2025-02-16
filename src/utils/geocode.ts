import axios from "axios";
import { Coordinates } from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string;

export const getCoordinates = async (address: string): Promise<Coordinates | null> => {
    try {
        const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: { address, key: API_KEY },
        });

        console.log(response.data)

        if (response.data.status === "OK") {
            return response.data.results[0].geometry.location;
        }

        console.error("Error en geocodificación:", response.data.status);
        return null;
    } catch (error) {
        console.error("Error en geocodificación:", error);
        return null;
    }
};
