__author__ = 'mirko'
import numpy
from sklearn.svm.classes import SVC
import Features_manager
import Database_manager
import config as cfg
from sklearn.metrics.classification import precision_recall_fscore_support, accuracy_score
from sklearn.model_selection import KFold

# initialize database_manager
database_manager = Database_manager.make_database_manager()
# initialize feature_manager
feature_manager = Features_manager.make_feature_manager()

#for topic in cfg.topic.keys():

for attribute in cfg.attribute:
    #print(topic,attribute)


    # recover training tweets
    tweets= numpy.array(database_manager.return_tweets_training(None,attribute))
    labels = numpy.array(feature_manager.get_label(tweets))


    # create the feature space with all available features
    # recover keyword list corresponding to available features
    feature_types = feature_manager.get_availablefeaturetypes()
    """
    or you could include only desired features
    feature_type=[
                "ngrams",
                "ngramshashtag",
                "chargrams",
                "numhashtag",
                "puntuactionmarks",
                "length",
                ]
    """
    # create the feature space with all available features
    X,feature_names,feature_type_indexes=feature_manager.create_feature_space(tweets,feature_types)


    print("features:", feature_types)
    print("feature space dimension:", X.shape)

    golden=[]
    predict=[]
    f_measures=[]
    kf = KFold(n_splits=10, shuffle=True, random_state=True)
    i=0
    for index_train, index_test in kf.split(X):
        i+=1

        print(i)

        clf = SVC(kernel="linear")

        clf.fit(X[index_train],labels[index_train])
        test_predict = clf.predict(X[index_test])


        prec, recall, f, support = precision_recall_fscore_support(
            labels[index_test],
            test_predict,
            beta=1)
        f_measures.append(numpy.sum(f)/len(f))
        golden=numpy.concatenate((golden,labels[index_test]), axis=0)
        predict=numpy.concatenate((predict,test_predict), axis=0)

    prec, recall, f, support = precision_recall_fscore_support(
    golden,
    predict,
    beta=1)

    accuracy = accuracy_score(
    golden,
    predict
    )

    print("f",numpy.average(f_measures))
    print("std",numpy.std(f_measures))
    print(prec, recall, f, support )
    print(numpy.sum(f)/len(f))
    print(accuracy)

"""

5 fold

features: ['1-gram']
feature space dimension: (11662, 28192)
f 0.7917016612286086
std 0.007528754872423416
[precision no precision yes] [recall  no recall yes] [f no f yes]   [support no support yes]
[0.91983653 0.67154318] [0.92653578 0.65036563] [0.923174   0.66078477] [9474 2188]
0.8747213170982678 accuracy


features: ['chargrams']
feature space dimension: (11662, 369695)
f 0.8066446017545751
std 0.008402167314425073
"""

"""

10 fold

features: ['1-gram']
feature space dimension: (11662, 28192)
f 0.8056867608485003
std 0.008132504987331075
[precision no precision yes] [recall  no recall yes] [f no f yes]   [support no support yes]
[0.92811772 0.68095668] [0.92537471 0.68967093] [0.92674419 0.6852861 ] [9474 2188]
0.8811524609843937 accuracy

features: ['chargrams']
f 0.8265815987476914
std 0.01241508284744356
"""