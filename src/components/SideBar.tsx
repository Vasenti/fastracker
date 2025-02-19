import React from "react";
import ExcelUpload from "@/components/ExcelUpload";
import {ExcelRowData, OptimizedExcelRow} from "@/lib/calculateOptimalRoute";
import {TravelMode} from "@/shared/enums";

interface SideBarProps {
    menuOpen: boolean;
    startingAddress: string;
    setStartingAddress: (address: string) => void;
    startingZone: string;
    setStartingZone: (zone: string) => void;
    travelMode: string;
    setTravelMode: (mode: TravelMode) => void;
    handleExcelResult: (rows: ExcelRowData[]) => void;
    loading: boolean;
    handleDownloadExcel: () => void;
    optimizedRoutes: OptimizedExcelRow[] | null;
}

const Sidebar = (
    {
        menuOpen,
        startingAddress,
        setStartingAddress,
        startingZone,
        setStartingZone,
        travelMode,
        setTravelMode,
        handleExcelResult,
        loading,
        handleDownloadExcel,
        optimizedRoutes
    }: SideBarProps) => {
    if (!menuOpen) return null;

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                position: "absolute",
                top: 0,
                left: menuOpen ? 0 : "-40%",
                width: "40%",
                height: "100%",
                background: "#f8f9fa",
                padding: "2rem",
                zIndex: 1002,
                transition: "left 0.3s ease-in-out",
                boxShadow: "2px 0 5px rgba(0,0,0,0.3)",
                display: menuOpen ? "flex" : "none",
                flexDirection: "column",
                gap: "1rem",
                color: "black"
            }}
        >
            <h1 className="text-xl font-bold text-center">Optimización de Rutas</h1>
            <label
                style={{color: "black"}}
            >Dirección de Partida:
                <input type="text" value={startingAddress} onChange={(e) => setStartingAddress(e.target.value)}
                       style={{width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc"}}/>
            </label>
            <label
                style={{color: "black"}}
            >Zona de Partida:
                <input type="text" value={startingZone} onChange={(e) => setStartingZone(e.target.value)}
                       style={{width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc"}}/>
            </label>
            <label
                style={{color: "black"}}
            >Modo de Viaje:
                <select value={travelMode} onChange={(e) => setTravelMode(e.target.value as TravelMode)}
                        style={{width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ccc"}}>
                    <option value="driving">Conduciendo</option>
                    <option value="walking">Caminando</option>
                </select>
            </label>
            <ExcelUpload onResult={handleExcelResult}/>
            {loading && <p style={{textAlign: "center"}}>Procesando ruta...</p>}
            {optimizedRoutes && (
                <button onClick={handleDownloadExcel} style={{
                    marginTop: '1rem',
                    background: "#28a745",
                    color: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    border: "none"
                }}>
                    Descargar Excel Ordenado
                </button>
            )}
        </div>
    );
};
export default Sidebar;