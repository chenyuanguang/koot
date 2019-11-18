/* eslint-disable no-console */
// https://github.com/jantimon/html-webpack-plugin

const fs = require('fs-extra');
const path = require('path');
// const ejs = require('ejs')
const chalk = require('chalk');

const writeChunkmap = require('koot/utils/write-chunkmap');
const getAppType = require('koot/utils/get-app-type');
const __ = require('koot/utils/translate');
const getDistPath = require('koot/utils/get-dist-path');
const getCwd = require('koot/utils/get-cwd');
const getChunkmap = require('koot/utils/get-chunkmap');
const getDirDistPublic = require('koot/libs/get-dir-dist-public');
const validateTemplate = require('koot/libs/validate-template');

/**
 * Webpack 插件 - 生成 SPA 主页面文件
 * @class SpaTemplatePlugin
 * @classdesc Webpack 插件 - 生成 SPA 主页面文件
 * @property {String} localeId
 */
class SpaTemplatePlugin {
    constructor(settings = {}) {
        this.localeId = settings.localeId;
        this.inject = settings.inject;
        this.template = settings.template;
        this.serviceWorkerPathname = settings.serviceWorkerPathname;
    }

    apply(compiler) {
        const localeId = this.localeId;
        const inject = this.inject;
        const template = this.template;
        const serviceWorkerPathname = this.serviceWorkerPathname;

        const filename = `index${localeId ? `.${localeId}` : ''}.html`;

        // 失败原因
        let fail = false;

        // 如果环境变量中未找到模板结果，分析 koot.js，获取结果
        if (!process.env.KOOT_HTML_TEMPLATE) {
            compiler.hooks.compilation.tap(
                'SpaTemplatePlugin',
                (compilation, { normalModuleFactory }) => {
                    const handler = parser => {
                        // for (let key in parser.hooks) console.log(key)

                        parser.hooks.varDeclaration
                            .for('template')
                            .tap('SpaTemplatePlugin', function(/*node*/) {
                                // console.log(node)
                                compilation.modules.forEach(m => {
                                    if (
                                        typeof m.resource === 'string' &&
                                        typeof m._source === 'object' &&
                                        /[/\\]koot\.js$/.test(m.resource)
                                    ) {
                                        const exec = /template[ *]=[ *]['"](.+?)['"]/.exec(
                                            m._source._value
                                        );
                                        if (
                                            Array.isArray(exec) &&
                                            exec.length > 1
                                        ) {
                                            const t = exec[1];
                                            if (t.substr(0, 2) === './') {
                                                process.env.KOOT_HTML_TEMPLATE = fs.readFileSync(
                                                    path.resolve(getCwd(), t),
                                                    'utf-8'
                                                );
                                            } else {
                                                process.env.KOOT_HTML_TEMPLATE = t;
                                            }
                                        }
                                    }
                                });
                            });
                    };

                    normalModuleFactory.hooks.parser
                        .for('javascript/auto')
                        .tap('SpaTemplatePlugin', handler);
                    normalModuleFactory.hooks.parser
                        .for('javascript/dynamic')
                        .tap('SpaTemplatePlugin', handler);
                    normalModuleFactory.hooks.parser
                        .for('javascript/esm')
                        .tap('SpaTemplatePlugin', handler);
                }
            );
        }

        // hook: 在文件吐出时修改模板文件代码
        const hookStep =
            process.env.WEBPACK_BUILD_ENV === 'prod' ? 'afterEmit' : 'emit';
        compiler.hooks[hookStep].tapAsync.bind(
            compiler.hooks[hookStep],
            'SpaTemplatePlugin'
        )(async (compilation, callback) => {
            const appType = await getAppType();

            // 获取并写入 chunkmap
            await writeChunkmap(
                compilation,
                undefined,
                undefined,
                serviceWorkerPathname
            );
            const {
                '.files': filemap,
                '.entrypoints': entrypoints
                // 'service-worker': serviceWorker
            } = getChunkmap(localeId);

            // console.log({
            //     serviceWorker,
            //     KOOT_PWA_PATHNAME: process.env.KOOT_PWA_PATHNAME
            // });

            // 如果环境变量中未找到模板结果，报错并返回
            if (typeof process.env.KOOT_HTML_TEMPLATE !== 'string') {
                fail = __('build.spa_template_not_found');
                return callback();
            }
            const templateStr =
                process.env.WEBPACK_BUILD_ENV === 'dev'
                    ? await validateTemplate(template)
                    : process.env.KOOT_HTML_TEMPLATE;

            const renderTemplate = (() => {
                switch (appType) {
                    case 'ReactSPA': {
                        return require(`koot/React/render-template`);
                    }
                    default: {
                    }
                }
                return () => '';
            })();
            const defaultInject = (() => {
                switch (appType) {
                    case 'ReactSPA': {
                        return require(`koot/ReactSPA/inject`)({
                            filemap,
                            compilation,
                            entrypoints,
                            localeId,
                            needInjectCritical: require(`koot/React/inject/is-need-inject-critical`)(
                                templateStr
                            )
                        });
                    }
                    default: {
                    }
                }
                return {};
            })();
            // console.log(Object.assign({}, defaultInject, inject))

            const projectInject = (() => {
                if (!inject) return {};
                if (typeof inject !== 'string') return {};
                if (!fs.existsSync(inject)) return {};
                return (thisModule => {
                    if (typeof thisModule.default === 'object')
                        return thisModule.default;
                    if (typeof thisModule === 'object') return thisModule;
                    return {};
                    // eslint-disable-next-line no-eval
                })(eval(fs.readFileSync(inject, 'utf-8')));
            })();

            const html = renderTemplate({
                template: templateStr,
                inject: {
                    ...defaultInject,
                    ...projectInject
                },
                compilation
            });

            // 写入 Webpack 文件流
            if (compilation.fileDependencies.add) {
                compilation.fileDependencies.add(filename);
            } else {
                // Before Webpack 4 - fileDepenencies was an array
                compilation.fileDependencies.push(filename);
            }
            compilation.assets[filename] = {
                source: () => html,
                size: () => html.length
            };

            // console.log(html)

            // 生产环境：写入文件
            if (process.env.WEBPACK_BUILD_ENV === 'prod') {
                const pathname = path.resolve(
                    getDirDistPublic(getDistPath()),
                    filename
                );
                await fs.ensureFile(pathname);
                await fs.writeFile(pathname, html, 'utf-8');
            }

            callback();
        });

        // hook: done
        compiler.hooks.done.tapAsync.bind(
            compiler.hooks.done,
            'SpaTemplatePlugin'
        )((compilation, callback) => {
            // 生产环境：报告文件写入完成
            if (process.env.WEBPACK_BUILD_ENV === 'prod') {
                setTimeout(() => {
                    console.log('');
                    if (fail) {
                        setTimeout(() => {
                            console.log(
                                chalk.redBright('× ') +
                                    chalk.yellowBright('[koot/build] ') +
                                    chalk.redBright(fail)
                            );
                        });
                    } else {
                        console.log(
                            chalk.green('√ ') +
                                chalk.yellowBright('[koot/build] ') +
                                __('build.spa_template_emitted', {
                                    file: chalk.green(`/${filename}`)
                                })
                        );
                    }
                });
            }

            callback();
        });
    }
}

module.exports = SpaTemplatePlugin;
