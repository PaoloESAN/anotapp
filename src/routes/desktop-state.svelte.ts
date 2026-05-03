import { type ClipboardItem } from "$lib/types";
import { createWorker } from "tesseract.js";
import type { DataConnection } from "peerjs";

class DesktopState {
    items = $state<ClipboardItem[]>([]);
    maxZ = $state(1);
    lastText = $state("");
    lastImageB64Len = $state(0);
    isReady = $state(false);
    clipboardPaused = $state(false);
    hideHeaders = $state(false);
    bgPattern = $state("grid");
    customBgImage = $state("");
    
    peerId = $state("");
    peerInstance: any = null;
    
    ocrText = $state("");
    ocrLoading = $state(false);
    ocrImageSrc = $state("");
    isOcrModalOpen = $state(false);
    isMobileLinkOpen = $state(false);

    constructor() {
        if (typeof localStorage !== "undefined") {
            try {
                const saved = localStorage.getItem("anotapp-items");
                if (saved) {
                    this.items = JSON.parse(saved);
                    this.maxZ = Math.max(0, ...this.items.map((i) => i.z || 0)) + 1;
                }
                const savedHeaders = localStorage.getItem("anotapp-hide-headers");
                if (savedHeaders === "true") this.hideHeaders = true;

                const savedBg = localStorage.getItem("anotapp-bg-pattern");
                if (savedBg) this.bgPattern = savedBg;
                
                const savedCustomBg = localStorage.getItem("anotapp-custom-bg-image");
                if (savedCustomBg) this.customBgImage = savedCustomBg;
            } catch (e) {}
        }
    }

    initSerialization() {
        // Auto-save logic - must be called within a component context
        $effect(() => {
            const serialized = JSON.stringify(this.items);
            const hideState = this.hideHeaders;
            const bgState = this.bgPattern;

            const timer = setTimeout(() => {
                try {
                    localStorage.setItem("anotapp-items", serialized);
                    localStorage.setItem("anotapp-hide-headers", String(hideState));
                    localStorage.setItem("anotapp-bg-pattern", bgState);
                } catch (err) {
                    console.warn("Storage exception", err);
                }
            }, 500);

            return () => clearTimeout(timer);
        });
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
