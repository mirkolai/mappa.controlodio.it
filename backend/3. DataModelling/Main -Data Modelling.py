__author__ = 'mirko'

import pymysql

import os,sys,inspect

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0,parentdir)
import config as cfg

db = pymysql.connect(host=cfg.mysql['host'],
                     user=cfg.mysql['user'],
                     passwd=cfg.mysql['passwd'],
                     db=cfg.mysql['db'],
                     charset='utf8mb4'#,
                     #use_unicode=True
                     )
cur = db.cursor()
cur.execute('SET NAMES utf8mb4')
cur.execute("SET CHARACTER SET utf8mb4")
cur.execute("SET character_set_connection=utf8mb4")
db.commit()


#la stampa
#repubblica
#corriere
#giornale
#fatto
#libero

"""
Questo script si occupa di modelizzare i tweet annotati automaticamente.

"""




"""

la tabella tweet_to_model contiene i tweet annotati automaticamente.

"""

cur.execute(" SELECT `id`, topic, `year`, `month`, `day`, `week_year`,"
            " `administrative_division_0`, `administrative_division_1`,"
            " `administrative_division_2`  "
            " from tweet_to_model where `hs` is not NULL")# AND `aggressiveness`is not NULL AND `offensiveness` is not NULL AND `stereotype` is not NULL AND `irony`is not NULL AND `intensity`is not NULL")
tweets=cur.fetchall()


for tweet in tweets:

    id=tweet[0]

    topic=tweet[1]

    """

     Un ciclo per ogni attributo:  hs, aggressiveness etc..

    """
    for attribute in cfg.attribute:

        cur.execute(" SELECT  "+attribute+" "
                    " from tweet_to_model "
                    " where id=%s and topic=%s",(id,topic))
        result=cur.fetchone()


        label=result[-1]
        print(attribute,label,topic)

        """
        Viene conteggiato giornalmente il numero di label per ogni attributo.
        Viene fatta anche una suddivisione geografica.

        """


        cur.execute("INSERT INTO `daily_frequency_topic`"
                    "(`topic`,`year`, `month`, `day`, `week_year`,"
                    " `administrative_division_0`, `administrative_division_1`,"
                    " `administrative_division_2`, "
                    " `"+attribute+"_"+str(label)+"_count`) "
                    " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)"
                    " on duplicate key update `"+attribute+"_"+str(label)+"_count`=`"+attribute+"_"+str(label)+"_count`+1 ",
                    tuple([topic])+tweet[2:]+tuple([1]))
        db.commit()



    """
     Qui viene calcolato il conteggio assoluto giornaliero (indipendentemente dall'attributo).
     La somma dei conteggi dei label di un singolo attributo restituiranno il valore del campo `count`.
    """

    cur.execute(" UPDATE `daily_frequency_topic` SET `count`=`count`+1 "
                " where topic=%s and year=%s and month=%s and day=%s and"
                " `week_year`=%s and "
                " `administrative_division_0`=%s and  `administrative_division_1`=%s and "
                " `administrative_division_2`=%s "
                ,tuple([topic])+tweet[2:]
                )
    db.commit()


    """
    Quando le invormazioni del tweet vengono aggregate al conteggio giornaliero, il tweet viene 'backuppato'

    """

    cur.execute(" INSERT INTO `tweet_to_daily_token_frequency`"
                " select  *, 0 "
                " from tweet_to_model where id=%s and topic=%s"
                " on duplicate key update tweet_to_daily_token_frequency.id=tweet_to_daily_token_frequency.id",(id,topic))
    db.commit()
    cur.execute("delete from tweet_to_model where id=%s and topic=%s",(id,topic))
    db.commit()
