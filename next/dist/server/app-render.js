"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.renderToHTMLOrFlight = renderToHTMLOrFlight;
var _react = _interopRequireWildcard(require("next/dist/compiled/react"));
var _error = require("../client/components/error");
var _serverBrowser = _interopRequireDefault(require("next/dist/compiled/react-dom/server.browser"));
var _renderResult = _interopRequireDefault(require("./render-result"));
var _nodeWebStreamsHelper = require("./node-web-streams-helper");
var _htmlescape = require("./htmlescape");
var _matchSegments = require("../client/components/match-segments");
var _serverInsertedHtml = require("../shared/lib/server-inserted-html");
var _internalUtils = require("./internal-utils");
var _redirect = require("../client/components/redirect");
var _cookies = require("./web/spec-extension/cookies");
var _hooksServerContext = require("../client/components/hooks-server-context");
var _notFound = require("../client/components/not-found");
var _headManagerContext = require("../shared/lib/head-manager-context");
var _stream = require("stream");
var _stringHash = _interopRequireDefault(require("next/dist/compiled/string-hash"));
function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache() {
    if (typeof WeakMap !== "function") return null;
    var cache = new WeakMap();
    _getRequireWildcardCache = function() {
        return cache;
    };
    return cache;
}
function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache();
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const isEdgeRuntime = process.env.NEXT_RUNTIME === "edge";
function preloadComponent(Component, props) {
    const prev = console.error;
    // Hide invalid hook call warning when calling component
    console.error = (msg)=>{
        if (msg.startsWith("Invalid hook call..")) {
        // ignore
        } else {
            // @ts-expect-error argument is defined
            prev.apply(console, arguments);
        }
    };
    try {
        let result = Component(props);
        return function() {
            // We know what this component will render already.
            return result;
        };
    } catch (x) {
    // something suspended or errored, try again later
    } finally{
        console.error = prev;
    }
    return Component;
}
const INTERNAL_HEADERS_INSTANCE = Symbol("internal for headers readonly");
function readonlyHeadersError() {
    return new Error("ReadonlyHeaders cannot be modified");
}
class ReadonlyHeaders {
    constructor(headers){
        // Since `new Headers` uses `this.append()` to fill the headers object ReadonlyHeaders can't extend from Headers directly as it would throw.
        const headersInstance = new Headers(headers);
        this[INTERNAL_HEADERS_INSTANCE] = headersInstance;
        this.entries = headersInstance.entries.bind(headersInstance);
        this.forEach = headersInstance.forEach.bind(headersInstance);
        this.get = headersInstance.get.bind(headersInstance);
        this.has = headersInstance.has.bind(headersInstance);
        this.keys = headersInstance.keys.bind(headersInstance);
        this.values = headersInstance.values.bind(headersInstance);
    }
    [Symbol.iterator]() {
        return this[INTERNAL_HEADERS_INSTANCE][Symbol.iterator]();
    }
    append() {
        throw readonlyHeadersError();
    }
    delete() {
        throw readonlyHeadersError();
    }
    set() {
        throw readonlyHeadersError();
    }
}
exports.ReadonlyHeaders = ReadonlyHeaders;
const INTERNAL_COOKIES_INSTANCE = Symbol("internal for cookies readonly");
class ReadonlyRequestCookiesError extends Error {
    message = "ReadonlyRequestCookies cannot be modified. Read more: https://nextjs.org/api-reference/cookies";
}
class ReadonlyRequestCookies {
    constructor(request){
        // Since `new Headers` uses `this.append()` to fill the headers object ReadonlyHeaders can't extend from Headers directly as it would throw.
        // Request overridden to not have to provide a fully request object.
        const cookiesInstance = new _cookies.RequestCookies(request.headers);
        this[INTERNAL_COOKIES_INSTANCE] = cookiesInstance;
        this.get = cookiesInstance.get.bind(cookiesInstance);
        this.getAll = cookiesInstance.getAll.bind(cookiesInstance);
        this.has = cookiesInstance.has.bind(cookiesInstance);
    }
    [Symbol.iterator]() {
        return this[INTERNAL_COOKIES_INSTANCE][Symbol.iterator]();
    }
    clear() {
        throw new ReadonlyRequestCookiesError();
    }
    delete() {
        throw new ReadonlyRequestCookiesError();
    }
    set() {
        throw new ReadonlyRequestCookiesError();
    }
}
exports.ReadonlyRequestCookies = ReadonlyRequestCookies;
/**
 * Flight Response is always set to application/octet-stream to ensure it does not get interpreted as HTML.
 */ class FlightRenderResult extends _renderResult.default {
    constructor(response){
        super(response, {
            contentType: "application/octet-stream"
        });
    }
}
/**
 * Interop between "export default" and "module.exports".
 */ function interopDefault(mod) {
    return mod.default || mod;
}
// tolerate dynamic server errors during prerendering so console
// isn't spammed with unactionable errors
/**
 * Create error handler for renderers.
 */ function createErrorHandler(/**
   * Used for debugging
   */ _source, capturedErrors, allCapturedErrors) {
    return (err)=>{
        var ref;
        if (allCapturedErrors) allCapturedErrors.push(err);
        if (err.digest === _hooksServerContext.DYNAMIC_ERROR_CODE || err.digest === _notFound.NOT_FOUND_ERROR_CODE || ((ref = err.digest) == null ? void 0 : ref.startsWith(_redirect.REDIRECT_ERROR_CODE))) {
            return err.digest;
        }
        // Used for debugging error source
        // console.error(_source, err)
        console.error(err);
        capturedErrors.push(err);
        // TODO-APP: look at using webcrypto instead. Requires a promise to be awaited.
        return (0, _stringHash).default(err.message + err.stack + (err.digest || "")).toString();
    };
}
let isFetchPatched = false;
// we patch fetch to collect cache information used for
// determining if a page is static or not
function patchFetch(ComponentMod) {
    if (isFetchPatched) return;
    isFetchPatched = true;
    const { DynamicServerError  } = ComponentMod.serverHooks;
    const staticGenerationAsyncStorage = ComponentMod.staticGenerationAsyncStorage;
    const originFetch = globalThis.fetch;
    globalThis.fetch = async (input, init)=>{
        const staticGenerationStore = "getStore" in staticGenerationAsyncStorage ? staticGenerationAsyncStorage.getStore() : staticGenerationAsyncStorage;
        const { isStaticGeneration , fetchRevalidate , pathname  } = staticGenerationStore || {};
        if (staticGenerationStore && isStaticGeneration) {
            if (init && typeof init === "object") {
                const cache = init.cache;
                // Delete `cache` property as Cloudflare Workers will throw an error
                if (isEdgeRuntime) {
                    delete init.cache;
                }
                if (cache === "no-store") {
                    staticGenerationStore.fetchRevalidate = 0;
                    // TODO: ensure this error isn't logged to the user
                    // seems it's slipping through currently
                    throw new DynamicServerError(`no-store fetch ${input}${pathname ? ` ${pathname}` : ""}`);
                }
                const hasNextConfig = "next" in init;
                const next = init.next || {};
                if (typeof next.revalidate === "number" && (typeof fetchRevalidate === "undefined" || next.revalidate < fetchRevalidate)) {
                    staticGenerationStore.fetchRevalidate = next.revalidate;
                    if (next.revalidate === 0) {
                        throw new DynamicServerError(`revalidate: ${next.revalidate} fetch ${input}${pathname ? ` ${pathname}` : ""}`);
                    }
                }
                if (hasNextConfig) delete init.next;
            }
        }
        return originFetch(input, init);
    };
}
/**
 * Render Flight stream.
 * This is only used for renderToHTML, the Flight response does not need additional wrappers.
 */ function useFlightResponse(writable, req, serverComponentManifest, rscChunks, flightResponseRef, nonce) {
    if (flightResponseRef.current !== null) {
        return flightResponseRef.current;
    }
    const { createFromReadableStream ,  } = require("next/dist/compiled/react-server-dom-webpack/client");
    const [renderStream, forwardStream] = (0, _nodeWebStreamsHelper).readableStreamTee(req);
    const res = createFromReadableStream(renderStream, {
        moduleMap: isEdgeRuntime ? serverComponentManifest.__edge_ssr_module_mapping__ : serverComponentManifest.__ssr_module_mapping__
    });
    flightResponseRef.current = res;
    let bootstrapped = false;
    // We only attach CSS chunks to the inlined data.
    const forwardReader = forwardStream.getReader();
    const writer = writable.getWriter();
    const startScriptTag = nonce ? `<script nonce=${JSON.stringify(nonce)}>` : "<script>";
    function read() {
        forwardReader.read().then(({ done , value  })=>{
            if (value) {
                rscChunks.push(value);
            }
            if (!bootstrapped) {
                bootstrapped = true;
                writer.write((0, _nodeWebStreamsHelper).encodeText(`${startScriptTag}(self.__next_f=self.__next_f||[]).push(${(0, _htmlescape).htmlEscapeJsonString(JSON.stringify([
                    0
                ]))})</script>`));
            }
            if (done) {
                flightResponseRef.current = null;
                writer.close();
            } else {
                const responsePartial = (0, _nodeWebStreamsHelper).decodeText(value);
                const scripts = `${startScriptTag}self.__next_f.push(${(0, _htmlescape).htmlEscapeJsonString(JSON.stringify([
                    1,
                    responsePartial
                ]))})</script>`;
                writer.write((0, _nodeWebStreamsHelper).encodeText(scripts));
                read();
            }
        });
    }
    read();
    return res;
}
/**
 * Create a component that renders the Flight stream.
 * This is only used for renderToHTML, the Flight response does not need additional wrappers.
 */ function createServerComponentRenderer(ComponentToRender, ComponentMod, { transformStream , serverComponentManifest , serverContexts , rscChunks  }, serverComponentsErrorHandler, nonce) {
    // We need to expose the `__webpack_require__` API globally for
    // react-server-dom-webpack. This is a hack until we find a better way.
    if (ComponentMod.__next_app_webpack_require__) {
        // @ts-ignore
        globalThis.__next_require__ = ComponentMod.__next_app_webpack_require__;
        // @ts-ignore
        globalThis.__next_chunk_load__ = ()=>Promise.resolve();
    }
    let RSCStream;
    const createRSCStream = ()=>{
        if (!RSCStream) {
            RSCStream = ComponentMod.renderToReadableStream(/*#__PURE__*/ _react.default.createElement(ComponentToRender, null), serverComponentManifest, {
                context: serverContexts,
                onError: serverComponentsErrorHandler
            });
        }
        return RSCStream;
    };
    const flightResponseRef = {
        current: null
    };
    const writable = transformStream.writable;
    return function ServerComponentWrapper() {
        const reqStream = createRSCStream();
        const response = useFlightResponse(writable, reqStream, serverComponentManifest, rscChunks, flightResponseRef, nonce);
        return (0, _react).use(response);
    };
}
/**
 * Shorten the dynamic param in order to make it smaller when transmitted to the browser.
 */ function getShortDynamicParamType(type) {
    switch(type){
        case "catchall":
            return "c";
        case "optional-catchall":
            return "oc";
        case "dynamic":
            return "d";
        default:
            throw new Error("Unknown dynamic param type");
    }
}
/**
 * Parse dynamic route segment to type of parameter
 */ function getSegmentParam(segment) {
    if (segment.startsWith("[[...") && segment.endsWith("]]")) {
        return {
            type: "optional-catchall",
            param: segment.slice(5, -2)
        };
    }
    if (segment.startsWith("[...") && segment.endsWith("]")) {
        return {
            type: "catchall",
            param: segment.slice(4, -1)
        };
    }
    if (segment.startsWith("[") && segment.endsWith("]")) {
        return {
            type: "dynamic",
            param: segment.slice(1, -1)
        };
    }
    return null;
}
/**
 * Get inline <link> tags based on server CSS manifest. Only used when rendering to HTML.
 */ function getCssInlinedLinkTags(serverComponentManifest, serverCSSManifest, filePath, serverCSSForEntries) {
    var ref;
    const layoutOrPageCss = serverCSSManifest[filePath] || ((ref = serverComponentManifest.__client_css_manifest__) == null ? void 0 : ref[filePath]);
    if (!layoutOrPageCss) {
        return [];
    }
    const chunks = new Set();
    for (const css of layoutOrPageCss){
        // We only include the CSS if it's a global CSS, or it is used by this
        // entrypoint.
        if (serverCSSForEntries.includes(css) || !/\.module\.css/.test(css)) {
            const mod = serverComponentManifest[css];
            if (mod) {
                for (const chunk of mod.default.chunks){
                    chunks.add(chunk);
                }
            }
        }
    }
    return [
        ...chunks
    ];
}
function getServerCSSForEntries(serverCSSManifest, entries) {
    const css = [];
    for (const entry of entries){
        const entryName = entry.replace(/\.[^.]+$/, "");
        if (serverCSSManifest.__entry_css__ && serverCSSManifest.__entry_css__[entryName]) {
            css.push(...serverCSSManifest.__entry_css__[entryName]);
        }
    }
    return css;
}
/**
 * Get inline <link rel="preload" as="font"> tags based on server CSS manifest and font loader manifest. Only used when rendering to HTML.
 */ function getPreloadedFontFilesInlineLinkTags(serverComponentManifest, serverCSSManifest, fontLoaderManifest, serverCSSForEntries, filePath) {
    var ref;
    if (!fontLoaderManifest || !filePath) {
        return [];
    }
    const layoutOrPageCss = serverCSSManifest[filePath] || ((ref = serverComponentManifest.__client_css_manifest__) == null ? void 0 : ref[filePath]);
    if (!layoutOrPageCss) {
        return [];
    }
    const fontFiles = new Set();
    for (const css of layoutOrPageCss){
        // We only include the CSS if it is used by this entrypoint.
        if (serverCSSForEntries.includes(css)) {
            const preloadedFontFiles = fontLoaderManifest.app[css];
            if (preloadedFontFiles) {
                for (const fontFile of preloadedFontFiles){
                    fontFiles.add(fontFile);
                }
            }
        }
    }
    return [
        ...fontFiles
    ];
}
function getScriptNonceFromHeader(cspHeaderValue) {
    var ref;
    const directives = cspHeaderValue// Directives are split by ';'.
    .split(";").map((directive)=>directive.trim());
    // First try to find the directive for the 'script-src', otherwise try to
    // fallback to the 'default-src'.
    const directive1 = directives.find((dir)=>dir.startsWith("script-src")) || directives.find((dir)=>dir.startsWith("default-src"));
    // If no directive could be found, then we're done.
    if (!directive1) {
        return;
    }
    // Extract the nonce from the directive
    const nonce = (ref = directive1.split(" ")// Remove the 'strict-src'/'default-src' string, this can't be the nonce.
    .slice(1).map((source)=>source.trim())// Find the first source with the 'nonce-' prefix.
    .find((source)=>source.startsWith("'nonce-") && source.length > 8 && source.endsWith("'"))) == null ? void 0 : ref.slice(7, -1);
    // If we could't find the nonce, then we're done.
    if (!nonce) {
        return;
    }
    // Don't accept the nonce value if it contains HTML escape characters.
    // Technically, the spec requires a base64'd value, but this is just an
    // extra layer.
    if (_htmlescape.ESCAPE_REGEX.test(nonce)) {
        throw new Error("Nonce value from Content-Security-Policy contained HTML escape characters.\nLearn more: https://nextjs.org/docs/messages/nonce-contained-invalid-characters");
    }
    return nonce;
}
const FLIGHT_PARAMETERS = [
    "__rsc__",
    "__next_router_state_tree__",
    "__next_router_prefetch__", 
];
function headersWithoutFlight(headers) {
    const newHeaders = {
        ...headers
    };
    for (const param of FLIGHT_PARAMETERS){
        delete newHeaders[param];
    }
    return newHeaders;
}
async function renderToString(element) {
    const renderStream = await _serverBrowser.default.renderToReadableStream(element);
    await renderStream.allReady;
    return (0, _nodeWebStreamsHelper).streamToString(renderStream);
}
async function renderToHTMLOrFlight(req, res, pathname, query, renderOpts) {
    /**
   * Rules of Static & Dynamic HTML:
   *
   *    1.) We must generate static HTML unless the caller explicitly opts
   *        in to dynamic HTML support.
   *
   *    2.) If dynamic HTML support is requested, we must honor that request
   *        or throw an error. It is the sole responsibility of the caller to
   *        ensure they aren't e.g. requesting dynamic HTML for an AMP page.
   *
   * These rules help ensure that other existing features like request caching,
   * coalescing, and ISR continue working as intended.
   */ const isStaticGeneration = renderOpts.supportsDynamicHTML !== true && !renderOpts.isBot;
    const isFlight = req.headers.__rsc__ !== undefined;
    const capturedErrors = [];
    const allCapturedErrors = [];
    const serverComponentsErrorHandler = createErrorHandler("serverComponentsRenderer", capturedErrors);
    const flightDataRendererErrorHandler = createErrorHandler("flightDataRenderer", capturedErrors);
    const htmlRendererErrorHandler = createErrorHandler("htmlRenderer", capturedErrors, allCapturedErrors);
    const { buildManifest , subresourceIntegrityManifest , serverComponentManifest , serverCSSManifest ={} , ComponentMod , dev , fontLoaderManifest , supportsDynamicHTML ,  } = renderOpts;
    if (process.env.NODE_ENV === "production") {
        patchFetch(ComponentMod);
    }
    const generateStaticHTML = supportsDynamicHTML !== true;
    const staticGenerationAsyncStorage = ComponentMod.staticGenerationAsyncStorage;
    const requestAsyncStorage = ComponentMod.requestAsyncStorage;
    if (staticGenerationAsyncStorage && !("getStore" in staticGenerationAsyncStorage) && staticGenerationAsyncStorage.inUse) {
        throw new Error(`Invariant: A separate worker must be used for each render when AsyncLocalStorage is not available`);
    }
    // we wrap the render in an AsyncLocalStorage context
    const wrappedRender = async ()=>{
        const staticGenerationStore = "getStore" in staticGenerationAsyncStorage ? staticGenerationAsyncStorage.getStore() : staticGenerationAsyncStorage;
        // don't modify original query object
        query = Object.assign({}, query);
        const isPrefetch = req.headers.__next_router_prefetch__ !== undefined;
        // TODO-APP: verify the tree is valid
        // TODO-APP: verify query param is single value (not an array)
        // TODO-APP: verify tree can't grow out of control
        /**
     * Router state provided from the client-side router. Used to handle rendering from the common layout down.
     */ let providedFlightRouterState = isFlight ? req.headers.__next_router_state_tree__ ? JSON.parse(req.headers.__next_router_state_tree__) : undefined : undefined;
        /**
     * The tree created in next-app-loader that holds component segments and modules
     */ const loaderTree = ComponentMod.tree;
        (0, _internalUtils).stripInternalQueries(query);
        const LayoutRouter = ComponentMod.LayoutRouter;
        const RenderFromTemplateContext = ComponentMod.RenderFromTemplateContext;
        /**
     * Server Context is specifically only available in Server Components.
     * It has to hold values that can't change while rendering from the common layout down.
     * An example of this would be that `headers` are available but `searchParams` are not because that'd mean we have to render from the root layout down on all requests.
     */ const serverContexts = [
            [
                "WORKAROUND",
                null
            ]
        ];
        /**
     * Dynamic parameters. E.g. when you visit `/dashboard/vercel` which is rendered by `/dashboard/[slug]` the value will be {"slug": "vercel"}.
     */ const pathParams = renderOpts.params;
        /**
     * Parse the dynamic segment and return the associated value.
     */ const getDynamicParamFromSegment = (// [slug] / [[slug]] / [...slug]
        segment)=>{
            const segmentParam = getSegmentParam(segment);
            if (!segmentParam) {
                return null;
            }
            const key = segmentParam.param;
            const value = pathParams[key];
            if (!value) {
                // Handle case where optional catchall does not have a value, e.g. `/dashboard/[...slug]` when requesting `/dashboard`
                if (segmentParam.type === "optional-catchall") {
                    const type = getShortDynamicParamType(segmentParam.type);
                    return {
                        param: key,
                        value: null,
                        type: type,
                        // This value always has to be a string.
                        treeSegment: [
                            key,
                            "",
                            type
                        ]
                    };
                }
                return null;
            }
            const type = getShortDynamicParamType(segmentParam.type);
            return {
                param: key,
                // The value that is passed to user code.
                value: value,
                // The value that is rendered in the router tree.
                treeSegment: [
                    key,
                    Array.isArray(value) ? value.join("/") : value,
                    type, 
                ],
                type: type
            };
        };
        async function resolveHead([segment, parallelRoutes, { head  }], parentParams) {
            // Handle dynamic segment params.
            const segmentParam = getDynamicParamFromSegment(segment);
            /**
       * Create object holding the parent params and current params
       */ const currentParams = // Handle null case where dynamic param is optional
            segmentParam && segmentParam.value !== null ? {
                ...parentParams,
                [segmentParam.param]: segmentParam.value
            } : parentParams;
            for(const key in parallelRoutes){
                const childTree = parallelRoutes[key];
                const returnedHead = await resolveHead(childTree, currentParams);
                if (returnedHead) {
                    return returnedHead;
                }
            }
            if (head) {
                const Head = await interopDefault(head());
                return /*#__PURE__*/ _react.default.createElement(Head, {
                    params: currentParams
                });
            }
            return null;
        }
        const createFlightRouterStateFromLoaderTree = ([segment, parallelRoutes, { layout  }], rootLayoutIncluded = false)=>{
            const dynamicParam = getDynamicParamFromSegment(segment);
            const segmentTree = [
                dynamicParam ? dynamicParam.treeSegment : segment,
                {}, 
            ];
            if (!rootLayoutIncluded && typeof layout !== "undefined") {
                rootLayoutIncluded = true;
                segmentTree[4] = true;
            }
            segmentTree[1] = Object.keys(parallelRoutes).reduce((existingValue, currentValue)=>{
                existingValue[currentValue] = createFlightRouterStateFromLoaderTree(parallelRoutes[currentValue], rootLayoutIncluded);
                return existingValue;
            }, {});
            return segmentTree;
        };
        let defaultRevalidate = false;
        // Collect all server CSS imports used by this specific entry (or entries, for parallel routes).
        // Not that we can't rely on the CSS manifest because it tracks CSS imports per module,
        // which can be used by multiple entries and cannot be tree-shaked in the module graph.
        // More info: https://github.com/vercel/next.js/issues/41018
        const serverCSSForEntries = getServerCSSForEntries(serverCSSManifest, ComponentMod.pages);
        const assetPrefix = renderOpts.assetPrefix || "";
        /**
     * Use the provided loader tree to create the React Component tree.
     */ const createComponentTree = async ({ createSegmentPath , loaderTree: [segment, parallelRoutes, { layoutOrPagePath , layout , template , error , loading , page , "not-found": notFound ,  }, ] , parentParams , firstItem , rootLayoutIncluded  })=>{
            // TODO-APP: enable stylesheet per layout/page
            const stylesheets = layoutOrPagePath ? getCssInlinedLinkTags(serverComponentManifest, serverCSSManifest, layoutOrPagePath, serverCSSForEntries) : [];
            const preloadedFontFiles = getPreloadedFontFilesInlineLinkTags(serverComponentManifest, serverCSSManifest, fontLoaderManifest, serverCSSForEntries, layoutOrPagePath);
            const Template = template ? await interopDefault(template()) : _react.default.Fragment;
            const ErrorComponent = error ? await interopDefault(error()) : undefined;
            const Loading = loading ? await interopDefault(loading()) : undefined;
            const isLayout = typeof layout !== "undefined";
            const isPage = typeof page !== "undefined";
            const layoutOrPageMod = isLayout ? await layout() : isPage ? await page() : undefined;
            /**
       * Checks if the current segment is a root layout.
       */ const rootLayoutAtThisLevel = isLayout && !rootLayoutIncluded;
            /**
       * Checks if the current segment or any level above it has a root layout.
       */ const rootLayoutIncludedAtThisLevelOrAbove = rootLayoutIncluded || rootLayoutAtThisLevel;
            const NotFound = notFound ? await interopDefault(notFound()) : rootLayoutAtThisLevel ? _error.NotFound : undefined;
            if (typeof (layoutOrPageMod == null ? void 0 : layoutOrPageMod.revalidate) === "number") {
                defaultRevalidate = layoutOrPageMod.revalidate;
                if (isStaticGeneration && defaultRevalidate === 0) {
                    const { DynamicServerError  } = ComponentMod.serverHooks;
                    throw new DynamicServerError(`revalidate: 0 configured ${segment}`);
                }
            }
            // TODO-APP: move these errors to the loader instead?
            // we will also need a migration doc here to link to
            if (typeof (layoutOrPageMod == null ? void 0 : layoutOrPageMod.getServerSideProps) === "function") {
                throw new Error(`getServerSideProps is not supported in app/, detected in ${segment}`);
            }
            if (typeof (layoutOrPageMod == null ? void 0 : layoutOrPageMod.getStaticProps) === "function") {
                throw new Error(`getStaticProps is not supported in app/, detected in ${segment}`);
            }
            /**
       * The React Component to render.
       */ let Component = layoutOrPageMod ? interopDefault(layoutOrPageMod) : undefined;
            if (dev) {
                const { isValidElementType  } = require("next/dist/compiled/react-is");
                if ((isPage || typeof Component !== "undefined") && !isValidElementType(Component)) {
                    throw new Error(`The default export is not a React Component in page: "${pathname}"`);
                }
                if (typeof ErrorComponent !== "undefined" && !isValidElementType(ErrorComponent)) {
                    throw new Error(`The default export of error is not a React Component in page: ${segment}`);
                }
                if (typeof Loading !== "undefined" && !isValidElementType(Loading)) {
                    throw new Error(`The default export of loading is not a React Component in ${segment}`);
                }
                if (typeof NotFound !== "undefined" && !isValidElementType(NotFound)) {
                    throw new Error(`The default export of notFound is not a React Component in ${segment}`);
                }
            }
            // Handle dynamic segment params.
            const segmentParam = getDynamicParamFromSegment(segment);
            /**
       * Create object holding the parent params and current params
       */ const currentParams = // Handle null case where dynamic param is optional
            segmentParam && segmentParam.value !== null ? {
                ...parentParams,
                [segmentParam.param]: segmentParam.value
            } : parentParams;
            // Resolve the segment param
            const actualSegment = segmentParam ? segmentParam.treeSegment : segment;
            // This happens outside of rendering in order to eagerly kick off data fetching for layouts / the page further down
            const parallelRouteMap = await Promise.all(Object.keys(parallelRoutes).map(async (parallelRouteKey)=>{
                const currentSegmentPath = firstItem ? [
                    parallelRouteKey
                ] : [
                    actualSegment,
                    parallelRouteKey
                ];
                const childSegment = parallelRoutes[parallelRouteKey][0];
                const childSegmentParam = getDynamicParamFromSegment(childSegment);
                if (isPrefetch && Loading) {
                    const childProp = {
                        // Null indicates the tree is not fully rendered
                        current: null,
                        segment: childSegmentParam ? childSegmentParam.treeSegment : childSegment
                    };
                    // This is turned back into an object below.
                    return [
                        parallelRouteKey,
                        /*#__PURE__*/ _react.default.createElement(LayoutRouter, {
                            parallelRouterKey: parallelRouteKey,
                            segmentPath: createSegmentPath(currentSegmentPath),
                            loading: Loading ? /*#__PURE__*/ _react.default.createElement(Loading, null) : undefined,
                            hasLoading: Boolean(Loading),
                            error: ErrorComponent,
                            template: /*#__PURE__*/ _react.default.createElement(Template, null, /*#__PURE__*/ _react.default.createElement(RenderFromTemplateContext, null)),
                            notFound: NotFound ? /*#__PURE__*/ _react.default.createElement(NotFound, null) : undefined,
                            childProp: childProp,
                            rootLayoutIncluded: rootLayoutIncludedAtThisLevelOrAbove
                        }), 
                    ];
                }
                // Create the child component
                const { Component: ChildComponent  } = await createComponentTree({
                    createSegmentPath: (child)=>{
                        return createSegmentPath([
                            ...currentSegmentPath,
                            ...child
                        ]);
                    },
                    loaderTree: parallelRoutes[parallelRouteKey],
                    parentParams: currentParams,
                    rootLayoutIncluded: rootLayoutIncludedAtThisLevelOrAbove
                });
                const childProp = {
                    current: /*#__PURE__*/ _react.default.createElement(ChildComponent, null),
                    segment: childSegmentParam ? childSegmentParam.treeSegment : childSegment
                };
                const segmentPath = createSegmentPath(currentSegmentPath);
                // This is turned back into an object below.
                return [
                    parallelRouteKey,
                    /*#__PURE__*/ _react.default.createElement(LayoutRouter, {
                        parallelRouterKey: parallelRouteKey,
                        segmentPath: segmentPath,
                        error: ErrorComponent,
                        loading: Loading ? /*#__PURE__*/ _react.default.createElement(Loading, null) : undefined,
                        // TODO-APP: Add test for loading returning `undefined`. This currently can't be tested as the `webdriver()` tab will wait for the full page to load before returning.
                        hasLoading: Boolean(Loading),
                        template: /*#__PURE__*/ _react.default.createElement(Template, null, /*#__PURE__*/ _react.default.createElement(RenderFromTemplateContext, null)),
                        notFound: NotFound ? /*#__PURE__*/ _react.default.createElement(NotFound, null) : undefined,
                        childProp: childProp,
                        rootLayoutIncluded: rootLayoutIncludedAtThisLevelOrAbove
                    }), 
                ];
            }));
            // Convert the parallel route map into an object after all promises have been resolved.
            const parallelRouteComponents = parallelRouteMap.reduce((list, [parallelRouteKey, Comp])=>{
                list[parallelRouteKey] = Comp;
                return list;
            }, {});
            // When the segment does not have a layout or page we still have to add the layout router to ensure the path holds the loading component
            if (!Component) {
                return {
                    Component: ()=>/*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, parallelRouteComponents.children)
                };
            }
            const props = {
                ...parallelRouteComponents,
                // TODO-APP: params and query have to be blocked parallel route names. Might have to add a reserved name list.
                // Params are always the current params that apply to the layout
                // If you have a `/dashboard/[team]/layout.js` it will provide `team` as a param but not anything further down.
                params: currentParams,
                // Query is only provided to page
                ...isPage ? {
                    searchParams: query
                } : {}
            };
            // Eagerly execute layout/page component to trigger fetches early.
            Component = await Promise.resolve().then(()=>{
                return preloadComponent(Component, props);
            });
            return {
                Component: ()=>{
                    // Add extra cache busting (DEV only) for https://github.com/vercel/next.js/issues/5860
                    // See also https://bugs.webkit.org/show_bug.cgi?id=187726
                    const cacheBustingUrlSuffix = dev ? `?ts=${Date.now()}` : "";
                    return /*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, preloadedFontFiles.map((fontFile)=>{
                        const ext = /\.(woff|woff2|eot|ttf|otf)$/.exec(fontFile)[1];
                        return /*#__PURE__*/ _react.default.createElement("link", {
                            key: fontFile,
                            rel: "preload",
                            href: `${assetPrefix}/_next/${fontFile}`,
                            as: "font",
                            type: `font/${ext}`,
                            crossOrigin: "anonymous"
                        });
                    }), stylesheets ? stylesheets.map((href, index)=>/*#__PURE__*/ _react.default.createElement("link", {
                            rel: "stylesheet",
                            href: `${assetPrefix}/_next/${href}${cacheBustingUrlSuffix}`,
                            // `Precedence` is an opt-in signal for React to handle
                            // resource loading and deduplication, etc:
                            // https://github.com/facebook/react/pull/25060
                            // @ts-ignore
                            precedence: "high",
                            key: index
                        })) : null, /*#__PURE__*/ _react.default.createElement(Component, Object.assign({}, props)));
                }
            };
        };
        const streamToBufferedResult = async (renderResult)=>{
            const renderChunks = [];
            const writable = new _stream.Writable({
                write (chunk, _encoding, callback) {
                    renderChunks.push(chunk);
                    callback();
                }
            });
            await renderResult.pipe(writable);
            return Buffer.concat(renderChunks).toString();
        };
        // Handle Flight render request. This is only used when client-side navigating. E.g. when you `router.push('/dashboard')` or `router.reload()`.
        const generateFlight = async ()=>{
            // TODO-APP: throw on invalid flightRouterState
            /**
       * Use router state to decide at what common layout to render the page.
       * This can either be the common layout between two pages or a specific place to start rendering from using the "refetch" marker in the tree.
       */ const walkTreeWithFlightRouterState = async ({ createSegmentPath , loaderTreeToFilter , parentParams , isFirst , flightRouterState , parentRendered  })=>{
                const [segment, parallelRoutes] = loaderTreeToFilter;
                const parallelRoutesKeys = Object.keys(parallelRoutes);
                // Because this function walks to a deeper point in the tree to start rendering we have to track the dynamic parameters up to the point where rendering starts
                const segmentParam = getDynamicParamFromSegment(segment);
                const currentParams = // Handle null case where dynamic param is optional
                segmentParam && segmentParam.value !== null ? {
                    ...parentParams,
                    [segmentParam.param]: segmentParam.value
                } : parentParams;
                const actualSegment = segmentParam ? segmentParam.treeSegment : segment;
                /**
         * Decide if the current segment is where rendering has to start.
         */ const renderComponentsOnThisLevel = // No further router state available
                !flightRouterState || // Segment in router state does not match current segment
                !(0, _matchSegments).matchSegment(actualSegment, flightRouterState[0]) || // Last item in the tree
                parallelRoutesKeys.length === 0 || // Explicit refresh
                flightRouterState[3] === "refetch";
                if (!parentRendered && renderComponentsOnThisLevel) {
                    return [
                        actualSegment,
                        // Create router state using the slice of the loaderTree
                        createFlightRouterStateFromLoaderTree(loaderTreeToFilter),
                        // Check if one level down from the common layout has a loading component. If it doesn't only provide the router state as part of the Flight data.
                        isPrefetch && !Boolean(loaderTreeToFilter[2].loading) ? null : _react.default.createElement((await createComponentTree(// This ensures flightRouterPath is valid and filters down the tree
                        {
                            createSegmentPath: (child)=>{
                                return createSegmentPath(child);
                            },
                            loaderTree: loaderTreeToFilter,
                            parentParams: currentParams,
                            firstItem: isFirst
                        })).Component), 
                    ];
                }
                // Walk through all parallel routes.
                for (const parallelRouteKey of parallelRoutesKeys){
                    const parallelRoute = parallelRoutes[parallelRouteKey];
                    const currentSegmentPath = isFirst ? [
                        parallelRouteKey
                    ] : [
                        actualSegment,
                        parallelRouteKey
                    ];
                    const path = await walkTreeWithFlightRouterState({
                        createSegmentPath: (child)=>{
                            return createSegmentPath([
                                ...currentSegmentPath,
                                ...child
                            ]);
                        },
                        loaderTreeToFilter: parallelRoute,
                        parentParams: currentParams,
                        flightRouterState: flightRouterState && flightRouterState[1][parallelRouteKey],
                        parentRendered: parentRendered || renderComponentsOnThisLevel,
                        isFirst: false
                    });
                    if (typeof path[path.length - 1] !== "string") {
                        return [
                            actualSegment,
                            parallelRouteKey,
                            ...path
                        ];
                    }
                }
                return [
                    actualSegment
                ];
            };
            // Flight data that is going to be passed to the browser.
            // Currently a single item array but in the future multiple patches might be combined in a single request.
            const flightData = [
                // TODO-APP: change walk to output without ''
                (await walkTreeWithFlightRouterState({
                    createSegmentPath: (child)=>child,
                    loaderTreeToFilter: loaderTree,
                    parentParams: {},
                    flightRouterState: providedFlightRouterState,
                    isFirst: true
                })).slice(1), 
            ];
            // For app dir, use the bundled version of Fizz renderer (renderToReadableStream)
            // which contains the subset React.
            const readable = ComponentMod.renderToReadableStream(flightData, serverComponentManifest, {
                context: serverContexts,
                onError: flightDataRendererErrorHandler
            }).pipeThrough((0, _nodeWebStreamsHelper).createBufferedTransformStream());
            return new FlightRenderResult(readable);
        };
        if (isFlight && !isStaticGeneration) {
            return generateFlight();
        }
        // Below this line is handling for rendering to HTML.
        // Create full component tree from root to leaf.
        const { Component: ComponentTree  } = await createComponentTree({
            createSegmentPath: (child)=>child,
            loaderTree: loaderTree,
            parentParams: {},
            firstItem: true
        });
        // AppRouter is provided by next-app-loader
        const AppRouter = ComponentMod.AppRouter;
        let serverComponentsInlinedTransformStream = new TransformStream();
        // TODO-APP: validate req.url as it gets passed to render.
        const initialCanonicalUrl = req.url;
        // Get the nonce from the incomming request if it has one.
        const csp = req.headers["content-security-policy"];
        let nonce;
        if (csp && typeof csp === "string") {
            nonce = getScriptNonceFromHeader(csp);
        }
        const serverComponentsRenderOpts = {
            transformStream: serverComponentsInlinedTransformStream,
            serverComponentManifest,
            serverContexts,
            rscChunks: []
        };
        const validateRootLayout = dev ? {
            validateRootLayout: {
                assetPrefix: renderOpts.assetPrefix,
                getTree: ()=>createFlightRouterStateFromLoaderTree(loaderTree)
            }
        } : {};
        const initialHead = await resolveHead(loaderTree, {});
        /**
     * A new React Component that renders the provided React Component
     * using Flight which can then be rendered to HTML.
     */ const ServerComponentsRenderer = createServerComponentRenderer(()=>{
            const initialTree = createFlightRouterStateFromLoaderTree(loaderTree);
            return /*#__PURE__*/ _react.default.createElement(AppRouter, {
                assetPrefix: assetPrefix,
                initialCanonicalUrl: initialCanonicalUrl,
                initialTree: initialTree,
                initialHead: initialHead
            }, /*#__PURE__*/ _react.default.createElement(ComponentTree, null));
        }, ComponentMod, serverComponentsRenderOpts, serverComponentsErrorHandler, nonce);
        const serverInsertedHTMLCallbacks = new Set();
        function InsertedHTML({ children  }) {
            // Reset addInsertedHtmlCallback on each render
            serverInsertedHTMLCallbacks.clear();
            const addInsertedHtml = _react.default.useCallback((handler)=>{
                serverInsertedHTMLCallbacks.add(handler);
            }, []);
            return /*#__PURE__*/ _react.default.createElement(_headManagerContext.HeadManagerContext.Provider, {
                value: {
                    appDir: true,
                    nonce
                }
            }, /*#__PURE__*/ _react.default.createElement(_serverInsertedHtml.ServerInsertedHTMLContext.Provider, {
                value: addInsertedHtml
            }, children));
        }
        const bodyResult = async ()=>{
            const polyfills = buildManifest.polyfillFiles.filter((polyfill)=>polyfill.endsWith(".js") && !polyfill.endsWith(".module.js")).map((polyfill)=>{
                return {
                    src: `${assetPrefix}/_next/${polyfill}`,
                    integrity: subresourceIntegrityManifest == null ? void 0 : subresourceIntegrityManifest[polyfill]
                };
            });
            const content = /*#__PURE__*/ _react.default.createElement(InsertedHTML, null, /*#__PURE__*/ _react.default.createElement(ServerComponentsRenderer, null));
            let polyfillsFlushed = false;
            const getServerInsertedHTML = ()=>{
                const flushed = renderToString(/*#__PURE__*/ _react.default.createElement(_react.default.Fragment, null, Array.from(serverInsertedHTMLCallbacks).map((callback)=>callback()), polyfillsFlushed ? null : polyfills == null ? void 0 : polyfills.map((polyfill)=>{
                    return /*#__PURE__*/ _react.default.createElement("script", {
                        key: polyfill.src,
                        src: polyfill.src,
                        integrity: polyfill.integrity,
                        noModule: true,
                        nonce: nonce
                    });
                })));
                polyfillsFlushed = true;
                return flushed;
            };
            try {
                const renderStream = await (0, _nodeWebStreamsHelper).renderToInitialStream({
                    ReactDOMServer: _serverBrowser.default,
                    element: content,
                    streamOptions: {
                        onError: htmlRendererErrorHandler,
                        nonce,
                        // Include hydration scripts in the HTML
                        bootstrapScripts: [
                            ...subresourceIntegrityManifest ? buildManifest.rootMainFiles.map((src)=>({
                                    src: `${assetPrefix}/_next/` + src,
                                    integrity: subresourceIntegrityManifest[src]
                                })) : buildManifest.rootMainFiles.map((src)=>`${assetPrefix}/_next/` + src), 
                        ]
                    }
                });
                const result = await (0, _nodeWebStreamsHelper).continueFromInitialStream(renderStream, {
                    dataStream: serverComponentsInlinedTransformStream == null ? void 0 : serverComponentsInlinedTransformStream.readable,
                    generateStaticHTML: isStaticGeneration || generateStaticHTML,
                    getServerInsertedHTML,
                    serverInsertedHTMLToHead: true,
                    ...validateRootLayout
                });
                return result;
            } catch (err) {
                const shouldNotIndex = err.digest === _notFound.NOT_FOUND_ERROR_CODE;
                if (err.digest === _notFound.NOT_FOUND_ERROR_CODE) {
                    res.statusCode = 404;
                }
                // TODO-APP: show error overlay in development. `element` should probably be wrapped in AppRouter for this case.
                const renderStream = await (0, _nodeWebStreamsHelper).renderToInitialStream({
                    ReactDOMServer: _serverBrowser.default,
                    element: /*#__PURE__*/ _react.default.createElement("html", {
                        id: "__next_error__"
                    }, /*#__PURE__*/ _react.default.createElement("head", null, shouldNotIndex ? /*#__PURE__*/ _react.default.createElement("meta", {
                        name: "robots",
                        content: "noindex"
                    }) : null), /*#__PURE__*/ _react.default.createElement("body", null)),
                    streamOptions: {
                        nonce,
                        // Include hydration scripts in the HTML
                        bootstrapScripts: subresourceIntegrityManifest ? buildManifest.rootMainFiles.map((src)=>({
                                src: `${assetPrefix}/_next/` + src,
                                integrity: subresourceIntegrityManifest[src]
                            })) : buildManifest.rootMainFiles.map((src)=>`${assetPrefix}/_next/` + src)
                    }
                });
                return await (0, _nodeWebStreamsHelper).continueFromInitialStream(renderStream, {
                    dataStream: serverComponentsInlinedTransformStream == null ? void 0 : serverComponentsInlinedTransformStream.readable,
                    generateStaticHTML: isStaticGeneration,
                    getServerInsertedHTML,
                    serverInsertedHTMLToHead: true,
                    ...validateRootLayout
                });
            }
        };
        const renderResult1 = new _renderResult.default(await bodyResult());
        if (isStaticGeneration) {
            const htmlResult = await streamToBufferedResult(renderResult1);
            // if we encountered any unexpected errors during build
            // we fail the prerendering phase and the build
            if (capturedErrors.length > 0) {
                throw capturedErrors[0];
            }
            // const before = Buffer.concat(
            //   serverComponentsRenderOpts.rscChunks
            // ).toString()
            // TODO-APP: derive this from same pass to prevent additional
            // render during static generation
            const filteredFlightData = await streamToBufferedResult(await generateFlight());
            renderOpts.pageData = filteredFlightData;
            renderOpts.revalidate = typeof (staticGenerationStore == null ? void 0 : staticGenerationStore.fetchRevalidate) === "undefined" ? defaultRevalidate : staticGenerationStore == null ? void 0 : staticGenerationStore.fetchRevalidate;
            return new _renderResult.default(htmlResult);
        }
        return renderResult1;
    };
    const initialStaticGenerationStore = {
        isStaticGeneration,
        inUse: true,
        pathname
    };
    const tryGetPreviewData = process.env.NEXT_RUNTIME === "edge" ? ()=>false : require("./api-utils/node").tryGetPreviewData;
    // Reads of this are cached on the `req` object, so this should resolve
    // instantly. There's no need to pass this data down from a previous
    // invoke, where we'd have to consider server & serverless.
    const previewData = tryGetPreviewData(req, res, renderOpts.previewProps);
    let cachedHeadersInstance;
    let cachedCookiesInstance;
    const requestStore = {
        get headers () {
            if (!cachedHeadersInstance) {
                cachedHeadersInstance = new ReadonlyHeaders(headersWithoutFlight(req.headers));
            }
            return cachedHeadersInstance;
        },
        get cookies () {
            if (!cachedCookiesInstance) {
                cachedCookiesInstance = new ReadonlyRequestCookies({
                    headers: {
                        get: (key)=>{
                            if (key !== "cookie") {
                                throw new Error("Only cookie header is supported");
                            }
                            return req.headers.cookie;
                        }
                    }
                });
            }
            return cachedCookiesInstance;
        },
        previewData
    };
    function handleRequestStoreRun(fn) {
        if ("getStore" in requestAsyncStorage) {
            return new Promise((resolve, reject)=>{
                requestAsyncStorage.run(requestStore, ()=>{
                    return Promise.resolve(fn()).then(resolve).catch(reject);
                });
            });
        } else {
            Object.assign(requestAsyncStorage, requestStore);
            return Promise.resolve(fn());
        }
    }
    function handleStaticGenerationStoreRun(fn) {
        if ("getStore" in staticGenerationAsyncStorage) {
            return new Promise((resolve, reject)=>{
                staticGenerationAsyncStorage.run(initialStaticGenerationStore, ()=>{
                    return Promise.resolve(fn()).then(resolve).catch(reject);
                });
            });
        } else {
            Object.assign(staticGenerationAsyncStorage, initialStaticGenerationStore);
            return Promise.resolve(fn()).finally(()=>{
                staticGenerationAsyncStorage.inUse = false;
            });
        }
    }
    return handleRequestStoreRun(()=>handleStaticGenerationStoreRun(()=>wrappedRender()));
}

//# sourceMappingURL=app-render.js.map