'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {ExcelRowData} from "@/lib/calculateOptimalRoute";

interface ExcelUploadProps {
    onResult: (data: ExcelRowData[]) => void;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onResult }) => {
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        const result: ExcelRowData[] = jsonData.map(row => ({
            data: row,
            direccion: row['DIRECCION'] || row['Direccion'] || '',
            zona: row['Localidad'] || row['LOCALIDAD'] || '',
        })).filter(item => item.direccion !== '');

        onResult(result);
        setLoading(false);
    };

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{color: "black"}} htmlFor="excelUpload">Cargar archivo Excel (.xlsx o .xls):</label>
            <input type="file" id="excelUpload" accept=".xlsx, .xls" onChange={handleFileUpload} />
            {loading && <p style={{color: "black"}}>Procesando archivo...</p>}
        </div>
    );
};

export default ExcelUpload;

