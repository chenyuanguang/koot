const transformFixDefaultExport = require('./transform-fix-default-export');

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
            const stage = process.env.WEBPACK_BUILD_STAGE;
            // console.log({ options });

            // presets ========================================================
            const newPresets = [...presets];
            if (__typescript) {
                newPresets.unshift([
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
            if (stage === 'server') {
                newPresets.map(preset => {
                    if (
                        typeof preset.file === 'object' &&
                        /^@babel\/preset-env$/.test(preset.file.request)
                    ) {
                        if (!preset.options) preset.options = {};
                        preset.options.modules = false;
                        preset.options.exclude = [
                            '@babel/plugin-transform-regenerator',
                            '@babel/plugin-transform-async-to-generator'
                        ];
                        return preset;
                    }
                    return preset;
                });
            }

            // plugins ========================================================
            const newPlugins = plugins.filter(plugin => {
                if (
                    typeof plugin.file === 'object' &&
                    (/extract-hoc(\/|\\)babel/.test(plugin.file.request) ||
                        /react-hot-loader(\/|\\)babel/.test(
                            plugin.file.request
                        ))
                )
                    return false;

                if (
                    stage === 'server' &&
                    typeof plugin.file === 'object' &&
                    /@babel(\/|\\)plugin-transform-regenerator/.test(
                        plugin.file.request
                    )
                )
                    return false;

                return true;
            });

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
            if (
                !customOptions.__createDll &&
                customOptions.__react &&
                process.env.WEBPACK_BUILD_ENV === 'dev' &&
                process.env.WEBPACK_BUILD_STAGE === 'client'
            ) {
                result.code = transformFixDefaultExport(result.code);
            }

            // if (!customOptions.__createDll) {
            //     const { code, ...remainings } = result;
            //     console.log(remainings);
            // }

            return {
                ...result
            };
        }
    };
});
