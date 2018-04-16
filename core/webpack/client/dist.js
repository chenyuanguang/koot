const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')
const common = require('../common')

const ExtractTextPlugin = require("extract-text-webpack-plugin")
const WebpackOnBuildPlugin = require('on-build-webpack')

const dist = global.__SUPER_DIST__

const factoryConfig = async ({
    RUN_PATH,
    // CLIENT_DEV_PORT,
}) => {

    // let { RUN_PATH, CLIENT_DEV_PORT, APP_KEY } = opt

    return {
        target: 'web',
        // devtool: 'source-map',
        optimization: {
            minimize: true,
        },
        plugins: [
            // 在node执行环境中设置，不起作用，此处不能省略
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }),
            new webpack.NoEmitOnErrorsPlugin(),
            // new webpack.optimize.UglifyJsPlugin({
            //     compress: {
            //         warnings: false
            //     },
            //     beautify: false,
            //     comments: false,
            //     sourceMap: false
            // }),
            new ExtractTextPlugin('[name].[chunkhash].css'),
            await new WebpackOnBuildPlugin(async function (stats) {
                // After webpack build...
                // create(parseOptions(...args))
                // console.log('')
                // console.log('----------------------------------------')
                // console.log('')

                const chunks = {}
                // const outputPath = stats.compilation.outputOptions.path
                // const publicPath = stats.compilation.outputOptions.publicPath

                const times = n => f => {
                    let iter = i => {
                        if (i === n) return
                        f(i)
                        iter(i + 1)
                    }
                    return iter(0)
                }

                const log = (obj, spaceCount = 1, deep = 2) => {
                    if (typeof obj === 'object') {
                        let spaces = ''
                        times(spaceCount)(() => {
                            spaces += '    '
                        })
                        for (let key in obj) {
                            console.log(spaces + key)
                            if (spaceCount < deep)
                                log(obj[key], spaceCount + 1, deep)
                        }
                    }
                }

                // log(stats)

                // for (let key in stats) {
                // console.log(key)
                // obj[key] = stats[key]
                // }
                // console.log(stats.compilation.namedChunks)
                // console.log(stats.compilation)

                // log(stats.compilation.chunks, undefined, 2)

                const dirRelative = path.relative(
                    dist,
                    stats.compilation.outputOptions.path
                ).replace(`\\`, '/')
                for (let id in stats.compilation.chunks) {
                    const o = stats.compilation.chunks[id]
                    // console.log(o)
                    if (typeof o.name === 'undefined' || o.name === null) continue
                    chunks[o.name] = o.files

                    if (Array.isArray(chunks[o.name]))
                        chunks[o.name] = chunks[o.name].map(file => (
                            `${dirRelative}/${file}`
                        ))
                    // console.log(
                    //     o.id,
                    //     // o.ids,
                    //     o.name,
                    //     // o.chunks,
                    //     o.files
                    //     // o.hash,
                    //     // o.renderedHash
                    // )
                }

                // console.log(chunks)
                // console.log(outputPath, htmlFileName)
                // console.log(outputPath)

                await fs.writeJsonSync(
                    path.resolve(
                        // stats.compilation.outputOptions.path,
                        dist,
                        `.public-chunckmap.json`
                    ),
                    chunks,
                    {
                        spaces: 4
                    }
                )

                // id
                // ids
                // debugId
                // name
                // _modules
                // entrypoints
                // chunks
                // parents
                // blocks
                // origins
                // files
                // rendered
                // entryModule
                // hash
                // renderedHash

                // console.log('')
                // console.log('----------------------------------------')
                // console.log('')

            }),
        ],
    }
}

module.exports = async (opt) => await factoryConfig(opt)
