// eslint.config.cjs
const globals = require('globals');
const pluginJs = require('eslint/js');

module.exports = {
    languageOptions: {
        globals: globals.browser,
    },
    plugins: [pluginJs],
    rules: {
        indent: ['error', 4], // impose une indentation de 4 espaces
        'linebreak-style': ['error', 'windows'], // impose les fins de ligne Windows (\r\n)
        quotes: ['error', 'single'], // impose l’usage de guillemets simples (')
        semi: ['error', 'always'], // impose le point-virgule obligatoire
    },
    extends: pluginJs.configs.recommended,
};