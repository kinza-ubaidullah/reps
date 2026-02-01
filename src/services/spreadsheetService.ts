
import { api } from './apiClient';
import { Spreadsheet } from '../types';

export const fetchSpreadsheets = async (): Promise<Spreadsheet[]> => {
    try {
        return await api.get('/spreadsheets');
    } catch (err) {
        console.error("Spreadsheet Fetch Error:", err);
        return [];
    }
};

export const addSpreadsheet = async (sheet: Omit<Spreadsheet, 'id' | 'created_at'>) => {
    return await api.post('/admin/spreadsheets', sheet);
};

export const deleteSpreadsheet = async (id: number) => {
    return await api.delete(`/admin/spreadsheets/${id}`);
};
