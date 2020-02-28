import isI18nEnabled from '../../../i18n/is-enabled';
import { setLocales } from '../../../i18n/locales';
import getDist from '../../../utils/get-dist-path';

const fs = require('fs-extra');
const path = require('path');

/**
 * 验证 i18n 相关信息
 *
 * 如果没有开启多语言，不进行任何操作
 *
 * - 将所有可用语种ID写入内存
 * - 将所有语种的语言包写入内存
 *
 * _开发环境_ 同构中间件需执行该验证方法
 *
 * @returns {void}
 */
const validateI18n = () => {
    if (!isI18nEnabled()) return;

    /** @type {Object} 完整语言包配置 */
    const localesFull = getLocalesFull();
    // /** @type {String} 多语言类型 */
    // const type = JSON.parse(process.env.KOOT_I18N_TYPE) || false
    // const localeIds = []
    const locales = {};
    localesFull.forEach(arr => {
        const [localeId, localeObj] = arr;
        // localeIds.push(localeId)
        locales[localeId] = localeObj;
    });

    // 服务器端注册多语言
    setLocales(locales);

    return locales;
};

export default validateI18n;

/**
 * 获取完整语言包配置
 * @returns {Object}
 */
const getLocalesFull = () => {
    const locales = JSON.parse(process.env.KOOT_I18N_LOCALES);
    return locales.map(l => [
        l[0],
        fs.readJsonSync(__DEV__ ? l[2] : getLocaleFile(l[3]), 'utf-8'),
        l[2],
        l[3]
    ]);
    // return JSON.parse(process.env.KOOT_I18N_LOCALES);
};

/** 通过环境变量中记录的相对路径读取语言包内容 */
const getLocaleFile = relativePath => {
    let file = relativePath;
    if (fs.existsSync(file)) return file;

    file = path.resolve(getDist(), 'server', relativePath);
    if (fs.existsSync(file)) return file;

    file = path.resolve('server', relativePath);
    if (fs.existsSync(file)) return file;

    file = path.resolve(relativePath);
    if (fs.existsSync(file)) return file;

    return {};
};
