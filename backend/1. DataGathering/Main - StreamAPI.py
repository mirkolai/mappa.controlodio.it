# -*- coding: iso-8859-15 -*-
__author__ = 'mirko'

from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream
import json
import traceback
import logging
import codecs
import gzip
import glob
from datetime import datetime
import shutil
import time

import os,sys,inspect
currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0,parentdir)

import config as cfg

"""
Primo  modulo del Data Gathering.
Lo script si occupa di raccogliere tweet tramite le Stream API.
Il file config.py contiene le informazioni necessarie a stabilire la connessione (credenziali di accesso e keyword)

twitter ={
    "consumer_key"          : "",
    "consumer_secret"       : "",
    "access_token"          : "",
    "access_token_secret"   : "",

    "trak"      : ["a","e","i","o","u"],
    #"track"    : ["vita","Roma","forza","alla","quanto","amore","Milano","Italia","fare","grazie","della","anche","periodo","bene","scuola","dopo","tutto","ancora","tutti","fatto"],
    "languages" : ["it"],

}



"""


def start_stream():

    while True:
        try:
            l = StdOutListener()
            auth = OAuthHandler(cfg.twitter["consumer_key"], cfg.twitter["consumer_secret"])
            auth.set_access_token(cfg.twitter["access_token"], cfg.twitter["access_token_secret"])
            stream = Stream(auth, l)
            stream.filter(track=cfg.twitter["trak"],languages=cfg.twitter["languages"])
            logging.debug('Autentification done')
        except Exception:
            logging.warning(traceback.format_exc())
            print(traceback.format_exc())
            #nel caso si verifichi un'ecezzione, si tenterà  di stabilire la connessione dopo 60 secondi
            time.sleep(60)
            continue


class StdOutListener(StreamListener):

    def on_data(self, tweet):

        try:

            jsonTweet=json.loads(tweet)

            """
            ogni tweet viene salvato in una nuova riga di un file twita.gz
            il tweet viene salvato nel file corrispondente al giorno in cui è stato postato


            YYYYY-MM-DD 00:00:00 twita.gz
            """

            if 'timestamp_ms' in jsonTweet:
                date = datetime.fromtimestamp(int(jsonTweet['timestamp_ms'])/1000)
                date = date.replace(hour=0, minute=0, second=0, microsecond=0)
                #date = date.replace(second=0, microsecond=0)
                date = date.strftime('%Y-%m-%d %H:%M:%S')

                file = gzip.open(currentdir+cfg.path['todo']+date+'.twita.gz', "ab")

                file.write(bytes(tweet, 'UTF-8'))
                file.close()

            else:
                logging.debug(tweet)

            return True

        except Exception:
            logging.warning(traceback.format_exc())
            print(traceback.format_exc())
        pass

    def on_error(self, status):
        logging.warning(traceback.format_exc())
        print(traceback.format_exc())

if __name__ == '__main__':



    logging.basicConfig(filename=currentdir+cfg.path['log']+'Main - StreamAPI.log',level=logging.DEBUG)
    logging.debug('Start stream')

    try:
        start_stream()

    except Exception:
        logging.warning(traceback.format_exc())
        #print(traceback.format_exc())
        #time.sleep(1500)
