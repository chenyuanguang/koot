module.exports = {
    type: 'react',
    dist: './dist',
    cookiesToStore: true,
    i18n: false,
    pwa: true,
    aliases: {},
    defines: {},

    // before: '',
    // after: '',
    // onRouterUpdate: '',
    // onHistoryUpdate: '',

    port: 8080,
    // serverBefore: '',
    // serverAfter: '',
    // serverOnRender: '',

    moduleCssFilenameTest: /\.(component|view|module)/,
    classNameHashLength: 6,
    bundleVersionsKeep: 2,

    devPort: 3080,
}
