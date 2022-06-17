"use strict";

const {
  create,
} = require(`./on-node-create`);

exports.sourceNodes = create;
// exports.createSchemaCustomization = require(`./create-schema-customization`);
exports.setFieldsOnGraphQLNodeType = require(`./extend-node-type`);
