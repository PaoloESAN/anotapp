import { type DataConnection } from "peerjs";
import { setMode, resetMode } from "mode-watcher";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error" | "reconnecting";

class MobileState {
    peerId = $state("");
    status = $state<ConnectionStatus>("idle");
    peerInstance: any = null;
    connection = $state<DataConnection | null>(null);
    textInput = $state("");
    inputCode = $state("");

    constructor() {
        if (typeof sessionStorage !== "undefined") {
            const savedText = sessionStorage.getItem("anotapp_textInput");
            if (savedText) this.textInput = savedText;
            
            const savedPeerId = sessionStorage.getItem("anotapp_peerId");
            if (savedPeerId) {
                this.peerId = savedPeerId;
                this.inputCode = savedPeerId;
            }
        }
    }

    initSerialization() {
        // Auto-save text input - must be called within a component context
        $effect(() => {
            if (typeof sessionStorage !== "undefined") {
                sessionStorage.setItem("anotapp_textInput", this.textInput);
            }
        });
    }

    handleVisibilityChange() {
        if (typeof document === "undefined") return;
        if (document.visibilityState === "visible" && this.peerId) {
            if (this.status === "error") {
                this.initConnection(this.peerId, false);
            } else if (
                (this.status === "connected" || this.status === "reconnecting") &&
                this.connection &&
                !this.connection.open
            ) {
                this.initConnection(this.peerId, true);
            }
        }
    }

    savePeerId(id: string) {
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("peerId", id);
            window.history.replaceState({}, "", url);
            sessionStorage.setItem("anotapp_peerId", id);
        }
        this.peerId = id;
    }

    async initConnection(id: string, isAutoReconnect = false) {
        if (!id) return;
        this.status = isAutoReconnect ? "reconnecting" : "connecting";

        try {
            const { Peer } = await import("peerjs");
            if (this.peerInstance) {
                this.peerInstance.destroy();
            }

            this.peerInstance = new Peer();

            this.peerInstance.on("open", () => {
                const conn = this.peerInstance.connect(id, { reliable: true });
                this.connection = conn;

                conn.on("open", () => {
                    this.status = "connected";
                });

                conn.on("error", (err: any) => {
                    console.error("Connection error:", err);
                    if (this.status === "connected" || this.status === "reconnecting") {
                        setTimeout(() => this.initConnection(id, true), 3000);
                    } else {
                        this.status = "error";
                    }
                });

                conn.on("close", () => {
                    if (this.status === "connected" || this.status === "reconnecting") {
                        this.status = "reconnecting";
                        setTimeout(() => this.initConnection(id, true), 3000);
                    } else {
                        this.status = "error";
                    }
                });
            });

            this.peerInstance.on("error", (err: any) => {
                console.error("Peer error:", err);
                if (this.status === "connected" || this.status === "reconnecting") {
                    setTimeout(() => this.initConnection(id, true), 3000);
                } else {
                    this.status = "error";
                }
            });
        } catch (err) {
            console.error("Failed to load PeerJS:", err);
            this.status = "error";
        }
    }

    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peerInstance) {
            this.peerInstance.destroy();
            this.peerInstance = null;
        }
        this.peerId = "";
        this.inputCode = "";
        this.status = "idle";
        
        if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("peerId");
            window.history.replaceState({}, "", url);
            sessionStorage.removeItem("anotapp_peerId");
        }
    }

    sendText() {
        if (!this.textInput.trim() || !this.connection || this.status !== "connected") return;

        this.connection.send({
            type: "text",
            content: this.textInput.trim(),
        });

        this.textInput = "";
    }

    handleImageUpload(e: Event) {
        if (!this.connection || this.status !== "connected") return;

        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            this.connection!.send({
                type: "image",
                content: dataUrl,
            });
            input.value = "";
        };

        reader.readAsDataURL(file);
    }
}

export const mobileState = new MobileState();
