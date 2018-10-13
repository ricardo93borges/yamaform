var fs = require('fs')

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

exports.generateTables = (connection) => {
    let json = readFile('file.json')
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
