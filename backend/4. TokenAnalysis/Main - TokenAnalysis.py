from nltk import word_tokenize

__author__ = 'mirko'

import pymysql
import traceback
import logging
import os,sys,inspect
import re
import nltk
nltk.download('stopwords')
#nltk.download('punkt')
from nltk.corpus import stopwords

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


"""
Questo script si occupa di monitorare la frequenza gionaliera di word, hashtag e mention.

"""

#elimina token che nello storico sono poco significativi
cur.execute(" DELETE FROM daily_word_frequency " 
            " WHERE `count` <= 10")
db.commit()
#elimina token che nello storico sono poco significativi
cur.execute(" DELETE FROM daily_co_occurrence_word_frequency " 
            " WHERE `count` <= 10")
db.commit()

def extract_hashtags(text):
    return re.findall("#(\w+)",text.lower())


def extract_mentions(text):
    return re.findall("@(\w+)",text.lower())

def extract_words(text,stop_words,keywords):

    text=re.sub(u"(https|http)?:\/\/(\w|\.|\/|\?|\=|\&|\%)*\b"," ",text)
    text = re.sub(u"[^a-záàâåãäçèéêëìíîïñòóùúüÿßøæ#@]"," ",text)

    filtered_sentence = []

    for w in text.split(" "):
        if w not in stop_words and len(w)>2 and len(w)<100:
            flag = True

            for keyword in keywords:
                if "*" in keyword:
                    if re.findall(u""+keyword.replace("*", "") +"[haei]{1,2}", w.strip()):
                        flag = False
                elif "#" in keyword:
                    if re.findall(u""+ keyword + "[rtaeio]{2}", w.strip()):
                        flag = False
                elif re.findall(u""+ keyword +"", w.strip()):
                    flag = False

            if flag:
                filtered_sentence.append(w)

    return filtered_sentence



cur.execute(" SELECT `id`, topic, `text`, `year`, `month`, `day`, `week_year`,"
            " `administrative_division_0`, `administrative_division_1`,"
            " `administrative_division_2`  "
            " from tweet_to_daily_token_frequency where `hs` is not NULL "
            " order by year desc, month desc, day desc"
            " limit 0,1000000 ")# AND `aggressiveness`is not NULL AND `offensiveness` is not NULL AND `stereotype` is not NULL AND `irony`is not NULL AND `intensity`is not NULL")
tweets=cur.fetchall()


stop_words = list(stopwords.words('italian'))+['https','http',"solo","senza","essere"]

for tweet in tweets:
    #print(tweet[2].lower())
    try:
        id=tweet[0]

        topic=tweet[1]

        text=tweet[2].lower()

        year=tweet[3]
        month=tweet[4]
        day=tweet[5]



        """
         Un ciclo per ogni attributo:  hs, aggressiveness etc..
    
        """
        for attribute in cfg.attribute:


            cur.execute(" SELECT  "+attribute+" "
                        " from tweet_to_daily_token_frequency "
                        " where id=%s and topic=%s",(id,topic))
            result=cur.fetchone()


            label=result[-1]
            #print(attribute,label,topic,text)

            for h in extract_hashtags(text):
                cur.execute("INSERT INTO "
                            "`daily_hashtag_frequency`(`token`, `topic`, `year`, `month`, `day`, `count_"+attribute+"_"+label+"`) "
                            " VALUES (%s,%s,%s,%s,%s,%s)"
                            " on duplicate key update `count` = `count`+1 , `count_"+attribute+"_"+label+"`=`count_"+attribute+"_"+label+"`+1",
                            (h,topic,year,month,day,1))
                db.commit()


            for m in extract_mentions(text):
                cur.execute("INSERT INTO "
                            "`daily_mention_frequency`(`token`, `topic`, `year`, `month`, `day`, `count_" + attribute + "_" + label + "`) "
                            " VALUES (%s,%s,%s,%s,%s,%s)"
                            " on duplicate key update `count` = `count`+1 , `count_" + attribute + "_" + label + "`=`count_" + attribute + "_" + label + "`+1",
                            (m,topic,year,month,day,1))
                db.commit()

            for w in extract_words(text,stop_words,cfg.topic[topic]):

                if w not in extract_hashtags(text) and w not in extract_mentions(text):
                    cur.execute("INSERT INTO "
                                "`daily_word_frequency`(`token`, `topic`, `year`, `month`, `day`, `count_" + attribute + "_" + label + "`) "
                                " VALUES (%s,%s,%s,%s,%s,%s)"
                                " on duplicate key update `count` = `count`+1 , `count_" + attribute + "_" + label + "`=`count_" + attribute + "_" + label + "`+1",
                                (w,topic,year,month,day,1))
                    db.commit()

            words = extract_words(text, stop_words, cfg.topic[topic])
            for i in range(0,len(words)):
                for j in range(i,len(words)):
                    if i != j:
                        first =  words[j] if words[j]  < words[i]  else words[i]
                        second = words[j] if words[i]  < words[j]  else words[i]

                        cur.execute(" INSERT INTO "
                                    " `daily_co_occurrence_word_frequency` "
                                    " (`token_1`,`token_2`, `topic`, `year`, `month`, `day`, `count_" + attribute + "_" + label + "`) "
                                    " VALUES (%s,%s,%s,%s,%s,%s,%s)"
                                    " on duplicate key update `count` = `count`+1 ,"
                                    " `count_" + attribute + "_" + label + "`=`count_" + attribute + "_" + label + "`+1",
                                    (first, second, topic, year, month, day, 1))
                        db.commit()


    except Exception:
        print(id,topic,attribute)
        print(traceback.format_exc())
        continue

    """
    Quando le invormazioni del tweet vengono aggregate al conteggio giornaliero, il tweet viene 'backuppato'

    """

    cur.execute(" INSERT INTO `tweet_backup`"
                " select  * "
                " from tweet_to_daily_token_frequency where id=%s and topic=%s"
                " on duplicate key update tweet_backup.id=tweet_backup.id",(id,topic))
    db.commit()
    cur.execute("delete from tweet_to_daily_token_frequency where id=%s and topic=%s",(id,topic))
    db.commit()



#elimina token che nello storico sono poco significativi
cur.execute(" DELETE FROM daily_word_frequency " 
            " WHERE `count` <= 10")
db.commit()
#elimina token che nello storico sono poco significativi
cur.execute(" DELETE FROM daily_co_occurrence_word_frequency " 
            " WHERE `count` <= 10")
db.commit()
