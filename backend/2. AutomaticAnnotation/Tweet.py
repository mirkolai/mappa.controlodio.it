
class Tweet(object):

    id=None
    text=None
    label=None

    def __init__(self, id, text, label):


        self.id=id
        self.text=text
        """
        import re
        from nltk.corpus import stopwords
        you cold:
        Remove urls
        self.text=re.sub(r'\w+:\/{2}[\d\w-]+(\.[\d\w-]+)*(?:(?:\/[^\s/]*))*', ' URL ', text)
        Remove hashtags
        self.text=re.sub(r'#(\w+)', ' HASHTAG ', text)
        Remove stop words
        self.text_no_stop_word=" ".join([word for word in self.text if word not in stopwords.words('english')])
        etc...
        """


        self.label=label






def make_tweet(id, text, label ):
    """
        Return a Tweet object.
    """
    tweet = Tweet(id, text, label)

    return tweet



