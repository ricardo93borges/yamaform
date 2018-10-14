var fs = require('fs')
const mysql = require('mysql');
var Database = require('./Database')
module.exports = class Yamaform {

    constructor(databaseConfig) {
        this.relationshipQueries = []
        this.queries = []
        this.associativeTablesCreated = []
        this.databaseConfig = databaseConfig
    }

    readFile(path) {
        return JSON.parse(fs.readFileSync(path, 'utf8'))
    }

    async runQuery(query) {
        let database = new Database(this.databaseConfig)
        let results = await database.query(query)
        database.close()
        return results
    }

    isManyToMany(json, currentTable, otherTable) {
        for (let columnName in json[currentTable]) {
            if (columnName === 'hasMany' && json[otherTable][columnName] === currentTable) {
                return true
            }
        }
        return false
    }

    /**
     * Generate tables from a json file
     * @param  {object} connection - A mysql connection
     * @param  {string} file - The file path
     */
    async generateTables(file) {
        try {
            let json = this.readFile(file)
            var query = ''

            Object.keys(json).forEach((tableName, index) => {
                query = `CREATE TABLE IF NOT EXISTS ${tableName} (id integer not null auto_increment primary key,`
                let table = json[tableName]

                for (let columnName in table) {
                    if (columnName === 'hasOne') {

                        let otherTable = table[columnName]
                        this.relationshipQueries.push(`ALTER table ${tableName} ADD COLUMN ${otherTable}_id integer not null;`)
                        this.relationshipQueries.push(`ALTER table ${tableName} ADD FOREIGN KEY (${otherTable}_id) REFERENCES ${otherTable}(id);`)

                    } else if (columnName === 'hasMany') {

                        let otherTable = table[columnName]
                        if (this.isManyToMany(json, tableName, otherTable)) {
                            let associativeTableName = `${tableName}_${otherTable}`
                            let associativeTableNameReverse = `${otherTable}_${tableName}`

                            if (!this.associativeTablesCreated.includes(associativeTableName)) {
                                this.associativeTablesCreated.push(associativeTableName)
                                this.associativeTablesCreated.push(associativeTableNameReverse)
                                this.queries.push(`CREATE TABLE IF NOT EXISTS ${associativeTableName} (id integer not null auto_increment primary key);`)
                                this.relationshipQueries.push(`ALTER table ${associativeTableName} ADD COLUMN ${tableName}_id integer not null;`)
                                this.relationshipQueries.push(`ALTER table ${associativeTableName} ADD FOREIGN KEY (${tableName}_id) REFERENCES ${tableName}(id);`)
                                this.relationshipQueries.push(`ALTER table ${associativeTableName} ADD COLUMN ${otherTable}_id integer not null;`)
                                this.relationshipQueries.push(`ALTER table ${associativeTableName} ADD FOREIGN KEY (${otherTable}_id) REFERENCES ${otherTable}(id);`)
                            }

                        } else {
                            this.relationshipQueries.push(`ALTER table ${otherTable} ADD COLUMN ${tableName}_id integer not null;`)
                            this.relationshipQueries.push(`ALTER table ${otherTable} ADD FOREIGN KEY (${tableName}_id) REFERENCES ${tableName}(id);`)
                        }
                    } else {
                        let type = table[columnName]
                        query += `${columnName} ${type},`
                    }
                }
                this.queries.push(query.slice(0, -1) + ');')
            })

            this.queries.forEach(item => {
                this.runQuery(item)
            });

            this.relationshipQueries.forEach(item => {
                this.runQuery(item)
            });
        } catch (e) {
            console.log(e)
        }
    }

    async generateForm(file, table, props) {
        try {
            let json = this.readFile(file)

            var object = null
            if (props.method === 'put') {
                let results = await this.runQuery(`SELECT * FROM ${table} WHERE id = ${props.id}`)
                object = results[0]
            }

            var form = `<form method='${props.method}' action='${props.action}'>`

            Object.keys(json[table]).forEach((column, index) => {
                let datatype = json[table][column]
                let value = object ? object[column] : ''
                form += `<div>`
                form += `<label for='${column}'>${column}</label>`

                if (datatype.includes('int')) {
                    form += `<input type='number' name='${column}' id='${column}' value='${value}' />`
                } else if (datatype.includes('text')) {
                    form += `<textarea name='${column}' id='${column}'>${value}</textarea>`
                } else {
                    form += `<input type='text' name='${column}' id='${column}' value='${value}' />`
                }

                form += `</div>`
            })

            form += "</form>"
            return form
        } catch (e) {
            console.log(e)
        }
    }

}