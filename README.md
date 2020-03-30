# mysql-history

Historical database registry system for Node.js and MySQL databases

## Installation

`$ npm i -g mysql-history`

## Usage

### CLI usage

```sh
$ mysql-history
    --command create
    --schema-generation
    --schema-user test
    --schema-password test
    --schema-database test
    --schema-host 127.0.0.1
    --schema-port 3306
    --schema-output mydb.schema.js
    --history-schema mydb.schema.js
    --history-user test
    --history-password test
    --history-database test
    --history-host 127.0.0.1
    --history-port 3306
```


### API usage

```js
const history = require("mysql-history").create({
	schema: {
		generation: true,
		user: "admin",
		password: "admin123",
		database: "app_database",
		host: "127.0.0.1",
		port: 3306,
		configurations: undefined,
		extensions: {},
		output: __dirname + "/db1.schema.js"
		// debug: true,
	},
	history: {
		user: "history_user",
		password: "history123",
		database: "app_history",
		host: "127.0.0.1",
		port: 3306,
		schema: [
			__dirname + "/db1.schema.js",
			// you can add other schemas too...
		],
		// debug: true,
	}
});

const execution = async function() {
	await history.initialize(); // generates the schema, prepares templates and others
	await history.createTables(); // creates the database history tables
	await history.save("db1", "my_table", [{value:1},{value:2},{value:3}]);
	await history.save("db1", "my_table", [{value:4},{value:5},{value:6}]);
	await history.save("db1", "my_table", [{value:7},{value:8},{value:9}]);
	await history.deleteTables(); // deletes the database history tables
};

module.exports = execution();
```

## API Reference





## Issues

Please, report issues and suggestions [here](https://github.com/allnulled/mysql-history/issues).

## License

This project is licensed under [WTFPL or What The Fuck Public License](http://www.wtfpl.net/), which means 'do what you want with it'.
