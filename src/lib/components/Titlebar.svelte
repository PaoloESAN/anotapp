<script lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";

    const window = getCurrentWindow();

    function minimize() {
        window.minimize();
    }

    function toggleMaximize() {
        window.toggleMaximize();
    }

    function closeWindow() {
        window.close();
    }
</script>

<div
    data-tauri-drag-region
    style="user-select: none; -webkit-user-select: none; -webkit-app-region: drag;"
    class="fixed top-0 left-0 w-full h-12 flex items-center justify-between px-4 z-9999 bg-transparent"
>
    <!-- App Title / Logo -->
    <div
        data-tauri-drag-region
        style="-webkit-app-region: drag;"
        class="flex items-center space-x-3 text-slate-700 dark:text-zinc-200 font-semibold tracking-tight text-lg drop-shadow-md pointer-events-none"
    >
        <span>Anotapp</span>
    </div>

    <!-- Botones de Control de Ventana -->
    <div
        class="flex items-center space-x-2.5"
        style="-webkit-app-region: no-drag;"
    >
        <!-- Minimizar -->
        <button
            class="w-3.5 h-3.5 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors focus:outline-none cursor-pointer"
            onclick={minimize}
            aria-label="Minimizar"
        ></button>
        <!-- Maximizar -->
        <button
            class="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-600 transition-colors focus:outline-none cursor-pointer"
            onclick={toggleMaximize}
            aria-label="Maximizar"
        ></button>
        <!-- Cerrar -->
        <button
            class="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors focus:outline-none cursor-pointer"
            onclick={closeWindow}
            aria-label="Cerrar"
        ></button>
    </div>
</div>
