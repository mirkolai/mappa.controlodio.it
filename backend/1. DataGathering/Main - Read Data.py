__author__ = 'mirko'
# -*- coding: utf-8 -*-
import json
import glob
import gzip
import traceback
import shutil
from datetime import datetime
import re
import utils
import pymysql
import os,sys,inspect


"""
sudo pip3 install oauth2
sudo pip3 install pymysql
sudo pip3 install pyproj
sudo pip3 install pyshp
sudo pip3 install numpy

"""
currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0,parentdir)
import config as cfg
"""
Secondo modulo del Data Gathering.
Questo script si occupa di leggere i dati raccolti da Main - StreamAPI.py in formato .twita.gz e di inserire i dati in un database SQL.
Le credenziali di accesso ad database devono essere definite nel file config.py nella seguente forma:

esempio:
mysql = {
         'host': 'localhost',
         'user': 'user',
         'passwd': 'password',
         'db': 'HS'

}

Il file config.py conterrà anche i topic di interesse e le parole chiave per identificare ogni topic.

Ad esempio:
topic = { "etnichs_group"  : ["immigrat*","immigrazione","migrant*","stranier*","profug*"], #etnichs_group
          "religion"  : ["terrorismo","terrorist*","islam","mussulman*","corano"], #religion
          "roam"  : ["rom","nomad*"], #roma

          }

il file config.py conterrà anche il path dove devono essere recuperati i file .twita.gz e dove dovranno essere spostati dopo la lettura e l'analisi:

path = { "todo" : "day/", dati da elaborare
         "done" : "backup/",} i dati verranno spostati in questa cartella una volta elaborati


"""




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


path_todo=cfg.path['todo']
path_done=cfg.path['done']

print(currentdir+path_todo)
print(currentdir+path_done)
filelist = sorted(glob.glob(currentdir+path_todo+"*.twita.gz"))

print(filelist)

"""
filelist contiene la lista di file .twita.gz presenti nel path 'todo'
"""

for file in filelist:
    print(file)
    infile = gzip.open(file, 'rb')
    """
    Se la lettura del file termina con successo, il file viene spostato nella cartella di backup 'done'.
    Se l'esecuzione dello script si interrompe prima che il file venga 'backuppato' e necessario ripulire le tabelle
    daily_frequency e daily_virality  per impedire che gli stessi tweet vengano contati più volte nelle frequenze giornaliere
    La pulizia viene effettuata nelle seguenti righe.
    
    
        cur.execute("DELETE FROM `daily_frequency` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        print("DELETE FROM `daily_frequency` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        db.commit()
        cur.execute("DELETE FROM `daily_virality` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        db.commit()
        
    """

    year=int(file.split("/")[-1][0:4])
    print(year)
    month=int(file.split("/")[-1][5:7])
    print(month)
    day=int(file.split("/")[-1][8:10])
    print(day)

    """
        posso elaborare solo i dati a partire dal giorno precedente.
        NON posso elaborare i dati del giorno corrente perché sono in fase di raccolta.
        
        if  todo<today:

    """
    today = datetime.now()
    todo = datetime(year=year, month=month, day=day, hour=23, minute=59, second=59, microsecond=999999)
    print(today,todo,todo<today)


    if  todo<today:

        """
        Ripulire le tabelle daily_frequency e daily_virality  per impedire che gli stessi tweet vengano contati 
        più volte nelle frequenze giornaliere.
        
        """

        cur.execute("DELETE FROM `daily_frequency` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        db.commit()
        cur.execute("DELETE FROM `daily_virality` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        db.commit()
        cur.execute("DELETE FROM `tweet_to_annotate` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        db.commit()
        cur.execute("DELETE FROM `tweet_to_model` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        db.commit()
        cur.execute("DELETE FROM `tweet_backup` where `year`=%s and `month`=%s and `day`= %s",(year,month,day))
        db.commit()

        try:

            """
            NB. ogni riga di un file .twita.gz contiene un JSON di un tweet
            """
            for row in infile:

                try:
                    jsonTweet = json.loads(row.decode("utf-8"))

                    if jsonTweet["lang"]=="it":

                        #print(json.dumps(jsonTweet,2))
                        #date = datetime.fromtimestamp(int(jsonTweet['timestamp_ms'])/1000) #dal 2017
                        if 'timestamp_ms' in jsonTweet:
                            date = datetime.fromtimestamp(int(jsonTweet['timestamp_ms']) / 1000)  # dal 2017
                        else:
                            date=datetime.strptime(jsonTweet["created_at"], '%a %b %d %H:%M:%S %z %Y') #prima del 2017

                        """
                        Importante usare la conversione giusta perché bisogna tenere conto del nostro fuso orario.
                        
                        Se un tweet è stato postato alle 0:00 del fuso orario Rome (GMT+1) o (GMT+2),
                        A causa della conversione verrebbero cancellati i conteggi delle frequenze del giorno precedente.
                        
                        """

                        #date=datetime.strptime(jsonTweet["created_at"], '%a %b %d %H:%M:%S %z %Y') #prima del 2017
                        #print(date)
                        year  = date.year
                        month = date.month
                        day = date.day
                        week_year = date.isocalendar()[1]
                        #print(date, year, month, day, week_year, jsonTweet['created_at'])

                        """
                        
                        Si occupa di recuperare il codice istat dell'eventuale entità territoriale associata al tweet
                        
                        """
                        admininistration_level_0,admininistration_level_1,admininistration_level_2,admininistration_level_3=\
                            utils.getIstatCode(jsonTweet,year)

                        #se il tweet non è stato postato in Italia consideriamo solo il codice nazione

                        """
                        Dentro questo ciclo vengono iterati i topic definiti nel file config.py
                        I tweet sono associati ad un topic e salvati nel database (tabella tweet_temp) se contengono almeno una delle parole di uno dei topic
                        NB. lo stesso tweet può essere associato a più topic
                        """
                        for topic, keywords in cfg.topic.items():
                            flag=False

                            """
                            Se il testo del tweet è troncato viene recuperato il testo intero
                            se è un tweet viene recuperato il testo originale
                            """
                            if jsonTweet.get('retweeted_status'):
                                if jsonTweet["retweeted_status"]["truncated"]==False:
                                   text=jsonTweet["retweeted_status"]["text"]
                                else:
                                   #print(jsonTweet)
                                   text=jsonTweet["retweeted_status"]["extended_tweet"]["full_text"]
                            else:
                                if jsonTweet["truncated"] == False:
                                    text = jsonTweet["text"]
                                else:
                                    # print(jsonTweet)
                                    text = jsonTweet["extended_tweet"]["full_text"]

                            """
                            Il tweet deve contenere almeno una parola della lista di keword del topic
                            """
                            flag=False
                            for keyword in keywords:
                                if "*" in keyword:
                                    if re.findall(u"[^a-zàèéòìù]"+keyword.replace("*","")+"[haei]{1,2}[^a-zàèéòìù]",text.lower()):
                                        flag=True

                                elif "#" in keyword:
                                    if re.findall(u"[^a-zàèéòìù]"+keyword+"[rtaeio]{2}[^a-zàèéòìù]",text.lower()):
                                        flag=True
                                elif re.findall(u"[^a-zàèéòìù]"+keyword+"[^a-zàèéòìù]",text.lower()):
                                    flag=True

                            """
                            Se il tweet contiene almeno una delle parole del topic
                            """
                            if flag:
                                id=jsonTweet["id"]
                                #print(text,topic)

                                """
                                daily_virality contiene il numero di retweet, reply e quote ricevuti giornalmente da ogni tweet
                                Il tweet è salvato solo se retweet+reply+quote>0

                                """

                                """

                                Se il tweet è un retweet

                                """
                                is_retweet=0
                                if  jsonTweet.get('retweeted_status'):
                                    is_retweet=1
                                    #id=jsonTweet['retweeted_status']['id']

                                    if jsonTweet['retweeted_status']["truncated"]==False:
                                       text=jsonTweet['retweeted_status']["text"]
                                    else:
                                       #print(jsonTweet)
                                       text=jsonTweet['retweeted_status']["extended_tweet"]["full_text"]

                                    retwetted_admininistration_level_0,retwetted_admininistration_level_1,\
                                    retwetted_admininistration_level_2,retwetted_admininistration_level_3=\
                                        utils.getIstatCode(jsonTweet['retweeted_status'],year)

                                    cur.execute(" INSERT INTO `daily_virality`(`topic`,`id`, `user_id`,"
                                                " `retweet`, `quote`, `reply`, `year`, `month`, `day`, `week_year`, "
                                                " `administrative_division_0`, `administrative_division_1`,"
                                                " `administrative_division_2`) "
                                                " VALUES "
                                                " (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
                                                " on duplicate key update retweet=retweet+1",
                                                (topic, jsonTweet['retweeted_status']['id'],jsonTweet['user']['id'],1,0,0,year,month,day,week_year,
                                             retwetted_admininistration_level_0,retwetted_admininistration_level_1,
                                             retwetted_admininistration_level_2))
                                    db.commit()


                                """

                                Se il tweet è una quote

                                """
                                is_quote=0
                                if jsonTweet.get('quoted_status'):
                                    is_quote=1

                                    quoted_admininistration_level_0,quoted_admininistration_level_1, \
                                    quoted_admininistration_level_2,quoted_admininistration_level_3=\
                                        utils.getIstatCode(jsonTweet['quoted_status'],year)


                                    cur.execute(" INSERT INTO `daily_virality`(`topic`,`id`, `user_id`,"
                                                " `retweet`, `quote`, `reply`, `year`, `month`, `day`, `week_year`, "
                                                " `administrative_division_0`, `administrative_division_1`,"
                                                " `administrative_division_2`) "
                                                " VALUES "
                                                " (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
                                                " on duplicate key update quote=quote+1",
                                                (topic,jsonTweet['quoted_status']['id'],jsonTweet['quoted_status']['user']['id'],0,1,0,year,month,day,week_year,
                                                 quoted_admininistration_level_0,quoted_admininistration_level_1,
                                                 quoted_admininistration_level_2))
                                    db.commit()

                                """

                                Se il tweet è un reply

                                """
                                is_reply=0
                                if not jsonTweet['in_reply_to_status_id'] is None:
                                    is_reply=1

                                    jsonTweet['replied_status']=utils.getJsonFromId(jsonTweet['in_reply_to_status_id'])
                                    #print(jsonTweet['replied_status'])
                                    #print(jsonTweet['replied_status'])
                                    #print(jsonTweet['replied_status']['place'])
                                    if jsonTweet['replied_status'] is not None:
                                        replied_admininistration_level_0,replied_admininistration_level_1, \
                                        replied_admininistration_level_2,replied_admininistration_level_3=\
                                            utils.getIstatCode(jsonTweet['replied_status'],year)
                                        #print(replied_admininistration_level_0,replied_admininistration_level_1,
                                        #replied_admininistration_level_2,replied_admininistration_level_3)
                                    else:
                                        replied_admininistration_level_0=replied_admininistration_level_1= \
                                        replied_admininistration_level_2=replied_admininistration_level_3 = ""

                                    cur.execute(" INSERT INTO `daily_virality`(`topic`,`id`, `user_id`,"
                                                " `retweet`, `quote`, `reply`, `year`, `month`, `day`, `week_year`, "
                                                " `administrative_division_0`, `administrative_division_1`,"
                                                " `administrative_division_2`) "
                                                " VALUES "
                                                " (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
                                                " on duplicate key update reply=reply+1",
                                                (topic,jsonTweet['in_reply_to_status_id'],jsonTweet['in_reply_to_user_id'],0,0,1,year,month,day,week_year,
                                                 replied_admininistration_level_0,replied_admininistration_level_1,
                                                 replied_admininistration_level_2))
                                    db.commit()

                                """
                                    Infine, il tweet viene salvato nella tabella `tweet_to_annotate` in attesa che venga annotato
                                    nella fase 2. Automatic annotation

                                """

                                cur.execute("INSERT INTO `tweet_to_annotate`"
                                            "(`topic`,`id`, `text`, `is_retweet`, `is_quote`, `is_reply`,"
                                            "`year`, `month`, `day`, `week_year`, "
                                            "`administrative_division_0`, `administrative_division_1`,"
                                            " `administrative_division_2`)"
                                            " VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
                                            " on duplicate key update id=id",
                                            (topic,id,text,is_retweet,is_quote,is_reply,
                                             year,month,day,week_year,
                                             admininistration_level_0,admininistration_level_1,
                                             admininistration_level_2
                                             ))


                        """

                        `daily_frequency` viene aggiornato una sola volta (non una volta per topic, ed indipendentemente da esso.
                         infatti, viene tenuta traccia di tutti i tweet raccolti da Main - Stream API).
                         Ogni record conterrà il numero di tweet giornaliero raccolto per ogni suddivisione amministrativa.

                        """

                        cur.execute("INSERT INTO `daily_frequency`"
                                    "(`year`, `month`, `day`, `week_year`,"
                                    " `administrative_division_0`, `administrative_division_1`,"
                                    " `administrative_division_2`,`count`) "
                                    " VALUES (%s,%s,%s,%s,%s,%s,%s,1)"
                                    " on duplicate key update `count`=`count`+1 ",
                                    (year,month,day,week_year,
                                     admininistration_level_0,
                                     admininistration_level_1,
                                     admininistration_level_2
                        ))
                        db.commit()

                except Exception:
                    print(traceback.format_exc())
                    continue


        except Exception:
            print(traceback.format_exc())
            continue

        """
        Se l'analisi del file .twita.gz termina con successo, il file viene spostato nella cartella di backup
        """
        shutil.move(file, currentdir+path_done+file.split("/")[-1])
