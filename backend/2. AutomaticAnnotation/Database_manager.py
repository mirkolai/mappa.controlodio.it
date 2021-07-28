from sklearn.externals import joblib
from Tweet import make_tweet
import os.path
import pymysql
import os,sys,inspect

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0,parentdir)
import config as cfg
class Database_manager(object):

    db=None
    cur=None

    def __init__(self):
        """
         If you want to recover tweets from a mysql db set the config.py:
         for example  mysql = {
         'host': 'yourhost',
         'user': 'yourmysqluser',
         'passwd': 'yourpassword',
         'db': 'dbname'}
        """
        self.db = pymysql.connect(host=cfg.mysql['host'],
                 user=cfg.mysql['user'],
                 passwd=cfg.mysql['passwd'],
                 db=cfg.mysql['db'],
                 charset='utf8',
                 use_unicode=True)
        self.cur = self.db.cursor()
        self.cur.execute('SET NAMES utf8mb4')
        self.cur.execute("SET CHARACTER SET utf8mb4")
        self.cur.execute("SET character_set_connection=utf8mb4")
        self.db.commit()


    def return_tweets_training(self,topic,attribute):
        """Return an array containing tweets.
           Tweets are encoded as Tweet objects.
        """
        """
         You could recover tweets from db or csv file

        """
        tweets=[]
        #self.cur.execute("SELECT `tweet_id`, `Text`,`"+attribute+"`  FROM `training_"+topic+"` ")
        self.cur.execute("SELECT `id`, `Text`,`"+attribute+"`  FROM `training` ")

        for tweet in self.cur.fetchall():
                id=tweet[0]
                text=tweet[1]
                label=tweet[2]

                """
                Create a new istance of a Tweet object
                """
                if label!=None:

                    this_tweet=make_tweet(id, text, label)

                    tweets.append(this_tweet)


        return tweets


    def return_tweets_test(self, topic):
        """Return an array containing tweets.
           Tweets are encoded as Tweet objects.
        """
        """
         You could recover tweets from db or csv file

        """
        tweets=[]
        self.cur.execute("SELECT `ID`, `Text`  FROM tweet_to_annotate where topic=%s limit 0,500000",(topic))

        for tweet in self.cur.fetchall():
                id=tweet[0]
                text=tweet[1]
                label=None

                """
                Create a new istance of a Tweet object
                """
                this_tweet=make_tweet(id, text, label)

                tweets.append(this_tweet)


        return tweets



    def save_automatic_annotation(self,topic, attribute, tweet_id,label):



        self.cur.execute("INSERT INTO tweet_to_model "
                         " Select `topic`,`id`, `text`, is_retweet, `is_quote`, `is_reply`,"
                         " `year`, `month`, `day`, `week_year`,"
                         " `administrative_division_0`, `administrative_division_1`,"
                         " `administrative_division_2`, NULL, NULL, NULL, NULL, NULL, NULL "
                         " FROM `tweet_to_annotate` where id=%s and topic=%s"
                         " on duplicate key update tweet_to_model.id=tweet_to_model.id",(tweet_id,topic))
        self.db.commit()

        self.cur.execute(" UPDATE tweet_to_model  "
                         " set tweet_to_model.`"+attribute+"`=%s where id=%s and topic=%s",(label,tweet_id,topic))
        self.db.commit()


    def remove_annotated_tweet(self,topic,tweets_test):

        for tweet in tweets_test:

            self.cur.execute(" DELETE FROM tweet_to_annotate "
                             " where id=%s and topic=%s",(tweet.id, topic))
            self.db.commit()



def make_database_manager():
    database_manager = Database_manager()

    return database_manager




