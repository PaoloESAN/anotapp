<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import Sun from "@lucide/svelte/icons/sun";
    import Moon from "@lucide/svelte/icons/moon";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import { setMode, resetMode } from "mode-watcher";
    import { mobileState } from "../mobile-state.svelte";

    let { isScanning } = $props<{ isScanning: boolean }>();
</script>

<header class="text-center mb-8 pt-6 h-20 relative">
    <div class="absolute left-0 top-4">
        {#if mobileState.status !== "idle" && mobileState.status !== "error" && !isScanning}
            <Button
                variant="ghost"
                size="icon"
                class="rounded-full text-muted-foreground hover:text-foreground"
                onclick={() => mobileState.disconnect()}
            >
                <ChevronLeft class="h-6 w-6" />
            </Button>
        {/if}
    </div>

    <div class="absolute right-0 top-4">
        <DropdownMenu.Root>
            <DropdownMenu.Trigger>
                {#snippet child({ props })}
                    <Button
                        {...props}
                        variant="ghost"
                        size="icon"
                        class="rounded-full text-muted-foreground hover:text-foreground"
                    >
                        <Sun
                            class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                        />
                        <Moon
                            class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                        />
                        <span class="sr-only">Cambiar tema</span>
                    </Button>
                {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
                align="end"
                class="border-border/50 shadow-lg rounded-xl min-w-[120px]"
            >
                <DropdownMenu.Item
                    onclick={() => setMode("light")}
                    class="cursor-pointer py-2">Claro</DropdownMenu.Item
                >
                <DropdownMenu.Item
                    onclick={() => setMode("dark")}
                    class="cursor-pointer py-2">Oscuro</DropdownMenu.Item
                >
                <DropdownMenu.Item
                    onclick={() => resetMode()}
                    class="cursor-pointer py-2">Sistema</DropdownMenu.Item
                >
            </DropdownMenu.Content>
        </DropdownMenu.Root>
    </div>

    <h1 class="text-3xl font-extrabold tracking-tight mb-2 text-foreground">
        Anotapp
    </h1>
    {#if mobileState.status === "connected"}
        <div
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300"
        >
            <CheckCircle2 class="w-3.5 h-3.5" />
            Conectado a la PC
        </div>
    {:else if mobileState.status === "reconnecting"}
        <div
            class="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-semibold animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300"
        >
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
            Reconectando...
        </div>
    {/if}
</header>
