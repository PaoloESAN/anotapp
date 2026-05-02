<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import QRCode from "qrcode";

    let {
        open = $bindable(false),
        peerId = "",
    }: { open: boolean; peerId: string } = $props();

    let canvas = $state<HTMLCanvasElement>();

    const baseUrl = "https://anotapp-mobile.vercel.app/mobile";

    $effect(() => {
        if (open && canvas && peerId) {
            const url = `${baseUrl}?peerId=${peerId}`;
            QRCode.toCanvas(
                canvas,
                url,
                {
                    width: 250,
                    margin: 1,
                    color: {
                        dark: "#000000FF",
                        light: "#FFFFFFFF",
                    },
                },
                function (error) {
                    if (error) console.error(error);
                },
            );
        }
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Content
        class="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border text-foreground p-4 sm:p-6 rounded-xl shadow-2xl flex flex-col items-center [&::-webkit-scrollbar]:hidden"
        style="scrollbar-width: none;"
    >
        <Dialog.Header class="shrink-0 w-full text-center mb-4">
            <Dialog.Title
                class="text-xl font-bold tracking-tight text-foreground mb-1"
            >
                Vincular Celular
            </Dialog.Title>
            <Dialog.Description class="text-muted-foreground">
                Escanea este código QR con tu celular para conectarte.
            </Dialog.Description>
        </Dialog.Header>

        <div
            class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 flex items-center justify-center"
        >
            <canvas bind:this={canvas} class="block max-w-full h-auto rounded-md"></canvas>
        </div>

        {#if peerId}
            <div class="mt-3 text-center w-full">
                <p
                    class="text-xs text-muted-foreground uppercase tracking-wider font-semibold"
                >
                    ID de Conexión
                </p>
                <p
                    class="font-mono bg-muted px-3 py-1.5 rounded-md text-sm mt-1.5 select-all break-all"
                >
                    {peerId}
                </p>
            </div>
        {/if}

        <p class="text-xs text-center text-muted-foreground px-4">
            Escanea el codigo para poder enviar texto e imagenes desde tu
            celular.
        </p>
    </Dialog.Content>
</Dialog.Root>
