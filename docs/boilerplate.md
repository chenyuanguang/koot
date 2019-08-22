# 项目结构

模板项目 (boilerplate) 采用如下的目录结构，该结构仅为建议，开发者可自行决断如何使用。

另外建议使用 `aliases` 配置，方便文件的引用，请参见 [项目配置/aliases](/config?id=aliases)。

```
[app]
├── 📄 README.md
├── 📄 .eslintrc.js
├── 📄 .gitignore
├── 📄 .prettierrc.js
├── 📄 babel.config.js
├── 📄 browserslist
├── 📄 jsconfig.json
├── 📄 koot.config.js
├── 📄 package.json
├── 📄 postcss.config.js
└── 📂 src
    ├── 📄 critical.js
    ├── 📄 global.less
    ├── 📄 index.ejs
    ├── 📄 index.inject.js
    ├── 📂 assets
    │   └── 📂 public
    │       └── 📄 favicon.ico
    ├── 📂 components
    │   ├── 📂 组件#1
    │   │   ├── 📄 index.jsx
    │   │   └── 📄 index.module.less
    │   └── 📂 组件#2
    │       ├── 📄 index.jsx
    │       └── 📄 index.module.less
    ├── 📂 constants
    │   ├── 📂 less
    │   │   └── 📄 colors.less
    │   └── 📄 action-types.js
    ├── 📂 locales
    │   ├── 📄 en.json
    │   └── 📄 zh.json
    ├── 📂 routes
    │   └── 📄 index.js
    ├── 📂 server
    ├── 📂 store
    │   ├── 📄 actions.js
    │   ├── 📄 index.js
    │   └── 📄 reducers.js
    └── 📂 views
        ├── 📂 视图#1
        │   ├── 📄 index.jsx
        │   └── 📄 index.module.less
        └── 📂 视图#2
            ├── 📄 index.jsx
            └── 📄 index.module.less
```
