/**
 * app.js - Lógica de Interfaz de Usuario y Controladores
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initForms();
});

// --- SISTEMA DE NAVEGACIÓN ---
function initNavigation() {
    const buttons = document.querySelectorAll('#sidebarNav button');
    const views = document.querySelectorAll('.module-view');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar estilos de botones
            buttons.forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('text-gray-600', 'hover:bg-gray-100');
            });
            btn.classList.add('bg-primary', 'text-white');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');

            // Mostrar vista correspondiente
            const targetId = btn.getAttribute('data-target');
            views.forEach(view => {
                if(view.id === targetId) {
                    view.classList.remove('hidden');
                    view.classList.add('active');
                } else {
                    view.classList.add('hidden');
                    view.classList.remove('active');
                }
            });
        });
    });
}

// --- MANEJADORES DE FORMULARIOS ---
function initForms() {
    // 1. Formulario Pages From Bus
    document.getElementById('formPagesFromBus').addEventListener('submit', async (e) => {
        e.preventDefault();
        const busBits = document.getElementById('pb-bus').value;
        const pageSizeKb = document.getElementById('pb-size').value;
        const resultContainer = document.getElementById('result-pages');

        resultContainer.innerHTML = '<span class="text-blue-500">Calculando...</span>';

        try {
            const data = await ApiService.getPagesFromBus(busBits, pageSizeKb);
            renderPagesFromBusResult(data, resultContainer);
        } catch (error) {
            resultContainer.innerHTML = `<span class="text-red-500 font-bold">${error.message}</span>`;
        }
    });

    // 4. Formulario Range Didactic
    document.getElementById('formRangeDidactic').addEventListener('submit', async (e) => {
        e.preventDefault();
        const busBits = document.getElementById('rd-bus').value;
        const pageSizeKb = document.getElementById('rd-size').value;
        const startPage = document.getElementById('rd-start').value;
        const endPage = document.getElementById('rd-end').value;
        const resultContainer = document.getElementById('result-didactic');

        resultContainer.innerHTML = '<span class="text-blue-500">Generando análisis...</span>';
        resultContainer.classList.remove('hidden');

        try {
            const data = await ApiService.getRangeDidactic(busBits, pageSizeKb, startPage, endPage);
            renderRangeDidacticResult(data, resultContainer);
        } catch (error) {
            resultContainer.innerHTML = `<div class="p-4 bg-red-50 text-red-700 border border-red-200 rounded">${error.message}</div>`;
        }
    });
}

// --- FUNCIONES DE RENDERIZADO (COMPONENTES) ---

function renderPagesFromBusResult(data, container) {
    container.innerHTML = `
        <div class="text-center">
            <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Total Páginas Direccionables</h3>
            <p class="text-5xl font-extrabold text-primary mb-4">${data.total_pages.toLocaleString()}</p>
            <div class="bg-white px-4 py-3 rounded border border-gray-200 inline-block text-left">
                <p class="text-sm"><strong>Memoria Total:</strong> ${data.total_memory_legible}</p>
                <p class="text-sm"><strong>Bits Offset:</strong> ${data.segmentation.offset_bits}</p>
                <p class="text-sm"><strong>Bits VPN:</strong> ${data.segmentation.vpn_bits}</p>
            </div>
        </div>
    `;
}

function renderRangeDidacticResult(data, container) {
    // Construir Pasos
    let stepsHtml = `<div class="space-y-4 mb-6">`;
    data.steps.forEach(step => {
        stepsHtml += `
            <div class="p-4 bg-blue-50 border-l-4 border-secondary rounded shadow-sm">
                <h3 class="font-bold text-primary text-md">Paso ${step.step_number}: ${step.title}</h3>
                <p class="text-sm text-gray-700 mt-1">${step.explanation}</p>
                <div class="mt-2 font-mono text-xs text-blue-800 bg-white p-2 rounded border">Fórmula: ${step.formula}</div>
                <div class="mt-2 text-sm font-semibold"><span class="text-secondary bg-primary px-2 py-1 rounded text-xs">Resultado</span> ${step.result_summary}</div>
            </div>`;
    });
    stepsHtml += `</div>`;

    // Construir Tabla de Memoria
    let tableHtml = `
        <div class="overflow-x-auto bg-white rounded border border-gray-200">
            <table class="min-w-full text-left text-sm">
                <thead class="bg-primary text-white">
                    <tr>
                        <th class="py-2 px-4 border-b border-blue-800">N° Página</th>
                        <th class="py-2 px-4 border-b border-blue-800">Inicio (Dec)</th>
                        <th class="py-2 px-4 border-b border-blue-800 text-secondary">Inicio (Hex)</th>
                        <th class="py-2 px-4 border-b border-blue-800">Fin (Dec)</th>
                        <th class="py-2 px-4 border-b border-blue-800 text-secondary">Fin (Hex)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
    `;
    data.pages_sample.forEach(page => {
        tableHtml += `
            <tr class="hover:bg-yellow-50">
                <td class="py-2 px-4 font-bold text-primary">Pág ${page.page_number}</td>
                <td class="py-2 px-4 text-gray-600">${page.start_address.toLocaleString()}</td>
                <td class="py-2 px-4 font-mono text-xs bg-gray-800 text-secondary font-bold rounded m-1 inline-block w-20 text-center">${page.start_address_hex}</td>
                <td class="py-2 px-4 text-gray-600">${page.end_address.toLocaleString()}</td>
                <td class="py-2 px-4 font-mono text-xs bg-gray-800 text-secondary font-bold rounded m-1 inline-block w-20 text-center">${page.end_address_hex}</td>
            </tr>`;
    });
    tableHtml += `</tbody></table></div>`;

    container.innerHTML = stepsHtml + tableHtml;
}