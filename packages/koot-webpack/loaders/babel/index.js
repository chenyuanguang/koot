module.exports = require('babel-loader').custom(babel => {
    // function myPlugin() {
    //     return {
    //         visitor: {},
    //     };
    // }
    const customOptions = {};

    return {
        // Passed the loader options.
        customOptions({ __createDll, __react, __typescript, ...loader }) {
            Object.assign(customOptions, {
                __createDll,
                __react,
                __typescript
            });
            // Pull out any custom options that the loader might have.
            return {
                // Pass the options back with the two custom options removed.
                loader
            };
        },

        // Passed Babel's 'PartialConfig' object.
        config(cfg) {
            // if (cfg.hasFilesystemConfig()) {
            //     // Use the normal config
            //     return cfg.options;
            // }

            const {
                __createDll,
                __react,
                __typescript = false
            } = customOptions;
            const { presets, plugins, ...options } = cfg.options;
            // console.log({ options })

            const newPresets = [...presets];
            if (__typescript) {
                newPresets.push([
                    require('@babel/preset-typescript').default,
                    __react
                        ? {
                              isTSX: true,
                              allExtensions: true
                          }
                        : {}
                ]);
                // console.log(newPresets);
            }
            // .filter(preset => {
            //     if (typeof preset.file === 'object' &&
            //         /^@babel\/preset-env$/.test(preset.file.request) &&
            //         process.env.WEBPACK_BUILD_STAGE === 'server'
            //     ) return false
            //     return true
            // })
            // .map(preset => {
            //     if (typeof preset.file === 'object' &&
            //         /^@babel\/preset-env$/.test(preset.file.request)
            //     ) {
            //         if (!preset.options)
            //             preset.options = {}
            //         return preset
            //     }
            //     return preset
            // })

            const newPlugins = plugins.filter(
                plugin =>
                    !(
                        typeof plugin.file === 'object' &&
                        (/extract-hoc(\/|\\)babel/.test(plugin.file.request) ||
                            /react-hot-loader(\/|\\)babel/.test(
                                plugin.file.request
                            ))
                    )
            );

            if (
                !__createDll &&
                __react &&
                process.env.WEBPACK_BUILD_ENV === 'dev'
            ) {
                newPlugins.push(require('extract-hoc/babel'));
                newPlugins.push(require('react-hot-loader/babel'));
            }

            // console.log('')
            // presets.forEach(preset => {
            //     console.log('')
            //     console.log('options', preset.options)
            //     console.log('file', preset.file)
            // })
            // console.log({
            //     'plugin[].file': newPlugins
            //         // .filter(plugin => !!plugin.file)
            //         .map(plugin => {
            //             return plugin
            //             // return plugin.file
            //         })
            // })
            // console.log(
            //     {
            //         ...options,
            //         presets: newPresets,
            //         plugins: newPlugins,
            //     }
            // )
            // console.log('')

            return {
                ...options,
                // presets: presets,
                presets: newPresets,
                plugins: newPlugins
            };
        },

        result(result) {
            // For some reason, `default` export may be missing after babel compiling,
            // expecially for TSX file.
            // This is a hacky fix
            if (
                customOptions.__react &&
                // customOptions.__typescript &&
                process.env.WEBPACK_BUILD_ENV === 'dev'
            ) {
                result.code = result.code.replace(
                    /(var _default = .+?;\n*)(;\n\n\(function \(\) \{\n[ ]*var reactHotLoader = )/gm,
                    `$1\n/* harmony default export */ __webpack_exports__["default"] = (_default)$2`
                );
            }
            // if (process.env.WEBPACK_BUILD_ENV === 'dev') {
            //     const { code, ...r } = result
            //     return {
            //         code: code.replace(
            //             /\/\* __KOOT_DEV_SSR__ \*\//g,
            //             `if (__DEV__) { require('../../'); global.__KOOT_SSR__ = {} }`
            //         ),
            //         ...r
            //     }
            // }
            // console.log(result);
            return {
                ...result
                // code: result.code + "\n// Generated by some custom loader",
            };
        }
    };
});
