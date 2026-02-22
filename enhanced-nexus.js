// BlochSphereBundle (IIFE structure, content extracted)
(function() {
  "use strict";

  // --- Enums & Interaction Modes ---
  const InteractionMode = {
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
  };

  const OrbitControlsMode = {
    ROTATE: 0,
    PAN: 1,
    DOLLY_PAN: 2,
    DOLLY_ROTATE: 3,
  };

  // --- WebGL Constants (Commonly found in THREE.js) ---
  const WebGLConstants = {
    // Blending, Depth, Stencil, etc.
    ZERO: 0,
    ONE: 1,
    ADD: 2,
    NEVER: 1,
    LESS: 2,
    EQUAL: 3,
    LEQUAL: 4,
    GREATER: 5,
    NOTEQUAL: 6,
    GEQUAL: 7,
    ALWAYS: 8,

    FRONT: 1028,
    BACK: 1029,
    FRONT_AND_BACK: 1032,

    SRC_ALPHA_SATURATE: 776,
    BLEND_EQUATION_RGB: 32777,
    BLEND_EQUATION_ALPHA: 34877,
    BLEND_DST_RGB: 32968,
    BLEND_SRC_RGB: 32969,
    BLEND_DST_ALPHA: 32970,
    BLEND_SRC_ALPHA: 32971,

    // Data Types
    BYTE: 5120,
    UNSIGNED_BYTE: 5121,
    SHORT: 5122,
    UNSIGNED_SHORT: 5123,
    INT: 5124,
    UNSIGNED_INT: 5125,
    FLOAT: 5126,
    HALF_FLOAT: 36193,
    UNSIGNED_SHORT_4_4_4_4: 32819,
    UNSIGNED_SHORT_5_5_5_1: 32820,
    UNSIGNED_SHORT_5_6_5: 33635,
    UNSIGNED_INT_2_10_10_10_REV: 33640,
    UNSIGNED_INT_24_8: 34042,
    UNSIGNED_INT_10F_11F_11F_REV: 35899,
    UNSIGNED_INT_5_9_9_9_REV: 35902,
    FLOAT_32_UNSIGNED_INT_24_8_REV: 36269,

    // Buffer Usage
    STATIC_DRAW: 35044,
    DYNAMIC_DRAW: 35048,
    STREAM_DRAW: 35040,

    // Textures
    TEXTURE_2D: 3553,
    TEXTURE_CUBE_MAP: 34067,
    TEXTURE_BINDING_2D: 32873,
    TEXTURE_BINDING_CUBE_MAP: 34068,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    TEXTURE_WRAP_R: 32882, // WebGL2
    REPEAT: 10497,
    CLAMP_TO_EDGE: 33071,
    MIRRORED_REPEAT: 33648,
    NEAREST: 9728,
    LINEAR: 9729,
    NEAREST_MIPMAP_NEAREST: 9984,
    LINEAR_MIPMAP_NEAREST: 9985,
    NEAREST_MIPMAP_LINEAR: 9986,
    LINEAR_MIPMAP_LINEAR: 9987,

    // Formats
    ALPHA: 6406,
    RGB: 6407,
    RGBA: 6408,
    LUMINANCE: 6409,
    LUMINANCE_ALPHA: 6410,
    DEPTH_COMPONENT: 6402,
    DEPTH_STENCIL: 34041,
    RED_INTEGER: 36244,
    RGB_INTEGER: 36248,
    RGBA_INTEGER: 36249,
    RG_INTEGER: 33320, // WebGL2

    // Internal Formats
    R8: 33321,
    R8_SNORM: 36760,
    R16F: 33325,
    R32F: 33326,
    R8I: 33329,
    R8UI: 33330,
    R16I: 33331,
    R16UI: 33332,
    R32I: 33333,
    R32UI: 33334,
    RG8: 33323,
    RG8_SNORM: 36761,
    RG16F: 33327,
    RG32F: 33328,
    RG8I: 33335,
    RG8UI: 33336,
    RG16I: 33337,
    RG16UI: 33338,
    RG32I: 33339,
    RG32UI: 33340,
    RGB8: 32849,
    SRGB8: 35905,
    RGB565: 36194,
    RGB9_E5: 35901,
    RGB16F: 34843,
    RGB32F: 34837,
    RGBM7C0: 34849, // Custom format?
    RGB8I: 36227,
    RGB8UI: 36221,
    RGB16I: 36233,
    RGB16UI: 36224,
    RGB32I: 36225,
    RGB32UI: 36226,
    RGBA8: 32856,
    SRGB8_ALPHA8: 35907,
    RGBA4: 32854,
    RGB5_A1: 32855,
    RGBA16F: 34842,
    RGBA32F: 34836,
    RGBA8I: 36238,
    RGBA8UI: 36220,
    RGBA16I: 36239,
    RGBA16UI: 36222,
    RGBA32I: 36240,
    RGBA32UI: 36223,
    DEPTH_COMPONENT16: 33189,
    DEPTH_COMPONENT24: 33190,
    DEPTH_COMPONENT32F: 36012,
    DEPTH24_STENCIL8: 35056,
    DEPTH32F_STENCIL8: 36013,

    // Compressed Formats
    COMPRESSED_RGB_S3TC_DXT1_EXT: 33776,
    COMPRESSED_RGBA_S3TC_DXT1_EXT: 33777,
    COMPRESSED_RGBA_S3TC_DXT3_EXT: 33778,
    COMPRESSED_RGBA_S3TC_DXT5_EXT: 33779,
    COMPRESSED_SRGB_S3TC_DXT1_EXT: 35916,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT: 35917,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT: 35918,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT: 35919,
    COMPRESSED_RED_RGTC1: 36283,
    COMPRESSED_SIGNED_RED_RGTC1: 36284,
    COMPRESSED_RG_RGTC2: 36285,
    COMPRESSED_SIGNED_RG_RGTC2: 36286,
    COMPRESSED_RGBA_BPTC_UNORM_ARB: 36492,
    COMPRESSED_SRGB_ALPHA_BPTC_UNORM_ARB: 36493,
    COMPRESSED_RGB_BPTC_SIGNED_FLOAT_ARB: 36494,
    COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_ARB: 36495,

    // Texture Anisotropy
    MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047,

    // Sync objects (WebGL2)
    SYNC_GPU_COMMANDS_COMPLETE: 37496,
    WAIT_FAILED: 37488,
    TIMEOUT_EXPIRED: 37489,
    CONDITION_SATISFIED: 37490,
    ALREADY_SIGNALED: 37491,
    SYNC_FLUSH_COMMANDS_BIT: 1,

    // Framebuffer
    COLOR_ATTACHMENT0: 36064,
    DEPTH_ATTACHMENT: 36096,
    STENCIL_ATTACHMENT: 36128,
    DEPTH_STENCIL_ATTACHMENT: 33306,
  };

  // --- Core Constants ---
  const GL_EXTENSIONS = {
    WEBGL_DEPTH_TEXTURE: 33776,
    OES_TEXTURE_FLOAT: 33777,
    OES_TEXTURE_HALF_FLOAT: 33778,
    WEBGL_COLOR_BUFFER_FLOAT: 33779,
  };

  const ColorSpace = {
    UNKNOWN: "",
    SRGB: "srgb",
    SRGB_LINEAR: "srgb-linear",
    LINEAR: "linear",
    DEFAULT_SRGB: "srgb", // Renamed from Yt
  };

  const RendererConstants = {
    // Other common THREE.js renderer constants might be here, e.g., mapping types.
    BASIC_SHADOW_MAP: 0,
    PCF_SHADOW_MAP: 1,
    PCF_SOFT_SHADOW_MAP: 2,
    VSM_SHADOW_MAP: 3,

    ALPHA_FORMAT: 1000,
    RGB_FORMAT: 1001,
    RGBA_FORMAT: 1002,
    LUMINANCE_FORMAT: 1003,
    LUMINANCE_ALPHA_FORMAT: 1004,
    RED_FORMAT: 1005,
    RED_INTEGER_FORMAT: 1006,
    RG_FORMAT: 1007,
    RG_INTEGER_FORMAT: 1008,
    RGB_INTEGER_FORMAT: 1009,
    RGBA_INTEGER_FORMAT: 1010,
    DEPTH_COMPONENT_FORMAT: 1011,
    DEPTH_STENCIL_FORMAT: 1012,
    RGB_ETC1_FORMAT: 1013,
    RGBA_ETC1_FORMAT: 1014,
    RGBA_ASTC_4X4_FORMAT: 1015,
    RGBA_ASTC_5X4_FORMAT: 1016,
    RGBA_ASTC_5X5_FORMAT: 1017,
    RGBA_ASTC_6X5_FORMAT: 1018,
    RGBA_ASTC_6X6_FORMAT: 1019,
    RGBA_ASTC_8X5_FORMAT: 1020,
    RGBA_ASTC_8X6_FORMAT: 1021,
    RGBA_ASTC_8X8_FORMAT: 1022,
    RGBA_ASTC_10X5_FORMAT: 1023,
    RGBA_ASTC_10X6_FORMAT: 1024,
    RGBA_ASTC_10X8_FORMAT: 1025,
    RGBA_ASTC_10X10_FORMAT: 1026,
    RGBA_ASTC_12X10_FORMAT: 1027,
    RGBA_ASTC_12X12_FORMAT: 1028,
    RGB_PVRTC1_4_FORMAT: 1029,
    RGB_PVRTC1_2_FORMAT: 1030,
    RGBA_PVRTC1_4_FORMAT: 1031,
    RGBA_PVRTC1_2_FORMAT: 1032,
    RGB_ETC2_FORMAT: 1033,
    RGBA_ETC2_EAC_FORMAT: 1034,

    UnsignedByteType: 1000, // Renamed from Ql
    HalfFloatType: 1001, // Renamed from Qa
    FloatType: 1002, // Renamed from tc
  };

  const MiscConstants = {
    // Animation/Timing
    EASE_OUT_EXPO_CSS: "300 es", // Renamed from eo
    DEFAULT_MAX_ANISOTROPY: 2e3, // Renamed from Je
    TEXEL_BUFFER_TEXTURE: 2001, // Renamed from ji
  };

  // Hexadecimal string lookup table (for color conversion or similar)
  const HexLookup = [
    "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "0a", "0b", "0c", "0d", "0e", "0f",
    "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "1a", "1b", "1c", "1d", "1e", "1f",
    "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "2a", "2b", "2c", "2d", "2e", "2f",
    "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "3a", "3b", "3c", "3d", "3e", "3f",
    "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "4a", "4b", "4c", "4d", "4e", "4f",
    "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "5a", "5b", "5c", "5d", "5e", "5f",
    "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "6a", "6b", "6c", "6d", "6e", "6f",
    "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "7a", "7b", "7c", "7d", "7e", "7f",
    "80", "81", "82", "83", "84", "85", "86", "87", "88", "89", "8a", "8b", "8c", "8d", "8e", "8f",
    "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "9a", "9b", "9c", "9d", "9e", "9f",
    "a0", "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "aa", "ab", "ac", "ad", "ae", "af",
    "b0", "b1", "b2", "b3", "b4", "b5", "b6"
  ];


  // --- Global State / Cache ---
  const threeWarningCache = {}; // Renamed from io

  // --- Utility Functions ---

  /**
   * Checks if any element in the array is greater than or equal to 65535.
   * @param {number[]} array
   * @returns {boolean}
   */
  function containsLargeValue(array) {
    for (let i = array.length - 1; i >= 0; --i) {
      if (array[i] >= 65535) return true;
    }
    return false;
  }

  /**
   * Creates an HTML element in the XHTML namespace.
   * @param {string} tagName
   * @returns {HTMLElement}
   */
  function createElementNs(tagName) {
    return document.createElementNS("http://www.w3.org/1999/xhtml", tagName);
  }

  /**
   * Creates a canvas element with display: block style.
   * @returns {HTMLCanvasElement}
   */
  function createCanvasElement() {
    const canvas = createElementNs("canvas");
    canvas.style.display = "block";
    return canvas;
  }

  /**
   * Logs a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function logThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.log(prefix, ...messages);
  }

  /**
   * Warns a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function warnThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.warn(prefix, ...messages);
  }

  /**
   * Errors a message with a "THREE." prefix.
   * @param {...any} messages
   */
  function errorThreeMessage(...messages) {
    const prefix = "THREE." + messages.shift();
    console.error(prefix, ...messages);
  }

  /**
   * Warns a message with a "THREE." prefix, but only once for a given message.
   * Uses `threeWarningCache` to prevent repetitive warnings.
   * @param {...any} messages
   */
  function warnThreeOnce(...messages) {
    const messageKey = messages.join(" ");
    if (!(messageKey in threeWarningCache)) {
      threeWarningCache[messageKey] = true;
      warnThreeMessage(...messages);
    }
  }

  /**
   * Returns a Promise that resolves when a WebGLSync object is signaled.
   * @param {WebGLRenderingContext} gl - The WebGL rendering context.
   * @param {WebGLSync} syncObject - The sync object to wait for.
   * @param {number} timeoutMs - The maximum time to wait in milliseconds.
   * @returns {Promise<void>}
   */
  function clientWaitSyncPromise(gl, syncObject, timeoutMs) {
    return new Promise(function(resolve, reject) {
      function checkSyncStatus() {
        switch (gl.clientWaitSync(syncObject, gl.SYNC_FLUSH_COMMANDS_BIT, 0)) {
          case gl.WAIT_FAILED:
            reject();
            break;
          case gl.TIMEOUT_EXPIRED:
            setTimeout(checkSyncStatus, timeoutMs);
            break;
          default:
            resolve();
        }
      }
      setTimeout(checkSyncStatus, timeoutMs);
    });
  }

  // --- Classes ---

  /**
   * A basic EventDispatcher implementation.
   */
  class EventDispatcher {
    constructor() {
      this._listeners = undefined;
    }

    /**
     * Adds an event listener.
     * @param {string} type - The type of event.
     * @param {Function} listener - The function to call when the event is dispatched.
     */
    addEventListener(type, listener) {
      if (this._listeners === undefined) {
        this._listeners = {};
      }
      const listeners = this._listeners;
      if (listeners[type] === undefined) {
        listeners[type] = [];
      }
      if (listeners[type].indexOf(listener) === -1) {
        listeners[type].push(listener);
      }
    }

    /**
     * Checks if an event listener is registered for a given type.
     * @param {string} type - The type of event.
     * @param {Function} listener - The listener function.
     * @returns {boolean}
     */
    hasEventListener(type, listener) {
      const listeners = this._listeners;
      return listeners === undefined ? false : listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }

    /**
     * Removes an event listener.
     * @param {string} type - The type of event.
     * @param {Function} listener - The listener function to remove.
     */
    removeEventListener(type, listener) {
      const listeners = this._listeners;
      if (listeners === undefined) {
        return;
      }
      const typeListeners = listeners[type];
      if (typeListeners !== undefined) {
        const index = typeListeners.indexOf(listener);
        if (index !== -1) {
          typeListeners.splice(index, 1);
        }
      }
    }

    /**
     * Dispatches an event.
     * The event object must have a `type` property.
     * Listeners will be called with the event object, and `event.target` will be set to this dispatcher.
     * @param {object} event - The event object to dispatch.
     */
    dispatchEvent(event) {
      const listeners = this._listeners;
      if (listeners === undefined) {
        return;
      }
      const typeListeners = listeners[event.type];
      if (typeListeners !== undefined) {
        event.target = this;
        // Make a copy to prevent issues if listeners are added/removed during dispatch
        const copiedListeners = typeListeners.slice(0);
        for (let i = 0, l = copiedListeners.length; i < l; i++) {
          copiedListeners[i].call(this, event);
        }
        event.target = null; // Clean up
      }
    }
  }

  // Exposed API (example, assuming this is how BlochSphereBundle uses these)
  // This part would typically be defined by the `Bs` parameter or the return value
  // of the IIFE. For this synthesis, we're just making the extracted parts available.
  /*
  return {
    InteractionMode,
    OrbitControlsMode,
    WebGLConstants,
    ColorSpace,
    RendererConstants,
    MiscConstants,
    HexLookup,
    containsLargeValue,
    createElementNs,
    createCanvasElement,
    logThreeMessage,
    warnThreeMessage,
    errorThreeMessage,
    warnThreeOnce,
    clientWaitSyncPromise,
    EventDispatcher,
    // ... potentially other exports
  };
  */

})();

const puppeteer = require('puppeteer');
const {beforeAll, describe, it, expect} = require('vitest');
const {readFileSync} = require('fs');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const temp = require('temp');
const path = require('path');

/**
 * Generates an HTML script with the current repository bundle
 * that we will use to compare.
 */
const bundleString = readFileSync('dist/bloch_sphere.bundle.js', 'utf8');

function htmlContent(clientCode) {
  return `
    <!doctype html>
    <meta charset="UTF-8">
    <html lang="en">
      <head>
      <title>Cirq Web Development page</title>
      </head>
      <body>
      <div id="container"></div>
      <script>${bundleString}</script>
      <script>${clientCode}</script>
      </body>
    </html>
    `;
}

/**
 * Helper to take a screenshot with a given client code.
 */
async function takeScreenshot(clientCode, outputPath) {
  const browser = await puppeteer.launch({args: ['--app']});
  const page = await browser.newPage();
  await page.setContent(htmlContent(clientCode));
  await page.screenshot({path: `${outputPath}.png`});
  await browser.close();
}

/**
 * Helper to compare two images using pixelmatch.
 */
function compareImages(expectedPath, actualPath) {
  const expected = PNG.sync.read(readFileSync(expectedPath));
  const actual = PNG.sync.read(readFileSync(actualPath));
  const {width, height} = expected;
  const diff = new PNG({width, height});

  const pixels = pixelmatch(expected.data, actual.data, diff.data, width, height, {
    threshold: 0.1,
  });

  expect(pixels).toBe(0);
}

// Automatically track and cleanup files on exit
temp.track();

describe('Bloch sphere', () => {
  const dirPath = temp.mkdirSync('tmp');
  const outputPath = path.join(dirPath, 'bloch_sphere');
  const newVectorOutputPath = path.join(dirPath, 'bloch_sphere_vec');

  beforeAll(async () => {
    await takeScreenshot("renderBlochSphere('container')", outputPath);
  });

  it('with no vector matches the gold PNG', () => {
    compareImages('e2e/bloch_sphere/bloch_sphere_expected.png', `${outputPath}.png`);
  });

  beforeAll(async () => {
    await takeScreenshot("renderBlochSphere('container').addVector(0.5, 0.5, 0.5)", newVectorOutputPath);
  });

  it('with custom statevector matches the gold PNG', () => {
    compareImages('e2e/bloch_sphere/bloch_sphere_expected_custom.png', `${newVectorOutputPath}.png`);
  });
});