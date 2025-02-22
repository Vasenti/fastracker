import {useState} from "react";
import {calculateOptimalRouteLarge, ExcelRowData, OptimizedExcelRow} from "@/lib/calculateOptimalRoute";
import * as XLSX from "xlsx";
import {TravelMode} from "@/shared/enums";
import {LatLngExpression} from "leaflet";
import {swapElements} from "@/utils/arrayutils";

interface OsmrRouteResponse {
    routes: Array<{
        geometry: {
            coordinates: Array<Array<number>>
        },
        distance: number;
        duration: number;
    }>;
    code: string;
}

const useRouteCalculation = () => {
    const [center, setCenter] = useState<LatLngExpression>([-34.603722, -58.381592]);
    const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedExcelRow[]>([]);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [travelMode, setTravelMode] = useState<TravelMode>(TravelMode.DRIVING);
    const [loading, setLoading] = useState<boolean>(false);
    const [startingAddress, setStartingAddress] = useState<string>('');
    const [startingZone, setStartingZone] = useState<string>('');
    const [distance, setDistance] = useState<number | null>(null);
    const [duration, setDuration] = useState<number | null>(null);
    const [routePath, setRoutePath] = useState<[number, number][]>([]);
    const [editableMarkers, setEditableMarkers] = useState<OptimizedExcelRow[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [recalculateRoutes, setRecalculateRoutes] = useState<boolean>(true);

    const recalculateRoute  = async (rows: ExcelRowData[], recalculate?: boolean) => {
        if (!startingAddress.trim() || !startingZone.trim()) {
            alert("Por favor, ingrese la dirección y zona de partida.");
            return;
        }
        setLoading(true);
        setDistance(null);
        setDuration(null);
        setRoutePath([]);
        const startingRow: ExcelRowData = {
            data: { Direccion: startingAddress, Zona: startingZone },
            direccion: startingAddress,
            zona: startingZone,
        };
        const combinedRows = !recalculate ? [startingRow, ...rows] : rows;
        const optimized = await calculateOptimalRouteLarge(combinedRows, travelMode);
        await fetchRoutePath(optimized);
        setOptimizedRoutes(optimized);
        setEditableMarkers(optimized);
        setLoading(false);
        setMenuOpen(false);
    };

    const fetchRoutePath = async (route: OptimizedExcelRow[]) => {
        if (route.length < 2) return;

        if (travelMode === TravelMode.DRIVING){
            const coordinates = route.map(row => `${row.coordenadas.split(", ")[1]},${row.coordenadas.split(", ")[0]}`).join(";");
            const profile = travelMode === 'driving' ? 'car' : 'foot';
            const url = `/api/osrm/route?profile=${profile}&coordinates=${coordinates}`;

            try {
                const response = await fetch(url);
                const data: OsmrRouteResponse = await response.json();

                if (!response.ok) {
                    throw new Error(JSON.stringify(data));
                }

                if (data.routes && data.routes.length > 0) {
                    setRoutePath(data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
                    setDistance(data.routes[0].distance / 1000);
                    setDuration(data.routes[0].duration);
                }
            } catch (error: any) {
                console.error("Error al obtener la ruta:", error);
                alert(`Ocurrió un error a intentar trazar la ruta: ${error.message}`);
            }
        }else {
            const coordinatesArray = route.map(row => {
                const parts = row.coordenadas.split(", ");
                return [parseFloat(parts[1]), parseFloat(parts[0])];
            });
            try {
                const response = await fetch('/api/osr/directions/walking', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ coordinates: coordinatesArray })
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(JSON.stringify(data));
                }


                if (data && data.features && data.features.length > 0) {
                    setRoutePath(
                        data.features.flatMap((feature: any) =>
                            feature.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]])
                        )
                    );
                    if (data.features[0].properties && data.features[0].properties.summary) {
                        setDistance(data.features[0].properties.summary.distance / 1000);
                        setDuration(data.features[0].properties.summary.duration);
                    }
                }
            } catch (error: any) {
                console.error("Error al obtener la ruta ORS:", error);
                alert(`Ocurrió un error a intentar trazar la ruta: ${error.message}`);
            }
        }
    };

    const handleDownloadExcel = () => {
        if (!optimizedRoutes) return;
        const exportData = optimizedRoutes.map(row => ({
            ...row.data,
            ORDER: row.order,
            COORDENADAS: row.coordenadas,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordenado');
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ruta_optimizada.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const updateMarkerPosition = async (index: number, lat: number, lng: number, newDireccion: string) => {
        const updatedMarkers = [...optimizedRoutes];
        updatedMarkers[index] = {
            ...updatedMarkers[index],
            coordenadas: `${lat}, ${lng}`,
            direccion: newDireccion,
            data: {
                ...updatedMarkers[index].data,
                Direccion: newDireccion,
            }
        };
        await recalculateRoute(updatedMarkers);
    };

    const reoderMarkersPosition = async (
        sourceIndex: number,
        destinarionIndex: number
    ): Promise<void> => {
        const previousRoutes = [...optimizedRoutes];
        const newRoutes = swapElements(previousRoutes, sourceIndex, destinarionIndex);

        if (recalculateRoutes){
            return await recalculateRoute(newRoutes, true);
        }

        await fetchRoutePath(newRoutes);
        setOptimizedRoutes(newRoutes);
        setEditableMarkers(newRoutes);
    }

    const deleteMarker = async (index: number) => {
        const copyRoutes = [...optimizedRoutes];
        const updatedMarkers = copyRoutes.filter((_, i) => i !== index);
        await recalculateRoute(updatedMarkers, true);
    }

    return {
        optimizedRoutes,
        handleExcelResult: recalculateRoute,
        handleDownloadExcel,
        routePath,
        setRoutePath,
        menuOpen,
        setMenuOpen,
        travelMode,
        setTravelMode,
        startingAddress,
        setStartingAddress,
        startingZone,
        setStartingZone,
        loading,
        distance,
        duration,
        editableMarkers,
        updateMarkerPosition,
        setEditableMarkers,
        isEditing,
        setIsEditing,
        center,
        setCenter,
        deleteMarker,
        reoderMarkersPosition,
        recalculateRoutes,
        setRecalculateRoutes
    };
};
export default useRouteCalculation;
