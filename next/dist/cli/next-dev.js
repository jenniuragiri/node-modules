#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.nextDev = void 0;
var _indexJs = _interopRequireDefault(require("next/dist/compiled/arg/index.js"));
var _fs = require("fs");
var _startServer = require("../server/lib/start-server");
var _utils = require("../server/lib/utils");
var Log = _interopRequireWildcard(require("../build/output/log"));
var _output = require("../build/output");
var _isError = _interopRequireDefault(require("../lib/is-error"));
var _getProjectDir = require("../lib/get-project-dir");
var _constants = require("../shared/lib/constants");
var _path = _interopRequireDefault(require("path"));
var _shared = require("../trace/shared");
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
let isTurboSession = false;
let sessionStopHandled = false;
let sessionStarted = Date.now();
const handleSessionStop = async ()=>{
    if (sessionStopHandled) return;
    sessionStopHandled = true;
    const { eventCliSession  } = require("../telemetry/events/session-stopped");
    const telemetry = _shared.traceGlobals.get("telemetry");
    if (!telemetry) {
        process.exit(0);
    }
    telemetry.record(eventCliSession({
        cliCommand: "dev",
        turboFlag: isTurboSession,
        durationMilliseconds: Date.now() - sessionStarted,
        pagesDir: !!_shared.traceGlobals.get("pagesDir"),
        appDir: !!_shared.traceGlobals.get("appDir")
    }));
    await telemetry.flush();
    process.exit(0);
};
process.on("SIGINT", handleSessionStop);
process.on("SIGTERM", handleSessionStop);
const nextDev = (argv)=>{
    const validArgs = {
        // Types
        "--help": Boolean,
        "--port": Number,
        "--hostname": String,
        "--turbo": Boolean,
        // To align current messages with native binary.
        // Will need to adjust subcommand later.
        "--show-all": Boolean,
        "--root": String,
        // Aliases
        "-h": "--help",
        "-p": "--port",
        "-H": "--hostname"
    };
    let args;
    try {
        args = (0, _indexJs).default(validArgs, {
            argv
        });
    } catch (error) {
        if ((0, _isError).default(error) && error.code === "ARG_UNKNOWN_OPTION") {
            return (0, _utils).printAndExit(error.message, 1);
        }
        throw error;
    }
    if (args["--help"]) {
        console.log(`
      Description
        Starts the application in development mode (hot-code reloading, error
        reporting, etc.)

      Usage
        $ next dev <dir> -p <port number>

      <dir> represents the directory of the Next.js application.
      If no directory is provided, the current directory will be used.

      Options
        --port, -p      A port number on which to start the application
        --hostname, -H  Hostname on which to start the application (default: 0.0.0.0)
        --help, -h      Displays this message
    `);
        process.exit(0);
    }
    const dir = (0, _getProjectDir).getProjectDir(args._[0]);
    // Check if pages dir exists and warn if not
    if (!(0, _fs).existsSync(dir)) {
        (0, _utils).printAndExit(`> No such directory exists as the project root: ${dir}`);
    }
    async function preflight() {
        const { getPackageVersion  } = await Promise.resolve(require("../lib/get-package-version"));
        const [sassVersion, nodeSassVersion] = await Promise.all([
            getPackageVersion({
                cwd: dir,
                name: "sass"
            }),
            getPackageVersion({
                cwd: dir,
                name: "node-sass"
            }), 
        ]);
        if (sassVersion && nodeSassVersion) {
            Log.warn("Your project has both `sass` and `node-sass` installed as dependencies, but should only use one or the other. " + "Please remove the `node-sass` dependency from your project. " + " Read more: https://nextjs.org/docs/messages/duplicate-sass");
        }
    }
    const port = (0, _utils).getPort(args);
    // If neither --port nor PORT were specified, it's okay to retry new ports.
    const allowRetry = args["--port"] === undefined && process.env.PORT === undefined;
    // We do not set a default host value here to prevent breaking
    // some set-ups that rely on listening on other interfaces
    const host = args["--hostname"];
    const devServerOptions = {
        allowRetry,
        dev: true,
        dir,
        hostname: host,
        isNextDevCommand: true,
        port
    };
    if (args["--turbo"]) {
        isTurboSession = true;
        // check for postcss, babelrc, swc plugins
        return new Promise(async (resolve)=>{
            const { findConfigPath  } = require("../lib/find-config");
            const { loadBindings  } = require("../build/swc");
            const { getPkgManager  } = require("../lib/helpers/get-pkg-manager");
            const { getBabelConfigFile  } = require("../build/webpack-config");
            const { defaultConfig  } = require("../server/config-shared");
            const { default: loadConfig  } = require("../server/config");
            const { PHASE_DEVELOPMENT_SERVER  } = require("../shared/lib/constants");
            const chalk = require("next/dist/compiled/chalk");
            const { eventCliSession  } = require("../telemetry/events/version");
            const { findPagesDir  } = require("../lib/find-pages-dir");
            const { interopDefault  } = require("../lib/interop-default");
            const { setGlobal  } = require("../trace");
            const { Telemetry  } = require("../telemetry/storage");
            // To regenerate the TURBOPACK gradient require('gradient-string')('blue', 'red')('>>> TURBOPACK')
            const isTTY = process.stdout.isTTY;
            const turbopackGradient = `${chalk.bold(isTTY ? "\x1b[38;2;0;0;255m>\x1b[39m\x1b[38;2;23;0;232m>\x1b[39m\x1b[38;2;46;0;209m>\x1b[39m \x1b[38;2;70;0;185mT\x1b[39m\x1b[38;2;93;0;162mU\x1b[39m\x1b[38;2;116;0;139mR\x1b[39m\x1b[38;2;139;0;116mB\x1b[39m\x1b[38;2;162;0;93mO\x1b[39m\x1b[38;2;185;0;70mP\x1b[39m\x1b[38;2;209;0;46mA\x1b[39m\x1b[38;2;232;0;23mC\x1b[39m\x1b[38;2;255;0;0mK\x1b[39m" : ">>> TURBOPACK")} ${chalk.dim("(alpha)")}\n\n`;
            let thankYouMsg = `Thank you for trying Next.js v13 with Turbopack! As a reminder,\nTurbopack is currently in alpha and not yet ready for production.\nWe appreciate your ongoing support as we work to make it ready\nfor everyone.\n`;
            let unsupportedParts = "";
            // TODO: warning for postcss mentioning sidecar
            let babelrc = await getBabelConfigFile(dir);
            if (babelrc) babelrc = _path.default.basename(babelrc);
            const rawNextConfig = interopDefault(await loadConfig(PHASE_DEVELOPMENT_SERVER, dir, undefined, true));
            const checkUnsupportedCustomConfig = (configKey = "", parentUserConfig, parentDefaultConfig)=>{
                // these should not error
                if (configKey === "serverComponentsExternalPackages" || configKey === "appDir" || configKey === "transpilePackages" || configKey === "reactStrictMode" || configKey === "swcMinify" || configKey === "configFileName") {
                    return false;
                }
                let userValue = parentUserConfig[configKey];
                let defaultValue = parentDefaultConfig[configKey];
                if (typeof defaultValue !== "object") {
                    return defaultValue !== userValue;
                }
                return Object.keys(userValue || {}).some((key)=>{
                    return checkUnsupportedCustomConfig(key, userValue, defaultValue);
                });
            };
            const hasNonDefaultConfig = Object.keys(rawNextConfig).some((key)=>checkUnsupportedCustomConfig(key, rawNextConfig, defaultConfig));
            const findUp = require("next/dist/compiled/find-up");
            const packagePath1 = findUp.sync("package.json", {
                cwd: dir
            });
            let hasSideCar = false;
            if (packagePath1) {
                const pkgData = require(packagePath1);
                hasSideCar = Object.values(pkgData.scripts || {}).some((script)=>script.includes("tailwind") || script.includes("postcss"));
            }
            let postcssFile = !hasSideCar && await findConfigPath(dir, "postcss");
            let tailwindFile = !hasSideCar && await findConfigPath(dir, "tailwind");
            if (postcssFile) postcssFile = _path.default.basename(postcssFile);
            if (tailwindFile) tailwindFile = _path.default.basename(tailwindFile);
            const hasWarningOrError = tailwindFile || postcssFile || babelrc || hasNonDefaultConfig;
            if (!hasWarningOrError) {
                thankYouMsg = chalk.dim(thankYouMsg);
            }
            console.log(turbopackGradient + thankYouMsg);
            let feedbackMessage = `Learn more about Next.js v13 and Turbopack: ${chalk.underline("https://nextjs.link/with-turbopack")}\nPlease direct feedback to: ${chalk.underline("https://nextjs.link/turbopack-feedback")}\n`;
            if (!hasWarningOrError) {
                feedbackMessage = chalk.dim(feedbackMessage);
            }
            if (babelrc) {
                unsupportedParts += `\n- Babel detected (${chalk.cyan(babelrc)})\n  ${chalk.dim(`Babel is not yet supported. To use Turbopack at the moment,\n  you'll need to remove your usage of Babel.`)}`;
            }
            if (hasNonDefaultConfig) {
                unsupportedParts += `\n\n- Unsupported Next.js configuration option(s) (${chalk.cyan("next.config.js")})\n  ${chalk.dim(`The only configurations options supported are:\n    - ${chalk.cyan("experimental.serverComponentsExternalPackages")}\n    - ${chalk.cyan("experimental.transpilePackages")}\n  To use Turbopack, remove other configuration options.`)}   `;
            }
            if (postcssFile || tailwindFile) {
                console.warn(`${chalk.bold.yellow("Warning:")} You are using configuration that may require additional\nsetup with Turbopack. If you already made these changes please\nignore this warning.\n`);
            }
            if (postcssFile) {
                console.warn(`- PostCSS detected (${chalk.cyan(postcssFile)})\n` + `  ${chalk.dim("PostCSS is not yet supported by Next.js v13 with Turbopack.\n  To use with Turbopack, see: https://nextjs.link/turbopack-postcss")}\n`);
            }
            if (tailwindFile) {
                console.warn(`- Tailwind detected (${chalk.cyan(tailwindFile)})\n` + `  ${chalk.dim("Tailwind is not yet supported by Next.js v13 with Turbopack.\n  To use with Turbopack, see: https://nextjs.link/turbopack-tailwind")}\n`);
            }
            if (unsupportedParts) {
                const pkgManager = getPkgManager(dir);
                console.error(`${chalk.bold.red("Error:")} You are using configuration and/or tools that are not yet\nsupported by Next.js v13 with Turbopack:\n${unsupportedParts}\n
If you cannot make the changes above, but still want to try out\nNext.js v13 with Turbopack, create the Next.js v13 playground app\nby running the following commands:

  ${chalk.bold.cyan(`${pkgManager === "npm" ? "npx create-next-app" : `${pkgManager} create next-app`} --example with-turbopack with-turbopack-app`)}\n  cd with-turbopack-app\n  ${pkgManager} run dev
        `);
                console.warn(feedbackMessage);
                process.exit(1);
            }
            console.log(feedbackMessage);
            return loadBindings().then(async (bindings)=>{
                var ref, ref1;
                const distDir = _path.default.join(dir, rawNextConfig.distDir || ".next");
                const { pagesDir , appDir  } = findPagesDir(dir, !!((ref = rawNextConfig.experimental) == null ? void 0 : ref.appDir));
                const telemetry = new Telemetry({
                    distDir
                });
                setGlobal("appDir", appDir);
                setGlobal("pagesDir", pagesDir);
                setGlobal("telemetry", telemetry);
                telemetry.record(eventCliSession(distDir, rawNextConfig, {
                    webpackVersion: 5,
                    cliCommand: "dev",
                    isSrcDir: !!pagesDir && _path.default.relative(dir, pagesDir).startsWith("src") || !!appDir && _path.default.relative(dir, appDir).startsWith("src"),
                    hasNowJson: !!await findUp("now.json", {
                        cwd: dir
                    }),
                    isCustomServer: false,
                    turboFlag: true,
                    pagesDir: !!pagesDir,
                    appDir: !!appDir
                }));
                const turboJson = findUp.sync("turbo.json", {
                    cwd: dir
                });
                // eslint-disable-next-line no-shadow
                const packagePath = findUp.sync("package.json", {
                    cwd: dir
                });
                let server = bindings.turbo.startDev({
                    ...devServerOptions,
                    showAll: args["--show-all"] ?? false,
                    rootDir: args["--root"] ?? (turboJson ? _path.default.dirname(turboJson) : packagePath ? _path.default.dirname(packagePath) : undefined),
                    serverComponentsExternalPackages: (ref1 = rawNextConfig.experimental) == null ? void 0 : ref1.serverComponentsExternalPackages
                });
                // Start preflight after server is listening and ignore errors:
                preflight().catch(()=>{});
                await telemetry.flush();
                return server;
            }).then(()=>{
                resolve();
            }, (err)=>{
                console.error(err);
            });
        });
    } else {
        (0, _startServer).startServer(devServerOptions).then(async (app)=>{
            const appUrl = `http://${app.hostname}:${app.port}`;
            (0, _output).startedDevelopmentServer(appUrl, `${host || "0.0.0.0"}:${app.port}`);
            // Start preflight after server is listening and ignore errors:
            preflight().catch(()=>{});
            // Finalize server bootup:
            await app.prepare();
        }).catch((err)=>{
            if (err.code === "EADDRINUSE") {
                let errorMessage = `Port ${port} is already in use.`;
                const pkgAppPath = require("next/dist/compiled/find-up").sync("package.json", {
                    cwd: dir
                });
                const appPackage = require(pkgAppPath);
                if (appPackage.scripts) {
                    const nextScript = Object.entries(appPackage.scripts).find((scriptLine)=>scriptLine[1] === "next");
                    if (nextScript) {
                        errorMessage += `\nUse \`npm run ${nextScript[0]} -- -p <some other port>\`.`;
                    }
                }
                console.error(errorMessage);
            } else {
                console.error(err);
            }
            process.nextTick(()=>process.exit(1));
        });
    }
    for (const CONFIG_FILE of _constants.CONFIG_FILES){
        (0, _fs).watchFile(_path.default.join(dir, CONFIG_FILE), (cur, prev)=>{
            if (cur.size > 0 || prev.size > 0) {
                console.log(`\n> Found a change in ${CONFIG_FILE}. Restart the server to see the changes in effect.`);
            }
        });
    }
};
exports.nextDev = nextDev;

//# sourceMappingURL=next-dev.js.map