<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import Paperclip from "@lucide/svelte/icons/paperclip";
    import Camera from "@lucide/svelte/icons/camera";
    import ImagePlus from "@lucide/svelte/icons/image-plus";
    import ArrowUp from "@lucide/svelte/icons/arrow-up";
    import { mobileState } from "../mobile-state.svelte";
</script>

<div class="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
    <div class="relative bg-muted/40 dark:bg-[#212121] rounded-3xl border border-zinc-200 dark:border-[#424242] shadow-sm flex flex-col p-3 transition-colors focus-within:border-zinc-300 dark:focus-within:border-[#555555]">
        <textarea
            bind:value={mobileState.textInput}
            class="w-full min-h-[80px] max-h-[200px] bg-transparent border-0 px-3 py-2 text-[15px] resize-none outline-none placeholder:text-muted-foreground/70 custom-scrollbar"
            placeholder="Escribe algo para enviar..."
            onkeydown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    mobileState.sendText();
                }
            }}
        ></textarea>

        <div class="flex items-center justify-between mt-2 px-1">
            <div class="flex items-center gap-2">
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Button
                                {...props}
                                variant="ghost"
                                size="icon"
                                class="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                            >
                                <Paperclip class="w-5 h-5" />
                            </Button>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                        align="start"
                        side="top"
                        class="w-48 mb-2 border-border/50 shadow-lg rounded-xl"
                    >
                        <DropdownMenu.Item
                            onclick={() => document.getElementById("mobile-camera-capture")?.click()}
                            class="cursor-pointer gap-2 py-2.5"
                        >
                            <Camera class="h-4 w-4 text-muted-foreground" />
                            <span>Tomar Foto</span>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            onclick={() => document.getElementById("mobile-image-upload")?.click()}
                            class="cursor-pointer gap-2 py-2.5"
                        >
                            <ImagePlus class="h-4 w-4 text-muted-foreground" />
                            <span>Subir de Galería</span>
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </div>

            <Button
                onclick={() => mobileState.sendText()}
                disabled={!mobileState.textInput.trim()}
                class="h-9 w-9 rounded-full bg-foreground text-background p-0 disabled:bg-muted disabled:text-muted-foreground transition-all shadow-sm shrink-0"
            >
                <ArrowUp class="w-5 h-5" />
            </Button>
        </div>

        <input
            type="file"
            id="mobile-camera-capture"
            accept="image/*"
            capture="environment"
            class="hidden"
            onchange={(e) => mobileState.handleImageUpload(e)}
        />
        <input
            type="file"
            id="mobile-image-upload"
            accept="image/*"
            class="hidden"
            onchange={(e) => mobileState.handleImageUpload(e)}
        />
    </div>
</div>
