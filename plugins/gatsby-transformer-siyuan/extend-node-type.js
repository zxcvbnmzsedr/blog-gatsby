"use strict";

const Remark = require(`remark`);

const {
  selectAll
} = require(`unist-util-select`);

const _ = require(`lodash`);

const visit = require(`unist-util-visit`);

const toHAST = require(`mdast-util-to-hast`);

const hastToHTML = require(`hast-util-to-html`);

const mdastToToc = require(`mdast-util-toc`);

const mdastToString = require(`mdast-util-to-string`);

const unified = require(`unified`);

const parse = require(`remark-parse`);

const remarkGfm = require(`remark-gfm`);

const remarkFootnotes = require(`remark-footnotes`);

const stringify = require(`remark-stringify`);

const english = require(`retext-english`);

const remark2retext = require(`remark-retext`);

const stripPosition = require(`unist-util-remove-position`);

const hastReparseRaw = require(`hast-util-raw`);

const prune = require(`underscore.string/prune`);

const {
  getConcatenatedValue,
  cloneTreeUntil,
  findLastTextNode
} = require(`./hast-processing`);

const codeHandler = require(`./code-handler`);

const {
  getHeadingID
} = require(`./utils/get-heading-id`);

const {
  timeToRead
} = require(`./utils/time-to-read`);

let fileNodes;
let pluginsCacheStr = ``;
let pathPrefixCacheStr = ``;
const CACHE_TYPE_AST = `ast`;
const CACHE_TYPE_HTMLAST = `html-ast`;
const CACHE_TYPE_HTML = `html`;
const CACHE_TYPE_HEADINGS = `headings`;
const CACHE_TYPE_TOC = `toc`;
const CACHE_TYPE_NODE_DEPS = `node-dependencies`;
const cacheTypesWithOptions = [CACHE_TYPE_TOC];
const cacheTypesUsingNodeId = [CACHE_TYPE_NODE_DEPS];

const getCacheKey = (cacheType, node, options = {}) => {
  const keyVars = [cacheTypesUsingNodeId.indexOf(cacheType) >= 0 ? node.id : node.internal.contentDigest, pluginsCacheStr, pathPrefixCacheStr];

  if (cacheTypesWithOptions.indexOf(cacheType) >= 0) {
    keyVars.push(JSON.stringify(options));
  }

  return `transformer-remark-markdown-${cacheType}-${keyVars.join(`-`)}`;
}; // ensure only one `/` in new url


const withPathPrefix = (url, pathPrefix) => (pathPrefix + url).replace(/\/\//, `/`);
/**
 * Map that keeps track of generation of AST to not generate it multiple
 * times in parallel.
 *
 * @type {Map<string,Promise>}
 */


const ASTPromiseMap = new Map();
/**
 * Set of all Markdown node types which, when encountered, generate an extra to
 * separate text.
 *
 * @type {Set<string>}
 */

const SpaceMarkdownNodeTypesSet = new Set([`paragraph`, `heading`, `tableCell`, `break`]);
const headingLevels = [...Array(6).keys()].reduce((acc, i) => {
  acc[`h${i}`] = i;
  return acc;
}, {});

module.exports = function remarkExtendNodeType({
  type,
  basePath,
  getNode,
  getNodesByType,
  cache,
  getCache,
  reporter,
  ...rest
}, pluginOptions) {
  if (type.name !== `SiYuan`) {
    return {};
  }

  return {
    newField: {
      type: `Int`,

      async resolve(markdownNode, opt, context) {
        console.log(markdownNode)
        return 123123;
      }
    }
  }
};
