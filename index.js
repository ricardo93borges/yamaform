var fs = require('fs')
var Database = require('./Database')

var relationshipQueries = []
var queries = []
var associativeTablesCreated = []

const readFile = (path) => {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
}

const runQuery = (connection, query) => {
    connection.query(query, (error, results, fields) => {
        if(error)
            console.log(error)
        return results
    })
}

const isManyToMany = (json, currentTable, otherTable) => {
    for(columnName in json[currentTable]){
        if(columnName === 'hasMany' && json[otherTable][columnName] === currentTable){
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
exports.generateTables = (connection, file) => {
    let json = readFile(file)
    var query = ''

    Object.keys(json).forEach( (tableName, index) => {
        query = `create table ${tableName} (id integer not null auto_increment primary key,`
        let table = json[tableName]

        for(columnName in table){
            if(columnName === 'hasOne'){

                let otherTable = table[columnName]
                relationshipQueries.push(`ALTER table ${tableName} ADD COLUMN ${otherTable}_id integer not null;`)
                relationshipQueries.push(`ALTER table ${tableName} ADD FOREIGN KEY (${otherTable}_id) REFERENCES ${otherTable}(id);`)
                
            }else if(columnName === 'hasMany'){

                let otherTable = table[columnName]
                if(isManyToMany(json, tableName, otherTable)){
                    let associativeTableName = `${tableName}_${otherTable}`
                    let associativeTableNameReverse = `${otherTable}_${tableName}`
                    
                    if(!associativeTablesCreated.includes(associativeTableName)){
                        associativeTablesCreated.push(associativeTableName)
                        associativeTablesCreated.push(associativeTableNameReverse)
                        queries.push(`CREATE TABLE ${associativeTableName} (id integer not null auto_increment primary key);`)
                        relationshipQueries.push(`ALTER table ${associativeTableName} ADD COLUMN ${tableName}_id integer not null;`)
                        relationshipQueries.push(`ALTER table ${associativeTableName} ADD FOREIGN KEY (${tableName}_id) REFERENCES ${tableName}(id);`)
                        relationshipQueries.push(`ALTER table ${associativeTableName} ADD COLUMN ${otherTable}_id integer not null;`)
                        relationshipQueries.push(`ALTER table ${associativeTableName} ADD FOREIGN KEY (${otherTable}_id) REFERENCES ${otherTable}(id);`)
                    }

                }else{
                    relationshipQueries.push(`ALTER table ${otherTable} ADD COLUMN ${tableName}_id integer not null;`)
                    relationshipQueries.push(`ALTER table ${otherTable} ADD FOREIGN KEY (${tableName}_id) REFERENCES ${tableName}(id);`)
                }
            }else{
                let type = table[columnName]                
                query += `${columnName} ${type},`
            }         
        }    
        queries.push(query.slice(0, -1)+');')
    })

    queries.forEach( item => {
        runQuery(connection, item)
    });

    relationshipQueries.forEach( item => {
        runQuery(connection, item)
    });
}

exports.generateForm = async (file, table, props) => {
    let json = readFile(file)

    var object = null
    if(props.method === 'put'){
        let database = new Database({host:'localhost', user:'root', password:'toor', database:'yamaform'})
        let results = await database.query(`SELECT * FROM ${table} WHERE id = ${props.id}`)
        object = results[0]
        database.close()
    }
    
    var form = `<form method='${props.method}' action='${props.action}'>`

    Object.keys(json[table]).forEach( (column, index) => {
        let datatype = json[table][column]
        let value = object ? object[column] : ''
        form += `<div>`
        form += `<label for='${column}'>${column}</label>`

        if(datatype.includes('int')){                    
            form += `<input type='number' name='${column}' id='${column}' value='${value}' />`
        }else if(datatype.includes('text')){
            form += `<textarea name='${column}' id='${column}'>${value}</textarea>`
        }else{
            form += `<input type='text' name='${column}' id='${column}' value='${value}' />`
        }

        form += `</div>`
    })

    form += "</form>"
    return form
}
