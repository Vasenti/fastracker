import {useState} from "react";
import {calculateOptimalRouteLarge, ExcelRowData, OptimizedExcelRow} from "@/lib/calculateOptimalRoute";
import * as XLSX from "xlsx";
import {TravelMode} from "@/shared/enums";
import {LatLngExpression} from "leaflet";

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

        const coordinates = route.map(row => `${row.coordenadas.split(", ")[1]},${row.coordenadas.split(", ")[0]}`).join(";");
        const profile = travelMode === 'driving' ? 'car' : 'foot';
        const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`;

        try {
            const response = await fetch(url);
            const data: OsmrRouteResponse = await response.json();
            if (data.routes && data.routes.length > 0) {
                setRoutePath(data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]));
                setDistance(data.routes[0].distance / 1000);
                setDuration(data.routes[0].duration / 60);
            }
        } catch (error) {
            console.error("Error al obtener la ruta:", error);
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
        await recalculateRoute(updatedMarkers, true);
    };

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
        setCenter
    };
};
export default useRouteCalculation;
