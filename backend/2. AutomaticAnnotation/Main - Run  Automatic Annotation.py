import numpy
from sklearn.svm.classes import SVC
import Features_manager
import Database_manager
import os,sys,inspect

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0,parentdir)
import config as cfg
# initialize database_manager
database_manager = Database_manager.make_database_manager()
# initialize feature_manager
feature_manager = Features_manager.make_feature_manager()

for topic in cfg.topic.keys():

    # recover test tweets
    tweets_test = numpy.array(database_manager.return_tweets_test(topic))

    for attribute in cfg.attribute:
        print(topic,attribute, len(tweets_test))



        # recover training tweets
        tweets_train = numpy.array(database_manager.return_tweets_training(topic,attribute))
        labels = numpy.array(feature_manager.get_label(tweets_train))



        if len(tweets_test)<1:
            print("No test tweets available")
            exit(0)

        # create the feature space with all available features
        X, Y, feature_names,feature_type_indexes=feature_manager.create_feature_space(tweets_train,tweet_test=tweets_test)

        feature_type=feature_manager.get_availablefeaturetypes()

        print("features types:", feature_type)
        print("features names:", feature_names)
        print("feature space dimension:", X.shape)



        clf = SVC(kernel="linear")

        clf.fit(X,labels)
        test_predict = clf.predict(Y)

        for i in range(0, len(tweets_test)):
            tweet_id=tweets_test[i].id
            #print(tweets_test[i].text)
            label=test_predict[i]
            database_manager.save_automatic_annotation(topic,attribute,tweet_id,label)

    database_manager.remove_annotated_tweet(topic,tweets_test)