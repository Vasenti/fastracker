// src/components/ExcelUpload.tsx
'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { calculateOptimalRouteForExcelRows, ExcelRow } from '@/lib/calculateOptimalRoute';

interface ExcelUploadProps {
    travelMode: 'driving' | 'walking';
    onResult: (data: ExcelRow[]) => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ travelMode, onResult }) => {
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        // Leemos el archivo como ArrayBuffer
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Convertimos la hoja a JSON (cada fila es un objeto)
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        // Mapeamos cada fila para incluir un id y extraer "DIRECCION" y "ZONA"
        const rows: ExcelRow[] = jsonData
            .map((row, index) => ({
                id: index,
                data: row,
                direccion: row['DIRECCION'] || row['Direccion'] || '',
                zona: row['ZONA'] || row['Zona'] || '',
            }))
            .filter((item) => item.direccion !== '');

        // Calculamos la ruta óptima con las filas completas
        const optimizedRows = await calculateOptimalRouteForExcelRows(rows, travelMode);
        onResult(optimizedRows);
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="excelUpload">Cargar archivo Excel (.xlsx o .xls):</label>
            <input type="file" id="excelUpload" accept=".xlsx, .xls" onChange={handleFileUpload} />
            {loading && <p>Procesando archivo...</p>}
        </div>
    );
};

export default ExcelUpload;
