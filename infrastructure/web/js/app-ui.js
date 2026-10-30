
/* =========================================================
   APP UI — Gestión visual de la aplicación
   Compatible con api.js y main.js
   ========================================================= */

/* Estado compartido con main.js */
const appState = {
    mode: 'pages-from-bus',
    busBits: 16,
    pageSizeBytes: 4096,
    totalPages: 16,
    totalMemoryBytes: 65536,
    vpnBits: 4,
    offsetBits: 12,
    requestedPage: 10,
    startPage: 0,
    endPage: 10,
    inspectorAddress: 0x00A0,
    lastResultData: null
};

const modeTitles = {
    'pages-from-bus': 'Calcular Páginas',
    'size-from-bus': 'Calcular Anchura / Tamaño',
    'bus-from-pages': 'Calcular Bus de Direcciones',
    'range-didactic': 'Análisis Didáctico de Memoria'
};

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function initApp() {
    initTheme();
    setupNavigation();
    setupMobileMenu();
    setupDetailCarousel();
    //mountBitInspector();

    if (typeof window.updateFormVisibility === 'function') {
        window.updateFormVisibility();
    }

    updatePowerPreview();
    updateThemeIcon();

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    console.info('Aplicación inicializada correctamente.');
}

/* =========================================================
   TEMA CLARO / OSCURO
   El modo claro es el predeterminado.
   ========================================================= */

function initTheme() {
    const savedTheme = localStorage.getItem('appTheme');

    const shouldUseDark =
        savedTheme === 'dark' ||
        (
            savedTheme === null &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
        );

    document.documentElement.classList.toggle(
        'dark',
        shouldUseDark
    );
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');

    localStorage.setItem(
        'appTheme',
        isDark ? 'dark' : 'light'
    );

    showToast(
        isDark
            ? 'Modo Oscuro activado'
            : 'Modo Claro activado'
    );

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updateThemeIcon() {
    const button = document.getElementById('themeToggleBtn');

    if (!button) return;

    const isDark = document.documentElement.classList.contains('dark');

    button.innerHTML = `
        <i data-lucide="${isDark ? 'sun' : 'moon'}"
           class="w-5 h-5"></i>
    `;

    button.title = isDark
        ? 'Cambiar a modo claro'
        : 'Cambiar a modo oscuro';

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function showToast(message) {
    const container = document.getElementById('toastContainer');

    if (!container) return;

    const toast = document.createElement('div');

    toast.className = `
        pointer-events-auto
        px-4 py-3
        rounded-lg shadow-lg
        text-sm font-semibold
        bg-brandBlue text-white
        dark:bg-slate-800 dark:text-brandYellow
        border border-brandBlue-light
        dark:border-slate-700
        transition-all duration-300
    `;

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');

        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/* =========================================================
   MANEJO DE ERRORES
   ========================================================= */

function showError(message) {
    const container = document.getElementById('errorContainer');

    if (!container) return;

    container.textContent = `Error: ${message}`;
    container.classList.remove('hidden');
}

function hideError() {
    const container = document.getElementById('errorContainer');

    if (!container) return;

    container.textContent = '';
    container.classList.add('hidden');
}

/* =========================================================
   NAVEGACIÓN ENTRE MÓDULOS
   ========================================================= */

function setupNavigation() {
    const buttons = document.querySelectorAll('.nav-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const mode = button.dataset.mode;

            switchMode(mode);

            buttons.forEach(item => {
                item.classList.remove(
                    'border-brandYellow',
                    'text-brandBlue',
                    'bg-amber-50/50',
                    'dark:bg-slate-800/50',
                    'font-bold'
                );

                item.classList.add('border-transparent');
            });

            button.classList.add(
                'border-brandYellow',
                'text-brandBlue',
                'bg-amber-50/50',
                'dark:bg-slate-800/50',
                'font-bold'
            );

            button.classList.remove('border-transparent');

            document.getElementById('sidebar')?.classList.add('hidden');

            document.getElementById('sidebar')?.classList.add('md:flex');
        });
    });
}

function switchMode(newMode) {
    if (!modeTitles[newMode]) return;

    appState.mode = newMode;

    const currentMode = document.getElementById('currentMode');
    const title = document.getElementById('formTitle');

    if (currentMode) currentMode.value = newMode;
    if (title) title.textContent = modeTitles[newMode];

    if (typeof window.updateFormVisibility === 'function') {
        window.updateFormVisibility();
    }

    updatePowerPreview();
}

/* =========================================================
   MENÚ RESPONSIVE
   ========================================================= */

function setupMobileMenu() {
    const button = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (!button || !sidebar) return;

    button.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
    });
}

/* =========================================================
   UNIDADES Y PREVISUALIZACIÓN MATEMÁTICA
   ========================================================= */

function getPageSizeBytesFromInput() {
    const input = document.getElementById('pageSizeValue');
    const unitInput = document.getElementById('pageSizeUnit');
    const hiddenInput = document.getElementById('pageSizeKb');

    if (!input || !unitInput) return 4096;

    const value = Number(input.value);
    const unit = unitInput.value;

    if (!Number.isFinite(value) || value <= 0) return 4096;

    const multipliers = {
        B: 1,
        KB: 1024,
        MB: 1024 ** 2,
        GB: 1024 ** 3
    };

    const bytes = Math.round(value * (multipliers[unit] || 1024));

    if (hiddenInput) {
        hiddenInput.value = (bytes / 1024).toFixed(2);
    }

    return bytes;
}

function formatBytes(bytes) {
    if (!Number.isFinite(Number(bytes))) return '—';

    const value = Number(bytes);

    if (value >= 1024 ** 3) {
        return `${(value / 1024 ** 3).toFixed(2)} GB`;
    }

    if (value >= 1024 ** 2) {
        return `${(value / 1024 ** 2).toFixed(2)} MB`;
    }

    if (value >= 1024) {
        return `${(value / 1024).toFixed(2)} KB`;
    }

    return `${value} Bytes`;
}

function updatePowerPreview() {
    const container = document.getElementById('powerPreviewContainer');

    if (!container) return;

    const busBits = Number(document.getElementById('busBits')?.value) || 16;
    const pageSizeBytes = getPageSizeBytesFromInput();
    const totalPages = Number(document.getElementById('totalPages')?.value) || 16;

    const totalMemory = 2 ** busBits;

    const offsetBits = Math.round(Math.log2(pageSizeBytes));
    const pagesBits = Math.round(Math.log2(totalPages));

    const badgeClass = `
        px-3 py-2
        bg-white dark:bg-slate-800
        rounded-md
        border border-amber-200 dark:border-slate-700
        text-brandBlue dark:text-brandYellow
    `;

    let html = `
        <span class="${badgeClass}">
            Mem. Total = 2<sup>${busBits}</sup> = ${formatBytes(totalMemory)}
        </span>
    `;

    if (appState.mode !== 'size-from-bus') {
        html += `
            <span class="${badgeClass}">
                Offset = 2<sup>${offsetBits}</sup> =
                ${formatBytes(pageSizeBytes)}
            </span>
        `;
    }

    if (
        appState.mode === 'size-from-bus' ||
        appState.mode === 'bus-from-pages'
    ) {
        html += `
            <span class="${badgeClass}">
                Páginas = 2<sup>${pagesBits}</sup> = ${totalPages}
            </span>
        `;
    }

    container.innerHTML = html;
    container.classList.remove('hidden');
}

/* =========================================================
   INSPECTOR BINARIO
   Montaje en la página principal
   ========================================================= */

function mountBitInspector() {
    const source = document.getElementById('bit-inspector-root');
    const destination = document.getElementById('bitInspectorHome');

    if (!source || !destination) {
        console.warn('No se encontró el contenedor del inspector binario.');
        return;
    }

    const inspector = source.querySelector('#bitInspectorSection');

    if (!inspector) return;

    destination.appendChild(inspector);
}

/* =========================================================
   VISTA COMPLETA DEL DESGLOSE
   ========================================================= */

function openFullBreakdownView() {
    const root = document.getElementById('results-root');
    const view = document.getElementById('fullBreakdownView');

    if (!root || !view) return;

    root.classList.remove('hidden');
    view.classList.remove('hidden');

    document.body.classList.add('overflow-hidden');

    showDetailSlide(0);
}

function closeFullBreakdownView() {
    const root = document.getElementById('results-root');
    const view = document.getElementById('fullBreakdownView');

    view?.classList.add('hidden');
    root?.classList.add('hidden');

    document.body.classList.remove('overflow-hidden');
}

/* =========================================================
   NAVEGACIÓN TIPO CARRUSEL
   ========================================================= */

let activeDetailSlide = 0;

function setupDetailCarousel() {
    document.getElementById('detailPrev')?.addEventListener('click', () => {
        showDetailSlide(activeDetailSlide - 1);
    });

    document.getElementById('detailNext')?.addEventListener('click', () => {
        showDetailSlide(activeDetailSlide + 1);
    });

    document.querySelectorAll('[data-detail-index]').forEach(button => {
        button.addEventListener('click', () => {
            showDetailSlide(Number(button.dataset.detailIndex));
        });
    });

    document.addEventListener('keydown', event => {
        if (document.getElementById('fullBreakdownView')?.classList.contains('hidden')) {
            return;
        }

        if (event.key === 'Escape') {
            closeFullBreakdownView();
        }

        if (event.key === 'ArrowRight') {
            showDetailSlide(activeDetailSlide + 1);
        }

        if (event.key === 'ArrowLeft') {
            showDetailSlide(activeDetailSlide - 1);
        }
    });
}

function showDetailSlide(index) {
    const slides = [...document.querySelectorAll('[data-detail-slide]')];

    if (!slides.length) return;

    activeDetailSlide = Math.max(
        0,
        Math.min(index, slides.length - 1)
    );

    slides.forEach((slide, i) => {
        slide.classList.toggle('hidden', i !== activeDetailSlide);
    });

    document.querySelectorAll('[data-detail-index]').forEach((button, i) => {
        const active = i === activeDetailSlide;

        button.classList.toggle('bg-brandBlue', active);
        button.classList.toggle('text-white', active);
        button.classList.toggle('bg-gray-100', !active);
        button.classList.toggle('dark:bg-slate-800', !active);
    });

    const label = document.getElementById('detailStepLabel');
    const previous = document.getElementById('detailPrev');
    const next = document.getElementById('detailNext');

    if (label) {
        label.textContent = `Sección ${activeDetailSlide + 1} de ${slides.length}`;
    }

    if (previous) previous.disabled = activeDetailSlide === 0;
    if (next) next.disabled = activeDetailSlide === slides.length - 1;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/* =========================================================
   FUNCIONES GLOBALES
   ========================================================= */

window.toggleTheme = toggleTheme;
window.openFullBreakdownView = openFullBreakdownView;
window.closeFullBreakdownView = closeFullBreakdownView;
window.showToast = showToast;
window.showError = showError;
window.hideError = hideError;
window.updatePowerPreview = updatePowerPreview;
window.switchMode = switchMode;
window.initApp = initApp;
window.showDetailSlide = showDetailSlide;
window.mountBitInspector = mountBitInspector;
