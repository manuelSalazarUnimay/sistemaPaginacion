/**
- main.js - Lógica principal de la aplicación.
 */

let ultimaRespuestaAPI = null;
let modoActual = 'pages-from-bus';

function initApp() {
    configurarNavegacionModulos();
    configurarFormulario();
    configurarTransicionDesglose(); // Reemplaza la antigua función de scroll
    actualizarCamposFormulario(modoActual);
}

function traducirErrorAPI(errorData) {
    if (!errorData) return 'Ocurrió un error inesperado al procesar la solicitud.';

    // Si es un error interno de JavaScript (TypeError, SyntaxError, etc.)
    if (errorData instanceof Error) {
        return `Error de ejecución en JS: ${errorData.message}`;
    }

    if (typeof errorData === 'string') return errorData;

    // Manejo de errores estructurados de FastAPI { "detail": [...] }
    if (errorData.detail) {
        if (typeof errorData.detail === 'string') return errorData.detail;

        if (Array.isArray(errorData.detail)) {
            const nombresCampos = {
                'bus_bits': 'Bits del Bus',
                'page_size_kb': 'Tamaño de Página (KB)',
                'total_pages': 'Total de Páginas',
                'requested_page': 'Página Específica',
                'start_page': 'Página Inicial',
                'end_page': 'Página Final'
            };

            const mensajes = errorData.detail.map(err => {
                const loc = err.loc || [];
                const campoTecnico = loc[loc.length - 1] || 'Campo';
                const campoNombre = nombresCampos[campoTecnico] || campoTecnico;

                if (err.type.includes('missing')) return `El campo <strong>${campoNombre}</strong> es requerido.`;
                if (err.type.includes('type_error') || err.type.includes('int') || err.type.includes('float')) {
                    return `El campo <strong>${campoNombre}</strong> debe ser un valor numérico.`;
                }
                if (err.type.includes('greater_than') || err.type.includes('gt')) {
                    return `El campo <strong>${campoNombre}</strong> supera el límite máximo permitido.`;
                }
                if (err.type.includes('less_than') || err.type.includes('lt')) {
                    return `El campo <strong>${campoNombre}</strong> es inferior al límite mínimo permitido.`;
                }
                return `Error en <strong>${campoNombre}</strong>: ${err.msg}`;
            });

            return mensajes.join('<br>');
        }
    }

    return 'Los parámetros ingresados no son válidos para la simulación.';
}

function mostrarError(errorData) {
    const errorContainer = document.getElementById('errorContainer');
    const quickResultContent = document.getElementById('quickResultContent');
    const btnShowDetails = document.getElementById('btnShowDetails');

    if (errorContainer) {
        errorContainer.innerHTML = traducirErrorAPI(errorData);
        errorContainer.classList.remove('hidden');
    }

    if (quickResultContent) {
        quickResultContent.innerHTML = `
            <div class="text-3xl font-bold text-red-500 mb-1">!</div>
            <p class="text-xs font-semibold text-gray-700">Error de Entrada</p>
            <p class="text-[11px] text-gray-400 mt-1">Verifica los campos ingresados.</p>
        `;
    }

    if (btnShowDetails) {
        btnShowDetails.classList.add('hidden');
    }
}

function actualizarCamposFormulario(modo) {
    modoActual = modo;
    document.getElementById('currentMode').value = modo;

    const busGroup = document.querySelector('.bus-group');
    const sizeGroup = document.querySelector('.size-group');
    const pagesGroup = document.querySelector('.pages-group');
    const optionalGroup = document.querySelector('.optional-group');
    const rangeGroups = document.querySelectorAll('.range-group');
    const formTitle = document.getElementById('formTitle');

    busGroup?.classList.remove('hidden');
    sizeGroup?.classList.remove('hidden');
    pagesGroup?.classList.add('hidden');
    optionalGroup?.classList.remove('hidden');
    rangeGroups.forEach(el => el.classList.add('hidden'));

    switch (modo) {
        case 'pages-from-bus':
            if (formTitle) formTitle.innerText = 'Calcular Páginas';
            break;

        case 'size-from-bus':
            if (formTitle) formTitle.innerText = 'Calcular Tamaño de Página';
            sizeGroup?.classList.add('hidden');
            pagesGroup?.classList.remove('hidden');
            break;

        case 'bus-from-pages':
            if (formTitle) formTitle.innerText = 'Calcular Bits del Bus';
            busGroup?.classList.add('hidden');
            pagesGroup?.classList.remove('hidden');
            break;

        case 'range-didactic':
            if (formTitle) formTitle.innerText = 'Análisis Didáctico de Paginación';
            optionalGroup?.classList.add('hidden');
            rangeGroups.forEach(el => el.classList.remove('hidden'));
            break;
    }
}

function configurarNavegacionModulos() {
    document.querySelectorAll('[data-mode]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const modoSeleccionado = element.getAttribute('data-mode');
            actualizarCamposFormulario(modoSeleccionado);
        });
    });
}

function configurarFormulario() {
    const calcForm = document.getElementById('calcForm');
    if (!calcForm) return;

    calcForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) errorContainer.classList.add('hidden');

        const busBits = document.getElementById('busBits')?.value;
        const pageSizeKb = document.getElementById('pageSizeKb')?.value;
        const totalPages = document.getElementById('totalPages')?.value;
        const requestedPage = document.getElementById('requestedPage')?.value;
        const startPage = document.getElementById('startPage')?.value;
        const endPage = document.getElementById('endPage')?.value;

        try {
            let responseData = null;

            switch (modoActual) {
                case 'pages-from-bus':
                    responseData = await window.getPagesFromBus(busBits, pageSizeKb, requestedPage);
                    break;
                case 'size-from-bus':
                    responseData = await window.getSizeFromBus(busBits, totalPages, requestedPage);
                    break;
                case 'bus-from-pages':
                    responseData = await window.getBusFromPages(totalPages, pageSizeKb, requestedPage);
                    break;
                case 'range-didactic':
                    responseData = await window.getDidacticRange(busBits, pageSizeKb, startPage, endPage);
                    break;
            }

            // Desempaquetar el objeto si viene dentro de un Array [...]
            const data = Array.isArray(responseData) ? responseData[0] : responseData;

            ultimaRespuestaAPI = data;
            renderQuickResult(data);
            renderDetailedResults(data, modoActual);

        } catch (error) {
            console.error("Error detectado:", error);
            mostrarError(error);
        }
    });
}

function renderQuickResult(data) {
    const quickResultContent = document.getElementById('quickResultContent');
    const btnShowDetails = document.getElementById('btnShowDetails');

    if (!quickResultContent) return;

    const req = data?.requested_page_detail;

    if (req && req.page_number !== undefined) {
        quickResultContent.innerHTML = `
            <span class="inline-block px-3 py-1 bg-blue-50 text-brandBlue font-bold text-xs rounded-full mb-4">
                Página Solicitada #${req.page_number}
            </span>

            <div class="flex justify-center gap-4 w-full">
                <!-- Columna Inicio -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex-1 flex flex-col items-center justify-center">
                    <span class="text-gray-400 font-sans text-xs uppercase tracking-wider mb-1">Inicio (Hex)</span>
                    <span class="text-lg md:text-xl font-bold text-brandBlue font-mono tracking-tight">${req.start_address_hex}</span>
                </div>

                <!-- Columna Fin -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex-1 flex flex-col items-center justify-center">
                    <span class="text-gray-400 font-sans text-xs uppercase tracking-wider mb-1">Fin (Hex)</span>
                    <span class="text-lg md:text-xl font-bold text-brandBlue font-mono tracking-tight">${req.end_address_hex}</span>
                </div>
            </div>
        `;
    } else if (data && data.total_pages !== undefined) {
        // ... (resto de la función)
    } else if (data && data.total_pages !== undefined) {
        quickResultContent.innerHTML = `
            <div class="text-4xl font-extrabold text-brandBlue mb-1">
                ${data.total_pages.toLocaleString()}
            </div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Páginas Totales</p>
            ${data.total_memory_legible ? `
                <div class="bg-gray-50 border rounded-md p-2 text-xs text-gray-600">
                    Memoria Total: <strong class="text-brandBlue">${data.total_memory_legible}</strong>
                </div>
            ` : ''}
        `;
    }

    if (btnShowDetails) {
        btnShowDetails.classList.remove('hidden');
    }
}

function renderDetailedResults(data, mode) {
    const jsonView = document.getElementById('jsonResponseView');
    const memoryMapSection = document.getElementById('memoryMapSection');
    const memoryMapBody = document.getElementById('memoryMapBody');
    const didacticSection = document.getElementById('didacticSection');
    const didacticStepsContainer = document.getElementById('didacticStepsContainer');
    const summaryCardsSection = document.getElementById('summaryCardsSection');

    if (memoryMapBody) memoryMapBody.innerHTML = '';
    if (didacticStepsContainer) didacticStepsContainer.innerHTML = '';
    if (memoryMapSection) memoryMapSection.classList.add('hidden');
    if (didacticSection) didacticSection.classList.add('hidden');

    if (summaryCardsSection) {
        if (data && (data.segmentation || data.total_pages !== undefined)) {
            summaryCardsSection.classList.remove('hidden');
            const seg = data.segmentation || {};

            summaryCardsSection.innerHTML = `
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase">Total Páginas</span>
                    <div class="text-xl font-bold text-brandBlue mt-1">${(data.total_pages || 0).toLocaleString()}</div>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase">Memoria Total</span>
                    <div class="text-xl font-bold text-brandBlue mt-1">${data.total_memory_legible || 'N/A'}</div>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase">Offset / VPN Bits</span>
                    <div class="text-xl font-bold text-brandBlue mt-1">${seg.offset_bits ?? '-'} / ${seg.vpn_bits ?? '-'} bits</div>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <span class="text-xs font-semibold text-gray-400 uppercase">Páginas Máx. Soportadas</span>
                    <div class="text-xl font-bold text-brandBlue mt-1">${(seg.max_supported_pages || 0).toLocaleString()}</div>
                </div>
            `;
        } else {
            summaryCardsSection.classList.add('hidden');
        }
    }

    if (jsonView) {
        jsonView.textContent = JSON.stringify(data, null, 2);
    }

    if (data && data.pages_sample && data.pages_sample.length > 0) {
        if (memoryMapSection) memoryMapSection.classList.remove('hidden');

        const pages = data.pages_sample;
        const requested = data.requested_page_detail;

        if (pages[0]) {
            const isReq = requested && requested.page_number === pages[0].page_number;
            memoryMapBody.innerHTML += generateTableRow(pages[0], isReq ? 'bg-yellow-50 border-l-4 border-brandYellow font-semibold' : 'bg-white');
        }

        if (requested && requested.page_number > (pages[0] ? pages[0].page_number + 1 : 1)) {
            memoryMapBody.innerHTML += `
                <tr>
                    <td colspan="3" class="px-6 py-2 text-center bg-gray-50 text-gray-400 font-mono text-xs">
                        ... (Espacio de memoria intermedio omitido) ...
                    </td>
                </tr>`;
        }

        if (requested && pages[0] && requested.page_number !== pages[0].page_number) {
            memoryMapBody.innerHTML += generateTableRow(requested, 'bg-yellow-50 border-l-4 border-brandYellow font-semibold text-brandBlue');
        }

        const lastPage = pages[pages.length - 1];
        if (requested && lastPage && lastPage.page_number > requested.page_number + 1) {
            memoryMapBody.innerHTML += `
                <tr>
                    <td colspan="4" class="px-6 py-2 text-center bg-gray-50 text-gray-400 font-mono text-xs">
                        ... (Espacio de memoria intermedio omitido) ...
                    </td>
                </tr>`;
        }

        if (lastPage && pages[0] && lastPage.page_number !== pages[0].page_number && (!requested || lastPage.page_number !== requested.page_number)) {
            memoryMapBody.innerHTML += generateTableRow(lastPage, 'bg-white');
        }
    }

    if (mode === 'range-didactic' && data && data.steps) {
        if (didacticSection) didacticSection.classList.remove('hidden');

        let stepsHtml = '';
        data.steps.forEach(step => {
            stepsHtml += `
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 class="font-bold text-gray-800 text-base">Paso ${step.step_number}: ${step.title}</h4>
                    <p class="text-gray-600 text-sm mt-1">${step.explanation}</p>
                    <div class="mt-2 font-mono text-xs bg-gray-200 px-3 py-1.5 rounded text-gray-800 inline-block">${step.formula}</div>
                    <p class="mt-2 text-xs text-brandBlue font-semibold">${step.result_summary}</p>
                </div>
            `;
        });
        if (didacticStepsContainer) didacticStepsContainer.innerHTML = stepsHtml;
    }
}

function generateTableRow(page, rowClass) {
    return `
        <tr class="border-b hover:bg-gray-50 transition-colors ${rowClass}">
            <td class="px-6 py-4 font-medium">Página ${page.page_number}</td>
            <td class="px-6 py-4 font-mono text-xs text-brandBlue">${page.start_address_hex}</td>
            <td class="px-6 py-4 font-mono text-xs text-brandBlue">${page.end_address_hex}</td>
        </tr>
    `;
}


function configurarTransicionDesglose() {
    const btnShowDetails = document.getElementById('btnShowDetails');
    const btnBackToMain = document.getElementById('btnBackToMain');
    const mainDashboard = document.getElementById('mainDashboard');
    const fullBreakdownView = document.getElementById('fullBreakdownView');

    if (
        !btnShowDetails ||
        !btnBackToMain ||
        !mainDashboard ||
        !fullBreakdownView
    ) {
        console.error('Faltan elementos para la transición del desglose.');
        return;
    }

    // Evitar que el contenedor oculto results-root oculte el desglose.
    if (fullBreakdownView.closest('#results-root')) {
        document.body.appendChild(fullBreakdownView);
        console.log('Desglose trasladado directamente a document.body');
    }

    btnShowDetails.addEventListener('click', (event) => {
        event.preventDefault();

        if (!ultimaRespuestaAPI) {
            console.error('No hay datos almacenados de la API.');
            return;
        }

        // Renderizar los datos antes de mostrar la vista.
        renderizarTablaMemoria(ultimaRespuestaAPI);

        mainDashboard.classList.add('hidden');
        fullBreakdownView.classList.remove('hidden');

        console.log('Desglose visible:', !fullBreakdownView.classList.contains('hidden'));
        console.log(
            'Filas renderizadas:',
            document.querySelectorAll('#fullMemoryMapBody tr').length
        );
    });

    btnBackToMain.addEventListener('click', (event) => {
        event.preventDefault();

        fullBreakdownView.classList.add('hidden');

        // Volver a mostrar el dashboard.
        mainDashboard.classList.remove('hidden');
    });
}


function renderizarTablaMemoria(jsonData) {
    // Este ID pertenece exclusivamente a la tabla grande.
    const fullMemoryMapBody =
        document.getElementById('fullMemoryMapBody');

    const emptyMessage =
        document.getElementById('fullMemoryMapEmpty');

    const badge =
        document.getElementById('fullMemoryMapBadge');

    // No modificar ni utilizar el tbody de la vista rápida.
    if (!fullMemoryMapBody) {
        console.error(
            'No se encontró el elemento #fullMemoryMapBody en el HTML.'
        );
        return;
    }

    // Limpiar solamente el contenido de la tabla grande.
    fullMemoryMapBody.replaceChildren();

    const pages = Array.isArray(jsonData?.pages_sample)
        ? jsonData.pages_sample
        : [];

    // Mostrar u ocultar el mensaje de tabla vacía.
    if (emptyMessage) {
        emptyMessage.classList.toggle('hidden', pages.length > 0);
    }

    if (pages.length === 0) {
        if (badge) {
            badge.textContent = 'Sin páginas';
        }
        return;
    }

    // Mostrar la cantidad de páginas recibidas en el JSON.
    if (badge) {
        badge.textContent = `${pages.length} páginas`;
    }

    const fragment = document.createDocumentFragment();

    pages.forEach((page) => {
        const tr = document.createElement('tr');

        tr.className =
            'border-b hover:bg-gray-50 transition-colors';

        // Reemplazar la definición de 'valores' y el ciclo forEach
        const valores = [
            page.page_number,
            page.start_address_hex ?? '',
            page.end_address_hex ?? ''
        ];

        valores.forEach((valor, index) => {
            const td = document.createElement('td');

            td.className = index === 0
                ? 'px-6 py-4 font-bold text-gray-800'
                : 'px-6 py-4 font-mono text-xs text-brandBlue';

            td.textContent = String(valor);
            tr.appendChild(td);
        });

        fragment.appendChild(tr);
    });

    fullMemoryMapBody.appendChild(fragment);
}

window.initApp = initApp;