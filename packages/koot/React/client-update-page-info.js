// 当前 meta 标签
let currentMetaTags
// meta 标签区域结尾的 HTML 注释代码
let nodeCommentEnd

let inited = false

/**
 * (浏览器环境) 更新页面信息
 * @param {String} title
 * @param {Object[]} metas
 */
export default (title, metas = []) => {
    if (__SERVER__) return
    if (!__SPA__ && !inited) {
        inited = true
        return
    }

    // 替换页面标题
    document.title = title

    // 替换 metas
    const head = document.getElementsByTagName('head')[0]
    if (!Array.isArray(currentMetaTags)) {
        currentMetaTags = []
        // 移除所有在 KOOT_METAS 里的 meta 标签
        // 采用 DOM 操作的初衷：如果使用 innerHTML 的字符串替换方法，浏览器可能会全局重新渲染一次，造成“闪屏”
        const childNodes = head.childNodes
        const nodesToRemove = []
        let meetStart = false
        let meetEnd = false
        let i = 0
        while (!meetEnd && childNodes[i] instanceof Node) {
            const node = childNodes[i]
            if (node.nodeType === Node.COMMENT_NODE) {
                if (node.nodeValue === __KOOT_INJECT_METAS_START__)
                    meetStart = true
                if (node.nodeValue === __KOOT_INJECT_METAS_END__) {
                    meetEnd = true
                    nodeCommentEnd = node
                }
            } else if (meetStart && node.nodeType === Node.ELEMENT_NODE && node.tagName === 'META') {
                nodesToRemove.push(node)
            }
            i++
        }
        nodesToRemove.forEach(el => head.removeChild(el))
    }

    currentMetaTags.forEach(el => {
        if (el && el.parentNode)
            el.parentNode.removeChild(el)
    })
    currentMetaTags = metas
        .filter(meta => typeof meta === 'object')
        .map(meta => {
            const el = document.createElement('meta')
            for (var key in meta) {
                el.setAttribute(key, meta[key])
            }
            // el.setAttribute(__KOOT_INJECT_ATTRIBUTE_NAME__, '')
            if (nodeCommentEnd) {
                head.insertBefore(el, nodeCommentEnd)
            } else {
                head.appendChild(el)
            }
            return el
        })
}
