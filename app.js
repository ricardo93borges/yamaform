var yamaform = require('./index')

var mysql      = require('mysql')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'toor',
  database : 'yamaform'
})
 
connection.connect()

yamaform.generateTables(connection)

connection.end()