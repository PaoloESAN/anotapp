<script lang="ts">
    import Plus from "@lucide/svelte/icons/plus";
    import SettingsIcon from "@lucide/svelte/icons/settings";
    import Smartphone from "@lucide/svelte/icons/smartphone";
    import SettingsModal from "./modals/SettingsModal.svelte";
    import { desktopState } from "../../routes/desktop-state.svelte";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import Type from "@lucide/svelte/icons/type";
    import Image from "@lucide/svelte/icons/image";

    let {
        addEmptyText,
        openMobileLink,
        hideHeaders = $bindable(false),
        bgPattern = $bindable("grid"),
    }: {
        addEmptyText: () => void;
        openMobileLink: () => void;
        hideHeaders: boolean;
        bgPattern: string;
    } = $props();

    let isSettingsOpen = $state(false);

    let imageInput: HTMLInputElement;

    async function handleImageSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files || target.files.length === 0) return;

        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const b64 = (ev.target?.result as string).split(",")[1];
            desktopState.handleImageUpdate(b64);
        };
        reader.readAsDataURL(file);
    }
</script>

<input
    bind:this={imageInput}
    type="file"
    accept="image/*"
    class="hidden"
    onchange={handleImageSelect}
/>

<!-- Action Buttons (Bottom Left) -->
<div class="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-3">
    <button
        onclick={openMobileLink}
        class="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-md text-muted-foreground shadow-md transition-all hover:bg-muted hover:border-border hover:text-foreground hover:scale-105 active:scale-95"
        title="Vincular Celular"
    >
        <Smartphone class="w-5 h-5" />
    </button>

    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            {#snippet child({ props })}
                <button
                    {...props}
                    class="flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-background/80 backdrop-blur-md text-primary shadow-xl transition-all hover:bg-primary/10 hover:border-primary/50 hover:text-primary/80 hover:scale-105 active:scale-95"
                    title="Agregar contenido"
                >
                    <Plus class="w-6 h-6" />
                </button>
            {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
            align="start"
            side="right"
            class="mb-2 ml-2 min-w-[160px] rounded-xl border-border/50 bg-background/95 backdrop-blur-lg shadow-2xl"
        >
            <DropdownMenu.Item
                onclick={addEmptyText}
                class="flex items-center gap-2 py-2.5 cursor-pointer"
            >
                <Type class="w-4 h-4 text-primary" />
                <span>Nueva Nota</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
                onclick={() => imageInput.click()}
                class="flex items-center gap-2 py-2.5 cursor-pointer"
            >
                <Image class="w-4 h-4 text-primary" />
                <span>Imagen</span>
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>

    <button
        onclick={() => (isSettingsOpen = true)}
        class="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background/80 backdrop-blur-md text-muted-foreground shadow-md transition-all hover:bg-muted hover:border-border hover:text-foreground hover:scale-105 active:scale-95"
        title="Configuración"
    >
        <SettingsIcon class="w-5 h-5" />
    </button>
</div>

<SettingsModal bind:open={isSettingsOpen} bind:hideHeaders bind:bgPattern />
