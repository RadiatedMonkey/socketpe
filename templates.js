// Example: say << 1 + 1 >>

module.exports = cmd => {
    let templates = cmd.split(/(<<|>>)/gi);
    templates.forEach((temp, idx) => {
        if(temp === "<<") {

            templates[idx + 1] = eval(templates[idx + 1]);

            templates.splice(idx, 1);
            templates.splice(idx + 1, 1);
        }
    });

    return templates.join("");
}