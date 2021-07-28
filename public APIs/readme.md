# Public API

mappa.controlodio.it uses public available APIs implemented with node.js.

The APIs use the statistical codes of the territorial administrative units released by ISTAT.

The APIs are available at [https](https://api.controlodio.it:4000/restAPI/)[://](https://api.controlodio.it:4000/restAPI/)[api](https://api.controlodio.it:4000/restAPI/)[.](https://api.controlodio.it:4000/restAPI/)[controlodio](https://api.controlodio.it:4000/restAPI/)[.](https://api.controlodio.it:4000/restAPI/)[it](https://api.controlodio.it:4000/restAPI/)[:4000/](https://api.controlodio.it:4000/restAPI/)[restAPI](https://api.controlodio.it:4000/restAPI/)[/](https://api.controlodio.it:4000/restAPI/)<API> and are described following:

## levelOfAttribute
This API returns the number of collected tweets and the occurrence of each label, grouping them by administrative divisions.

The following parameters are available:

- **year**, **month**, **day**, **week**: 

This parameter is mandatory. These parameters apply a date filter. To define the parameters **year** and **month** and **day** or **year** and **month** or  **year** and **week\_year**, or only **year** is possible.

- **topic**:

This parameter is mandatory. The admitted values are:  *all*, *etnichs\_group*, *religion*, *roma*

- **administrative\_division**: 

This parameter is mandatory. It defines the desidered geographical aggregation. The admitted values are: 0 (national aggregation), 1  (regional aggregation), e 2  (provincial aggregation).


**Example Request**: 

This request returns the total number of tweets, aggregated by region, collected between Dec. 10, 2018  and  Dec. 16, 2018. The response includes all topics.

https://api.controlodio.it:4000/restAPI/levelOfAttribute?administrative_division=1&topic=all&year=2018&week_year=50

**Example Response**: 

{

`	`"status":200,

`	`"data":[

`    	`{

`        	`"count":92522,

`        	`"no":75877,

`        	`"yes":16645,

`        	`"administrative\_division\_1":""

`    	`},

`    	`{

`        	`"count":2153,

`        	`"no":1809,

`        	`"yes":344,

`        	`"administrative\_division\_1":"1"

`    	`},

`    	`[...]

`    	`{

`        	`"count":2634,

`        	`"no":2242,

`        	`"yes":392,

`        	`"administrative\_division\_1":"9"

`    	`}

`	`]

}

## timeFrequency
The API returns different tweets frequency within the required time window. 

The following parameters are available:

- **topic**: This parameter is mandatory. The admitted values are:  *all*, *etnichs\_group*, *religion*, *roma*
- **frequency**:  This parameter is mandatory. This parameter indicates the type of time division to be carried out in the time interval defined by **startdate** and **enddate**.  The admitted values are:  daily,  weekly,   monthly,   annually
- **startdate**: This parameter is mandatory. It defines the beginning of the time window. The allowed date format is: 'DD/MM/YYYY'
- **enddate**: This parameter is optional.  It defines the ending of the time window. The allowed date format is: 'DD/MM/YYYY'
- **is\_administrative\_division\_0**, **is\_administrative\_division\_1**, **is\_administrative\_division\_2**: These parameters are optional. The default value is 0 (false). If set to 1 (true) it forces the presence of a value in the corrispettive field. For example, if **is\_administrative\_division\_1** is set to 1, the API includes tweets that contain, at least, a geographical location at regional level.
- **administrative\_division\_0**, **administrative\_division\_1**, **administrative\_division\_2**: These parameters are optional. These parameters apply an aggregation by filter space. The priority of these parameters are:  administrative\_division\_2 (provincial), administrative\_division\_1 (regional), administrative\_division\_0 (national). 


**Example Request**: 

This request returns the total number of tweets, annually aggregated, collected between Dec. 10, 2018  and  today. The tweets are filtered by topic *roma*.

https://api.controlodio.it:4000/restAPI/timeFrequency?frequency=annually&startdate=01/01/2019&topic=Roma

**Example Response:**

{

`	`"status":200,

`	`"data":[

`    	  	`{

`        	`"count":239624,

`        	`"no":203493,

`        	`"yes":36131,

`        	`"year":2019,

`        	`"administrative\_division\_1":"1"

`    	`},

`    	`{

`        	`"count":138994,

`        	`"no":117265,

`        	`"yes":21729,

`        	`"year":2020,

`        	`"administrative\_division\_1":"1"

`    	`},

`    	`{

`        	`"count":68614,

`        	`"no":61294,

`        	`"yes":7320,

`        	`"year":2021,

`        	`"administrative\_division\_1":"1"

`    	`}

`	`]

}


## virality
This API returns the most significant tweets (the tweets that received more reactions) in the considered time interval. 

The available parameters are:

- **type**: the parameter is mandatory. It defines the type of reaction to use for defining the most significant tweets. The admitted values are: retweet, reply, quote
- **limit**:  This parameter is optional.  The default value is 10. It defines the number of tweets to return.
- **topic**: This parameter is mandatory. The admitted values are:  *all*, *etnichs\_group*, *religion*, *roma*
- **startdate**: This parameter is mandatory. It defines the beginning of the time window. The allowed date format is: 'DD/MM/YYYY'
- **enddate**: This parameter is optional.  It defines the ending of the time window. The allowed date format is: 'DD/MM/YYYY'

- **is\_administrative\_division\_0**, **is\_administrative\_division\_1**, **is\_administrative\_division\_2**: These parameters are optional. The default value is 0 (false). If set to 1 (true) it forces the presence of a value in the corrispettive field. For example, if **is\_administrative\_division\_1** is set to 1, the API includes tweets that contain, at least, a geographical location at regional level.
- **administrative\_division\_0**, **administrative\_division\_1**, **administrative\_division\_2**: These parameters are optional. These parameters apply a filter space. The priority of these parameters are:  administrative\_division\_2 (provincial), administrative\_division\_1 (regional), administrative\_division\_0 (national). 


**Example Request**: 

This request returns most retweeted tweets in 2021, annually aggregated, collected between Dec. 10, 2018  and  today. The tweets are filtered by topic *roma* and located in the province of Turin (administrative division 1, in accordance with the territorial administrative units released by ISTAT.). 

https://api.controlodio.it:4000/restAPI/virality?type=retweet&enddate=31%2F12%2F2021&startdate=1%2F1%2F2021&topic=all&administrative\_division\_2=1


**Example Response:**

{

`	`"status":200,

`	`"data":[

`    	`{

`        	`"id":"1368156540537102337",

`        	`"count":242,

`        	`"topic":"all",

`        	`"administrative\_division\_2":"1"

`    	`},

`    	`{

`        	`"id":"1416280655458091009",

`        	`"count":224,

`        	`"topic":"all",

`        	`"administrative\_division\_2":"1"

`    	`},

`    	`{

`        	`"id":"1368094317127073797",

`        	`"count":205,

`        	`"topic":"all",

`        	`"administrative\_division\_2":"1"

`    	`}

`	`]

}

## avg
  
This request returns some metrics (average, max, min of daily frequency of  tweets, average, max, min of daily frequency of hateful tweets) calculated in the current time window:
  - **topic**: This parameter is mandatory. The admitted values are:  *all*, *etnichs\_group*, *religion*, *roma*
  - **startdate**: This parameter is mandatory. It defines the beginning of the time window. The allowed date format is: 'DD/MM/YYYY'
  - **pastdays**: the parameter is mandatory. It defines how many days back to calculate the averages. 
  - **is\_administrative\_division\_0**, **is\_administrative\_division\_1**, **is\_administrative\_division\_2**: These parameters are optional. The default value is 0 (false). If set to 1 (true) it forces the presence of a value in the corrispettive field. For example, if **is\_administrative\_division\_1** is set to 1, the API includes tweets that contain, at least, a geographical location at regional level.
  - **administrative\_division\_0**, **administrative\_division\_1**, **administrative\_division\_2**: These parameters are optional. These parameters apply a filter space. The priority of these parameters are:  administrative\_division\_2 (provincial), administrative\_division\_1 (regional), administrative\_division\_0 (national). 

**Example Request**: 

This request returns some metrics about the 100 days before Jul. 1, 2018. 

https://api.controlodio.it:4000/restAPI/avg?attribute=hs&topic=all&startdate=01/07/2018&pastdays=100


**Example Response:**

{

`	`"status":200,

`	`"data":[

`    	`{

`        	`"avg\_tweet":10715.5,

`        	`"avg\_fraq":0.148448,

`        	`"max\_tweet":56476,

`        	`"min\_tweet":1051,

`        	`"max\_frac":0.2885,

`        	`"Min\_frac":0.0699

`    	`}

`	`]

}

## median
This request returns some metrics (median, max, min of daily frequency of  tweets, median, max, min of daily frequency of hateful tweets) calculated in the current time window:
  - **topic**: This parameter is mandatory. The admitted values are:  *all*, *etnichs\_group*, *religion*, *roma*
  - **startdate**: This parameter is mandatory. It defines the beginning of the time window. The allowed date format is: 'DD/MM/YYYY'
  - **pastdays**: the parameter is mandatory. It defines how many days back to calculate the medians. 
  - **is\_administrative\_division\_0**, **is\_administrative\_division\_1**, **is\_administrative\_division\_2**: These parameters are optional. The default value is 0 (false). If set to 1 (true) it forces the presence of a value in the corrispettive field. For example, if **is\_administrative\_division\_1** is set to 1, the API includes tweets that contain, at least, a geographical location at regional level.
  - **administrative\_division\_0**, **administrative\_division\_1**, **administrative\_division\_2**: These parameters are optional. These parameters apply a filter space. The priority of these parameters are:  administrative\_division\_2 (provincial), administrative\_division\_1 (regional), administrative\_division\_0 (national). 

**Example Request**: 

This request returns some metrics about the 100 days before Jul. 1, 2018. 

https://api.controlodio.it:4000/restAPI/median?attribute=hs&topic=all&startdate=01/07/2018&pastdays=100


**Example Response:**

{

`	`"status":200,

`	`"data":[

`    	`{

`        	`"avg(median\_tweet)":3964,

`        	`"avg(median\_frac)":0.114,

`        	`"avg(rowindex)":50

`    	`}

`	`]

}

## tokenfrequency
The API returns the most frequent tokens (hashtag, mention, or word) contained in the tweets posted within the required time window. 

The following parameters are available:

- **topic**: This parameter is mandatory. The admitted values are:  *all*, *etnichs\_group*, *religion*, *roma*
- **limit**:  This parameter is optional. The default value is 10. It defines the number of tokens to return.
- **startdate**: This parameter is mandatory. It defines the beginning of the time window. The allowed date format is: 'DD/MM/YYYY'
- **enddate**: This parameter is optional.  It defines the ending of the time window. The allowed date format is: 'DD/MM/YYYY'
- **type**: this parameter defines the type of token among 'hashtag', 'mention', and 'word'.

**Example Request**: 

This request returns the most common words used in the tweets about roma posted in 2021.

https://api.controlodio.it:4000/restAPI/tokenfrequency?type=word&limit=3&enddate=31%2F12%2F2021&startdate=1%2F1%2F2021&topic=roma

**Example Response:**

{

`	`"status":200,

`	`"data":[

`    	`{

`        	`"token":"casa",

`        	`"count":9241,

`        	`"count\_hs\_yes":690,

`        	`"Topic":"roma"

`    	`},

`    	`{

`        	`"token":"campo",

`        	`"count":8532,

`        	`"count\_hs\_yes":594,

`        	`"Topic":"roma"

`    	`},

`    	`{

`        	`"token":"campi",

`        	`"count":5171,

`        	`"count\_hs\_yes":586,

`        	`"Topic":"roma"

`    	`}

`	`]

}


## tokencorrelation 
The API returns the most frequent tokens contained in the tweets posted within the required time window that co-occurred with a required token. 

The following parameters are available:

- **topic**: This parameter is mandatory. The admitted values are:  *all*, *etnichs\_group*, *religion*, *roma*
- **limit**:  This parameter is optional. The default value is 10. It defines the number of tokens to return.
- **startdate**: This parameter is mandatory. It defines the beginning of the time window. The allowed date format is: 'DD/MM/YYYY'
- **enddate**: This parameter is optional.  It defines the ending of the time window. The allowed date format is: 'DD/MM/YYYY'
- **token**: This parameter is mandatory. It allows defining the token whose you want to obtain the most common co-occurred words.

**Example Request**: 

This request returns the most common words that occurred in the tweets about roma that contain the token ‘campi’ posted in 2021.

https://api.controlodio.it:4000/restAPI/tokencorrelation?token=campi&limit=3&enddate=31%2F12%2F2021&startdate=1%2F1%2F2021&topic=roma

**Example Response:**

{

`	`"status":200,

`	`"data":[

`    	`{

`        	`"token\_1":"campi",

`        	`"token\_2":"dimenticati",

`        	`"count":3672,

`        	`"count\_hs\_yes":0,

`        	`"Topic":"all"

`    	`},

`    	`{

`        	`"token\_1":"campi",

`        	`"token\_2":"ora",

`        	`"count":2544,

`        	`"count\_hs\_yes":107,

`        	`"Topic":"all"

`    	`},

`    	`{

`        	`"token\_1":"campi",

`        	`"token\_2":"incendio",

`        	`"count":2387,

`        	`"count\_hs\_yes":0,

`        	`"Topic":"all"

`    	`}

`	`]

}



