/**
 * Interface representing the glslang module
 */
export interface IGLSLang {
  compileGLSL(
    glsl: string,
    type: "vertex" | "fragment" | "compute"
  ): Uint32Array;
}

/**
 * Returns an initialized module of the glslang compiler
 */
export async function getGLSLangModule(): Promise<IGLSLang> {
  // @ts-ignore
  const glslangModule = await import("https://unpkg.com/@webgpu/glslang@0.0.15/dist/web-devel/glslang.js");
  const glslang = await glslangModule.default();
  return glslang;
}

/**
 * Query an html element by the provided selector
 * @param selector - The selector to query for
 */
export function $(selector: string): HTMLElement {
  return document.querySelector(selector);
}

/**
 * Load a text from the provided path
 * @param path - The path to load the text from
 */
export function fetchText(path: string): Promise<string> {
  return new Promise(resolve => {
    fetch(path).then(resp => {
      resp.text().then(resolve);
    });
  });
}

/**
 * Load a buffer from the provided path
 * @param path - The path to load the buffer from
 */
export function fetchBuffer(path: string): Promise<ArrayBuffer> {
  return new Promise(resolve => {
    fetch(path).then(resp => {
      resp.arrayBuffer().then(resolve);
    });
  });
}
