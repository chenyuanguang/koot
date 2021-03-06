import routeCheck from 'koot/React/route-check'
import Root from '@components/app'

export default {

    component: Root,
    name: 'app-root',

    indexRoute: {
        getComponent: (nextState, cb) => {
            require.ensure([], (require) => {
                if (routeCheck(nextState)) cb(null, require('@views/home').default)
            }, 'Page: Home')
        }
    },

    childRoutes: (() => {
        const children = [{
            path: 'static',
            name: 'Page: Static Assets',
            getComponent: (nextState, cb) => {
                require.ensure([], (require) => {
                    if (routeCheck(nextState)) cb(null, require('@views/static').default)
                }, 'Page: Static Assets')
            }
        }]
        if (!__SPA__) {
            children.push({
                path: 'extend',
                name: 'Page: Component Extender',
                getComponent: (nextState, cb) => {
                    require.ensure([], (require) => {
                        if (routeCheck(nextState)) cb(null, require('@views/extend').default)
                    }, 'Page: Component Extender')
                }
            })
        }
        return children
    })()

}
