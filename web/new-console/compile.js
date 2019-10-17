const sass = require('node-sass');
const fs = require('fs');

module.exports = function() {
    sass.render({
        file: './web/new-console/styles.scss',
        outputStyle: 'compressed',
        precision: 2
    }, (err, data) => {
        if(err) throw err;
        fs.writeFileSync("./web/new-console/styles.css", data.css);
    });
};