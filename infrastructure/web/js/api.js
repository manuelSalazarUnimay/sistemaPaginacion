// js/api.js
const API_BASE_URL = '/api/v1/pagination';

async function fetchPagination(endpoint, params) {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams.toString()}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    const data = await response.json();
    if (!response.ok) throw data;
    return data;
}

// 1. Calcular número de páginas
const getPagesFromBus = (bus_bits, page_size_kb, requested_page) =>
    fetchPagination('/pages-from-bus', { bus_bits, page_size_kb, requested_page });

// 2. Calcular anchura de página
const getSizeFromBus = (bus_bits, total_pages, requested_page) =>
    fetchPagination('/size-from-bus', { bus_bits, total_pages, requested_page });

// 3. Calcular bus
const getBusFromPages = (total_pages, page_size_kb, requested_page) =>
    fetchPagination('/bus-from-pages', { total_pages, page_size_kb, requested_page });

// 4. Análisis didáctico
const getDidacticRange = (bus_bits, page_size_kb, start_page, end_page) =>
    fetchPagination('/range-didactic', { bus_bits, page_size_kb, start_page, end_page });

// Exponer globalmente en window
window.getPagesFromBus = getPagesFromBus;
window.getSizeFromBus = getSizeFromBus;
window.getBusFromPages = getBusFromPages;
window.getDidacticRange = getDidacticRange;