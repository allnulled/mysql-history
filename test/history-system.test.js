const { expect } = require("chai");
const MySQLHistorySystem = require(__dirname + "/../src/index.js");
const exec = require("execute-command-sync");
const nodelive = require("nodelive");
const path = require("path");
const KNOWN_TABLE = "auth_user";

describe("MySQLHistorySystem class", function() {

	let mysqlHistory;

	before(done => {
		mysqlHistory = MySQLHistorySystem.create({
			schema: {
				// debug: true,
				generation: true,
				user: "test",
				password: "test",
				host: "127.0.0.1",
				port: 3306,
				database: "database2",
				output: __dirname + "/db1.schema.js"
			},
			history: {
				// debug: true,
				schema: [__dirname + "/db1.schema.js"],
				user: "test",
				password: "test",
				host: "127.0.0.1",
				port: 3306,
				database: "database2"
			}
		});
		done();
	});

	after(done => {
		mysqlHistory.connection.end();
		done();
	});

	it("can initialize a system", async function() {
		await mysqlHistory.initialize();
		await mysqlHistory.createTables();
		await mysqlHistory.deleteTables();
		await mysqlHistory.createTables();
	});

	it("can save items into tables", async function() {
		//await nodelive.editor({h:mysqlHistory});
		await mysqlHistory.save("db1", KNOWN_TABLE, [{
			name: "username1",
			password: "password1",
			email: "someemail@email.com"
		}, {
			name: "username1",
			password: "password1",
			email: "someemail@email.com"
		}, {
			name: "username1",
			password: "password1",
			email: "someemail@email.com"
		}, {
			name: "username1",
			password: "password1",
			email: "someemail@email.com"
		}]);
	});

	it("can query to database", async function() {
		const { data, fields } = await mysqlHistory.$query("SELECT * FROM $hist$db1$" + KNOWN_TABLE + ";");
		expect(data.length).to.equal(4);
	});

	it("can delete tables", async function() {
		await mysqlHistory.deleteTables();
	});

	it("works by CLI too", async function() {
		exec("../bin/mysql-history " +
			"--command delete " +
			"--schema-generation " +
			"--schema-user test " +
			"--schema-password test " +
			"--schema-database database2 " +
			"--schema-host 127.0.0.1 " +
			"--schema-port 3306 " +
			"--schema-output mydb.schema.js " +
			"--history-schema mydb.schema.js " +
			"--history-user test " +
			"--history-password test " +
			"--history-database database2 " +
			"--history-host 127.0.0.1 " +
			"--history-port 3306 ", {
			cwd: path.resolve(__dirname)
		});
		exec("../bin/mysql-history " +
			"--command create " +
			"--schema-generation " +
			"--schema-user test " +
			"--schema-password test " +
			"--schema-database database2 " +
			"--schema-host 127.0.0.1 " +
			"--schema-port 3306 " +
			"--schema-output mydb.schema.js " +
			// "--history-debug " +
			"--history-schema mydb.schema.js " +
			"--history-user test " +
			"--history-password test " +
			"--history-database database2 " +
			"--history-host 127.0.0.1 " +
			"--history-port 3306 ", {
			cwd: path.resolve(__dirname)
		});
		const { data, fields } = await mysqlHistory.$query("SELECT * FROM $hist$mydb$" + KNOWN_TABLE + ";");
		expect(data.length).to.equal(0);
	});

});