const dataValues = require('./dataValues.json');
const dataKeys = Object.keys(dataValues);

module.exports = {
    convertDataValues: function(model) {
        let tempModel = [];
        model.forEach((item, idx) => {
            let dataIndex = dataKeys.indexOf(item.n);
            if(dataIndex < 0) {
                tempModel.push(item);
            } else {
                let blockData = dataValues[dataKeys[dataIndex]];
    
                tempModel.push({
                    n: blockData[0],
                    i: blockData[1],
                    c: item.c
                });
            }
        });
        return tempModel;
    }
}