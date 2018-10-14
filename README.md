# Yamaform

Usage example:

```
var Yamaform = require('yamaform')

let databaseConfig = {
  host     : 'localhost',
  user     : 'username',
  password : 'password',
  database : 'database'
}

const yamaform = new Yamaform(databaseConfig)

yamaform.generateTables('database.json')
```

JSON file example:
```
{
    "person": {
        "name": "varchar(45)",
        "age": "integer",
        "hasMany": "dog"
    },
    "dog": {
        "name": "varchar(45)",
        "age": "integer",
        "hasMany": "person"
    },
    "address": {
        "name": "varchar(45)"
    }
}
```

Form creation

Example:
```
var Yamaform = require('yamaform')

let databaseConfig = {
  host     : 'localhost',
  user     : 'root',
  password : 'toor',
  database : 'yamaform'
}

const yamaform = new Yamaform(databaseConfig)

let props = {
  "method":'put',
  "id":1,
  "action":'/',
}

const getForm = async () => {
  let form = await yamaform.generateForm('database.json', 'person', props)
  console.log(form)
}

getForm()
```
