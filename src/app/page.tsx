// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import ExcelUpload from '@/components/ExcelUpload';
import * as XLSX from 'xlsx';
import {calculateOptimalRouteLarge, ExcelRowData, OptimizedExcelRow} from "@/lib/calculateOptimalRoute";

export default function HomePage() {
    const [optimizedRoute, setOptimizedRoute] = useState<OptimizedExcelRow[] | null>(null);
    const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');
    const [loading, setLoading] = useState<boolean>(false);
    const [startingAddress, setStartingAddress] = useState<string>('');
    const [startingZone, setStartingZone] = useState<string>('');

    // Al recibir las filas del Excel, se agrega la fila de partida (con dirección y zona de partida) al inicio.
    const handleExcelResult = async (rows: ExcelRowData[]) => {
        if (!startingAddress.trim()) {
            alert("Por favor, ingrese la dirección de partida.");
            return;
        }
        if (!startingZone.trim()) {
            alert("Por favor, ingrese la zona de partida.");
            return;
        }
        setLoading(true);
        const startingRow: ExcelRowData = {
            data: { ...{ Direccion: startingAddress, Zona: startingZone } }, // Guarda toda la info original para el punto de partida
            direccion: startingAddress,
            zona: startingZone,
        };
        const combinedRows = [startingRow, ...rows];
        const optimized = await calculateOptimalRouteLarge(combinedRows, travelMode);
        setOptimizedRoute(optimized);
        setLoading(false);
    };

    const handleDownloadExcel = () => {
        if (!optimizedRoute) return;
        // Excluir la primera fila (punto de partida) del Excel exportado.
        const exportData = optimizedRoute.slice(1).map(row => ({
            ...row.data, // Toda la información original de la fila
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
        a.download = 'excel_ordenado.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Optimización de Rutas</h1>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="startingAddress">Dirección de Partida: </label>
                <input
                    id="startingAddress"
                    type="text"
                    value={startingAddress}
                    onChange={(e) => setStartingAddress(e.target.value)}
                    placeholder="Ingrese la dirección de partida"
                    style={{ width: '300px', padding: '0.5rem', marginRight: '1rem' }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="startingZone">Zona de Partida: </label>
                <input
                    id="startingZone"
                    type="text"
                    value={startingZone}
                    onChange={(e) => setStartingZone(e.target.value)}
                    placeholder="Ingrese la zona de partida"
                    style={{ width: '300px', padding: '0.5rem', marginRight: '1rem' }}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="travelMode">Modo de Viaje: </label>
                <select
                    id="travelMode"
                    value={travelMode}
                    onChange={(e) => setTravelMode(e.target.value as 'driving' | 'walking')}
                >
                    <option value="driving">Conduciendo</option>
                    <option value="walking">Caminando</option>
                </select>
            </div>

            {/* Componente para cargar el Excel */}
            <ExcelUpload onResult={handleExcelResult} />

            {loading && <p>Procesando ruta...</p>}

            {optimizedRoute && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>Ruta Óptima</h2>
                    <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse' }}>
                        <thead>
                        <tr>
                            <th>ORDER</th>
                            <th>DIRECCIÓN</th>
                            <th>ZONA</th>
                            <th>COORDENADAS</th>
                        </tr>
                        </thead>
                        <tbody>
                        {optimizedRoute.map((row, index) => (
                            <tr key={index}>
                                <td>{row.order}</td>
                                <td>{row.direccion}</td>
                                <td>{row.zona}</td>
                                <td>{row.coordenadas}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <button onClick={handleDownloadExcel} style={{ marginTop: '1rem' }}>
                        Descargar Excel Ordenado
                    </button>
                </div>
            )}
        </div>
    );
}

