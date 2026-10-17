/**
 * api.js - Cliente de consumo para la API de Paginación
 */
const API_BASE_URL = '/api/v1/pagination';

const ApiService = {
    /**
     * Consume el endpoint 1: /pages-from-bus
     */
    async getPagesFromBus(busBits, pageSizeKb) {
        const url = `${API_BASE_URL}/pages-from-bus?bus_bits=${busBits}&page_size_kb=${pageSizeKb}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al calcular páginas');
        }
        return await response.json();
    },

    /**
     * Consume el endpoint 4: /range-didactic
     */
    async getRangeDidactic(busBits, pageSizeKb, startPage, endPage) {
        const url = `${API_BASE_URL}/range-didactic?bus_bits=${busBits}&page_size_kb=${pageSizeKb}&start_page=${startPage}&end_page=${endPage}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error en análisis didáctico');
        }
        return await response.json();
    }
};