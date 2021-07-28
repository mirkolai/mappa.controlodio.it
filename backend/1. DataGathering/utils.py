__author__ = 'mirko'
import time
import oauth2 as oauth
import json
import pymysql
import pyproj
import shapegeocode #pyshp
import os,sys,inspect
import re
currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parentdir = os.path.dirname(currentdir)
sys.path.insert(0,parentdir)

import config as cfg


db = pymysql.connect(host=cfg.mysql['host'],
                     user=cfg.mysql['user'],
                     passwd=cfg.mysql['passwd'],
                     db=cfg.mysql['db'],
                     charset='utf8mb4',
                     use_unicode=True)
cur = db.cursor()
cur.execute('SET NAMES utf8mb4')
cur.execute("SET CHARACTER SET utf8mb4")
cur.execute("SET character_set_connection=utf8mb4")
db.commit()


consumer = oauth.Consumer(key=cfg.twitter["consumer_key"], secret=cfg.twitter["consumer_secret"])
access_token = oauth.Token(key=cfg.twitter["access_token"], secret=cfg.twitter["access_token_secret"])
clientTwitter = oauth.Client(consumer, access_token)







#############################################################################
#
#                                      MAPPE
#
#############################################################################




"""
Le mappe in formato shp sono state recuperate dal sito dell'istat.
I codici dei comuni cambiano con gli anni a causa di cambi province o (più raro) regione.
"""
gc={
     "2021": shapegeocode.geocoder(currentdir+'/ReverseGeocode/Limiti01012018_g/ProvCM01012018_g/ProvCM01012018_g.shp'),
     "2020": shapegeocode.geocoder(currentdir+'/ReverseGeocode/Limiti01012018_g/ProvCM01012018_g/ProvCM01012018_g.shp'),
     "2019": shapegeocode.geocoder(currentdir+'/ReverseGeocode/Limiti01012018_g/ProvCM01012018_g/ProvCM01012018_g.shp'),
     "2018": shapegeocode.geocoder(currentdir+'/ReverseGeocode/Limiti01012018_g/ProvCM01012018_g/ProvCM01012018_g.shp'),
     "2017": shapegeocode.geocoder(currentdir+'/ReverseGeocode/Limiti01012018_g/ProvCM01012018_g/ProvCM01012018_g.shp'),
     }


"""

Dato una anno e na stringa di testo restitutisce il ccodice istat dell'entità territoriale menzionata nel testo relativa all'anno iserito come parametro.

Noi la usiamo per recuperare il codice istat da:

-jsontweet["place"]["name"]
-jsontweet["user"]["place"]

"""
def getIstatCodeByLocation(year, location):

    start_time=time.time()

    try:
        admininistration_level_0 = admininistration_level_1 = admininistration_level_2 = admininistration_level_3=""


        #c'è testo utilizzabile per estrarre la localizzazione?
        if location is None or len(re.sub(r'([^a-zA-Z])', "", location))<2:
            elapsed_time = time.time() - start_time
            #print(1,elapsed_time)
            return admininistration_level_0, admininistration_level_1,admininistration_level_2,admininistration_level_3

        #la recupero dalla cache
        cur.execute("SELECT `location`, `year`, `administrative_division_0`, `administrative_division_1`, `administrative_division_2`, `administrative_division_3` "
                    "FROM `twitter_location` WHERE year=%s and location=%s", (year, location))

        result=cur.fetchone()

        #abbiamo il dato in cache?
        if result is not None:
            #si, recuperiamo il dato dalla cache e usciamo
            elapsed_time = time.time() - start_time
            #print(2,elapsed_time)
            admininistration_level_0 = result[2]
            admininistration_level_1 = result[3]
            admininistration_level_2 = result[4]
            admininistration_level_3 = result[5]
            return  admininistration_level_0, admininistration_level_1,admininistration_level_2,admininistration_level_3


        #atrimenti la cerco nel database delle entità geograficha

        firstlocation=location

        typesofsplit=[",","-","/"]
        # administration_level_0

        for typeofsplit in typesofsplit:
            locations=location.split(typeofsplit)
            if len(locations)<=3:

                for thislocation in locations:
                    thislocation=thislocation.strip()
                    if  thislocation is not None and len(thislocation)>0 and len(re.sub(r'([^a-zA-Z\-])', "", thislocation))>2:

                        cur.execute(" SELECT distinct `Codice iso`   "
                                                " FROM `administrative_division_0_istat` "
                                                " where `Denominazione in italiano` = %s or `Denominazione altra lingua` = %s or `Denominazione in inglese` = %s",
                                    (thislocation, thislocation, thislocation))
                        result=cur.fetchall()
                        if len(result)==1:
                            admininistration_level_0=result[0][0]


        #administration_level_1
        if admininistration_level_0== "" or admininistration_level_0== "IT":
            for typeofsplit in typesofsplit:
                locations = location.split(typeofsplit)
                if len(locations)<=3:
                    for thislocation in locations:
                        if thislocation is not None and len(thislocation) > 0 and len(re.sub(r'([^a-zA-Z])', "", thislocation)) > 2:

                            cur.execute(" SELECT distinct `Codice Istat`  "
                                                    " FROM `administrative_division_1_istat` "
                                                    " where `Denominazione in italiano` = %s or `Denominazione altra lingua` = %s or `Denominazione in inglese` = %s",
                                        (thislocation, thislocation, thislocation))
                            result = cur.fetchall()
                            if len(result) == 1:
                                admininistration_level_1 = result[0][0]
                                admininistration_level_0 = "IT"
                                break

            # administration_level_2 `Codice Istat`, `Denominazione in italiano`, `Denominazione targa`, `codice regione`
            if admininistration_level_0 == "" or admininistration_level_0 == "IT":
                if admininistration_level_2 == "":

                    for typeofsplit in typesofsplit:
                        locations = location.split(typeofsplit)
                        if len(locations) <= 3:
                            for thislocation in locations:
                                if thislocation is not None and len(thislocation) > 0 and len(re.sub(r'([^a-zA-Z])', "", thislocation)) > 2:


                                    cur.execute(" SELECT distinct `Codice Istat`,`codice regione`  "
                                                            " FROM `administrative_division_2_istat` "
                                                            " where year =%s and"
                                                            " (`Denominazione in italiano` = %s "
                                                            " or "
                                                            " `Denominazione targa` = %s )",
                                                (year,thislocation, "(" + thislocation + ")"))
                                    result = cur.fetchall()
                                    if len(result) == 1:
                                        if admininistration_level_1 == "" or admininistration_level_1 == result[0][1]:
                                            admininistration_level_2 = result[0][0]
                                            admininistration_level_1 = result[0][1]
                                            admininistration_level_0 = "IT"
                                            break

            # administration_level_3   # `Denominazione in italiano`, `Denominazione altra lingua`,  `Denominazione in inglese`, `Codice Comune formato numerico`,
            #  `Codice Regione`, `Codice Provincia (1)`,
            #  `Codice Comune numerico con 110 province (dal 2010 al 2016)`,
            #  `Codice Comune numerico con 107 province (dal 2006 al 2009)`,
            #  `Codice Comune numerico con 103 province (dal 1995 al 2005)`
            if admininistration_level_0 == "" or admininistration_level_0 == "IT":
                for typeofsplit in typesofsplit:
                    locations = thislocation.split(typeofsplit)
                    if len(locations) <= 3:
                        for thislocation in locations:
                            if admininistration_level_3 == "":

                                if   year<=2005:
                                    index_istat_code=4
                                elif year<=2009:
                                    index_istat_code=3

                                elif year<=2016:
                                    index_istat_code=2
                                else:
                                    index_istat_code=5


                                """
                                 
                                N.B. DA MODIFICARE SE CAMBIANO I CODICI DELLE PROVINCE 
                                 
   
                                """


                                if thislocation is not None and len(re.sub(r'([^a-zA-Z])', "", thislocation))>1 and admininistration_level_2 == "": #se conosco la provincia mi disinteresso del comune

                                    cur.execute(" SELECT `Codice Regione`, `Codice Provincia`, "
                                          "`Codice Comune numerico con 110 province (dal 2010 al 2016)`,"
                                          "`Codice Comune numerico con 107 province (dal 2006 al 2009)`,"
                                          "`Codice Comune numerico con 103 province (dal 1995 al 2005)`,"
                                          "`Codice Comune formato numerico` "
                                          " from administrative_division_3_istat"       
                                          " where `Denominazione in italiano`=%s or `Denominazione altra lingua`=%s or  `Denominazione in inglese`=%s",
                                                (thislocation, thislocation, thislocation))
                                    result = cur.fetchall()

                                    if len(result) == 1:
                                        if admininistration_level_1 == "" or admininistration_level_1 == result[0][0]:
                                            if admininistration_level_2 == "" or admininistration_level_2 == result[0][1]:
                                                admininistration_level_3 = result[0][index_istat_code]
                                                admininistration_level_2 = result[0][1]
                                                admininistration_level_1 = result[0][0]
                                                admininistration_level_0 = "IT"
                                                break

        #salvo il cache la nuova location
        cur.execute(
            " insert into `twitter_location` "
            " (`location`, `year`, `administrative_division_0`, `administrative_division_1`, `administrative_division_2`, `administrative_division_3`)"
            " values (%s,%s,%s, %s,%s,%s) ", (firstlocation,year, admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3))
        db.commit()

        elapsed_time = time.time() - start_time
        #print(3,elapsed_time)
        return admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3
    except:

        print("Unexpected error (util.py getIstatCodeByLocation):", sys.exc_info()[0], sys.exc_info()[1])
        return "","","",""

"""

Preso un anno, e le coordinare lat lon recupera il codice istat tramite reverse geocoding.
Le mappe usate per fare reverse geocoding sono quelle dell'istat

"""

def getIstatCodeByLatLon(year,lat, lon):

    try:

        admininistration_level_0 = admininistration_level_1 = admininistration_level_2 = admininistration_level_3 = ""

        wgs84=pyproj.Proj("+init=EPSG:4326")
        UTM32N=pyproj.Proj("+init=EPSG:23032")

        x, y = pyproj.transform(wgs84, UTM32N, lon, lat)
        result=gc[str(year)].geocode(y,x)
        #print(result)
        if result is not None:
            #print(result)
            admininistration_level_0="IT"
            admininistration_level_1=result['COD_REG']
            #print(result)
            #a partire dal 2017 il codice COD_PRO è stato sostituito da COD_PROV (motivo ignoto)
            if year > 2016:
                admininistration_level_2=result['COD_PROV']
            else:
                admininistration_level_2=result['COD_PRO']

            #admininistration_level_3=result['PRO_COM']

        return  admininistration_level_0,admininistration_level_1,admininistration_level_2,admininistration_level_3
    except:

        print("Unexpected error (util.py getIstatCodeByLatLon):", sys.exc_info()[0], sys.exc_info()[1])
        return "","","",""



"""

Questo metodo viene chiamato dallo script Main -Read Data.py.

Dato il json di un tweet restituisce l'eventuale codice istat associato al tweet.

La priorità per assegnare un'informazione di localizazione ad un tweet è la seguente:

- jsonTweet["geo"]  getIstatCodeByLatLon(year,lat, lon)

- jsonTweet["place"]["name"] getIstatCodeByLocation(year, location)

- jsonTweet["user"]["location"] getIstatCodeByLocation(year, location)

"""


def getIstatCode(jsonTweet,year):
        """INIZIO COMMENTO
        in queste righe viene recuperata l'informazione geografica del tweet analizzato
        -se è presente il campo 'geo', lat e lon vengono utilizzati per effettuare reverse geocoding (in locale)
        e recuperare la corrispettiva il codice istat dell'entità territoriale
        -se non è presente in campo 'geo, ma è presente il campo 'place', viene utilizzato il place id
        fornito da Twitter e l'API api.twitter.com/1.1/geo/id per recuperare il codice istat del place
        -se nessuna informazione di localizzazione è presente, le divisioni amministrative sono settate come vuote

        i metodi getIstatCodeByLatLon e getIstatCodeByPlaceId sono implementati nel file util.py

    l'inserimento dell'anno è necessario per far riferimento alla suddivisione amministrativa dell'anno in cui è stato postato il tweet.
    NB. le suddivisioni ammministrative cambiano spesso (es. province
        """

        if jsonTweet["geo"] is not None:
            #print(jsonTweet["geo"])
            admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3 =\
                getIstatCodeByLatLon(year,jsonTweet["geo"]["coordinates"][0],jsonTweet["geo"]["coordinates"][1])
            #print("geo",admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3)
        elif jsonTweet["place"] is not None and jsonTweet["place"]["country_code"]=="IT":
            #print("by place name")
            admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3 = \
                getIstatCodeByLocation(year,jsonTweet["place"]["name"])
            #centroid=jsonTweet["place"]['bounding_box']['coordinates'][0]
            #lat = numpy.average([ c[1] for c in centroid])
            #lon = numpy.average([ c[0] for c in centroid])

            #print(json.dumps(jsonTweet["place"]))

            #if len(centroid)>4:
            #    #print(json.dumps( jsonTweet["place"]))
            #    #p

            #admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3 =\
            #    getIstatCodeByLatLon(year,lat,lon)

            #print("centroide",admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3)


            #if admininistration_level_0=="":
                #print(json.dumps( jsonTweet["place"]))
                #print(jsonTweet["place"]["name"],admininistration_level_0,admininistration_level_1, admininistration_level_2, admininistration_level_3 )

            #    admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3 =\
            #        getIstatCodeByPlaceId(year,jsonTweet["place"]["id"])
            #    admininistration_level_0='IT'

            #print("twitter place",admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3)

        elif jsonTweet["user"]["location"] is not None:

            admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3 = \
                getIstatCodeByLocation(year, jsonTweet["user"]["location"])

            #print("NOT IT",admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3)

        else:
            admininistration_level_0=admininistration_level_1=admininistration_level_2=admininistration_level_3=""

            #if jsonTweet["place"] is not None and jsonTweet["place"]["country_code"]=="IT" and admininistration_level_0=="":
            #    print(jsonTweet['place'])

        return admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3



"""
NON UTILIZZATA

Questa funzione non viene più usata.
Precedentemente era utilizzata per interrogare l'api place di twitter che fornisce il codice istat nel campo result['attributes']['174368:admin_order_id'].
I codici istat però non sono aggiornati.


"""

def getIstatCodeByPlaceId(year,place_id):

    try:

        cur.execute("select * from twitter_places where id = %s",(place_id))
        result=cur.fetchone()
        admininistration_level_0=admininistration_level_1=admininistration_level_2=admininistration_level_3=""

        if result is None:

            result=getPlace(place_id)
            cur.execute("INSERT INTO `twitter_places`(`id`, `json`)"
                        " VALUES (%s,%s)",(place_id,json.dumps(result)))
            db.commit()
        else:
            result=json.loads(result[1])


        #Purtroppo  twitter fornisce i codici istat non aggiornati, per questo motivo non usiamo questo sistema
        if result is not None and "country_code" in result and result["country_code"]=="IT" and '174368:admin_order_id' in result['attributes']:
            codes = result['attributes']['174368:admin_order_id']
            #es ITA:03::::::015:015182
            if len(codes)>3:
                admininistration_level_0=codes.split(":")[0]
                admininistration_level_1=codes.split(":")[1]
                if len(codes.split(":"))>7:
                    admininistration_level_2=codes.split(":")[7]
                if len(codes.split(":"))>8:
                    admininistration_level_3=codes.split(":")[8]
            elif len(codes)==3:
                admininistration_level_0=codes

        elif "country_code" in result and result["country_code"]=="IT" and '174368:admin_order_id' not in result['attributes']:
            admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3 = \
                getIstatCodeByLatLon(year,result['centroid'][1],result['centroid'][0])


        return admininistration_level_0, admininistration_level_1, admininistration_level_2, admininistration_level_3

    except:

        print("Unexpected error:", sys.exc_info()[0], sys.exc_info()[1])
        return "","","",""


#############################################################################
#
#                                      API TWITTER
#
#############################################################################




"""
NON UTILIZZATA

Questa funzione viene utilizzata per recuperare il JSON di un place dato un place id.
viene chiamata da def getIstatCodeByPlaceId(year,place_id)

"""

def getPlace(place_id):

    place_endpoint = "https://api.twitter.com/1.1/geo/id/"+str(place_id)+".json"
    #print(place_endpoint)
    response, data = clientTwitter.request(place_endpoint)


    if 'status' in response:
        #print(response)
        #print('Reverse Geocoding: remain '+str( int(response['x-rate-limit-remaining']) )+' queries in this time slot')
        if int(response['x-rate-limit-remaining'])<2:
            print('Reverse Geocoding: wait '+str( int(response['x-rate-limit-reset']) - int(time.time()) )+' seconds')
            time.sleep(int(response['x-rate-limit-reset'])-int(time.time()))

    if response['status']=='200':
        print(response['x-rate-limit-remaining'])
        if int(response['x-rate-limit-remaining'])<2:
            print('Reverse Geocoding: wait '+str( int(response['x-rate-limit-reset']) - int(time.time()) )+' seconds')
            time.sleep(int(response['x-rate-limit-reset'])-int(time.time()))

        result = json.loads(data.decode("utf-8"))

    else:
        #print({ "status": response['status']})
        #result = json.loads("{ \"status\": "+response['status']+"}")
        result = None

    print('Wait '+str((15*60)/int(response['x-rate-limit-limit']))+' seconds')
    time.sleep((15*60)/int(response['x-rate-limit-limit']))
    return result



"""
Questa funzione viene utilizzata per recuperare il JSON di un tweet a partire da un tweet id


"""
def getJsonFromId(id):



    status_endpoint = "https://api.twitter.com/1.1/statuses/show.json?id=" + str(id)
    response, data = clientTwitter.request(status_endpoint)
    if 'status' in response:
        #print(response)
        if int(response['x-rate-limit-remaining'])<2:
            print('id rescue: wait '+str( int(response['x-rate-limit-reset']) - int(time.time()) )+' seconds')
            time.sleep(int(response['x-rate-limit-reset'])-int(time.time()))

        #print(response['status'])
        if response['status'] == '200':
            print('Retrieving reply: remain ' + str(int(response['x-rate-limit-remaining'])) + ' queries in this time slot')
            if int(response['x-rate-limit-remaining']) < 2:
                print('id rescue: wait ' + str(int(response['x-rate-limit-reset']) - int(time.time())) + ' seconds')
                time.sleep(int(response['x-rate-limit-reset']) - int(time.time()))

            jsonTweet = json.loads(data)
            
        else:
            return None

        #print(jsonTweet)

        return jsonTweet
    else:
        return None



if __name__ == "__main__":

    #print(getIstatCodeByPlaceId(2018,"f0e73a6389100096"))
    #print("Cozzillandia place id",getIstatCodeByPlaceId(2018,"f6a7160aac613a28")) #cozzillandia anche nota come Furtei

    #print(2013,getIstatCodeByLatLon(2013,39.564417, 8.969107))
    #print(2014,getIstatCodeByLatLon(2014,39.564417, 8.969107))
    #print(2015,getIstatCodeByLatLon(2015,39.564417, 8.969107))
    #print(2016,getIstatCodeByLatLon(2016,39.564417, 8.969107))
    #print(2017,getIstatCodeByLatLon(2017,39.564417, 8.969107))
    print("Cozzillandia by lat lon", 2018,getIstatCodeByLatLon(2018,39.569744, 8.941099))



    jsonTweet=getJsonFromId(1057283564520308738)
    print(json.dumps(jsonTweet))
    print("Cozzillandia place name",getIstatCode(jsonTweet,1995))

    jsonTweet=getJsonFromId(1024414848581550080)
    print(json.dumps(jsonTweet))
    print("altro comune place name",getIstatCode(jsonTweet,1995))

