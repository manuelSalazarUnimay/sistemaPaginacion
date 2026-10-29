/*
 * main.js — Orquestación de la interfaz con la API de paginación.
 * Requiere cargar primero /js/api.js y después este archivo.
 */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function display(value) {
        if (value === null || value === undefined || value === '') return '—';
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value.toLocaleString('es-CO', { maximumFractionDigits: 6 });
        }
        return String(value);
    }

    function formatBytes(value) {
        const bytes = Number(value);
        if (!Number.isFinite(bytes)) return display(value);
        if (bytes < 0) return `${display(bytes)} bytes`;
        if (bytes < 1024) return `${display(bytes)} bytes`;

        const units = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        let size = bytes;
        let unit = 'bytes';
        for (const candidate of units) {
            size /= 1024;
            unit = candidate;
            if (size < 1024 || candidate === units[units.length - 1]) break;
        }
        return `${size.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
    }

    function readInteger(id, label, minimum = 0) {
        const raw = $(id)?.value;
        if (raw === undefined || raw.trim() === '') {
            throw new Error(`Debes indicar ${label.toLowerCase()}.`);
        }
        const value = Number(raw);
        if (!Number.isInteger(value) || value < minimum) {
            throw new Error(`${label} debe ser un entero mayor o igual a ${minimum}.`);
        }
        return value;
    }

    function readPageSize() {
        const raw = $('pageSizeValue')?.value;
        const value = Number(raw);
        if (raw === '' || !Number.isFinite(value) || value <= 0) {
            throw new Error('El tamaño de página debe ser un número mayor que cero.');
        }
        return value;
    }

    function getRequestedPage() {
        const raw = $('requestedPage')?.value;
        if (raw === undefined || raw.trim() === '') return undefined;
        const value = Number(raw);
        if (!Number.isInteger(value) || value < 0) {
            throw new Error('La página específica debe ser un entero mayor o igual a cero.');
        }
        return value;
    }

    function getApiError(error) {
        if (error instanceof Error) return error.message;
        if (error && typeof error === 'object') {
            const detail = error.detail ?? error.message ?? error.error;
            if (Array.isArray(detail)) {
                return detail.map((item) => {
                    const location = Array.isArray(item.loc) ? item.loc.join(' → ') : '';
                    return `${location ? `${location}: ` : ''}${item.msg ?? JSON.stringify(item)}`;
                }).join(' | ');
            }
            if (typeof detail === 'string') return detail;
            try { return JSON.stringify(error); } catch (_) { /* sigue con mensaje genérico */ }
        }
        return 'No fue posible completar la solicitud a la API.';
    }

    function getOrCreateApiDetailsSection() {
        let section = $('apiDetailsSection');
        if (section) return section;

        section = document.createElement('section');
        section.id = 'apiDetailsSection';
        section.className = 'bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-6 space-y-5';
        section.innerHTML = `
            <div>
                <h3 class="text-xl font-bold text-brandBlue dark:text-brandYellow">Datos completos de la API</h3>
                <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">Campos recibidos del endpoint ejecutado.</p>
            </div>
            <div id="apiRangeMetrics" class="hidden"></div>
            <div>
                <h4 class="font-bold text-brandBlue dark:text-white mb-2">Segmentación de memoria</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-600 dark:text-slate-300">
                        <thead class="text-xs uppercase bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200"><tr><th class="px-4 py-3">Campo</th><th class="px-4 py-3">Valor devuelto</th></tr></thead>
                        <tbody id="apiSegmentationBody" class="divide-y divide-gray-100 dark:divide-slate-800"></tbody>
                    </table>
                </div>
            </div>
            <div id="apiRequestedPageDetails"></div>
        `;

        const summary = $('summaryCardsSection');
        if (summary?.parentNode) summary.insertAdjacentElement('afterend', section);
        else $('mainDashboard')?.prepend(section);
        return section;
    }

    function buildKeyValueRows(entries) {
        return entries.map(([label, value]) => `
            <tr>
                <td class="px-4 py-3 font-semibold text-gray-700 dark:text-slate-200">${escapeHtml(label)}</td>
                <td class="px-4 py-3 font-mono break-all">${escapeHtml(display(value))}</td>
            </tr>
        `).join('');
    }

    function renderQuickResult(data, mode, segmentation) {
        const host = $('quickResultContent');
        const button = $('btnShowDetails');
        if (!host) return;

        if (mode === 'range-didactic') {
            host.innerHTML = `
                <div class="space-y-3 text-left bg-gray-50 dark:bg-slate-800/80 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                    <div><span class="text-xs text-gray-500 dark:text-slate-400">Páginas en el rango</span><div class="text-2xl font-extrabold text-brandBlue dark:text-brandYellow">${escapeHtml(display(data.total_pages_in_block))}</div></div>
                    <div class="text-xs text-gray-600 dark:text-slate-300">Rango de páginas: <strong>${escapeHtml(display(data.start_page))}</strong> a <strong>${escapeHtml(display(data.end_page))}</strong></div>
                    <div class="border-t border-gray-200 dark:border-slate-700 pt-2 text-xs font-mono"><div>Inicio: ${escapeHtml(display(data.start_address_hex))}</div><div>Fin: ${escapeHtml(display(data.end_address_hex))}</div></div>
                </div>`;
        } else {
            const requested = data.requested_page_detail;
            host.innerHTML = `
                <div class="space-y-2 text-left bg-gray-50 dark:bg-slate-800/80 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                    <div class="flex justify-between gap-3 text-xs font-mono"><span class="text-gray-500 dark:text-slate-400">Total de páginas</span><strong class="text-brandBlue dark:text-brandYellow">${escapeHtml(display(data.total_pages))}</strong></div>
                    <div class="flex justify-between gap-3 text-xs font-mono"><span class="text-gray-500 dark:text-slate-400">Tamaño de página</span><strong>${escapeHtml(formatBytes(data.page_size_bytes))}</strong></div>
                    <div class="flex justify-between gap-3 text-xs font-mono"><span class="text-gray-500 dark:text-slate-400">Memoria total</span><strong>${escapeHtml(data.total_memory_legible ?? formatBytes(data.total_memory_bytes))}</strong></div>
                    <div class="flex justify-between gap-3 text-xs font-mono border-t border-gray-200 dark:border-slate-700 pt-2"><span class="text-gray-500 dark:text-slate-400">VPN / Offset</span><strong class="text-brandBlue dark:text-brandYellow">${escapeHtml(display(segmentation.vpn_bits))} / ${escapeHtml(display(segmentation.offset_bits))} bits</strong></div>
                    ${requested ? `<div class="border-t border-gray-200 dark:border-slate-700 pt-2 text-xs font-mono"><div>Detalle página ${escapeHtml(display(requested.page_number))}</div><div>Inicio: ${escapeHtml(display(requested.start_address_hex))}</div><div>Fin: ${escapeHtml(display(requested.end_address_hex))}</div></div>` : ''}
                </div>`;
        }
        button?.classList.remove('hidden');
    }

    function renderSummary(data, mode, segmentation) {
        const totalPages = mode === 'range-didactic'
            ? segmentation.max_supported_pages
            : data.total_pages;
        const memoryBytes = data.total_memory_bytes ?? segmentation.total_memory_bytes;
        const pageBytes = data.page_size_bytes ?? segmentation.page_size_bytes;
        const memoryLabel = data.total_memory_legible ?? formatBytes(memoryBytes);

        const container = $('summaryCardsSection');
        if (!container) return;
        container.classList.remove('hidden');
        container.innerHTML = `
            <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
                <span class="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase">Memoria direccionable</span>
                <div class="text-xl font-extrabold text-brandBlue dark:text-white font-mono mt-1 break-words">${escapeHtml(memoryLabel)}</div>
                <span class="text-[10px] text-gray-400 font-mono">${escapeHtml(display(segmentation.bus_bits))} bits de bus</span>
            </div>
            <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
                <span class="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase">Páginas direccionables</span>
                <div class="text-xl font-extrabold text-brandBlue dark:text-brandYellow font-mono mt-1 break-words">${escapeHtml(display(totalPages))}</div>
                <span class="text-[10px] text-gray-400 font-mono">VPN: ${escapeHtml(display(segmentation.vpn_bits))} bits</span>
            </div>
            <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
                <span class="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase">Tamaño de página</span>
                <div class="text-xl font-extrabold text-brandBlue dark:text-white font-mono mt-1 break-words">${escapeHtml(formatBytes(pageBytes))}</div>
                <span class="text-[10px] text-gray-400 font-mono">Offset: ${escapeHtml(display(segmentation.offset_bits))} bits</span>
            </div>
            <div class="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
                <span class="text-xs font-extrabold text-gray-400 dark:text-slate-500 uppercase">Bus de direcciones</span>
                <div class="text-xl font-extrabold text-brandBlue dark:text-brandYellow font-mono mt-1">${escapeHtml(display(segmentation.bus_bits))} bits</div>
                <span class="text-[10px] text-gray-400 font-mono">VPN + Offset</span>
            </div>`;
    }

    function renderApiDetails(data, mode, segmentation) {
        const section = getOrCreateApiDetailsSection();
        section.classList.remove('hidden');

        const segBody = $('apiSegmentationBody');
        const segEntries = [
            ['bus_bits', segmentation.bus_bits],
            ['page_size_val', segmentation.page_size_val],
            ['page_size_unit', segmentation.page_size_unit],
            ['page_size_bytes', segmentation.page_size_bytes],
            ['page_size_kb', segmentation.page_size_kb],
            ['offset_bits', segmentation.offset_bits],
            ['vpn_bits', segmentation.vpn_bits],
            ['max_supported_pages', segmentation.max_supported_pages],
            ['total_memory_bytes', segmentation.total_memory_bytes]
        ];
        segBody.innerHTML = buildKeyValueRows(segEntries);

        const rangeHost = $('apiRangeMetrics');
        if (mode === 'range-didactic') {
            rangeHost.classList.remove('hidden');
            rangeHost.innerHTML = `
                <h4 class="font-bold text-brandBlue dark:text-white mb-2">Resumen del rango devuelto por la API</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${[
                        ['start_page', data.start_page], ['end_page', data.end_page],
                        ['total_pages_in_block', data.total_pages_in_block],
                        ['start_address_dec', data.start_address_dec], ['end_address_dec', data.end_address_dec],
                        ['start_address_hex', data.start_address_hex], ['end_address_hex', data.end_address_hex]
                    ].map(([label, value]) => `
                        <div class="rounded-md border border-gray-200 dark:border-slate-700 p-3">
                            <div class="text-xs text-gray-500 dark:text-slate-400">${escapeHtml(label)}</div>
                            <div class="font-mono font-semibold mt-1 break-all text-gray-800 dark:text-slate-100">${escapeHtml(display(value))}</div>
                        </div>`).join('')}
                </div>`;
        } else {
            rangeHost.classList.add('hidden');
            rangeHost.innerHTML = '';
        }

        const requestedHost = $('apiRequestedPageDetails');
        if (data.requested_page_detail) {
            const page = data.requested_page_detail;
            requestedHost.innerHTML = `
                <h4 class="font-bold text-brandBlue dark:text-white mb-2">Detalle de la página solicitada</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-600 dark:text-slate-300">
                        <thead class="text-xs uppercase bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200"><tr><th class="px-4 py-3">Campo</th><th class="px-4 py-3">Valor</th></tr></thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-slate-800">${buildKeyValueRows([
                            ['page_number', page.page_number], ['start_address', page.start_address],
                            ['end_address', page.end_address], ['start_address_hex', page.start_address_hex],
                            ['end_address_hex', page.end_address_hex]
                        ])}</tbody>
                    </table>
                </div>`;
        } else {
            requestedHost.innerHTML = '<p class="text-sm text-gray-500 dark:text-slate-400">Este endpoint no devolvió <code>requested_page_detail</code> para esta solicitud.</p>';
        }
    }

    function renderMemoryMap(data, mode) {
        const section = $('memoryMapSection');
        const sampleBody = $('memoryMapBody');
        const fullBody = $('fullMemoryMapBody');
        const empty = $('fullMemoryMapEmpty');
        if (!section || !sampleBody || !fullBody) return;

        const pages = Array.isArray(data.pages_sample) ? [...data.pages_sample] : [];
        const requested = data.requested_page_detail;
        if (requested && !pages.some((page) => Number(page.page_number) === Number(requested.page_number))) {
            pages.push(requested);
            pages.sort((a, b) => Number(a.page_number) - Number(b.page_number));
        }

        const start = mode === 'range-didactic' ? Number(data.start_page) : null;
        const end = mode === 'range-didactic' ? Number(data.end_page) : null;
        const rows = pages.map((page) => {
            const pageNo = Number(page.page_number);
            const isRequested = requested && pageNo === Number(requested.page_number);
            const inRange = mode === 'range-didactic' && pageNo >= start && pageNo <= end;
            const rowClass = isRequested || inRange
                ? 'bg-amber-100/80 dark:bg-amber-950/60 font-bold border-l-4 border-brandYellow'
                : 'hover:bg-gray-50 dark:hover:bg-slate-800';
            return `
                <tr class="${rowClass}">
                    <td class="px-6 py-3 font-semibold text-gray-900 dark:text-white">Página ${escapeHtml(display(page.page_number))}</td>
                    <td class="px-6 py-3 text-brandBlue dark:text-brandYellow font-bold">${escapeHtml(display(page.start_address_hex))}</td>
                    <td class="px-6 py-3 text-gray-600 dark:text-slate-300">${escapeHtml(display(page.end_address_hex))}</td>
                </tr>`;
        }).join('');

        sampleBody.innerHTML = rows;
        fullBody.innerHTML = rows;
        section.classList.toggle('hidden', pages.length === 0);
        if (empty) empty.classList.toggle('hidden', pages.length > 0);

        const badgeText = `Datos API: ${pages.length} página(s)`;
        if ($('memoryMapBadge')) $('memoryMapBadge').textContent = badgeText;
        if ($('fullMemoryMapBadge')) $('fullMemoryMapBadge').textContent = badgeText;
        const fullTitle = document.querySelector('#fullBreakdownView .bg-brandBlue h3');
        if (fullTitle) fullTitle.textContent = 'Páginas devueltas por la API';
        const fullSubtitle = document.querySelector('#fullBreakdownView .mb-6 p');
        if (fullSubtitle) fullSubtitle.textContent = 'La vista muestra los registros recibidos en pages_sample y, si corresponde, la página específica solicitada.';
    }

    function renderDidacticSteps(data) {
        const section = $('didacticSection');
        const container = $('didacticStepsContainer');
        if (!section || !container) return;

        if (Array.isArray(data.steps) && data.steps.length > 0) {
            section.classList.remove('hidden');
            container.innerHTML = data.steps.map((step) => `
                <article class="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-lg space-y-2 border border-gray-200 dark:border-slate-700">
                    <h4 class="font-bold text-sm text-brandBlue dark:text-brandYellow">Paso ${escapeHtml(display(step.step_number))}: ${escapeHtml(display(step.title))}</h4>
                    <p class="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">${escapeHtml(display(step.explanation))}</p>
                    <div class="rounded bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-3">
                        <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-1">Fórmula</div>
                        <div class="font-mono text-sm break-words text-gray-800 dark:text-slate-100">${escapeHtml(display(step.formula))}</div>
                    </div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-slate-100"><span class="text-gray-500 dark:text-slate-400">Resultado:</span> ${escapeHtml(display(step.result_summary))}</p>
                </article>`).join('');
        } else {
            section.classList.remove('hidden');
            container.innerHTML = `
                <div class="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-lg border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300">
                    El endpoint consultado no incluye el campo <code>steps</code> en su respuesta. Para visualizar la traza paso a paso devuelta por el backend, selecciona <strong>Análisis Didáctico</strong>, que consume <code>/range-didactic</code>.
                </div>`;
        }
    }

    function toBigIntAddress(value) {
        if (typeof value === 'bigint') return value;
        const raw = String(value ?? '0').trim();
        try {
            if (/^0x[0-9a-f]+$/i.test(raw)) return BigInt(raw);
            if (/^-?\d+$/.test(raw)) return BigInt(raw);
        } catch (_) { /* dirección inválida: devuelve cero */ }
        return 0n;
    }

    function renderBitBoxesExact(address) {
        const totalBits = Math.max(1, Math.min(128, Number(appState.busBits) || 16));
        const offsetBits = Math.max(0, Math.min(totalBits, Number(appState.offsetBits) || 0));
        const vpnBits = Math.max(0, Number(appState.vpnBits) || 0);
        const binaryStr = toBigIntAddress(address).toString(2).slice(-totalBits).padStart(totalBits, '0');
        const indicesRow = $('bitIndicesRow');
        const boxesRow = $('bitBoxesRow');
        if (!indicesRow || !boxesRow) return;

        $('inspectorVpnBitsLabel').textContent = `${vpnBits} bits`;
        $('inspectorOffsetBitsLabel').textContent = `${offsetBits} bits`;
        indicesRow.style.gridTemplateColumns = `repeat(${totalBits}, minmax(0, 1fr))`;
        boxesRow.style.gridTemplateColumns = `repeat(${totalBits}, minmax(0, 1fr))`;

        let indicesHtml = '';
        let boxesHtml = '';
        for (let i = 0; i < totalBits; i++) {
            const bitPosition = totalBits - 1 - i;
            const isVpn = bitPosition >= offsetBits;
            indicesHtml += `<div>${bitPosition}</div>`;
            boxesHtml += `<div class="py-2 rounded ${isVpn ? 'bg-brandBlue text-white' : 'bg-brandYellow text-brandBlue-dark'} font-mono shadow-sm">${binaryStr[i]}</div>`;
        }
        indicesRow.innerHTML = indicesHtml;
        boxesRow.innerHTML = boxesHtml;
    }

    function renderInspector(data, segmentation, mode) {
        const section = $('bitInspectorSection');
        if (!section) return;
        section.classList.remove('hidden');

        const page = data.requested_page_detail;
        const addressHex = page?.start_address_hex ?? data.start_address_hex;
        const addressDecimal = page?.start_address ?? data.start_address_dec ?? 0;
        const address = addressHex ?? addressDecimal;
        appState.inspectorAddress = addressDecimal;
        if ($('inspectorAddressInput')) {
            $('inspectorAddressInput').value = addressHex ?? `0x${toBigIntAddress(addressDecimal).toString(16).toUpperCase()}`;
        }
        renderBitBoxesExact(address);
    }

    function syncAppState(data, mode, requestedPageInput) {
        const segmentation = data.segmentation || {};
        appState.mode = mode;
        appState.busBits = Number(data.bus_bits ?? segmentation.bus_bits ?? appState.busBits);
        appState.pageSizeBytes = Number(data.page_size_bytes ?? segmentation.page_size_bytes ?? appState.pageSizeBytes);
        appState.totalMemoryBytes = Number(data.total_memory_bytes ?? segmentation.total_memory_bytes ?? appState.totalMemoryBytes);
        appState.totalPages = Number(data.total_pages ?? segmentation.max_supported_pages ?? appState.totalPages);
        appState.vpnBits = Number(segmentation.vpn_bits ?? appState.vpnBits);
        appState.offsetBits = Number(segmentation.offset_bits ?? appState.offsetBits);
        appState.requestedPage = Number(data.requested_page_detail?.page_number ?? (mode === 'range-didactic' ? data.start_page : (requestedPageInput ?? 0)));
        appState.startPage = Number(data.start_page ?? appState.startPage);
        appState.endPage = Number(data.end_page ?? appState.endPage);
        appState.lastResultData = data;

        // El tamaño que calcula el endpoint 2 no venía en el formulario; refleja el valor real devuelto.
        if (mode === 'size-from-bus' && segmentation.page_size_val !== undefined) {
            $('pageSizeValue').value = segmentation.page_size_val;
            $('pageSizeUnit').value = segmentation.page_size_unit || 'KB';
        }
    }

    function renderApiResponse(data, mode, requestedPageInput) {
        const segmentation = data.segmentation || {};
        syncAppState(data, mode, requestedPageInput);

        $('results-root')?.classList.remove('hidden');
        renderQuickResult(data, mode, segmentation);
        renderSummary(data, mode, segmentation);
        renderApiDetails(data, mode, segmentation);
        renderMemoryMap(data, mode);
        renderDidacticSteps(data);
        renderInspector(data, segmentation, mode);
        const jsonView = $('jsonResponseView');
        if (jsonView) jsonView.textContent = JSON.stringify(data, null, 2);

        // Actualiza la etiqueta de la sección para hacer explícito qué datos vienen del backend.
        const mapHeading = document.querySelector('#memoryMapSection h3');
        if (mapHeading) mapHeading.textContent = 'Mapa de memoria — registros recibidos de la API';
    }

    async function main(event) {
        event?.preventDefault();
        hideError();

        const form = $('calcForm');
        const submitButton = form?.querySelector('button[type="submit"]');
        const oldButtonHtml = submitButton?.innerHTML;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.classList.add('opacity-70', 'cursor-wait');
            submitButton.textContent = 'Consultando API…';
        }

        try {
            const mode = appState.mode || $('currentMode')?.value || 'pages-from-bus';
            let requestedPage;
            let result;

            if (mode === 'pages-from-bus') {
                requestedPage = getRequestedPage();
                const busBits = readInteger('busBits', 'Bits del bus', 1);
                if (busBits > 128) throw new Error('Los bits del bus deben estar entre 1 y 128.');
                result = await window.getPagesFromBus(
                    busBits,
                    readPageSize(),
                    $('pageSizeUnit').value,
                    requestedPage
                );
            } else if (mode === 'size-from-bus') {
                requestedPage = getRequestedPage();
                const busBits = readInteger('busBits', 'Bits del bus', 1);
                if (busBits > 128) throw new Error('Los bits del bus deben estar entre 1 y 128.');
                result = await window.getSizeFromBus(
                    busBits,
                    readInteger('totalPages', 'Total de páginas', 1),
                    requestedPage
                );
            } else if (mode === 'bus-from-pages') {
                requestedPage = getRequestedPage();
                result = await window.getBusFromPages(
                    readInteger('totalPages', 'Total de páginas', 1),
                    readPageSize(),
                    $('pageSizeUnit').value,
                    requestedPage
                );
            } else if (mode === 'range-didactic') {
                const busBits = readInteger('busBits', 'Bits del bus', 1);
                if (busBits > 128) throw new Error('Los bits del bus deben estar entre 1 y 128.');
                const startPage = readInteger('startPage', 'Página inicial', 0);
                const endPage = readInteger('endPage', 'Página final', 0);
                if (endPage < startPage) throw new Error('La página final debe ser mayor o igual que la página inicial.');
                result = await window.getDidacticRange(
                    busBits,
                    readPageSize(),
                    $('pageSizeUnit').value,
                    startPage,
                    endPage
                );
            } else {
                throw new Error(`Modo de cálculo no reconocido: ${mode}`);
            }

            if (!result || typeof result !== 'object') {
                throw new Error('La API respondió sin un objeto JSON válido.');
            }

            renderApiResponse(result, mode, requestedPage);
            showToast('Respuesta recibida de la API');
        } catch (error) {
            showError(getApiError(error));
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('opacity-70', 'cursor-wait');
                submitButton.innerHTML = oldButtonHtml || 'Ejecutar Simulación';
            }
        }
    }

    // Ajusta la visibilidad para que el formulario muestre solo campos pertinentes al endpoint.
    window.updateFormVisibility = function () {
        const mode = appState.mode;
        const busGroup = document.querySelector('.bus-group');
        const sizeGroup = document.querySelector('.size-group');
        const pagesGroup = document.querySelector('.pages-group');
        const optionalGroup = document.querySelector('.optional-group');
        const rangeGroups = document.querySelectorAll('.range-group');

        busGroup?.classList.remove('hidden');
        sizeGroup?.classList.remove('hidden');
        pagesGroup?.classList.add('hidden');
        optionalGroup?.classList.toggle('hidden', mode === 'range-didactic');
        rangeGroups.forEach((group) => group.classList.add('hidden'));

        if (mode === 'size-from-bus') {
            sizeGroup?.classList.add('hidden');
            pagesGroup?.classList.remove('hidden');
        } else if (mode === 'bus-from-pages') {
            busGroup?.classList.add('hidden');
            pagesGroup?.classList.remove('hidden');
        } else if (mode === 'range-didactic') {
            rangeGroups.forEach((group) => group.classList.remove('hidden'));
        }
    };

    // Inspector compatible con direcciones decimales o hexadecimales y con anchos de hasta 128 bits.
    window.updateBitBoxes = renderBitBoxesExact;
    window.onInspectorInputChange = function (value) {
        const raw = String(value ?? '').trim();
        let address = 0n;
        try {
            if (/^p\d+$/i.test(raw)) {
                const pageNo = BigInt(raw.slice(1));
                address = pageNo * BigInt(Math.max(1, Math.trunc(Number(appState.pageSizeBytes) || 1)));
            } else if (/^0x[0-9a-f]+$/i.test(raw)) {
                address = BigInt(raw);
            } else if (/^-?\d+$/.test(raw)) {
                address = BigInt(raw);
            }
        } catch (_) { address = 0n; }
        renderBitBoxesExact(address);
    };

    window.main = main;
})();