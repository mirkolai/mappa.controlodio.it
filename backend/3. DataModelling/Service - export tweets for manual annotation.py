__author__ = 'mirko'

"""
Questo script si occupa di aggiornare l'annotazione automatica nel caso in cui il modello venga sostitutito.
I tweet da ri-annotare sono contenuti nella tabella e devono avere il campo `re-annotate` settato a 1.

I tweet da ri-annotare vengono cancellati dalla tabella di backup (tweet_to_backup), il modello viene aggionato (daily_frequency_topic) e il tweet viene inserito nella
tabella tweet_to_annotate

"""
import pymysql
import os,sys,inspect
from difflib import SequenceMatcher
from datetime import datetime, timedelta

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

today = datetime.now()

#last_week = today - timedelta(days=7)


#current_year=last_week.year
#current_month=last_week.month
current_year=2019
current_month=4

print(current_year,current_month)


cur.execute("""DELETE
FROM `tweet_to_manual_annotation` WHERE `year`=%s AND `month`=%s """, (current_year, current_month))
db.commit()

cur.execute(" SELECT `id`,`text`, hs "
            " from tweet_backup where topic='all' and `year`=%s and `month`=%s order by rand()",(current_year,current_month))
tweets=cur.fetchall()

dict_hs={"yes":{},"no":{} }
i=len(tweets)
for tweet in tweets:
    i-=1
    #print(tweet)
    id=tweet[0]
    text=tweet[1]
    hs=tweet[2]
    print(i, len(dict_hs[hs].keys()))

    is_new=True

    if len(dict_hs[hs].keys())<1000:
        for key, value in dict_hs[hs].items():

            s = SequenceMatcher(None, text, value)
            similarity= s.ratio()
            if similarity>0.5:
                #print("similarity: ",similarity)
                #print("tweet 1: ",text)
                #print("tweet 2: ",value)
                is_new=False

        if is_new:
            dict_hs[hs][id]=text

for hs in ['yes','no']:
    for key, value in dict_hs[hs].items():

        cur.execute("""INSERT
        INTO
        `tweet_to_manual_annotation`(`id`, `text`, `hs`,`year`,`month`)
        VALUES(%s,%s,%s,%s,%s)""",(key,value,hs,current_year,current_month))
        db.commit()
