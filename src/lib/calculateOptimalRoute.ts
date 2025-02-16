// src/lib/calculateOptimalRoute.ts

export interface AddressItem {
    direccion: string;
    zona: string;
}


export interface AddressItem {
    direccion: string;
    zona: string;
}

export interface ExcelRow {
    id: number;
    data: Record<string, any>;
    direccion: string;
    zona: string;
}

/**
 * Esta función simula la optimización de la ruta utilizando un algoritmo de vecino más cercano.
 * Se asigna una "distancia" dummy en función de si la dirección contiene "Ezeiza" (más cercano)
 * o "Monte Grande" (más lejano). Para un caso real se debería usar una API (Google Maps, OpenRouteService, etc.)
 * que devuelva distancias reales en carretera.
 *
 * @param addresses Array de direcciones. El primer elemento es el punto de partida.
 * @param travelMode Modo de viaje ('driving' o 'walking') que podría afectar la simulación.
 * @returns Array con la ruta optimizada.
 */
export function calculateOptimalRoute(addresses: string[], travelMode: 'driving' | 'walking'): string[] {
    if (addresses.length < 2) return addresses;

    // Función dummy para calcular "distancia"
    const getDistance = (addr1: string, addr2: string) => {
        let distance = 0;
        // Si ambas direcciones contienen "Ezeiza", se consideran cercanas.
        if (addr1.includes("Ezeiza") && addr2.includes("Ezeiza")) {
            distance = 1;
        } else if (addr1.includes("Monte Grande") || addr2.includes("Monte Grande")) {
            distance = 5;
        } else {
            distance = 3;
        }

        // Ajuste simulado para modo caminando
        if (travelMode === 'walking') {
            distance *= 1.2;
        }
        return distance;
    };

    // Algoritmo de vecino más cercano
    const unvisited = [...addresses];
    const route: string[] = [];

    // El primer elemento es el punto de partida
    const start = unvisited.shift()!;
    route.push(start);
    let current = start;

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = getDistance(current, unvisited[0]);

        for (let i = 1; i < unvisited.length; i++) {
            const distance = getDistance(current, unvisited[i]);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }
        current = unvisited.splice(nearestIndex, 1)[0];
        route.push(current);
    }

    return route;
}

/**
 * Geocodifica una dirección utilizando la API de Nominatim.
 * @param address Dirección a geocodificar.
 * @returns Objeto con latitud y longitud o null si no se encuentra.
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocodifica una dirección utilizando la API de Nominatim.
 * Introduce un retardo para evitar exceder el límite de solicitudes.
 * @param address Dirección a geocodificar.
 * @returns Objeto con latitud y longitud o null si no se encuentra.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
        // Espera 1 segundo antes de hacer la solicitud
        await delay(1000);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        console.error('Error en la geocodificación:', error);
        return null;
    }
}

/**
 * Calcula la ruta óptima para un array de AddressItem usando el algoritmo de vecino más cercano.
 * Se geocodifica cada dirección de forma secuencial para evitar "Too Many Requests".
 * @param addresses Array de direcciones con zona. El primer elemento se toma como punto de partida.
 * @param travelMode Modo de viaje ('driving' o 'walking').
 * @returns Array de AddressItem ordenados según la ruta óptima.
 */
export async function calculateOptimalRouteForAddresses(
    addresses: AddressItem[],
    travelMode: 'driving' | 'walking'
): Promise<AddressItem[]> {
    if (addresses.length < 2) return addresses;

    // Procesamos las direcciones de forma secuencial
    const addressCoords: { item: AddressItem; coords: { lat: number; lon: number } | null }[] = [];
    for (const item of addresses) {
        const coords = await geocodeAddress(item.direccion);
        addressCoords.push({ item, coords });
    }

    // Filtramos las direcciones que se pudieron geocodificar correctamente
    const validAddresses = addressCoords.filter((a) => a.coords !== null) as {
        item: AddressItem;
        coords: { lat: number; lon: number };
    }[];

    if (validAddresses.length < 2) {
        // Si no se pudo geocodificar al menos dos, devolvemos el array original.
        return addresses;
    }

    // Función para calcular la distancia haversine (en kilómetros)
    const haversineDistance = (
        coord1: { lat: number; lon: number },
        coord2: { lat: number; lon: number }
    ) => {
        const R = 6371; // Radio de la Tierra en km
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
    };

    // Algoritmo de vecino más cercano
    const unvisited = [...validAddresses];
    const route: { item: AddressItem; coords: { lat: number; lon: number } }[] = [];

    // El primer elemento es el punto de partida
    const start = unvisited.shift()!;
    route.push(start);
    let current = start;

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = haversineDistance(current.coords, unvisited[0].coords);

        for (let i = 1; i < unvisited.length; i++) {
            const distance = haversineDistance(current.coords, unvisited[i].coords);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        current = unvisited.splice(nearestIndex, 1)[0];
        route.push(current);
    }

    return route.map((r) => r.item);
}

/**
 * Calcula la ruta óptima para un array de ExcelRow usando el algoritmo de vecino más cercano.
 * Se geocodifica cada dirección de forma secuencial.
 *
 * @param rows Array de filas leídas del Excel.
 * @param travelMode Modo de viaje ('driving' o 'walking').
 * @returns Array de ExcelRow ordenados según la ruta óptima.
 */
export async function calculateOptimalRouteForExcelRows(
    rows: ExcelRow[],
    travelMode: 'driving' | 'walking'
): Promise<ExcelRow[]> {
    if (rows.length < 2) return rows;

    // Geocodifica cada fila de forma secuencial
    const rowsCoords: { row: ExcelRow; coords: { lat: number; lon: number } | null }[] = [];
    for (const row of rows) {
        const coords = await geocodeAddress(row.direccion);
        rowsCoords.push({ row, coords });
    }

    // Filtramos las filas que se pudieron geocodificar correctamente
    const validRows = rowsCoords.filter((r) => r.coords !== null) as {
        row: ExcelRow;
        coords: { lat: number; lon: number };
    }[];

    if (validRows.length < 2) return rows;

    // Función para calcular la distancia haversine (en kilómetros)
    const haversineDistance = (
        coord1: { lat: number; lon: number },
        coord2: { lat: number; lon: number }
    ) => {
        const R = 6371; // Radio de la Tierra en km
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
    };

    // Algoritmo de vecino más cercano
    const unvisited = [...validRows];
    const route: { row: ExcelRow; coords: { lat: number; lon: number } }[] = [];

    // El primer elemento es el punto de partida
    const start = unvisited.shift()!;
    route.push(start);
    let current = start;

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = haversineDistance(current.coords, unvisited[0].coords);

        for (let i = 1; i < unvisited.length; i++) {
            const distance = haversineDistance(current.coords, unvisited[i].coords);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        current = unvisited.splice(nearestIndex, 1)[0];
        route.push(current);
    }

    return route.map((r) => r.row);
}