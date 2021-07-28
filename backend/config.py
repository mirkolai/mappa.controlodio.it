__author__ = 'mirko'

path = { "todo" : "/data/todo/",
         "done" : "/data/done/",
         "log"  : "/log/"}
twitter ={
    "consumer_key"          : "<consumer_key>",
    "consumer_secret"       : "<consumer_secret>",
    "access_token"          : "<access_token>",
    "access_token_secret"   : "<access_token_secret>",

    "trak"      : ["a","e","i","o","u"],
    "languages" : ["it"],

}


mysql = {
         'host': 'localhost',
         'user': '<USERNAME DB>',
         'passwd': '<PASSWORD DB>',
         'db': 'HS'

}



topic = { "all"  : ["immigrat*","immigrazione","migrant*","stranier*","profug*","terrorismo","terrorist*","islam","mussulman*","corano","rom","nomad*"], #etnichs_group
          "etnichs_group"  : ["immigrat*","immigrazione","migrant*","stranier*","profug*"], #etnichs_group
          "religion"  : ["terrorismo","terrorist*","islam","mussulman*","corano"], #religion
          "roma"  : ["rom","nomad*"], #roma

          }

attribute=['hs']#, 'aggressiveness', 'offensiveness', 'stereotype', 'irony', 'intensity']

