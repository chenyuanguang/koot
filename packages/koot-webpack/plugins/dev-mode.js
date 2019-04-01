const fs = require('fs-extra')
const path = require('path')
// const opn = require('opn')

const { ConcatSource } = require("webpack-sources")

// const getPort = require('../libs/require-koot')('utils/get-port')
const { filenameDll } = require('../libs/require-koot')('defaults/before-build')
const isHotUpdate = require('../libs/is-compilation-hot-update-only')

// let opened = false

/**
 * Webpack 插件 - 开发环境扩展
 */
class DevModePlugin {
    constructor({
        dist,
        afterEmit, done,
    }) {
        this.dist = dist
        this.afterEmit = afterEmit
        this.done = done
    }

    apply(compiler) {
        const {
            afterEmit, done
        } = this

        const TYPE = process.env.WEBPACK_BUILD_TYPE
        const ENV = process.env.WEBPACK_BUILD_ENV
        const STAGE = process.env.WEBPACK_BUILD_STAGE

        let hotUpdate = false

        // afterEmit - 检查是否为热更新
        compiler.hooks.afterEmit.tapAsync.bind(compiler.hooks.afterEmit, 'GenerateChunkmap')(async (compilation, callback) => {
            hotUpdate = isHotUpdate(compilation)
            if (typeof afterEmit === 'function') afterEmit()
            callback()
        })

        // compilation - [server / dev] 如果存在 DLL 结果，写入到 index.js 文件开端
        if (STAGE === 'server' && ENV === 'dev') {
            compiler.hooks.compilation.tap("DevModePlugin", compilation => {
                compilation.hooks.optimizeChunkAssets.tap("DevModePlugin", chunks => {
                    if (typeof this.dist !== 'string' || !this.dist)
                        return

                    const { KOOT_DEV_DLL_FILE_SERVER: fileDll } = process.env
                    if (!fileDll || !fs.existsSync(fileDll))
                        return

                    for (const chunk of chunks) {
                        if (!chunk.canBeInitial()) {
                            continue
                        }
                        chunk.files
                            .filter(filename => filename === 'index.js')
                            .forEach(filename => {
                                compilation.assets[filename] = new ConcatSource(
                                    fs.readFileSync(fileDll, 'utf-8'),
                                    '\n',
                                    compilation.assets[filename]
                                )
                            })
                    }
                })
            })
        }

        // done - 执行 after 回调，并打开浏览器窗口
        compiler.hooks.done.tapAsync.bind(compiler.hooks.done, 'DevModePlugin')((compilation, callback) => {
            // console.log('\n\n\nhotUpdate', hotUpdate)

            // 如果当前为热更新，取消流程
            if (hotUpdate)
                return callback()

            if (typeof done === 'function') {
                done()
                setTimeout(() => {
                    if (!TYPE === 'spa') {
                        console.log('\n')
                    }
                })
            }

            // if (TYPE === 'spa') {
            //     if (!opened) opn(`http://localhost:${getPort()}/`)
            //     opened = true
            // }

            callback()
        })
    }
}

module.exports = DevModePlugin
