const fs = require('fs-extra')
const path = require('path')

const gitIgnore = `
# Logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid
*.seed

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage

# nyc test coverage
.nyc_output

# Grunt intermediate storage (http://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# node-waf configuration
.lock-wscript

# Compiled binary addons (http://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules
jspm_packages

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Personal code

.DS_Store
.vscode
`
const packageJson = {
    "name": "",
    "main": "index.js",
    "scripts": {
        "start": "node index.js"
    },
    "license": "UNLICENSED",
    "private": true,
    "dependencies": {
    }
}

module.exports = async (o = {}) => {
    const {
        dist
    } = o

    const packageProject = await fs.readJson(path.resolve(process.cwd(), 'package.json'))

    await fs.copy(
        path.resolve(__dirname, 'files'),
        dist, {
            overwrite: true,
        }
    )

    await fs.writeFile(
        path.resolve(dist, '.gitignore'),
        gitIgnore,
        'utf-8'
    )

    await fs.writeJson(
        path.resolve(dist, 'package.json'),
        Object.assign({}, packageJson, {
            name: `${packageProject.name}-server`,
            dependencies: packageProject.dependencies
        })
    )
}
