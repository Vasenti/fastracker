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
    travelMode: 'driving' | 'walking'
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

    // Función para calcular la distancia usando la fórmula haversine (en kilómetros).
    function haversineDistance(
        coord1: { lat: number; lon: number },
        coord2: { lat: number; lon: number }
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
        if (travelMode === 'walking') {
            distance *= 1.2;
        }
        return distance;
    }

    // Algoritmo de vecino más cercano para calcular el orden de visita.
    const unvisited = [...valid];
    const route: { row: ExcelRowData; coords: { lat: number; lon: number } }[] = [];
    let current = unvisited.shift()!;
    route.push(current);

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = haversineDistance(current.coords, unvisited[0].coords);
        for (let i = 1; i < unvisited.length; i++) {
            const d = haversineDistance(current.coords, unvisited[i].coords);
            if (d < nearestDistance) {
                nearestDistance = d;
                nearestIndex = i;
            }
        }
        current = unvisited.splice(nearestIndex, 1)[0];
        route.push(current);
    }

    // Mapear el recorrido optimizado, asignando el número de orden y la cadena de coordenadas.
    const optimized: OptimizedExcelRow[] = route.map((item, index) => ({
        ...item.row,
        order: index + 1,
        coordenadas: `${item.coords.lat}, ${item.coords.lon}`,
    }));

    return optimized;
}
