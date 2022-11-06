import { readFileSync } from "fs";
import * as path from "path";
import { getBabelError } from "./parseBabel";
import { getCssError } from "./parseCss";
import { getScssError } from "./parseScss";
import { getNotFoundError, getImageError } from "./parseNotFoundError";
import isError from "../../../../lib/is-error";
import { getRscError } from "./parseRSC";
function getFileData(compilation, m) {
    var ref;
    let resolved;
    let ctx = ((ref = compilation.compiler) == null ? void 0 : ref.context) ?? null;
    if (ctx !== null && typeof m.resource === "string") {
        const res = path.relative(ctx, m.resource).replace(/\\/g, path.posix.sep);
        resolved = res.startsWith(".") ? res : `.${path.posix.sep}${res}`;
    } else {
        const requestShortener = compilation.requestShortener;
        if (typeof (m == null ? void 0 : m.readableIdentifier) === "function") {
            resolved = m.readableIdentifier(requestShortener);
        } else {
            resolved = m.request ?? m.userRequest;
        }
    }
    if (resolved) {
        let content = null;
        try {
            content = readFileSync(ctx ? path.resolve(ctx, resolved) : resolved, "utf8");
        } catch  {}
        return [
            resolved,
            content
        ];
    }
    return [
        "<unknown>",
        null
    ];
}
export async function getModuleBuildError(compiler, compilation, input) {
    if (!(typeof input === "object" && ((input == null ? void 0 : input.name) === "ModuleBuildError" || (input == null ? void 0 : input.name) === "ModuleNotFoundError") && Boolean(input.module) && isError(input.error))) {
        return false;
    }
    const err = input.error;
    const [sourceFilename, sourceContent] = getFileData(compilation, input.module);
    const notFoundError = await getNotFoundError(compilation, input, sourceFilename);
    if (notFoundError !== false) {
        return notFoundError;
    }
    const imageError = await getImageError(compilation, input, err);
    if (imageError !== false) {
        return imageError;
    }
    const babel = getBabelError(sourceFilename, err);
    if (babel !== false) {
        return babel;
    }
    const css = getCssError(sourceFilename, err);
    if (css !== false) {
        return css;
    }
    const scss = getScssError(sourceFilename, sourceContent, err);
    if (scss !== false) {
        return scss;
    }
    const rsc = getRscError(sourceFilename, err, input.module, compilation, compiler);
    if (rsc !== false) {
        return rsc;
    }
    return false;
}

//# sourceMappingURL=webpackModuleError.js.map