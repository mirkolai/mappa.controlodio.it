from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
import numpy as np
import re
from scipy.sparse import csr_matrix, hstack



class Features_manager(object):

    def __init__(self):
        """You could add new feature types in global_feature_types_list
            global_feature_types_list is  a dictionary containing the feature space matrix for each feature type

            if you want to add a new feature:
            1. chose a keyword for defining the  feature type
            2. define a function function_name(self,tweets,tweet_test=None) where:

                tweets: Array of  tweet objects belonging to the training set
                tweet_test: Optional. Array of tweet objects belonging to the test set

                return:
                X_train: The feature space of the training set (numpy.array)
                X_test: The feature space of the test set, if test  set was defined (numpy.array)
                feature_names: An array containing the names of the features used for creating the feature space (array)

        """
        self.global_feature_types_list={
            "ngrams":          self.get_ngrams_features,
            #"ngramstfidf":     self.get_ngrams_td_idf_features,
            #"ngramshashtag" :  self.get_ngramshashtag_features,
            #"chargrams":       self.get_nchargrams_features,
            #"numhashtag":      self.get_numhashtag_features,
            #"puntuactionmarks":self.get_puntuaction_marks_features,
            #"length":          self.get_length_features,
        }

        return

    def get_availablefeaturetypes(self):
        """
        Return un array containing the keyword corresponding to  available feature types
        :return: un array containing the keyword corresponding to  available feature types
        """
        return np.array([ x for x in self.global_feature_types_list.keys()])

    def get_label(self,tweets):
        """
        Return un array containing the label for each tweet
        :param tweets:  Array of Tweet Objects
        :return: Array of label
        """
        return [ tweet.label for tweet  in tweets]


    #features extractor
    def create_feature_space(self,tweets,feature_types_list=None,tweet_test=None):
        """

        :param tweets: Array of  tweet objects belonging to the training set
        :param feature_types_list: Optional. array of keyword corresponding to global_feature_types_list (accepted  values are:
            "ngrams"
            "ngramshashtag"
            "chargrams"
            "numhashtag"
            "puntuactionmarks"
            "length")
            If not defined, all available features are used


            You could add new features in global_feature_types_list. See def __init__(self).

            
        :param tweet_test: Optional. Array of tweet objects belonging to the test set
        :return:
        
        X: The feature space of the training set
        X_test: The feature space of the test set, if test  set was defined
        feature_names: An array containing the names of the features used  for  creating the feature space
        feature_type_indexes: A numpy array of length len(feature_type).
                           Given feature_type i, feature_type_indexes[i] contains
                           the list of the index columns of the feature space matrix for the feature type i

        How to use the output, example:

        feature_type=feature_manager.get_avaiblefeaturetypes()

        print(feature_type)  # available feature types
        [
          "puntuactionmarks",
          "length",
          "numhashtag",
        ]
        print(feature_name)  # the name of all feature corresponding to the  number of columns of X
        ['feature_exclamation', 'feature_question',
        'feature_period', 'feature_comma', 'feature_semicolon','feature_overall',
        'feature_charlen', 'feature_avgwordleng', 'feature_numword',
        'feature_numhashtag' ]

        print(feature_type_indexes)
        [ [0,1,2,3,4,5],
          [6,7,8],
          [9]
        ]

        print(X) #feature space 3X10 using "puntuactionmarks", "length", and "numhashtag"
        numpy.array([
        [0,1,0,0,0,1,1,0,0,1], # vector rapresentation of the document 1
        [0,1,1,1,0,1,1,0,0,1], # vector rapresentation of the document 2
        [0,1,0,1,0,1,0,1,1,1], # vector rapresentation of the document 3

        ])

        # feature space 3X6 obtained using only "puntuactionmarks"
        print(X[:, feature_type_indexes[feature_type.index("puntuactionmarks")]])
        numpy.array([
        [0,1,0,0,0,1], # vector representation of the document 1
        [0,1,1,1,0,1], # vector representation of the document 2
        [0,1,0,1,0,1], # vector representation of the document 3

        ])

        """
        if feature_types_list is None:
            feature_types_list=self.get_availablefeaturetypes()





        if tweet_test is None:
            all_feature_names=[]
            all_feature_index=[]
            all_X=[]
            index=0
            for key in feature_types_list:
                X,feature_names=self.global_feature_types_list[key](tweets,tweet_test)

                current_feature_index=[]
                for i in range(0,len(feature_names)):
                    current_feature_index.append(index)
                    index+=1
                all_feature_index.append(current_feature_index)

                all_feature_names=np.concatenate((all_feature_names,feature_names))
                if all_X!=[]:
                    all_X=csr_matrix(hstack((all_X,X)))
                else:
                    all_X=X

            return all_X, all_feature_names, np.array(all_feature_index)
        else:
            all_feature_names=[]
            all_feature_index=[]
            all_X=[]
            all_X_test=[]
            index=0
            for key in feature_types_list:
                X,X_test,feature_names=self.global_feature_types_list[key](tweets,tweet_test)

                current_feature_index=[]
                for i in range(0,len(feature_names)):
                    current_feature_index.append(index)
                    index+=1
                all_feature_index.append(current_feature_index)

                all_feature_names=np.concatenate((all_feature_names,feature_names))
                if all_X!=[]:
                    all_X=csr_matrix(hstack((all_X,X)))
                    all_X_test=csr_matrix(hstack((all_X_test,X_test)))
                else:
                    all_X=X
                    all_X_test=X_test

            return all_X, all_X_test, all_feature_names, np.array(all_feature_index)




    def get_ngrams_features(self, tweets,tweet_test=None):
        """
        
        :param tweets: Array of  Tweet objects. Training set.
        :param tweet_test: Optional Array of  Tweet objects. Test set.
        :return:
        
        X_train: The feature space of the training set
        X_test: The feature space of the test set, if test  set was defined
        feature_names:  An array containing the names of the features used  for  creating the feature space
        """
        # CountVectorizer return a numpy matrix
        # row number of tweets
        # column number of 1-3gram in the dictionary

        vectorizer = CountVectorizer(ngram_range=(1,1),
                                          analyzer="word",
                                          #stop_words="english",
                                          lowercase=True,
                                          binary=True,
                                          max_features=500000)

        if tweet_test is None:
            feature  = []
            for tweet in tweets:

                feature.append(tweet.text)


            vectorizer = vectorizer.fit(feature)

            X = vectorizer.transform(feature)

            feature_names=vectorizer.get_feature_names()

            return X, feature_names
        else:
            feature  = []
            feature_test  = []
            for tweet in tweets:

                feature.append(tweet.text)

            for tweet in tweet_test:

                feature_test.append(tweet.text)


            vectorizer = vectorizer.fit(feature)

            X_train = vectorizer.transform(feature)
            X_test = vectorizer.transform(feature_test)

            feature_names=vectorizer.get_feature_names()

            return X_train, X_test, feature_names

    def get_ngrams_td_idf_features(self, tweets, tweet_test=None):
        """

        :param tweets: Array of  Tweet objects. Training set.
        :param tweet_test: Optional Array of  Tweet objects. Test set.
        :return:

        X_train: The feature space of the training set
        X_test: The feature space of the test set, if test  set was defined
        feature_names:  An array containing the names of the features used  for  creating the feature space
        """
        # CountVectorizer return a numpy matrix
        # row number of tweets
        # column number of 1-3gram in the dictionary

        tfidfVectorizer = TfidfVectorizer(ngram_range=(1, 1),
                                          analyzer="word",
                                          # stop_words="english",
                                          lowercase=True,
                                          binary=True,
                                          max_features=500000)

        if tweet_test is None:
            feature = []
            for tweet in tweets:
                feature.append(tweet.text)

            tfidfVectorizer = tfidfVectorizer.fit(feature)

            X = tfidfVectorizer.transform(feature)

            feature_names = tfidfVectorizer.get_feature_names()

            return X, feature_names
        else:
            feature = []
            feature_test = []
            for tweet in tweets:
                feature.append(tweet.text)

            for tweet in tweet_test:
                feature_test.append(tweet.text)

            tfidfVectorizer = tfidfVectorizer.fit(feature)

            X_train = tfidfVectorizer.transform(feature)
            X_test = tfidfVectorizer.transform(feature_test)

            feature_names = tfidfVectorizer.get_feature_names()

            return X_train, X_test, feature_names

    def get_ngramshashtag_features(self, tweets,tweet_test=None):
        """
        
        :param tweets: Array of  Tweet objects. Training set.
        :param tweet_test: Optional Array of  Tweet objects. Test set.
        :return:
        
        X_train: The feature space of the training set
        X_test: The feature space of the test set, if test  set was defined
        feature_names:  An array containing the names of the features used  for  creating the feature space
        """
        # CountVectorizer return a numpy matrix
        # row number of tweets
        # column number of hashtags in the dictionary

        vectorizer = CountVectorizer(ngram_range=(1,1),
                                          analyzer="word",
                                          #stop_words="english",
                                          lowercase=True,
                                          binary=True,
                                          max_features=500000)

        if tweet_test is None:
            feature  = []
            for tweet in tweets:

                feature.append(' '.join(re.findall(r"#(\w+)", tweet.text)))


            vectorizer = vectorizer.fit(feature)

            X = vectorizer.transform(feature)

            feature_names=vectorizer.get_feature_names()

            return X, feature_names
        else:
            feature  = []
            feature_test  = []
            for tweet in tweets:

                feature.append(' '.join(re.findall(r"#(\w+)", tweet.text)))

            for tweet in tweet_test:

                feature_test.append(' '.join(re.findall(r"#(\w+)", tweet.text)))


            vectorizer = vectorizer.fit(feature)

            X_train = vectorizer.transform(feature)
            X_test = vectorizer.transform(feature_test)

            feature_names=vectorizer.get_feature_names()

            return X_train, X_test, feature_names


    def get_nchargrams_features(self, tweets,tweet_test=None):


        # CountVectorizer return a numpy matrix
        # row number of tweets
        # column number of 2-5chargrams in the dictionary
        tfidfVectorizer = CountVectorizer(ngram_range=(2,5),
                                          analyzer="char",
                                          #stop_words="english",
                                          lowercase=True,
                                          binary=True,
                                          max_features=500000)

        if tweet_test is None:
            feature  = []
            for tweet in tweets:

                feature.append(tweet.text)


            tfidfVectorizer = tfidfVectorizer.fit(feature)

            X = tfidfVectorizer.transform(feature)

            feature_names=tfidfVectorizer.get_feature_names()

            return X, feature_names
        else:
            feature  = []
            feature_test  = []
            for tweet in tweets:

                feature.append(tweet.text)

            for tweet in tweet_test:

                feature_test.append(tweet.text)


            tfidfVectorizer = tfidfVectorizer.fit(feature)

            X_train = tfidfVectorizer.transform(feature)
            X_test = tfidfVectorizer.transform(feature_test)

            feature_names=tfidfVectorizer.get_feature_names()

            return X_train, X_test, feature_names


    def get_numhashtag_features(self, tweets,tweet_test=None):

        # This method extracts a single column (feature_numhashtag)
        # len(tweets) rows of 1 column
        # sr_matrix(np.vstack(feature)) convert to an array of dimension len(tweets)X1

        if tweet_test is None:
            feature  = []

            for tweet in tweets:
                feature.append(len(re.findall(r"#(\w+)", tweet.text)))

            return csr_matrix(np.vstack(feature)),\
                   ["feature_numhashtag"]

        else:
            feature  = []
            feature_test  = []

            for tweet in tweets:
                feature.append(len(re.findall(r"#(\w+)", tweet.text)))

            for tweet in tweet_test:
                feature_test.append(len(re.findall(r"#(\w+)", tweet.text)))

            return csr_matrix(np.vstack(feature)),csr_matrix(np.vstack(feature_test)),\
                   ["feature_numhashtag"]


    def get_puntuaction_marks_features(self,tweets,tweet_test):

        # This method extracts a single column (feature_numhashtag)
        # len(tweets) rows of 6 columns
        # sr_matrix(np.vstack(feature)) convert to an array of dimension len(tweets)X6

        if tweet_test is None:
            feature  = []

            for tweet in tweets:
                feature.append([
                len(re.findall(r"[!]", tweet.text)),
                len(re.findall(r"[?]", tweet.text)),
                len(re.findall(r"[.]", tweet.text)),
                len(re.findall(r"[,]", tweet.text)),
                len(re.findall(r"[;]", tweet.text)),
                len(re.findall(r"[!?.,;]", tweet.text)),
                ]

            )


            return csr_matrix(np.vstack(feature)),\
                   ["feature_exclamation",
                    "feature_question",
                    "feature_period",
                    "feature_comma",
                    "feature_semicolon",
                    "feature_overall"]


        else:
            feature  = []
            feature_test  = []

            for tweet in tweets:
                feature.append([
                len(re.findall(r"[!]", tweet.text)),
                len(re.findall(r"[?]", tweet.text)),
                len(re.findall(r"[.]", tweet.text)),
                len(re.findall(r"[,]", tweet.text)),
                len(re.findall(r"[;]", tweet.text)),
                len(re.findall(r"[!?.,;]", tweet.text)),
                ]

            )


            for tweet in tweet_test:
                feature_test.append([
                len(re.findall(r"[!]", tweet.text)),
                len(re.findall(r"[?]", tweet.text)),
                len(re.findall(r"[.]", tweet.text)),
                len(re.findall(r"[,]", tweet.text)),
                len(re.findall(r"[;]", tweet.text)),
                len(re.findall(r"[!?.,;]", tweet.text)),
                ]

            )


            return csr_matrix(np.vstack(feature)),csr_matrix(np.vstack(feature_test)),\
                   ["feature_exclamation",
                    "feature_question",
                    "feature_period",
                    "feature_comma",
                    "feature_semicolon",
                    "feature_overall"]


    def get_length_features(self,tweets,tweet_test):

        # This method extracts a single column (feature_numhashtag)
        # len(tweets) rows of 3 columns
        # sr_matrix(np.vstack(feature)) convert to an array of dimension len(tweets)X3

        if tweet_test is None:
            feature  = []

            for tweet in tweets:
                feature.append([
                len(tweet.text),
                np.average([len(w) for w in tweet.text.split(" ")]),
                len(tweet.text.split(" ")),

                ]

            )


            return csr_matrix(np.vstack(feature)),\
                   ["feature_charlen",
                    "feature_avgwordleng",
                    "feature_numword"]

        else:
            feature  = []
            feature_test  = []

            for tweet in tweets:
                feature.append([
                len(tweet.text),
                np.average([len(w) for w in tweet.text.split(" ")]),
                len(tweet.text.split(" ")),

                ]

            )


            for tweet in tweet_test:
                feature_test.append([
                len(tweet.text),
                np.average([len(w) for w in tweet.text.split(" ")]),
                len(tweet.text.split(" ")),

                ]

            )


            return csr_matrix(np.vstack(feature)),csr_matrix(np.vstack(feature_test)),\
                   ["feature_charlen",
                    "feature_avgwordleng",
                    "feature_numword"]

#inizializer
def make_feature_manager():

    features_manager = Features_manager()

    return features_manager
