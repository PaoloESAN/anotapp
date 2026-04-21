export interface ClipboardItem {
    id: string;
    type: "text" | "image" | "files";
    content: string;
    files?: string[];
    x: number;
    y: number;
    z: number;
    w?: number;
    h?: number;
    editing?: boolean;
    title?: string;
    editingTitle?: boolean;
}
