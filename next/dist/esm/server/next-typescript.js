/**
 * This is a TypeScript language service plugin for Next.js app directory,
 * it provides the following features:
 *
 * - Warns about disallowed React APIs in server components.
 * - Warns about disallowed layout and page exports.
 * - Autocompletion for entry configurations.
 * - Hover hint and docs for entry configurations.
 */ import path from "path";
const DISALLOWED_SERVER_REACT_APIS = [
    "useState",
    "useEffect",
    "useLayoutEffect",
    "useDeferredValue",
    "useImperativeHandle",
    "useInsertionEffect",
    "useReducer",
    "useRef",
    "useSyncExternalStore",
    "useTransition",
    "Component",
    "PureComponent",
    "createContext",
    "createFactory", 
];
const ALLOWED_EXPORTS = [
    "config",
    "generateStaticParams"
];
const API_DOCS = {
    dynamic: {
        description: "The `dynamic` option provides a few ways to opt in or out of dynamic behavior.",
        options: {
            '"auto"': "Heuristic to cache as much as possible but doesn\u2019t prevent any component to opt-in to dynamic behavior.",
            '"force-dynamic"': "This disables all caching of fetches and always revalidates. (This is equivalent to `getServerSideProps`.)",
            '"error"': "This errors if any dynamic Hooks or fetches are used. (This is equivalent to `getStaticProps`.)",
            '"force-static"': "This forces caching of all fetches and returns empty values from `useCookies`, `useHeaders` and `useSearchParams`."
        }
    },
    fetchCache: {
        description: "The `fetchCache` option controls how Next.js statically caches fetches. By default it statically caches fetches reachable before any dynamic Hooks are used, and it doesn\u2019t cache fetches that are discovered after that.",
        options: {
            '"force-no-store"': "This lets you intentionally opt-out of all caching of data. This option forces all fetches to be refetched every request even if the `cache: 'force-cache'` option is passed to `fetch()`.",
            '"only-no-store"': "This lets you enforce that all data opts out of caching. This option makes `fetch()` reject with an error if `cache: 'force-cache'` is provided. It also changes the default to `no-store`.",
            '"default-no-store"': "Allows any explicit `cache` option to be passed to `fetch()` but if `'default'`, or no option, is provided then it defaults to `'no-store'`. This means that even fetches before a dynamic Hook are considered dynamic.",
            '"auto"': "This is the default option. It caches any fetches with the default `cache` option provided, that happened before a dynamic Hook is used and don\u2019t cache any such fetches if they\u2019re issued after a dynamic Hook.",
            '"default-cache"': "Allows any explicit `cache` option to be passed to `fetch()` but if `'default'`, or no option, is provided then it defaults to `'force-cache'`. This means that even fetches before a dynamic Hook are considered dynamic.",
            '"only-cache"': "This lets you enforce that all data opts into caching. This option makes `fetch()` reject with an error if `cache: 'force-cache'` is provided. It also changes the default to `force-cache`. This error can be discovered early during static builds - or dynamically during Edge rendering.",
            '"force-cache"': "This lets you intentionally opt-in to all caching of data. This option forces all fetches to be cache even if the `cache: 'no-store'` option is passed to `fetch()`."
        }
    },
    preferredRegion: {
        description: 'Specify the perferred region that this layout or page should be deployed to. If the region option is not specified, it inherits the option from the nearest parent layout. The root defaults to `"auto"`.',
        options: {
            '"auto"': 'Next.js will first deploy to the `"home"` region. Then if it doesn\u2019t detect any waterfall requests after a few requests, it can upgrade that route, to be deployed globally to `"edge"`. If it detects any waterfall requests after that, it can eventually downgrade back to `"home`".',
            '"home"': "Prefer deploying to the Home region.",
            '"edge"': "Prefer deploying to the Edge globally."
        }
    },
    revalidate: {
        description: "The `revalidate` option sets the default revalidation time for that layout or page. Note that it doesn\u2019t override the value specify by each `fetch()`.",
        type: "mixed",
        options: {
            false: "This is the default and changes the fetch cache to indefinitely cache anything that uses force-cache or is fetched before a dynamic Hook/fetch.",
            0: "Specifying `0` implies that this layout or page should never be static.",
            30: "Set the revalidation time to `30` seconds. The value can be `0` or any positive number."
        },
        isValid: (value)=>{
            return value === "false" || Number(value) >= 0;
        },
        getHint: (value)=>{
            return `Set the default revalidation time to \`${value}\` seconds.`;
        }
    },
    dynamicParams: {
        description: "`dynamicParams` replaces the `fallback` option of `getStaticPaths`. It controls whether we allow `dynamicParams` beyond the generated static params from `generateStaticParams`.",
        options: {
            true: "Allow rendering dynamic params that are not generated by `generateStaticParams`.",
            false: "Disallow rendering dynamic params that are not generated by `generateStaticParams`."
        }
    },
    runtime: {
        description: "The `runtime` option controls the preferred runtime to render this route.",
        options: {
            '"nodejs"': "Prefer the Node.js runtime.",
            '"experimental-edge"': "Prefer the experimental Edge runtime."
        }
    }
};
function getAPIDescription(api) {
    return API_DOCS[api].description + "\n\n" + Object.entries(API_DOCS[api].options).map(([key, value])=>`- \`${key}\`: ${value}`).join("\n");
}
function removeStringQuotes(str) {
    return str.replace(/^['"`]|['"`]$/g, "");
}
export function createTSPlugin(modules) {
    const ts = modules.typescript;
    function createAutoCompletionOptionName(sort, name) {
        return {
            name,
            sortText: "" + sort,
            kind: ts.ScriptElementKind.unknown,
            kindModifiers: ts.ScriptElementKindModifier.exportedModifier,
            labelDetails: {
                description: `Next.js ${name} option`
            },
            data: {
                exportName: name,
                moduleSpecifier: "next/typescript/entry_option_name"
            }
        };
    }
    function createAutoCompletionOptionValue(sort, name, apiName) {
        const isString = name.startsWith('"');
        return {
            name,
            insertText: removeStringQuotes(name),
            sortText: "" + sort,
            kind: isString ? ts.ScriptElementKind.string : ts.ScriptElementKind.unknown,
            kindModifiers: ts.ScriptElementKindModifier.none,
            labelDetails: {
                description: `Next.js ${apiName} option`
            },
            data: {
                exportName: apiName,
                moduleSpecifier: "next/typescript/entry_option_value"
            }
        };
    }
    function create(info) {
        const appDir = path.join(info.project.getCurrentDirectory(), "app");
        const isAppEntryFile = (filePath)=>{
            return filePath.startsWith(appDir) && /(page|layout)\.(mjs|js|jsx|ts|tsx)$/.test(path.basename(filePath));
        };
        function getIsClientEntry(fileName) {
            var ref;
            const source = (ref = info.languageService.getProgram()) == null ? void 0 : ref.getSourceFile(fileName);
            if (source) {
                let isClientEntry = false;
                let isDirective = true;
                ts.forEachChild(source, (node)=>{
                    if (isClientEntry || !isDirective) return;
                    if (isDirective && ts.isExpressionStatement(node)) {
                        if (ts.isStringLiteral(node.expression)) {
                            if (node.expression.text === "use client") {
                                isClientEntry = true;
                            }
                        }
                    } else {
                        isDirective = false;
                    }
                });
                return isClientEntry;
            }
            return false;
        }
        function visitEntryConfig(fileName, position, callback) {
            var ref1;
            const source = (ref1 = info.languageService.getProgram()) == null ? void 0 : ref1.getSourceFile(fileName);
            if (source) {
                ts.forEachChild(source, function visit(node) {
                    // Covered by this node
                    if (node.getFullStart() <= position && position <= node.getFullStart() + node.getFullWidth()) {
                        var ref;
                        // Export variable
                        if (ts.isVariableStatement(node) && ((ref = node.modifiers) == null ? void 0 : ref.some((m)=>m.kind === ts.SyntaxKind.ExportKeyword))) {
                            if (ts.isVariableDeclarationList(node.declarationList)) {
                                for (const declarartion of node.declarationList.declarations){
                                    if (declarartion.getFullStart() <= position && position <= declarartion.getFullStart() + declarartion.getFullWidth()) {
                                        // `export const ... = ...`
                                        const text = declarartion.name.getText();
                                        callback(text, declarartion);
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
        function log(message) {
            info.project.projectService.logger.info(message);
        }
        log("Starting Next.js TypeScript plugin: " + appDir);
        // Set up decorator object
        const proxy = Object.create(null);
        for (let k of Object.keys(info.languageService)){
            const x = info.languageService[k];
            proxy[k] = (...args)=>x.apply(info.languageService, args);
        }
        // Auto completion
        proxy.getCompletionsAtPosition = (fileName, position, options)=>{
            let prior = info.languageService.getCompletionsAtPosition(fileName, position, options) || {
                isGlobalCompletion: false,
                isMemberCompletion: false,
                isNewIdentifierLocation: false,
                entries: []
            };
            if (!isAppEntryFile(fileName)) return prior;
            // Remove specified entries from completion list if it's a server entry.
            if (!getIsClientEntry(fileName)) {
                prior.entries = prior.entries.filter((e)=>{
                    // Remove disallowed React APIs.
                    if (DISALLOWED_SERVER_REACT_APIS.includes(e.name) && e.kindModifiers === "declare") {
                        return false;
                    }
                    return true;
                });
            }
            // Auto completion for entry exported configs.
            visitEntryConfig(fileName, position, (entryConfig, declarartion)=>{
                if (!API_DOCS[entryConfig]) {
                    if (declarartion.name.getFullStart() <= position && position <= declarartion.name.getFullStart() + declarartion.name.getFullWidth()) {
                        prior.entries = [
                            ...prior.entries,
                            ...Object.keys(API_DOCS).map((name, index)=>{
                                return createAutoCompletionOptionName(index, name);
                            }), 
                        ];
                    }
                    return;
                }
                prior.entries = [
                    ...prior.entries,
                    ...Object.keys(API_DOCS[entryConfig].options).map((name, index)=>{
                        return createAutoCompletionOptionValue(index, name, entryConfig);
                    }), 
                ];
            });
            return prior;
        };
        // Show auto completion details
        proxy.getCompletionEntryDetails = (fileName, position, entryName, formatOptions, source, preferences, data)=>{
            if (data && data.moduleSpecifier && data.moduleSpecifier.startsWith("next/typescript")) {
                let content = "";
                if (data.moduleSpecifier === "next/typescript/entry_option_name") {
                    content = getAPIDescription(entryName);
                } else {
                    content = API_DOCS[data.exportName].options[entryName];
                }
                return {
                    name: entryName,
                    kind: ts.ScriptElementKind.enumElement,
                    kindModifiers: ts.ScriptElementKindModifier.none,
                    displayParts: [],
                    documentation: [
                        {
                            kind: "text",
                            text: content
                        }, 
                    ]
                };
            }
            const prior = info.languageService.getCompletionEntryDetails(fileName, position, entryName, formatOptions, source, preferences, data);
            return prior;
        };
        // Quick info
        proxy.getQuickInfoAtPosition = (fileName, position)=>{
            const prior = info.languageService.getQuickInfoAtPosition(fileName, position);
            if (!isAppEntryFile(fileName)) return prior;
            // Remove type suggestions for disallowed APIs in server components.
            if (!getIsClientEntry(fileName)) {
                const definitions = info.languageService.getDefinitionAtPosition(fileName, position);
                if (definitions == null ? void 0 : definitions.some((d)=>DISALLOWED_SERVER_REACT_APIS.includes(d.name) && d.containerName === "React")) {
                    return;
                }
            }
            let overriden;
            visitEntryConfig(fileName, position, (entryConfig, declarartion)=>{
                if (!API_DOCS[entryConfig]) return;
                const name = declarartion.name;
                const value = declarartion.initializer;
                if (value && value.getFullStart() <= position && value.getFullStart() + value.getFullWidth() >= position) {
                    var _entryConfig, ref;
                    // Hovers the value of the config
                    const isString = ts.isStringLiteral(value);
                    const text = removeStringQuotes(value.getText());
                    const key = isString ? `"${text}"` : text;
                    const isValid = API_DOCS[entryConfig].isValid ? (ref = (_entryConfig = API_DOCS[entryConfig]).isValid) == null ? void 0 : ref.call(_entryConfig, key) : !!API_DOCS[entryConfig].options[key];
                    if (isValid) {
                        var _entryConfig1, ref2;
                        overriden = {
                            kind: ts.ScriptElementKind.enumElement,
                            kindModifiers: ts.ScriptElementKindModifier.none,
                            textSpan: {
                                start: value.getStart(),
                                length: value.getWidth()
                            },
                            displayParts: [],
                            documentation: [
                                {
                                    kind: "text",
                                    text: API_DOCS[entryConfig].options[key] || ((ref2 = (_entryConfig1 = API_DOCS[entryConfig]).getHint) == null ? void 0 : ref2.call(_entryConfig1, key)) || ""
                                }, 
                            ]
                        };
                    }
                } else {
                    // Hovers the name of the config
                    if (API_DOCS[entryConfig]) {
                        overriden = {
                            kind: ts.ScriptElementKind.enumElement,
                            kindModifiers: ts.ScriptElementKindModifier.none,
                            textSpan: {
                                start: name.getStart(),
                                length: name.getWidth()
                            },
                            displayParts: [],
                            documentation: [
                                {
                                    kind: "text",
                                    text: getAPIDescription(entryConfig)
                                }, 
                            ]
                        };
                    }
                }
            });
            if (overriden) return overriden;
            return prior;
        };
        // Show errors for disallowed imports
        proxy.getSemanticDiagnostics = (fileName)=>{
            var ref5;
            const prior = info.languageService.getSemanticDiagnostics(fileName);
            if (!isAppEntryFile(fileName)) return prior;
            const source = (ref5 = info.languageService.getProgram()) == null ? void 0 : ref5.getSourceFile(fileName);
            if (source) {
                const isClientEntry = getIsClientEntry(fileName);
                ts.forEachChild(source, (node)=>{
                    var ref;
                    if (ts.isImportDeclaration(node)) {
                        if (!isClientEntry) {
                            const importPath = node.moduleSpecifier.getText(source);
                            if (importPath === "'react'" || importPath === '"react"') {
                                // Check if it imports "useState"
                                const importClause = node.importClause;
                                if (importClause) {
                                    const namedBindings = importClause.namedBindings;
                                    if (namedBindings && ts.isNamedImports(namedBindings)) {
                                        const elements = namedBindings.elements;
                                        for (const element of elements){
                                            const name = element.name.getText(source);
                                            if (DISALLOWED_SERVER_REACT_APIS.includes(name)) {
                                                prior.push({
                                                    file: source,
                                                    category: ts.DiagnosticCategory.Error,
                                                    code: 71001,
                                                    messageText: `"${name}" is not allowed in Server Components.`,
                                                    start: element.name.getStart(),
                                                    length: element.name.getEnd() - element.name.getStart()
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } else if (ts.isVariableStatement(node) && ((ref = node.modifiers) == null ? void 0 : ref.some((m)=>m.kind === ts.SyntaxKind.ExportKeyword))) {
                        if (ts.isVariableDeclarationList(node.declarationList)) {
                            for (const declarartion of node.declarationList.declarations){
                                const name = declarartion.name;
                                if (ts.isIdentifier(name)) {
                                    if (!ALLOWED_EXPORTS.includes(name.text) && !API_DOCS[name.text]) {
                                        prior.push({
                                            file: source,
                                            category: ts.DiagnosticCategory.Error,
                                            code: 71002,
                                            messageText: `"${name.text}" is not a valid Next.js entry export value.`,
                                            start: name.getStart(),
                                            length: name.getEnd() - name.getStart()
                                        });
                                    } else if (API_DOCS[name.text]) {
                                        // Check if the value is valid
                                        const value = declarartion.initializer;
                                        if (value) {
                                            let displayedValue = "";
                                            let errorMessage = "";
                                            let isInvalid = false;
                                            if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
                                                const text = removeStringQuotes(value.getText());
                                                const allowedValues = Object.keys(API_DOCS[name.text].options).filter((v)=>/^['"]/.test(v)).map(removeStringQuotes);
                                                if (!allowedValues.includes(text)) {
                                                    isInvalid = true;
                                                    displayedValue = `'${text}'`;
                                                }
                                            } else if (ts.isNumericLiteral(value) || ts.isPrefixUnaryExpression(value) && ts.isMinusToken(value.operator) && (ts.isNumericLiteral(value.operand.kind) || ts.isIdentifier(value.operand.kind) && value.operand.kind.getText() === "Infinity") || ts.isIdentifier(value) && value.getText() === "Infinity") {
                                                var _text, ref3;
                                                const v = value.getText();
                                                if (((ref3 = (_text = API_DOCS[name.text]).isValid) == null ? void 0 : ref3.call(_text, v)) === false) {
                                                    isInvalid = true;
                                                    displayedValue = v;
                                                }
                                            } else if (value.kind === ts.SyntaxKind.TrueKeyword || value.kind === ts.SyntaxKind.FalseKeyword) {
                                                var _text1, ref4;
                                                const v = value.getText();
                                                if (((ref4 = (_text1 = API_DOCS[name.text]).isValid) == null ? void 0 : ref4.call(_text1, v)) === false) {
                                                    isInvalid = true;
                                                    displayedValue = v;
                                                }
                                            } else if (// Other literals
                                            ts.isBigIntLiteral(value) || ts.isArrayLiteralExpression(value) || ts.isObjectLiteralExpression(value) || ts.isRegularExpressionLiteral(value)) {
                                                isInvalid = true;
                                                displayedValue = value.getText();
                                            } else {
                                                // Not a literal, error because it's not statically analyzable
                                                isInvalid = true;
                                                displayedValue = value.getText();
                                                errorMessage = `"${displayedValue}" is not a valid value for the "${name.text}" option. The configuration must be statically analyzable.`;
                                            }
                                            if (isInvalid) {
                                                prior.push({
                                                    file: source,
                                                    category: ts.DiagnosticCategory.Error,
                                                    code: 71003,
                                                    messageText: errorMessage || `"${displayedValue}" is not a valid value for the "${name.text}" option.`,
                                                    start: value.getStart(),
                                                    length: value.getEnd() - value.getStart()
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
            return prior;
        };
        return proxy;
    }
    return {
        create
    };
}

//# sourceMappingURL=next-typescript.js.map