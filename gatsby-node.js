require("ts-node").register();

const { createPages } = require("./configs/gatsby-page");

exports.createPages = createPages;
