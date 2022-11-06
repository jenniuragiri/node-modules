"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EDGE_UNSUPPORTED_NODE_APIS = exports.RSC_MODULE_TYPES = exports.TRACE_OUTPUT_VERSION = exports.STATIC_STATUS_PAGES = exports.DEFAULT_SANS_SERIF_FONT = exports.DEFAULT_SERIF_FONT = exports.OPTIMIZED_FONT_PROVIDERS = exports.GOOGLE_FONT_PROVIDER = exports.SERVER_PROPS_ID = exports.STATIC_PROPS_ID = exports.PERMANENT_REDIRECT_STATUS = exports.TEMPORARY_REDIRECT_STATUS = exports.EDGE_RUNTIME_WEBPACK = exports.CLIENT_STATIC_FILES_RUNTIME_POLYFILLS_SYMBOL = exports.CLIENT_STATIC_FILES_RUNTIME_POLYFILLS = exports.CLIENT_STATIC_FILES_RUNTIME_WEBPACK = exports.CLIENT_STATIC_FILES_RUNTIME_AMP = exports.CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH = exports.APP_CLIENT_INTERNALS = exports.CLIENT_STATIC_FILES_RUNTIME_MAIN_APP = exports.CLIENT_STATIC_FILES_RUNTIME_MAIN = exports.MIDDLEWARE_REACT_LOADABLE_MANIFEST = exports.MIDDLEWARE_BUILD_MANIFEST = exports.FLIGHT_SERVER_CSS_MANIFEST = exports.FLIGHT_MANIFEST = exports.NEXT_CLIENT_SSR_ENTRY_SUFFIX = exports.NEXT_BUILTIN_DOCUMENT = exports.MODERN_BROWSERSLIST_TARGET = exports.STRING_LITERAL_DROP_BUNDLE = exports.CLIENT_STATIC_FILES_RUNTIME = exports.CLIENT_STATIC_FILES_PATH = exports.CLIENT_PUBLIC_FILES_PATH = exports.BLOCKED_PAGES = exports.BUILD_ID_FILE = exports.CONFIG_FILES = exports.SERVER_DIRECTORY = exports.FONT_MANIFEST = exports.REACT_LOADABLE_MANIFEST = exports.DEV_MIDDLEWARE_MANIFEST = exports.MIDDLEWARE_MANIFEST = exports.DEV_CLIENT_PAGES_MANIFEST = exports.SERVER_FILES_MANIFEST = exports.IMAGES_MANIFEST = exports.ROUTES_MANIFEST = exports.PRERENDER_MANIFEST = exports.EXPORT_DETAIL = exports.EXPORT_MARKER = exports.FONT_LOADER_MANIFEST = exports.SUBRESOURCE_INTEGRITY_MANIFEST = exports.APP_BUILD_MANIFEST = exports.BUILD_MANIFEST = exports.APP_PATH_ROUTES_MANIFEST = exports.APP_PATHS_MANIFEST = exports.PAGES_MANIFEST = exports.PHASE_TEST = exports.PHASE_DEVELOPMENT_SERVER = exports.PHASE_PRODUCTION_SERVER = exports.PHASE_PRODUCTION_BUILD = exports.PHASE_EXPORT = exports.COMPILER_INDEXES = exports.COMPILER_NAMES = void 0;
const COMPILER_NAMES = {
    client: 'client',
    server: 'server',
    edgeServer: 'edge-server'
};
exports.COMPILER_NAMES = COMPILER_NAMES;
const COMPILER_INDEXES = {
    [COMPILER_NAMES.client]: 0,
    [COMPILER_NAMES.server]: 1,
    [COMPILER_NAMES.edgeServer]: 2
};
exports.COMPILER_INDEXES = COMPILER_INDEXES;
const PHASE_EXPORT = 'phase-export';
exports.PHASE_EXPORT = PHASE_EXPORT;
const PHASE_PRODUCTION_BUILD = 'phase-production-build';
exports.PHASE_PRODUCTION_BUILD = PHASE_PRODUCTION_BUILD;
const PHASE_PRODUCTION_SERVER = 'phase-production-server';
exports.PHASE_PRODUCTION_SERVER = PHASE_PRODUCTION_SERVER;
const PHASE_DEVELOPMENT_SERVER = 'phase-development-server';
exports.PHASE_DEVELOPMENT_SERVER = PHASE_DEVELOPMENT_SERVER;
const PHASE_TEST = 'phase-test';
exports.PHASE_TEST = PHASE_TEST;
const PAGES_MANIFEST = 'pages-manifest.json';
exports.PAGES_MANIFEST = PAGES_MANIFEST;
const APP_PATHS_MANIFEST = 'app-paths-manifest.json';
exports.APP_PATHS_MANIFEST = APP_PATHS_MANIFEST;
const APP_PATH_ROUTES_MANIFEST = 'app-path-routes-manifest.json';
exports.APP_PATH_ROUTES_MANIFEST = APP_PATH_ROUTES_MANIFEST;
const BUILD_MANIFEST = 'build-manifest.json';
exports.BUILD_MANIFEST = BUILD_MANIFEST;
const APP_BUILD_MANIFEST = 'app-build-manifest.json';
exports.APP_BUILD_MANIFEST = APP_BUILD_MANIFEST;
const SUBRESOURCE_INTEGRITY_MANIFEST = 'subresource-integrity-manifest';
exports.SUBRESOURCE_INTEGRITY_MANIFEST = SUBRESOURCE_INTEGRITY_MANIFEST;
const FONT_LOADER_MANIFEST = 'font-loader-manifest';
exports.FONT_LOADER_MANIFEST = FONT_LOADER_MANIFEST;
const EXPORT_MARKER = 'export-marker.json';
exports.EXPORT_MARKER = EXPORT_MARKER;
const EXPORT_DETAIL = 'export-detail.json';
exports.EXPORT_DETAIL = EXPORT_DETAIL;
const PRERENDER_MANIFEST = 'prerender-manifest.json';
exports.PRERENDER_MANIFEST = PRERENDER_MANIFEST;
const ROUTES_MANIFEST = 'routes-manifest.json';
exports.ROUTES_MANIFEST = ROUTES_MANIFEST;
const IMAGES_MANIFEST = 'images-manifest.json';
exports.IMAGES_MANIFEST = IMAGES_MANIFEST;
const SERVER_FILES_MANIFEST = 'required-server-files.json';
exports.SERVER_FILES_MANIFEST = SERVER_FILES_MANIFEST;
const DEV_CLIENT_PAGES_MANIFEST = '_devPagesManifest.json';
exports.DEV_CLIENT_PAGES_MANIFEST = DEV_CLIENT_PAGES_MANIFEST;
const MIDDLEWARE_MANIFEST = 'middleware-manifest.json';
exports.MIDDLEWARE_MANIFEST = MIDDLEWARE_MANIFEST;
const DEV_MIDDLEWARE_MANIFEST = '_devMiddlewareManifest.json';
exports.DEV_MIDDLEWARE_MANIFEST = DEV_MIDDLEWARE_MANIFEST;
const REACT_LOADABLE_MANIFEST = 'react-loadable-manifest.json';
exports.REACT_LOADABLE_MANIFEST = REACT_LOADABLE_MANIFEST;
const FONT_MANIFEST = 'font-manifest.json';
exports.FONT_MANIFEST = FONT_MANIFEST;
const SERVER_DIRECTORY = 'server';
exports.SERVER_DIRECTORY = SERVER_DIRECTORY;
const CONFIG_FILES = [
    'next.config.js',
    'next.config.mjs'
];
exports.CONFIG_FILES = CONFIG_FILES;
const BUILD_ID_FILE = 'BUILD_ID';
exports.BUILD_ID_FILE = BUILD_ID_FILE;
const BLOCKED_PAGES = [
    '/_document',
    '/_app',
    '/_error'
];
exports.BLOCKED_PAGES = BLOCKED_PAGES;
const CLIENT_PUBLIC_FILES_PATH = 'public';
exports.CLIENT_PUBLIC_FILES_PATH = CLIENT_PUBLIC_FILES_PATH;
const CLIENT_STATIC_FILES_PATH = 'static';
exports.CLIENT_STATIC_FILES_PATH = CLIENT_STATIC_FILES_PATH;
const CLIENT_STATIC_FILES_RUNTIME = 'runtime';
exports.CLIENT_STATIC_FILES_RUNTIME = CLIENT_STATIC_FILES_RUNTIME;
const STRING_LITERAL_DROP_BUNDLE = '__NEXT_DROP_CLIENT_FILE__';
exports.STRING_LITERAL_DROP_BUNDLE = STRING_LITERAL_DROP_BUNDLE;
const MODERN_BROWSERSLIST_TARGET = [
    'chrome 64',
    'edge 79',
    'firefox 67',
    'opera 51',
    'safari 12', 
];
exports.MODERN_BROWSERSLIST_TARGET = MODERN_BROWSERSLIST_TARGET;
const NEXT_BUILTIN_DOCUMENT = '__NEXT_BUILTIN_DOCUMENT__';
exports.NEXT_BUILTIN_DOCUMENT = NEXT_BUILTIN_DOCUMENT;
const NEXT_CLIENT_SSR_ENTRY_SUFFIX = '.__sc_client__';
exports.NEXT_CLIENT_SSR_ENTRY_SUFFIX = NEXT_CLIENT_SSR_ENTRY_SUFFIX;
const FLIGHT_MANIFEST = 'flight-manifest';
exports.FLIGHT_MANIFEST = FLIGHT_MANIFEST;
const FLIGHT_SERVER_CSS_MANIFEST = 'flight-server-css-manifest';
exports.FLIGHT_SERVER_CSS_MANIFEST = FLIGHT_SERVER_CSS_MANIFEST;
const MIDDLEWARE_BUILD_MANIFEST = 'middleware-build-manifest';
exports.MIDDLEWARE_BUILD_MANIFEST = MIDDLEWARE_BUILD_MANIFEST;
const MIDDLEWARE_REACT_LOADABLE_MANIFEST = 'middleware-react-loadable-manifest';
exports.MIDDLEWARE_REACT_LOADABLE_MANIFEST = MIDDLEWARE_REACT_LOADABLE_MANIFEST;
const CLIENT_STATIC_FILES_RUNTIME_MAIN = `main`;
exports.CLIENT_STATIC_FILES_RUNTIME_MAIN = CLIENT_STATIC_FILES_RUNTIME_MAIN;
const CLIENT_STATIC_FILES_RUNTIME_MAIN_APP = `${CLIENT_STATIC_FILES_RUNTIME_MAIN}-app`;
exports.CLIENT_STATIC_FILES_RUNTIME_MAIN_APP = CLIENT_STATIC_FILES_RUNTIME_MAIN_APP;
const APP_CLIENT_INTERNALS = 'app-client-internals';
exports.APP_CLIENT_INTERNALS = APP_CLIENT_INTERNALS;
const CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH = `react-refresh`;
exports.CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH = CLIENT_STATIC_FILES_RUNTIME_REACT_REFRESH;
const CLIENT_STATIC_FILES_RUNTIME_AMP = `amp`;
exports.CLIENT_STATIC_FILES_RUNTIME_AMP = CLIENT_STATIC_FILES_RUNTIME_AMP;
const CLIENT_STATIC_FILES_RUNTIME_WEBPACK = `webpack`;
exports.CLIENT_STATIC_FILES_RUNTIME_WEBPACK = CLIENT_STATIC_FILES_RUNTIME_WEBPACK;
const CLIENT_STATIC_FILES_RUNTIME_POLYFILLS = 'polyfills';
exports.CLIENT_STATIC_FILES_RUNTIME_POLYFILLS = CLIENT_STATIC_FILES_RUNTIME_POLYFILLS;
const CLIENT_STATIC_FILES_RUNTIME_POLYFILLS_SYMBOL = Symbol(CLIENT_STATIC_FILES_RUNTIME_POLYFILLS);
exports.CLIENT_STATIC_FILES_RUNTIME_POLYFILLS_SYMBOL = CLIENT_STATIC_FILES_RUNTIME_POLYFILLS_SYMBOL;
const EDGE_RUNTIME_WEBPACK = 'edge-runtime-webpack';
exports.EDGE_RUNTIME_WEBPACK = EDGE_RUNTIME_WEBPACK;
const TEMPORARY_REDIRECT_STATUS = 307;
exports.TEMPORARY_REDIRECT_STATUS = TEMPORARY_REDIRECT_STATUS;
const PERMANENT_REDIRECT_STATUS = 308;
exports.PERMANENT_REDIRECT_STATUS = PERMANENT_REDIRECT_STATUS;
const STATIC_PROPS_ID = '__N_SSG';
exports.STATIC_PROPS_ID = STATIC_PROPS_ID;
const SERVER_PROPS_ID = '__N_SSP';
exports.SERVER_PROPS_ID = SERVER_PROPS_ID;
const GOOGLE_FONT_PROVIDER = 'https://fonts.googleapis.com/';
exports.GOOGLE_FONT_PROVIDER = GOOGLE_FONT_PROVIDER;
const OPTIMIZED_FONT_PROVIDERS = [
    {
        url: GOOGLE_FONT_PROVIDER,
        preconnect: 'https://fonts.gstatic.com'
    },
    {
        url: 'https://use.typekit.net',
        preconnect: 'https://use.typekit.net'
    }, 
];
exports.OPTIMIZED_FONT_PROVIDERS = OPTIMIZED_FONT_PROVIDERS;
const DEFAULT_SERIF_FONT = {
    name: 'Times New Roman',
    xAvgCharWidth: 821,
    azAvgWidth: 854.3953488372093,
    unitsPerEm: 2048
};
exports.DEFAULT_SERIF_FONT = DEFAULT_SERIF_FONT;
const DEFAULT_SANS_SERIF_FONT = {
    name: 'Arial',
    xAvgCharWidth: 904,
    azAvgWidth: 934.5116279069767,
    unitsPerEm: 2048
};
exports.DEFAULT_SANS_SERIF_FONT = DEFAULT_SANS_SERIF_FONT;
const STATIC_STATUS_PAGES = [
    '/500'
];
exports.STATIC_STATUS_PAGES = STATIC_STATUS_PAGES;
const TRACE_OUTPUT_VERSION = 1;
exports.TRACE_OUTPUT_VERSION = TRACE_OUTPUT_VERSION;
const RSC_MODULE_TYPES = {
    client: 'client',
    server: 'server'
};
exports.RSC_MODULE_TYPES = RSC_MODULE_TYPES;
const EDGE_UNSUPPORTED_NODE_APIS = [
    'clearImmediate',
    'setImmediate',
    'BroadcastChannel',
    'Buffer',
    'ByteLengthQueuingStrategy',
    'CompressionStream',
    'CountQueuingStrategy',
    'DecompressionStream',
    'DomException',
    'MessageChannel',
    'MessageEvent',
    'MessagePort',
    'ReadableByteStreamController',
    'ReadableStreamBYOBRequest',
    'ReadableStreamDefaultController',
    'TextDecoderStream',
    'TextEncoderStream',
    'TransformStreamDefaultController',
    'WritableStreamDefaultController', 
];
exports.EDGE_UNSUPPORTED_NODE_APIS = EDGE_UNSUPPORTED_NODE_APIS;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=constants.js.map