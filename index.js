var fs = require('fs')
const mysql = require('mysql');
var Database = require('./Database')
module.exports = class Yamaform {

    constructor(databaseConfig, file) {
        this.relationshipQueries = []
        this.queries = []
        this.associativeTablesCreated = []
        this.databaseConfig = databaseConfig
        this.file = file
        this.json = this.readFile(this.file)
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

    isManyToMany(currentTable, otherTable) {
        for (let columnName in this.json[currentTable]) {
            if (columnName === 'hasMany' && this.json[otherTable][columnName] === currentTable) {
                return true
            }
        }
        return false
    }

    /**
     * Generate tables from a json file
     */
    async generateTables() {
        try {
            var query = ''

            Object.keys(this.json).forEach((tableName) => {
                query = `CREATE TABLE IF NOT EXISTS ${tableName} (id integer not null auto_increment primary key,`
                let table = this.json[tableName]

                for (let columnName in table) {
                    if (columnName === 'hasOne') {

                        let otherTable = table[columnName]
                        this.relationshipQueries.push(`ALTER table ${tableName} ADD COLUMN ${otherTable}_id integer not null;`)
                        this.relationshipQueries.push(`ALTER table ${tableName} ADD FOREIGN KEY (${otherTable}_id) REFERENCES ${otherTable}(id);`)

                    } else if (columnName === 'hasMany') {

                        let otherTable = table[columnName]
                        if (this.isManyToMany(tableName, otherTable)) {
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

    /**
     * Generate form from a json file
     * @param  {string} table - The table to which the form must be generated
     * @param  {object} props - Form properties, example: {"method":"post", "action":"/my/form/action"}
     */
    async generateForm(table, props) {
        try {

            var object = null
            if (props.method === 'put') {
                let results = await this.runQuery(`SELECT * FROM ${table} WHERE id = ${props.id}`)
                object = results[0]
            }

            var form = `<form method='${props.method}' action='${props.action}'>`

            Object.keys(this.json[table]).forEach((column) => {
                let datatype = this.json[table][column]
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

     /**
     * Fetch and generate a HTLM table with results
     * @param  {string} table - The table to which the form must be generated
     * @param  {object} props - Table properties
     */
    async fetch(table, props) {
        let columns = Object.keys(this.json[table])
        let results = await this.runQuery(`SELECT * FROM ${table}`)
        var htmlTable = '<table><thead><tr>'

        columns.forEach((column) => {
            if(column !== 'hasMany' && column !== 'hasOne')
                htmlTable += `<td>${column}</td>`
        })

        htmlTable += '</tr></thead><tbody>'

        for(let i=0; i<results.length; i++){
            htmlTable += '<tr>'
            columns.forEach((column) => {
                if(column !== 'hasMany' && column !== 'hasOne')
                    htmlTable += `<td>${results[i][column]}</td>`
            })        
            htmlTable += '</tr>'
        }

        htmlTable += '</tbody></table>'
        return htmlTable    
    }


}