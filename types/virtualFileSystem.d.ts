export declare class VirtualFile {
    name: string;
    content: string;
    extention?: string;
    parent?: VirtualFolder;
    constructor(name: string, content?: string);
    getPath(): string;
    parseJSON(): any;
    parseYAML(): any;
    toJSON(): any;
}
export declare class VirtualFolder {
    name: string;
    parent?: VirtualFolder;
    children: (VirtualFile | VirtualFolder)[];
    constructor(name: string);
    getPath(): string;
    addChild(child: VirtualFile | VirtualFolder): void;
    getChild(name: string): VirtualFile | VirtualFolder | undefined;
    getFile(name: string | RegExp, recursive?: boolean): VirtualFile | undefined;
    getFiles(name?: string | RegExp, recursive?: boolean): VirtualFile[];
    getFolder(name: string | RegExp, recursive?: boolean): VirtualFolder | undefined;
    getFolders(name?: string | RegExp, recursive?: boolean): VirtualFolder[];
    toJSON(): any;
}
/**
 */
interface mapFolderOptions {
    /**
     * Any files that match
     */
    exclude?: RegExp;
}
/**
 * Maps the given folder to a VirtualFolder.
 * @param path The path of the folder to map
 */
export declare function mapFolder(path?: string, options?: mapFolderOptions): Promise<VirtualFolder>;
export {};
