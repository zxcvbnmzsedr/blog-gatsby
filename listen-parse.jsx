const root = './content/topic/'
const watch = require('watch')
const {parse} = require("./parse.jsx");
watch.watchTree(root, function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
        // Finished walking the tree
    } else if (prev === null) {
        // f is a new file
        parse()
    } else if (curr.nlink === 0) {
        // f was removed
        parse()
    } else {
        parse()
    }
})
