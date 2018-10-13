# yamaform

Usage example:

`var yamaform = require('yamaform')`

`var mysql      = require('mysql')`

`var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'username',
  password : 'password',
  database : 'database_name'
})`

`yamaform.generateTables(connection, 'database.json')`

`connection.end()`

JSON file example:

`{
  'person':{
    'name':varchar(45),
    'age':integer,
    'hasMany':'dog',
    'hasOne':'address'
  },
  'dog':{
    'name':varchar(45),
    'age':integer,
    'hasMany':'person'
  },
  'address':{
    'name':'varchar(45)'
  }
}
`

Form properties

`{
  'method':post,
  'url':'/pessoa',
  'fields'{
    'nome':'asfg',
     'idade':1
  }
}
`
