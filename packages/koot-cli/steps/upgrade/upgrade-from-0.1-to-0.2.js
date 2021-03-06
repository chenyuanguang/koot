const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

const getAllFiles = require('../../lib/get-all-files')
const spinner = require('../../lib/spinner')
const _ = require('../../lib/translate')

const msgUpgrading = require('./msg-upgrading')

module.exports = async (dir = process.cwd()) => {
    const msg = msgUpgrading('0.1.0', '0.2.0')
    const waiting = spinner(msg + '...')
    const files = await getAllFiles(dir, {
        onlyASCII: true,
        ignoreLockFiles: true,
    })
    const filesChanged = []
    const filesRemoved = []
    const writeFile = true

    for (let pathname of files) {
        // console.log(pathname)
        // const filename = path.basename(pathname)
        const content = await fs.readFile(pathname, 'utf-8')
        let newPathname = pathname
        let changed = content

        // 替换文件内容
        const replace = async (regex, to) => {
            if (regex.test(changed)) {
                changed = changed.replace(regex, to)
                if (!filesChanged.includes(newPathname))
                    filesChanged.push(newPathname)
                if (writeFile)
                    await fs.writeFile(
                        newPathname,
                        changed,
                        'utf-8'
                    )
            }
        }

        await replace(
            /([^a-zA-Z0-9_]+?)babel-polyfill([^a-zA-Z0-9_]+?)/g,
            '$1@babel/polyfill$2'
        )

        // console.log(changed)
    }

    // 修改 package.json 的依赖项
    const pathnamePackagejson = path.resolve(dir, 'package.json')
    const p = await fs.readJson(pathnamePackagejson)
    p.dependencies.koot = '^0.2.0'
    if (writeFile)
        await fs.writeJson(pathnamePackagejson, p, {
            spaces: 4
        })
    filesChanged.push(pathnamePackagejson)

    if (writeFile) {
        const pathnameBabelrc = path.resolve(dir, '.babelrc')
        if (fs.existsSync(pathnameBabelrc)) {
            await fs.remove(pathnameBabelrc)
            filesRemoved.push(pathnameBabelrc)

            const pathnameNewBabel = path.resolve(dir, 'babel.config.js')
            await fs.copyFile(
                path.resolve(__dirname, './files/koot-0.2-babel-config.js'),
                pathnameNewBabel
            )
            filesChanged.push(pathnameNewBabel)
        }
    }

    waiting.stop()
    spinner(msg).finish()

    // console.log(files)

    return {
        warn: chalk.yellowBright('koot 0.2.0')
            + chalk.reset(' ')
            + '\n'
            + _('upgrade_0.2.0_warning'),
        files: filesChanged,
        removed: filesRemoved,
    }
}
