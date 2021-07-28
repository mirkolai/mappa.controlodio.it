## 1. DataGathering

The script **Main - StreamAPI.py** collects tweets by using Twitter's stream API.

Then, the script **Main - Read Data.py** stores some basic information of the tweets in the database.

- **tweet\_to\_annotate**:  topic, id, text, is\_retweet, is\_quote, is\_reply, year, month, day, week\_year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2

The module tries to locate each tweet in a geographical place given a value to the fields administrative\_division\_0, administrative\_division\_1, and administrative\_division\_2.

- administrative\_division\_0 (nation) registers the ISO 3166-1 alpha-2 code of the country in which the tweet has been located 
- administrative\_division\_1 (region) registers the region code (ISTAT code) of the region in which the tweet has been located 
- administrative\_division\_2 (province) registers the province code (ISTAT code) of the province in which the tweet has been located 

Using the modules **utils.py** and **shapegeocode.py**, the script performs a reverse geocoding if the tweet was geolocated ("geo.coordinates”).

When the author does not share a geolocation at time of Tweet, the script tries to detect the location by the place description ("place.name") if available.

In a last attempt to locate the tweet when the field place is not available, the script tries to detect the location by the user location ("user.location").

The following tables respectively contain the denominations of nations, and italian regions, and provinces. The names of the locations are available in Italian, English and other languages. The denominations are used to recognize the "place.name" or the "user.location".

An unique code is available for each entity.

- **administrative\_division\_0\_istat**: Codice iso, Denominazione in inglese, Denominazione in italiano, Denominazione altra lingua

- **administrative\_division\_1\_istat**:   Codice Istat, Denominazione in italiano, Denominazione altra lingua, Denominazione in inglese

- **administrative\_division\_2\_istat**:  Codice Istat, year, Denominazione in italiano, Denominazione targa, codice regione

The table twitter\_location serves as a cache table for speed up the process of recognition of the place names and the user’s locations.


- **twitter\_location**:   location, year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2, administrative\_division\_3

The table **daily\_frequency** stores the number of tweets daily posted in each location.

The field is empty when the administrative subdivision has not been established.

The hierarchy of the administrative divisions is: 0-nation, 1-region, 2-province.

- **daily\_frequency**: 

year, month, day, week\_year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2, count

Finally, the table **daily\_virality** stores the number of retweets, quotes, and replies daily received by each tweet. A tweet can be associated with multiple topics.

- **daily\_virality**: topic, id, user\_id, retweet, quote, reply, year, month, day, week\_year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2

## 2. AutomaticAnnotation

This module performs the automatic detection of hateful tweets.

The script **Main - Run  Automatic Annotation.py** gets the training set from the table   **training**. Indeed, this table contains a corpus of Italian tweets manually labeled for hate speech.

- **training**:  id, text, hs

The script, using the modules **Database\_manager.py**, **Tweet.py**, and **Features\_manager.py**, performs the automatic annotation of the unlabelled tweets contained in the table **tweet\_to\_annotate**.

The tweets and their predictions are therefore deleted from the table **tweet\_to\_annotate**  and inserted in the table **tweet\_to\_model**.

The fields aggressiveness, offensiveness, stereotype, irony, intensity will be used in future versions.


- **tweet\_to\_model:**  topic, id, text, is\_retweet, is\_quote, is\_reply, year, month, day, week\_year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2, hs, aggressiveness, offensiveness, stereotype, irony, intensity


## 3. Data Modelling

The module Data Modelling uses the script **Main -Data Modelling.py** for aggregating tweets by time and a place. The scripts collect the tweets from the table **tweet\_to\_model**.

The table stores the number of  hateful and unhateful tweets daily posted in each location for each topic.

- **daily\_frequency\_topic**:

topic, year, month, day, week\_year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2, hs\_yes\_count, hs\_no\_count, count

The tweets are therefore deleted from the table **tweet\_to\_model**  and inserted in the table **tweet\_to\_daily\_token\_frequency**.

- **tweet\_to\_daily\_token\_frequency**:  topic, id, text, is\_retweet, is\_quote, is\_reply, year, month, day, week\_year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2, hs, aggressiveness, offensiveness, stereotype, irony, intensity, re-annotate


## 4. TokenAnalysis

This module, using the script **Main - TokenAnalysis.py**, performs a token analysis of the tweets contained in the table **tweet\_to\_daily\_token\_frequency**.

The stop words are removed from each tweet and the text is spitted by whitespace in tokens.

The tokens are distinguished into words, hashtags, and mentions. Then, the daily frequency of each token is respectively stored, based on its type, in the table **daily\_word\_frequency**, **daily\_hashtag\_frequency**, or **daily\_mention\_frequency**.

- **daily\_word\_frequency**: token, topic, year, month, day, count, count\_hs\_yes, count\_hs\_no 

- **daily\_hashtag\_frequency**: token, topic, year, month, day, count, count\_hs\_yes, count\_hs\_no FROM daily\_word\_frequency

- **daily\_mention\_frequency**: token, topic, year, month, day, count, count\_hs\_yes, count\_hs\_no FROM daily\_word\_frequency

The script also computes the daly co-occurrence of each pair of tokens.

- **daily\_co\_occurrence\_word\_frequency**: token\_1, token\_2, topic, year, month, day, count, count\_hs\_yes, count\_hs\_no 


The tweets are finally deleted from the table **tweet\_to\_daily\_token\_frequency**  and inserted in the table **tweet\_backup**.


- **tweet\_backup**:  topic, id, text, is\_retweet, is\_quote, is\_reply, year, month, day, week\_year, administrative\_division\_0, administrative\_division\_1, administrative\_division\_2, hs, aggressiveness, offensiveness, stereotype, irony, intensity, re-annotate






