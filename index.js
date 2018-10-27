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
     * @param  {object} props - Form properties, example: {
     *                                              "method":"post", 
     *                                              "action":"/my/form/action", 
     *                                              'formClass':'', 
     *                                              'labelClass':'', 
     *                                              'inputClass':'' 
     *                                              'inputWrapperClass':'', 
     *                                              'buttonClass':'',
     *                                              'buttonText':'',
     *                                          }
     * @returns HTML form
     */
    async generateForm(table, props) {
        try {

            var form = `<form method='post' action='${props.action}' class='${props.formClass}'><fieldset><legend>${table}</legend>`
            var object = null
            if (props.method === 'put') {
                let results = await this.runQuery(`SELECT * FROM ${table} WHERE id = ${props.id}`)
                object = results[0]
                form += `<input type='hidden' name='id' value='${props.id}' />`
            }

            Object.keys(this.json[table]).forEach((column) => {

                if( column === 'hasMany') return

                let datatype = this.json[table][column]
                let value = object ? object[column] : ''
                let name = column

                if(column === 'hasOne'){                
                    datatype = this.json[table][column]
                    value = object ? object[datatype+'_id'] : ''
                    form += `<div class='${props.inputWrapperClass}'>`
                    form += `<label for='${datatype}' class='${props.labelClass}'>${datatype}</label>`
                }else{                    
                    form += `<div class='${props.inputWrapperClass}'>`
                    form += `<label for='${column}' class='${props.labelClass}'>${column}</label>`
                }
                
                if(column === 'hasOne'){
                    form += `<input type='number' name='${datatype}' id='${datatype}' value='${value}' class='${props.inputClass}'/>`
                } else if (datatype.includes('int')) {
                    form += `<input type='number' name='${column}' id='${column}' value='${value}' class='${props.inputClass}'/>`
                } else if (datatype.includes('text')) {
                    form += `<textarea name='${column}' id='${column}' class='${props.inputClass}'>${value}</textarea>`
                } else {
                    form += `<input type='text' name='${column}' id='${column}' value='${value}' class='${props.inputClass}'/>`
                }

                form += `</div>`
            })

            form += `<div class='${props.inputWrapperClass}'><input type='submit' name='submit' value='${props.buttonText ? props.buttonText : "Submit"}' class='${props.buttonClass}' /></div></fieldset></form>`

            return form
        } catch (e) {
            console.log(e)
        }
    }

     /**
     * Fetch and generate a HTLM table with results
     * @param  {string} table - The table to which the form must be generated
     * @param  {object} props - Table properties, example: {'viewUrl':'/view', 'deleteUrl':'/delete', 'tableClass':'my-table', 'viewText':'', 'deleteText':''}
     * @returns HTML table
     */
    async fetch(table, props) {
        let columns = Object.keys(this.json[table])
        let results = await this.runQuery(`SELECT * FROM ${table}`)
        var htmlTable = `<table class="${props.tableClass}"><thead><tr>`

        columns.forEach((column) => {
            if(column !== 'hasMany' && column !== 'hasOne')
                htmlTable += `<th>${column}</th>`            
        })

        if(props.viewUrl)
            htmlTable += `<th>${props.viewText ? props.viewText : 'View'}</th>`
        if(props.deleteUrl)
            htmlTable += `<th>${props.deleteText ? props.deleteText : 'Delete'}</th>`

        htmlTable += '</tr></thead><tbody>'

        for(let i=0; i<results.length; i++){
            htmlTable += '<tr>'
            columns.forEach((column) => {
                if(column !== 'hasMany' && column !== 'hasOne')
                    htmlTable += `<td>${results[i][column]}</td>`                
            })
            if(props.viewUrl)
                htmlTable += `<td><a href="${props.viewUrl+'/'+results[i]['id']}">${props.viewText ? props.viewText : 'View'}</a></td>`
            if(props.deleteUrl)
                htmlTable += `<td><a href="${props.deleteUrl+'/'+results[i]['id']}">${props.deleteText ? props.deleteText : 'Delete'}</a></td>`
            htmlTable += '</tr>'
        }

        htmlTable += '</tbody></table>'
        return htmlTable    
    }

    /**
     * Insert into data base
     * @param  {object} data - Data to be insert, example: 
     *   {
     *    "tableName":[{"columnName":"value", "columnName":"value"},{"columnName":"value", "columnName":"value"}]
     *   }
     * @returns IDs of inserted rows
    */
    async insert(data){
        try{
            var queries = []
            for(let table in data){            
                
                for(let obj in data[table]){                    
                    var columns = []
                    var values = []
                    
                    for(let key in data[table][obj]){                        
                        let val = data[table][obj][key]                                    
                        let value = typeof val === 'string' ? `"${val}"` : val 
                        columns.push(key)
                        values.push(value)                        
                    }
                    queries.push(`INSERT INTO ${table} (${columns.join(',')}) VALUES(${values.join(',')});`)
                }
            }

            var ids = []
            for(let key in queries){
                let result = await this.runQuery(queries[key])
                ids.push(result.insertId)
            }
            return ids
        }catch(e){
            console.log(e)
        }
    }

    /**
     * Update database
     * @param  {object} data - Data to be update, example: 
     *   {
     *    "tableName":[{"columnName":"value", "columnName":"value"},{"columnName":"value", "columnName":"value"}]
     *   }
     * @returns number of affected rows
    */
   async update(data){
        try{            
            var queries = []
            for(let table in data){            
                    
                for(let obj in data[table]){                                    
                    var columns = Object.keys(data[table][obj])
                    if(!columns.includes('id')){
                        console.log('missing id value')
                        return false
                    }

                    var values = []
                    var where = "WHERE id = "
                    
                    for(let key in data[table][obj]){                    
                        let val = data[table][obj][key]                                    
                        let value = typeof val === 'string' ? `"${val}"` : val

                        if(key === 'id'){
                            where += value 
                            continue
                        }

                        values.push(`${key} = ${value}`)
                    }
                    queries.push(`UPDATE ${table} SET ${values.join(',')} ${where} ;`)
                }
            }

            var affectedRows = 0
            for(let key in queries){
                let result = await this.runQuery(queries[key])
                affectedRows += result.affectedRows
            }
            return affectedRows

        }catch(e){
            console.log(e)
        }
    }

    /**
     * Delete from database
     * @param  {object} data - Data to be insert, example: 
     *   {
     *    "tableName":[{"id":1},{"where":" name = 'john' "}]
     *   }
     * @returns number of affected rows
    */
   async remove(data){
    try{            
        var queries = []
        for(let table in data){            
                        
            for(let obj in data[table]){                                    
                
                for(let key in data[table][obj]){                    
                    let val = data[table][obj][key]                                    
                    queries.push(`DELETE FROM ${table} WHERE ${val} ;`)
                }
                
            }
        }
        console.log('Q: ',queries)

        var affectedRows = 0
        for(let key in queries){
            let result = await this.runQuery(queries[key])
            affectedRows += result.affectedRows
        }
        return affectedRows

    }catch(e){
        console.log(e)
    }
}

}