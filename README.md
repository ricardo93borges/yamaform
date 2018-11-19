# Yamaform

## Install

```
npm i yamaform --save
```

## Usage

A usage example can be found at https://github.com/ricardo93borges/yamaform-example

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

//Generate tables using "database.json" file
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

In _many to many_ relationships both tables must have a _name_ column.

Every table created will have a column called _id_ that will be a primary key auto incremented

If a table has more then one _many to one_ relationship use **hasOne: [table1,table2]**

<hr/>

**Generate form**

```js
let props = {
  "method":'put',
  "id":1, //Used when method is put
  "action":'/',
  'formClass':'', //Optional
  'labelClass':'', //Optional
  'inputClass':'', //Optional
  'inputWrapperClass':'', //Optional 
  'buttonClass':'', //Optional
  'buttonText':'', //Optional
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
  "tableClass":'', // Optional
  'viewUrl':'/your/url', // Optional, url to view record, will become /your/url/(record id)
  'deleteUrl':'/your/url', // Optional, url to delete record, will become /your/url/(record id)
  'tableClass':'', // Optional
  'viewText':'', // Optional, text for link to view, default: view
  'deleteText':'' // Optional, text for link to delete, default: delete
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






