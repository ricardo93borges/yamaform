# yamaform
Form generator

Para gerar tables e form \n
`{
  'pessoa':{
    'nome':varchar,
    'idade':int,
    'hasMany':'cachorro',
    'hasOne':'endereco'
  },
  'cachorro':{
    'nome':varchar,
    'idade':int,
    'hasMany':'pessoa'
  },
  'endereco':{
    'nome':'asdf',
    'belongsTo':'pessoa'//opcional
  }
}
`
Propriedades do form
`{
  'method':post,
  'url':'/pessoa',
  'fields'{
    'nome':'asfg',
     'idade':1
  }
}
`
