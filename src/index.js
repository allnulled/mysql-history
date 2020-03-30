// const MySQLSchema = require("mysql-schema");
const MySQLSchema = require("mysql-schema");
const mysql = require("mysql");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const SQL = require("sqlstring");
const Debug = require("debug");
const debug = Debug("mysqlhistory");
const Utils = require(__dirname + "/utils.js");

class MySQLHistorySystem {

	static create(...args) {
		return new this(...args);
	}

	static get DEFAULT_OPTIONS() {
		return {
			schema: {},
			history: {},
			historySchemas: {},
			queryTemplates: {},
			templates: {}
		};
	}

	static get DEFAULT_SCHEMA_OPTIONS() {
		return {
			generation: false,
			user: "test",
			password: "test",
			database: "test",
			host: "127.0.0.1",
			port: 3306,
			configurations: false,
			extensions: {}
		};
	}

	static get DEFAULT_HISTORY_OPTIONS() {
		return {
			schema: undefined,
			user: process.env.DB_HISTORY_USER || "test",
			password: process.env.DB_HISTORY_PASSWORD || "test",
			database: process.env.DB_HISTORY_NAME || "test",
			host: process.env.DB_HISTORY_HOST || "127.0.0.1",
			port: process.env.DB_HISTORY_PORT || 3306,
			isInitialized: false
		};
	}

	static get DEFAULT_QUERY_TEMPLATES_OPTIONS() {
		return {
			save: __dirname + "/queries/save.sql.ejs",
			createTables: __dirname + "/queries/create tables.sql.ejs",
			deleteTables: __dirname + "/queries/delete tables.sql.ejs",
		};
	}

	static get DEFAULT_TEMPLATES_OPTIONS() {
		return {};
	}

	constructor(options = {}) {
		Object.assign(this, this.constructor.DEFAULT_OPTIONS, options);
		this.schema = Object.assign({}, this.schema, this.constructor.DEFAULT_SCHEMA_OPTIONS, options.schema || {});
		this.history = Object.assign({}, this.history, this.constructor.DEFAULT_HISTORY_OPTIONS, options.history || {});
		this.queryTemplates = Object.assign({}, this.queryTemplates, this.constructor.DEFAULT_QUERY_TEMPLATES_OPTIONS, options.queryTemplates || {});
		this.templates = Object.assign({}, this.templates, this.constructor.DEFAULT_QUERIES_OPTIONS, options.templates || {});
		if (this.history.debug) {
			Debug.enable("mysqlhistory");
		} else {
			Debug.disable("mysqlhistory");
		}
		Object.keys(this.queryTemplates).forEach(queryName => {
			const queryTemplateFile = this.queryTemplates[queryName];
			const queryFileName = path.basename(queryTemplateFile);
			const queryPath = path.resolve(queryTemplateFile);
			this.debug("  ✔ Query for " + path.basename(queryFileName));
			const queryTemplateContents = fs.readFileSync(queryPath).toString();
			this.templates[queryName] = queryTemplateContents;
		});
		this.connection = mysql.createPool({ ...this.history,
			multipleStatements: true
		});
	}

	debug(...args) {
		debug(...args);
	}

	async initialize() {
		try {
			this.debug("⛁ Initializing schemas...");
			await this.initializeSchema();
			this.history.isInitialized = true;
		} catch (error) {
			console.log(error);
		}
	}

	async initializeSchema() {
		try {
			if (!this.history.schema) {
				throw new Error("Property <history.schema> is required");
			}
			if(this.schema.generation && !this.schema.isInitialized) {
				await this.generateSchema();
				this.schema.isInitialized = true;
			}
			this.initializeHistorySchemas();
			return;
		} catch (error) {
			console.log(error);
			throw error;
		}
	}

	initializeHistorySchemas() {
		[].concat(this.history.schema).forEach(historySchema => {
			const schemaPath = path.resolve(historySchema);
			const schemaName = path.basename(schemaPath).replace(/\.schema\.js(on)?/g, "");
			this.historySchemas[schemaName] = require(schemaPath);
		});
	}

	generateSchema() {
		return MySQLSchema.getSchema(this.schema);
	}

	$render(template, parameters, settings = {}) {
		return ejs.render(template, parameters, settings);
	}

	$query(query) {
		return new Promise((ok, fail) => {
			this.debug("⛁ [SQL] " + query);
			this.connection.query(query, (error, data, fields) => {
				if (error) {
					return fail(error);
				}
				return ok({
					data,
					fields
				});
			});
		});
	}

	queryByTemplate(template, parameters, querySettings = {}) {
		const queryTemplate = this.templates[template];
		const queryParameters = this.$createTemplateParameters(parameters);
		const query = this.$render(queryTemplate, queryParameters, querySettings);
		return this.$query(query);
	}

	async createTables(parameters = {}) {
		try {
			await this.queryByTemplate("createTables", parameters);
			return;
		} catch (error) {
			throw error;
		}
	}

	async deleteTables(parameters = {}) {
		try {
			await this.queryByTemplate("deleteTables", parameters);
			return;
		} catch (error) {
			throw error;
		}
	}

	$createTemplateParameters(options = {}) {
		return {
			ejs: ejs,
			require: require,
			process: process,
			SQL: SQL,
			Utils: Utils,
			createParameters: this.$createTemplateParameters.bind(this),
			mysqlHistory: this,
			...options
		};
	}

	save(schema, table, items) {
		return this.queryByTemplate("save", {
			insertIntoSchema: schema,
			insertIntoTable: table,
			insertItems: items
		});
	}

}

module.exports = MySQLHistorySystem;