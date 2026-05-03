import { type ClipboardItem } from "$lib/types";
import { createWorker } from "tesseract.js";
import type { DataConnection } from "peerjs";

export interface Workspace {
    id: string;
    name: string;
    items: ClipboardItem[];
}

class DesktopState {
    workspaces = $state<Workspace[]>([
        { id: "ws-default", name: "Mesa 1", items: [] }
    ]);
    activeWorkspaceId = $state("ws-default");
    
    // Getters for convenience
    get activeWorkspace() {
        return this.workspaces.find(ws => ws.id === this.activeWorkspaceId) || this.workspaces[0];
    }

    get items() {
        return this.activeWorkspace.items;
    }

    set items(newItems: ClipboardItem[]) {
        const ws = this.workspaces.find(ws => ws.id === this.activeWorkspaceId);
        if (ws) ws.items = newItems;
    }

    maxZ = $state(1);
    lastText = $state("");
    lastImageB64Len = $state(0);
    isReady = $state(false);
    clipboardPaused = $state(false);
    hideHeaders = $state(true);
    hideCardButtons = $state(false);
    bgPattern = $state("grid");
    customBgImage = $state("");
    
    contextMenu = $state<{
        open: boolean;
        x: number;
        y: number;
        item: any | null;
    }>({
        open: false,
        x: 0,
        y: 0,
        item: null,
    });
    
    peerId = $state("");
    peerInstance: any = null;
    
    draggedItemId = $state<string | null>(null);
    pointerY = $state(0);
    
    ocrText = $state("");
    ocrLoading = $state(false);
    ocrImageSrc = $state("");
    isOcrModalOpen = $state(false);
    isMobileLinkOpen = $state(false);

    constructor() {
        if (typeof localStorage !== "undefined") {
            try {
                const savedWS = localStorage.getItem("anotapp-workspaces");
                if (savedWS) {
                    this.workspaces = JSON.parse(savedWS);
                    // Calculate maxZ across all workspaces
                    let currentMaxZ = 1;
                    this.workspaces.forEach(ws => {
                        ws.items.forEach(item => {
                            if (item.z && item.z >= currentMaxZ) currentMaxZ = item.z + 1;
                        });
                    });
                    this.maxZ = currentMaxZ;
                }

                const savedActiveWS = localStorage.getItem("anotapp-active-ws");
                if (savedActiveWS && this.workspaces.find(ws => ws.id === savedActiveWS)) {
                    this.activeWorkspaceId = savedActiveWS;
                }

                const savedHeaders = localStorage.getItem("anotapp-hide-headers");
                if (savedHeaders !== null) this.hideHeaders = savedHeaders === "true";

                const savedCardButtons = localStorage.getItem("anotapp-hide-card-buttons");
                if (savedCardButtons !== null) this.hideCardButtons = savedCardButtons === "true";

                const savedBg = localStorage.getItem("anotapp-bg-pattern");
                if (savedBg) this.bgPattern = savedBg;
                
                const savedCustomBg = localStorage.getItem("anotapp-custom-bg-image");
                if (savedCustomBg) this.customBgImage = savedCustomBg;
            } catch (e) {
                console.error("Load error:", e);
            }
        }
    }

    initSerialization() {
        $effect(() => {
            const serializedWS = JSON.stringify(this.workspaces);
            const activeWS = this.activeWorkspaceId;
            const hideState = this.hideHeaders;
            const hideCardButtons = this.hideCardButtons;
            const bgState = this.bgPattern;
            const customBg = this.customBgImage;

            const timer = setTimeout(() => {
                try {
                    localStorage.setItem("anotapp-workspaces", serializedWS);
                    localStorage.setItem("anotapp-active-ws", activeWS);
                    localStorage.setItem("anotapp-hide-headers", String(hideState));
                    localStorage.setItem("anotapp-hide-card-buttons", String(hideCardButtons));
                    localStorage.setItem("anotapp-bg-pattern", bgState);
                    localStorage.setItem("anotapp-custom-bg-image", customBg);
                } catch (err) {
                    console.warn("Storage exception", err);
                }
            }, 500);

            return () => clearTimeout(timer);
        });
    }

    addWorkspace() {
        const id = crypto.randomUUID();
        const count = this.workspaces.length + 1;
        this.workspaces.push({
            id,
            name: `Mesa ${count}`,
            items: []
        });
        this.activeWorkspaceId = id;
    }

    removeWorkspace(id: string) {
        if (this.workspaces.length <= 1) return;
        const index = this.workspaces.findIndex(ws => ws.id === id);
        this.workspaces = this.workspaces.filter(ws => ws.id !== id);
        if (this.activeWorkspaceId === id) {
            this.activeWorkspaceId = this.workspaces[Math.max(0, index - 1)].id;
        }
    }

    addItem({
        type,
        content,
        files,
        w,
        h,
    }: {
        type: "text" | "image" | "files";
        content: string;
        files?: string[];
        w?: number;
        h?: number;
    }) {
        this.items.push({
            id: crypto.randomUUID(),
            type,
            content,
            files,
            x: window.innerWidth / 2 - 150 + (Math.random() * 100 - 50),
            y: window.innerHeight / 2 - 150 + (Math.random() * 100 - 50),
            z: this.maxZ++,
            w,
            h,
        });
    }

    addEmptyText() {
        this.items.push({
            id: crypto.randomUUID(),
            type: "text",
            content: "",
            x: window.innerWidth / 2 - 140 + (Math.random() * 40 - 20),
            y: window.innerHeight / 2 - 75 + (Math.random() * 40 - 20),
            z: this.maxZ++,
            w: 280,
            h: 150,
            editing: false,
        });
    }

    async handleImageUpdate(b64: string) {
        try {
            if (!b64 || b64.length === this.lastImageB64Len) return;
            this.lastImageB64Len = b64.length;

            const dataUrl = `data:image/png;base64,${b64}`;
            if (this.items.find((i) => i.type === "image" && i.content === dataUrl))
                return;

            const img = new Image();
            await new Promise<void>((res) => {
                img.onload = () => res();
                img.src = dataUrl;
            });
            const iw = img.naturalWidth;
            const ih = img.naturalHeight;

            let targetW = iw + 16;
            let targetH = ih + 56;
            if (targetW > 350) {
                targetH = (350 / targetW) * targetH;
                targetW = 350;
            }
            if (targetH > 400) {
                targetW = (400 / targetH) * targetW;
                targetH = 400;
            }

            this.addItem({
                type: "image",
                content: dataUrl,
                w: targetW,
                h: targetH,
            });
        } catch (err) {}
    }

    handleFilesUpdate(files: string[]) {
        if (!files || files.length === 0) return;
        const key = [...files].sort().join("|");
        if (this.items.find((i) => i.type === "files" && [...(i.files ?? [])].sort().join("|") === key))
            return;

        if (files.length === 1) {
            this.addItem({ type: "files", content: "", files, w: 200, h: 200 });
        } else {
            const cardW = Math.min(window.innerWidth - 48, 900);
            const cols = Math.max(1, Math.floor(cardW / 110));
            const rows = Math.ceil(files.length / cols);
            const cardH = Math.min(56 + rows * 110, window.innerHeight - 80);
            this.addItem({ type: "files", content: "", files, w: cardW, h: cardH });
        }
    }

    moveItemToWorkspace(itemId: string, targetWorkspaceId: string) {
        // Find current workspace and item
        let itemToMove: ClipboardItem | null = null;
        let sourceWsId = "";

        for (const ws of this.workspaces) {
            const index = ws.items.findIndex(i => i.id === itemId);
            if (index !== -1) {
                itemToMove = ws.items[index];
                sourceWsId = ws.id;
                // Don't move to the same workspace
                if (ws.id === targetWorkspaceId) return;
                
                // Remove from source
                ws.items = ws.items.filter(i => i.id !== itemId);
                break;
            }
        }

        if (itemToMove) {
            // Add to target workspace
            const targetWs = this.workspaces.find(ws => ws.id === targetWorkspaceId);
            if (targetWs) {
                // Position in the center of the window
                itemToMove.x = window.innerWidth / 2 - (itemToMove.w || 280) / 2;
                itemToMove.y = window.innerHeight / 2 - (itemToMove.h || 150) / 2;
                targetWs.items.push(itemToMove);
            }
        }
    }

    async handleIncomingPeerData(data: any) {
        if (!data || !data.type) return;
        if (data.type === "text" && data.content) {
            if (this.items.find((i) => i.type === "text" && i.content === data.content))
                return;
            this.addItem({ type: "text", content: data.content });
        } else if (data.type === "image" && data.content) {
            let b64 = data.content;
            if (b64.startsWith("data:image")) {
                b64 = b64.split(",")[1];
            }
            await this.handleImageUpdate(b64);
        }
    }

    async handleExtractText(rect?: {
        top: number;
        left: number;
        width: number;
        height: number;
    }) {
        if (!this.ocrImageSrc) return;

        this.ocrLoading = true;
        this.ocrText = "";

        try {
            const worker = await createWorker("eng+spa");
            let recognizeOptions = undefined;
            if (rect) {
                recognizeOptions = { rectangle: rect };
            }

            const {
                data: { text },
            } = await worker.recognize(this.ocrImageSrc, recognizeOptions);
            await worker.terminate();
            this.ocrText = text;
        } catch (e: any) {
            console.error("OCR Error:", e);
            this.ocrText = "Ocurrió un error al extraer el texto: " + e;
        } finally {
            this.ocrLoading = false;
        }
    }
}

export const desktopState = new DesktopState();
