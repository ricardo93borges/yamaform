# Yamaform

## Install

```
npm i yamaform --save
```

## Usage

**Instantiate**

```js
var Yamaform = require('yamaform')

let databaseConfig = {
  host     : 'localhost',
  user     : 'username',
  password : 'password',
  database : 'database'
}

const yamaform = new Yamaform(databaseConfig, 'database.json')

yamaform.generateTables()
```

JSON file example:
```js
{
    "person": {
        "name": "varchar(45)",
        "age": "integer",
        "hasMany": "dog",
        "hasOne":"address"
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

**Relationships**

You can specify _many to one_ relationships with **hasOne** keyword and _many to many_ relationships with keyword **hasMany**, on the example above, _person_ has one _address_, so a foreign key called _address_id_ will be created on person table. 

Also a person has many dogs and a dog has many persons, so a associative table called _person_dog_ will be created with the foreign keys _person_id_ and _dog_id_. 

If in json file the dog object didn't have a _hasMany_ keyword, a foreign key called _person_id_ would be created in dog table. 

<hr/>

**Generate form**

```js
let props = {
  "method":'put',
  "id":1,
  "action":'/',
}

const getForm = async () => {
  let form = await yamaform.generateForm('person', props)
  console.log(form)
}

getForm()
```

_generateForm_ method expects a database table name and an object of properties that will be used in the form element

<hr/>

**Fetch data and generate a HTML table**

```js
let props = {
  "tableClass":'my-table-class',
  "id":'my-table-id',
}

const fetch = async () => {
  let table = await yamaform.fetch('person', props)
  console.log(table)
}

fetch()
```
_fetch_ method expects a database table name and an object of properties that will be used in the table element

<hr/>

**Insert data in database**

```js
let data = {
   "tableName":[
      {"columnName":"value", "columnName":"value"},
      {"columnName":"value", "columnName":"value"}
   ],
   "otherTableName":[
      {"columnName":"value", "columnName":"value"},
      {"columnName":"value", "columnName":"value"}
   ]
}

const insert = async () => {
  let result = await yamaform.insert(data)
  console.log(result)
}

insert()
```
_insert_ method expects a json object with table name and data to be inserted into database, returns an array of IDs of the inserted rows

<hr/>

**Update data in database**

```js
let data = {
   "tableName":[
      {"id":"value", "columnName":"value"},
      {"id":"value", "columnName":"value"}
   ],
   "otherTableName":[
      {"id":"value", "columnName":"value"},
      {"id":"value", "columnName":"value"}
   ]
}

const update = async () => {
  let result = await yamaform.update(data)
  console.log(result)
}

update()
```
_update_ method expects a json object with table name and data (must contain the id of the record which will be update) to be inserted into database, returns an array of IDs of the affected rows

<hr/>

**Delete from database**

```js
let data = {
   "tableName":[
      {'where':'id = 34'}
   ],
   "otherTableName":[
      {'where':'name = "john doe" '}
   ]
}

const remove = async () => {
  let result = await yamaform.remove(data)
  console.log(result)
}

remove()
```
_update_ method expects a json object with table name and a WHERE clause to specify a condition to delete records, returns an array of IDs of the affected rows






