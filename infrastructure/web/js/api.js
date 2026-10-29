// js/api.js — cliente HTTP para los cuatro endpoints FastAPI.
// La interfaz y la API se sirven desde el mismo origen, por eso se usa una ruta relativa.
const API_BASE_URL = '/api/v1/pagination';

async function fetchPagination(endpoint, params = {}) {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
        }
    }

    const query = queryParams.toString();
    const url = `${API_BASE_URL}${endpoint}${query ? `?${query}` : ''}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    const body = await response.text();
    let data;
    try {
        data = body ? JSON.parse(body) : null;
    } catch (_) {
        data = { detail: body || `Respuesta no JSON (HTTP ${response.status}).` };
    }

    if (!response.ok) {
        throw data || { detail: `La API respondió HTTP ${response.status}.` };
    }
    if (data === null) {
        throw { detail: 'La API respondió sin contenido.' };
    }
    return data;
}

// 1. Bus + tamaño de página -> calcular páginas.
const getPagesFromBus = (bus_bits, page_size, unit = 'KB', requested_page) =>
    fetchPagination('/pages-from-bus', { bus_bits, page_size, unit, requested_page });

// 2. Bus + cantidad de páginas -> calcular tamaño de página.
const getSizeFromBus = (bus_bits, total_pages, requested_page) =>
    fetchPagination('/size-from-bus', { bus_bits, total_pages, requested_page });

// 3. Cantidad de páginas + tamaño de página -> calcular bus.
const getBusFromPages = (total_pages, page_size, unit = 'KB', requested_page) =>
    fetchPagination('/bus-from-pages', { total_pages, page_size, unit, requested_page });

// 4. Análisis didáctico de un rango de páginas.
const getDidacticRange = (bus_bits, page_size, unit = 'KB', start_page, end_page) =>
    fetchPagination('/range-didactic', { bus_bits, page_size, unit, start_page, end_page });

// Exposición global para que main.js pueda invocar los métodos desde el formulario.
window.getPagesFromBus = getPagesFromBus;
window.getSizeFromBus = getSizeFromBus;
window.getBusFromPages = getBusFromPages;
window.getDidacticRange = getDidacticRange;
