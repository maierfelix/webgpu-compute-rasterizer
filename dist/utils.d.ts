/**
 * Interface representing the glslang module
 */
export interface IGLSLang {
    compileGLSL(glsl: string, type: "vertex" | "fragment" | "compute"): Uint32Array;
}
/**
 * Returns an initialized module of the glslang compiler
 */
export declare function getGLSLangModule(): Promise<IGLSLang>;
/**
 * Query an html element by the provided selector
 * @param selector - The selector to query for
 */
export declare function $(selector: string): HTMLElement;
/**
 * Load a text from the provided path
 * @param path - The path to load the text from
 */
export declare function fetchText(path: string): Promise<string>;
/**
 * Load a buffer from the provided path
 * @param path - The path to load the buffer from
 */
export declare function fetchBuffer(path: string): Promise<ArrayBuffer>;
//# sourceMappingURL=utils.d.ts.map