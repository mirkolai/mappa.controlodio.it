__author__ = 'mirko'

"""
Questo script si occupa di aggiornare l'annotazione automatica nel caso in cui il modello venga sostitutito.
I tweet da ri-annotare sono contenuti nella tabella e devono avere il campo `re-annotate` settato a 1.

I tweet da ri-annotare vengono cancellati dalla tabella di backup (tweet_to_backup), il modello viene aggionato (daily_frequency_topic) e il tweet viene inserito nella
tabella tweet_to_annotate

"""
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
#815331756857561092

cur.execute(" SELECT `id`, topic, `year`, `month`, `day`,"
            " `administrative_division_0`, `administrative_division_1`,"
            " `administrative_division_2` "
            " from tweet_backup where `re-annotate` = 1 ")
tweets=cur.fetchall()


for tweet in tweets:
    print(tweet)
    id=tweet[0]
    topic=tweet[1]
    year=tweet[2]
    month=tweet[3]
    day=tweet[4]
    administrative_division_0=tweet[5]
    administrative_division_1=tweet[6]
    administrative_division_2=tweet[7]

    """
    Ciclo sugli attributi
    """
    for attribute in cfg.attribute:


        """
            Si recupera il label per quell'attributo

        """
        cur.execute(" SELECT  "+attribute+" "
                    " from tweet_backup "
                    " where id=%s and topic=%s",(id,topic))
        result=cur.fetchone()

        label=result[-1]
        #print(attribute,label,topic)

        """
        Si decurta di 1 il valore della coppia attributo
        """
        cur.execute(" UPDATE `daily_frequency_topic` "
                    " SET `"+attribute+"_"+str(label)+"_count`=`"+attribute+"_"+str(label)+"_count`-1 "
                    " WHERE year=%s and month=%s and day=%s and topic=%s and "
                    " `administrative_division_0`=%s and  `administrative_division_1`=%s and "
                    " `administrative_division_2`=%s ",
                    (year,month,day,topic,administrative_division_0,administrative_division_1,administrative_division_2))
        db.commit()

    """
    Si decurta di 1 il valore totale
    """
    cur.execute(" UPDATE `daily_frequency_topic` "
                    " SET `count`=`count`-1 "
                    " WHERE year=%s and  month=%s and  day=%s and  topic=%s and "
                    " `administrative_division_0`=%s and  `administrative_division_1`=%s and "
                    " `administrative_division_2`=%s ",
                    (year,month,day,topic,administrative_division_0,administrative_division_1,administrative_division_2))
    db.commit()

    cur.execute(" INSERT INTO `tweet_to_annotate`"
                " select  `topic`, `id`, `text`,"
                " `is_retweet`, `is_quote`, `is_reply`,"
                " `year`, `month`, `day`, `week_year`,"
                " `administrative_division_0`, `administrative_division_1`, `administrative_division_2` "
                " from tweet_backup where id=%s and topic=%s"
                " on duplicate key update tweet_to_annotate.id=tweet_to_annotate.id",(id,topic))
    db.commit()
    cur.execute("delete from tweet_backup where id=%s and topic=%s",(id,topic))
    db.commit()