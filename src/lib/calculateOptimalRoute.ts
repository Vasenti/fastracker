import {TravelMode} from "@/shared/enums";

export interface ExcelRowData {
    data: Record<string, any>; // La fila completa original del Excel
    direccion: string;
    zona: string;
    coordenadas?: string;
}

export interface OptimizedExcelRow extends ExcelRowData {
    order: number;
    coordenadas: string;
}

/**
 * Optimiza la ruta para una gran cantidad de direcciones usando la geocodificación de Google
 * y un algoritmo heurístico de vecino más cercano.
 *
 * @param rows Array de filas (cada una de tipo ExcelRowData; el primer elemento es el punto de partida).
 * @param travelMode 'driving' o 'walking' (afecta el cálculo de la distancia).
 * @returns Array de filas optimizadas, conservando la información original y agregando 'order' y 'coordenadas'.
 */
export async function calculateOptimalRouteLarge(
    rows: ExcelRowData[],
    travelMode: TravelMode
): Promise<OptimizedExcelRow[]> {
    if (rows.length < 2)
        return rows.map((row, index) => ({
            ...row,
            order: index + 1,
            coordenadas: '',
        })) as OptimizedExcelRow[];
    async function geocodeAddress(
        address: string,
        zone: string
    ): Promise<{ lat: number; lon: number } | null> {
        const query = zone ? `${address}, ${zone}` : address;
        try {
            const response = await fetch(
                `/api/google/geocode?direction=${query}`
            );
            const data = await response.json();
            if (data.status === 'OK' && data.results.length > 0) {
                return {
                    lat: data.results[0].geometry.location.lat,
                    lon: data.results[0].geometry.location.lng,
                };
            } else {
                // Si no se obtienen resultados, se solicita al usuario las coordenadas manualmente.
                alert(`No se encontraron resultados para la dirección: ${query}`);
                const latStr = prompt(`Por favor, ingrese la latitud para la dirección: ${query}`);
                const lonStr = prompt(`Por favor, ingrese la longitud para la dirección: ${query}`);
                if (latStr && lonStr) {
                    const lat = parseFloat(latStr);
                    const lon = parseFloat(lonStr);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        return { lat, lon };
                    } else {
                        alert(`Coordenadas inválidas para la dirección: ${query}`);
                        return null;
                    }
                }
                return null;
            }
        } catch (error) {
            console.error('Error en geocoding:', error);
            return null;
        }
    }

    // Obtener las coordenadas para todas las filas.
    const coordsArray = await Promise.all(
        rows.map(async row => {
            if (row.coordenadas && row.coordenadas.includes(',')) {
                // ✅ Si ya tiene coordenadas, las usa directamente.
                const [lat, lon] = row.coordenadas.split(',').map(coord => parseFloat(coord.trim()));
                return { lat, lon };
            } else {
                // ❌ Si no tiene coordenadas, las obtiene de Google.
                return await geocodeAddress(row.direccion, row.zona);
            }
        })
    );

    // Asociar cada fila con sus coordenadas (filtrando las que fallaron).
    const valid = rows
        .map((row, idx) => ({ row, coords: coordsArray[idx] }))
        .filter(item => item.coords !== null) as {
        row: ExcelRowData;
        coords: { lat: number; lon: number };
    }[];

    if (valid.length < 2)
        return rows.map((row, index) => ({
            ...row,
            order: index + 1,
            coordenadas: '',
        })) as OptimizedExcelRow[];

    /*async function getRouteDistance(
        coord1: { lat: number; lon: number },
        coord2: { lat: number; lon: number },
        travelMode: TravelMode
    ): Promise<number> {
        const origin = `${coord1.lat},${coord1.lon}`;
        const destination = `${coord2.lat},${coord2.lon}`;
        const response = await fetch(
            `/api/google/directions?origin=${origin}&destination=${destination}&mode=${travelMode}`
        );
        const data = await response.json();
        if (data.status === 'OK' && data.routes.length > 0) {
            // La API devuelve la distancia en metros, por lo que se convierte a kilómetros.
            return data.routes[0].legs[0].distance.value / 1000;
        }
        // En caso de error, se puede devolver un valor muy alto para descartarlo en la optimización.
        return Number.MAX_VALUE;
    }*/
    function haversineDistance(
        coord1: { lat: number; lon: number },
        coord2: { lat: number; lon: number },
        travelMode: TravelMode
    ): number {
        const R = 6371; // Radio de la Tierra en km.
        const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
        const dLon = ((coord2.lon - coord1.lon) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((coord1.lat * Math.PI) / 180) *
            Math.cos((coord2.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let distance = R * c;
        if (travelMode === TravelMode.WALKING) {
            distance *= 1.2;
        }
        return distance;
    }

    function totalDistance(
        route: { coords: { lat: number; lon: number } }[],
        travelMode: TravelMode
    ): number {
        let dist = 0;
        for (let i = 0; i < route.length - 1; i++) {
            dist += haversineDistance(route[i].coords, route[i + 1].coords, travelMode);
        }
        return dist;
    }

    function twoOpt(
        route: { row: ExcelRowData; coords: { lat: number; lon: number } }[],
        travelMode: TravelMode
    ): { row: ExcelRowData; coords: { lat: number; lon: number } }[] {
        let bestRoute = route.slice();
        let improved = true;

        while (improved) {
            improved = false;
            for (let i = 1; i < bestRoute.length - 2; i++) {
                for (let j = i + 1; j < bestRoute.length - 1; j++) {
                    // Invierte el segmento entre i y j
                    const newRoute = bestRoute
                        .slice(0, i)
                        .concat(bestRoute.slice(i, j + 1).reverse())
                        .concat(bestRoute.slice(j + 1));

                    if (totalDistance(newRoute, travelMode) < totalDistance(bestRoute, travelMode)) {
                        bestRoute = newRoute;
                        improved = true;
                    }
                }
            }
        }
        return bestRoute;
    }

    // Algoritmo de vecino más cercano para calcular el orden de visita.
    const unvisited = [...valid];
    const initialRoute: { row: ExcelRowData; coords: { lat: number; lon: number } }[] = [];
    let current = unvisited.shift()!;
    initialRoute.push(current);

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = haversineDistance(current.coords, unvisited[0].coords, travelMode);
        for (let i = 1; i < unvisited.length; i++) {
            const d = haversineDistance(current.coords, unvisited[i].coords, travelMode);
            if (d < nearestDistance) {
                nearestDistance = d;
                nearestIndex = i;
            }
        }
        current = unvisited.splice(nearestIndex, 1)[0];
        initialRoute.push(current);
    }

    const optimizedRoute = twoOpt(initialRoute, travelMode);

    const optimized: OptimizedExcelRow[] = optimizedRoute.map((item, index) => ({
        ...item.row,
        order: index + 1,
        coordenadas: `${item.coords.lat}, ${item.coords.lon}`,
    }));

    return optimized;
}
