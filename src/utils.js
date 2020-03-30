module.exports = {
	
	getOnlyFields(item, fields = []) {
		if(Array.isArray(fields)) {
			return fields.reduce((output, field) => {
				if(field in item) {
					output[field] = item[field];
				}
				return output;
			}, {})
		} else if(typeof fields === "object") {
			return Object.keys(fields).reduce((output, field) => {
				if(field in item) {
					output[field] = item[field];
				} else if(typeof fields[field] !== "undefined") {
					output[field] = fields[field];
				}
				return output;
			});
		}
	},

	getHistoryTableName(schema, table) {
		return "$hist$" + schema + "$" + table;
	}

};