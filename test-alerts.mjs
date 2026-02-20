import Markdown from 'markdown-it';
import plugin from './src/js/markdown-it-alerts-plugin.js';
const md = new Markdown({html: true, breaks: true, linkify: true, typographer: true});
md.use(plugin, {ignoreUnknownTypes: false});
const result = md.render('> [!NOTE]\n> test');
console.log('RESULT HAS SVG:', result.includes('<svg'));
console.log('RESULT:', result);
