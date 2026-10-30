async function loadComponent(id, file) {
  const mount = document.getElementById(id);
  if (!mount) throw new Error(`No existe el punto de montaje #${id}`);

  const response = await fetch(`/components/${file}`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${file}: HTTP ${response.status}`);
  }
  mount.innerHTML = await response.text();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Error cargando el script ${src}`));
    document.body.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Montar primero todos los componentes HTML.
    await Promise.all([
      loadComponent('header-root', 'header.html'),
      loadComponent('sidebar-root', 'sidebar.html'),
      loadComponent('form-root', 'form-and-quick-result.html'),
      loadComponent('results-panel-root', 'results-panel.html'),
      loadComponent('footer-root', 'footer.html')
    ]);

    // El inspector se monta dentro de la tarjeta correspondiente.
    await loadComponent('bit-inspector-root', 'bit-inspector.html');

    // 2. Cargar la lógica de UI y después la integración HTTP/API existente.
    await loadScript('/js/app-ui.js');
    await loadScript('/js/api.js');
    await loadScript('/js/main.js');

    // 3. Inicializar cuando el DOM de todos los componentes ya está disponible.
    if (typeof initApp === 'function') initApp();

    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);
    const toast = document.getElementById('toastContainer');
    if (toast) {
      toast.innerHTML = `<div class="pointer-events-auto rounded-lg bg-red-700 text-white px-4 py-3 text-sm shadow">${error.message}</div>`;
    }
  }
});
