var mysql = require('mysql');


function strcmp(a, b)
{
    return (a<b?0:(a>b?0:1));
}

function parseDate(str) {
    function pad(x){return (((''+x).length==2) ? '' : '0') + x; }
    var m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        , d = (m) ? new Date(m[3], m[2]-1, m[1]) : null
        , matchesPadded = (d&&(str==[pad(d.getDate()),pad(d.getMonth()+1),d.getFullYear()].join('/')))
        , matchesNonPadded = (d&&(str==[d.getDate(),d.getMonth()+1,d.getFullYear()].join('/')));
    return (matchesPadded || matchesNonPadded) ? d : null;
}



try {

    var pool = mysql.createPool({
        host: "localhost",
        user: "<USERNAME DB>",
        password: "<PASSWORD DB>",
        database: "HS",
        connectionLimit: 500,
        supportBigNumbers: true
    })

} catch (e) {

    console.log(e);
    res.send({"status":500} );


}


exports.getLevelOfAttribute = function(callback, req) {


    try {

        console.log(req.query);

        var select = "SELECT sum(`count`) as `count`,sum(hs_no_count) as no, sum(hs_yes_count) as yes ";
        var from = "   FROM daily_frequency_topic  ";
        var where = "";
        var group_by = "";
        var input = [];


        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro year è obbligatorio è sono valide le varianti di interrogazione nel seguente ordine di priorità:
           year and month and day
           year and month
           year and week_year
           year

         */

        var year = req.query.year;
        var month = req.query.month;
        var day = req.query.day;
        var week_year = req.query.week_year;


        if (year != null && month != null && day != null) {

            //select += ", year, month, day";
            where += " WHERE year = ? and month = ? and day = ?";
            //group_by = "GROUP BY year, month, day";
            input = input.concat(year, month, day);

        } else if (year != null && week_year != null) {

            //select += ", year, week_year";
            where += " WHERE  year = ? and week_year = ? ";
            //group_by = " GROUP BY year, week_year ";
            input = input.concat(year, week_year);

        } else if (year != null && month != null) {

            //select += ", year, month";
            where += " WHERE  year = ? and month = ? ";
            //group_by = " GROUP BY year, month ";
            input = input.concat(year, month);

        } else if (year != null ) {

            //select += ", year";
            where += " WHERE  year = ? ";
            //group_by = " GROUP BY year ";
            input = input.concat(year);

        } else {

            callback(null, {"status": 409, "message": "mandatory parameters (year and month and day) OR (year and month) OR (year and week_year) OR (year)"});
            return;
        }



        //Inizializzazione parametro topic.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma
         */

        var topic = req.query.topic;


        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){


            //select += ", topic";
            where += "AND topic=?";
            //group_by += ", topic";
            input = input.concat(topic);

        } else {

            callback(null, {"status": 409, "message": "mandatory parameters topic ([all, etnichs_group, religion, roma]"});
            return;
        }


        //Tipo di aggregazione geografica.
        /*Parametro administrative_division obbligatorio.
            valori possibili =0, 1,  2

        */

        var administrative_division = req.query.administrative_division;

         //Inizializzazione parametri realtivi alla presenza di dati geografici.
        if (administrative_division != null && strcmp(administrative_division, '0') > 0 ) {

                    where += " AND administrative_division_0 ='IT'";
                    select += ", administrative_division_0";
                    group_by += "GROUP BY administrative_division_0";

        }
        else if (administrative_division != null && strcmp(administrative_division, '1') > 0 ) {

                      //where += " AND administrative_division_1 != ''";
                      select += ", administrative_division_1";
                      group_by += "GROUP BY  administrative_division_1";
        }
        else if (administrative_division != null && strcmp(administrative_division, '2') > 0 ) {

                     //where += " AND administrative_division_2 != '' ";
                     select += ", administrative_division_2";
                     group_by += "GROUP BY  administrative_division_2";
        } else{

                    callback(null, {"status": 409, "message": "mandatory parameters administrative_division  [0,1,2] )"});
                    return;


        }



        var query = select + from + where + group_by;
        console.log(query)
        // get a connection from the pool

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);

        callback(null,{"status":500});
        return;


    }

};





exports.getTimeFrequency = function(callback, req) {


    try {

        console.log(req.query);

        var select = " SELECT sum(`count`) as `count`,sum(hs_no_count) as no, sum(hs_yes_count) as yes ";
        var from = "   FROM daily_frequency ";
        var where = "";
        var group_by = "";
        var order ="";
        var input = [];

        //Inizializzazione parametro della frequenza temporale.
        /*
           Il parametro frequenza temporale è obbligatorio e indica il tipo di suddivisione temporale da effettuare nell'intervallo di tempo definito da startdate and enddate
           Può assumery i seguenti valori:
            daily
            weekly
            monthly
            annually

         */

        var frequency = req.query.frequency;


        if (['daily','weekly','monthly','annually'].indexOf(frequency) > -1){


            if(strcmp(frequency, 'daily') > 0) {


                select += ", `year`, `month`, `day`";
                group_by = " GROUP BY `year`, `month`, `day`";
                order=" order by `year`, `month`, `day` asc";

            } else
            if(strcmp(frequency, 'weekly') > 0) {


                select += ", `year`, `week_year`";
                group_by = " GROUP BY `year`, `week_year`";
                order=" order by `year`, `week_year` asc";

            } else
            if(strcmp(frequency, 'monthly') > 0) {


                select += ", `year`, `month`";
                group_by = " GROUP BY `year`, `month`";
                order=" order by `year`, `month` asc";

            } else
            if(strcmp(frequency, 'annually') > 0) {


                select += ", `year`";
                group_by = " GROUP BY `year`";
                order=" order by `year` asc";
            }




        }else {

            callback(null, {"status": 409, "message": "mandatory parameter frequency [daily, weekly, monthly, annually]"});
            return;
        }


        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro startdate è obbligatorio mentre enddate è opzionale.
           Il formato della data deve essere espresso in questa forma 'DD/MM/YYYY'

         */

        var startdate= req.query.startdate;
        var enddate  = req.query.enddate;

        if (startdate != null && parseDate(startdate) != null) {

            var date=parseDate(startdate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();
            //02/02/2017 query
            //01/01/2018
            where += " WHERE ((year >= ? and month >= ? and day >= ?) or  (year >= ? and month > ?)  or (year > ?)) ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);



        }else{

            callback(null, {"status": 409, "message": "mandatory parameters startdate (format date DD/MM/YYYY)"});
            return;


        }

        if (enddate != null && parseDate(enddate) != null) {

            var date=parseDate(enddate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            where += " AND ((year <= ? and month <= ? and day <= ?) or  (year <= ? and month < ?)  or (year < ?)) ";

            //where += " AND   year <= ? and month <= ? and day <= ? ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);
        }





        //Inizializzazione parametro topic.
        /*
            Il parametro topic non è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma


            Se non settato viene restituito il conteggio su tutta la lingua italiana

         */

        var topic = req.query.topic;

        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){


            select += ", topic";
            where += " AND topic=? ";
            //group_by += ", topic";
            input = input.concat(topic);

        }/*else if (attribute!=null) {

            callback(null, {"status": 409, "message": "using attribute parameter topic ([all, etnichs_group, religion, roma] is mandatory"});
            return;
        }*/


        else{

            from = "   FROM daily_frequency_topic  ";

        }




        //Inizializzazione parametri realtive all'intervallo spaziale.
        /*
           non è obbbligatorio definire un filtro spaziale e la priorità dei parametri è la seguente:
           administrative_division_3
           administrative_division_2
           administrative_division_1
           administrative_division_0

         */


        var administrative_division_0 = req.query.administrative_division_0;
        var administrative_division_1 = req.query.administrative_division_1;
        var administrative_division_2 = req.query.administrative_division_2;
        //var administrative_division_3 = req.query.administrative_division_3;


        /*if (administrative_division_3 != null) {

            select += ", administrative_division_3";
            where += "AND administrative_division_3=?";
            //group_by += ", administrative_division_3";
            input = input.concat(administrative_division_3);

        }


        else*/
        if (administrative_division_2 != null) {

            select += ", administrative_division_2";
            where += " AND administrative_division_2=?";
            //group_by += ", administrative_division_2";
            input = input.concat(administrative_division_2);

        }

        else if (administrative_division_1 != null) {

            select += ", administrative_division_1";
            where += " AND administrative_division_1=?";
            //group_by += ", administrative_division_1";
            input = input.concat(administrative_division_1);

        }

        else if (administrative_division_0 != null) {

            select += ", administrative_division_0";
            where += " AND administrative_division_0=?";
            //group_by += ", administrative_division_0";
            input = input.concat(administrative_division_0);

        }


        /*

            filtro sulla presenza o meno  di informazioni geografiche

        */

        var is_administrative_division_0 = req.query.is_administrative_division_0;
        var is_administrative_division_1 = req.query.is_administrative_division_1;
        var is_administrative_division_2 = req.query.is_administrative_division_2;
         //Inizializzazione parametri realtivi alla presenza di dati geografici.
        if (is_administrative_division_0 != null && strcmp(is_administrative_division_0, 'true') > 0 ) {

                    where += " AND administrative_division_0 ='IT'";

        }
        if (is_administrative_division_1 != null && strcmp(is_administrative_division_1, 'true') > 0 ) {

                      where += " AND administrative_division_1 != ''";

        }
        if (is_administrative_division_2 != null && strcmp(is_administrative_division_2, 'true') > 0 ) {

                      where += " AND administrative_division_2 != ''";

        }

        var query = select + from + where + group_by + order;

        // get a connection from the pool

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});
                console.log(1);

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);
        callback(null,{"status":500});
        return;


    }

};


exports.getVirality = function(callback, req) {


    try {

        console.log(req.query);

        var select = " ";
        var from = "   FROM daily_virality ";
        var where = "";
        var group_by = "";
        var order ="";
        var limit = " LIMIT 0,10";
        var input = [];





        //Inizializzazione parametro type.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            retweet, reply, quote


         */

        var type = req.query.type;

        if (['retweet', 'reply', 'quote'].indexOf(type) > -1){


            select += "SELECT `id`, sum("+type+") as `count`";
            order += " order by `count` desc";
            group_by+= "GROUP BY `id` "

        }else {

            callback(null, {"status": 409, "message": " mandatory parameter type ([retweet, reply, quote]"});
            return;
        }


        //Inizializzazione parametro limit.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            retweet, reply, quote


        */

        var par_limit = req.query.limit;

        if (par_limit!= null && !isNaN(par_limit)){


            limit= " LIMIT 0,"+par_limit;

        }


        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro startdate è obbligatorio mentre enddate è opzionale.
           Il formato della data deve essere espresso in questa forma 'DD/MM/YYYY'

         */

        var startdate= req.query.startdate;
        var enddate  = req.query.enddate;

        if (startdate != null && parseDate(startdate) != null) {

            var date=parseDate(startdate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();
            //02/02/2017 query
            //01/01/2018
            where += " WHERE ((year >= ? and month >= ? and day >= ?) or  (year >= ? and month > ?)  or (year > ?)) ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);



        }else{

            callback(null, {"status": 409, "message": "mandatory parameters startdate (format date DD/MM/YYYY)"});
            return;


        }

        if (enddate != null && parseDate(enddate) != null) {

            var date=parseDate(enddate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            where += " AND ((year <= ? and month <= ? and day <= ?) or  (year <= ? and month < ?)  or (year < ?)) ";


            //where += " AND   year <= ? and month <= ? and day <= ? ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);
        }





        //Inizializzazione parametro topic.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma


            Se non settato viene restituito il conteggio su tutta la lingua italiana

         */

        var topic = req.query.topic;

        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){


            select += ", topic";
            where += " AND topic=? ";
            //group_by += ", topic";
            input = input.concat(topic);

        }else {

            callback(null, {"status": 409, "message": " mandatory parameter topic ([all, etnichs_group, religion, roma]"});
            return;
        }


        //Inizializzazione parametri realtive all'intervallo spaziale.
        /*
           non è obbbligatorio definire un filtro spaziale e la priorità dei parametri è la seguente:
           administrative_division_3
           administrative_division_2
           administrative_division_1
           administrative_division_0

         */


        var administrative_division_0 = req.query.administrative_division_0;
        var administrative_division_1 = req.query.administrative_division_1;
        var administrative_division_2 = req.query.administrative_division_2;
        //var administrative_division_3 = req.query.administrative_division_3;


        /*if (administrative_division_3 != null) {

            select += ", administrative_division_3";
            where += "AND administrative_division_3=?";
            //group_by += ", administrative_division_3";
            input = input.concat(administrative_division_3);

        }
        else */if (administrative_division_2 != null) {

            select += ", administrative_division_2";
            where += "AND administrative_division_2=?";
            //group_by += ", administrative_division_2";
            input = input.concat(administrative_division_2);

        }

        else if (administrative_division_1 != null) {

            select += ", administrative_division_1";
            where += " AND administrative_division_1=?";
            //group_by += ", administrative_division_1";
            input = input.concat(administrative_division_1);

        }

        else if (administrative_division_0 != null) {

            select += ", administrative_division_0";
            where += " AND administrative_division_0=?";
            //group_by += ", administrative_division_0";
            input = input.concat(administrative_division_0);

        }

        var is_administrative_division_0 = req.query.is_administrative_division_0;
        var is_administrative_division_1 = req.query.is_administrative_division_1;
        var is_administrative_division_2 = req.query.is_administrative_division_2;
         //Inizializzazione parametri realtivi alla presenza di dati geografici.
        if (is_administrative_division_0 != null && strcmp(is_administrative_division_0, 'true') > 0 ) {

                    where += " AND administrative_division_0 ='IT'";

        }
        if (is_administrative_division_1 != null && strcmp(is_administrative_division_1, 'true') > 0 ) {

                      where += " AND administrative_division_1 != ''";

        }
        if (is_administrative_division_2 != null && strcmp(is_administrative_division_2, 'true') > 0 ) {

                      where += " AND administrative_division_2 != ''";

        }


        var query = select + from + where + group_by + order + limit;
        console.log(query);
        console.log(input);


        // get a connection from the pool

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});
                console.log(1);

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);
        callback(null,{"status":500});
        return;


    }

};


exports.getAvg = function(callback, req) {


    try {

        console.log(req.query);
	

        var select = " SELECT sum(`count`) as `avg_tweet`, sum(hs_yes_count) /( sum(hs_yes_count) + sum(hs_no_count ) ) as avg_frac  ";
        var from = "   FROM daily_frequency_topic ";
        var where = "";
        var group_by = " ";
        var order ="    ";
        var input = [];

        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro startdate è obbligatorio mentre enddate è opzionale.
           Il formato della data deve essere espresso in questa forma 'DD/MM/YYYY'

         */

        var startdate = req.query.startdate;
        var pastdays = req.query.pastdays;


        console.log(startdate)
        console.log(pastdays)
        if (startdate != null && parseDate(startdate) != null  && pastdays!=null && pastdays>0 ) {


            var startdate= req.query.startdate;
            console.log(startdate)
            console.log(pastdays)

            var date=parseDate(startdate);
            date.setDate(date.getDate()-pastdays);
            console.log(date)
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            where += " WHERE ((year >= ? and month >= ? and day >= ?) or  (year >= ? and month > ?)  or (year > ?)) ";


            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);

            var date=parseDate(startdate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);
            where += " AND ((year <= ? and month <= ? and day <= ?) or  (year <= ? and month < ?)  or (year < ?)) ";

        }else{

            callback(null, {"status": 409, "message": "mandatory parameters startdate (format date DD/MM/YYYY) and pastdays (integer)"});
            return;


        }

	    select += ", `year`, `month`, `day`";
        group_by = " GROUP BY `year`, `month`, `day`";


        //Inizializzazione parametro topic.
        /*
            Il parametro topic non è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma


            Se non settato viene restituito il conteggio su tutta la lingua italiana

         */

        var topic = req.query.topic;

        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){

            where += " AND topic=? ";
            //group_by += ", topic";
            input = input.concat(topic);

        }else {

            callback(null, {"status": 409, "message": "using attribute parameter topic ([all, etnichs_group, religion, roma] is mandatory"});
            return;
        }





        //Inizializzazione parametri realtive all'intervallo spaziale.
        /*
           non è obbbligatorio definire un filtro spaziale e la priorità dei parametri è la seguente:
           administrative_division_3
           administrative_division_2
           administrative_division_1
           administrative_division_0

         */


        var administrative_division_0 = req.query.administrative_division_0;
        var administrative_division_1 = req.query.administrative_division_1;
        var administrative_division_2 = req.query.administrative_division_2;
        //var administrative_division_3 = req.query.administrative_division_3;



        if (administrative_division_2 != null) {

            where += "AND administrative_division_2=?";
            //group_by += ", administrative_division_2";
            input = input.concat(administrative_division_2);

        }

        else if (administrative_division_1 != null) {

            where += " AND administrative_division_1=?";
            //group_by += ", administrative_division_1";
            input = input.concat(administrative_division_1);

        }

        else if (administrative_division_0 != null) {

            where += " AND administrative_division_0=?";
            //group_by += ", administrative_division_0";
            input = input.concat(administrative_division_0);

        }



        var is_administrative_division_0  = req.query.is_administrative_division_0;
        var is_administrative_division_1 = req.query.is_administrative_division_1;
        var is_administrative_division_2 = req.query.is_administrative_division_2;
         //Inizializzazione parametri realtivi alla presenza di dati geografici.
        if (is_administrative_division_0 != null && strcmp(is_administrative_division_0, 'true') > 0 ) {

                    where += " AND administrative_division_0 ='IT'";

        }
        if (is_administrative_division_1 != null && strcmp(is_administrative_division_1, 'true') > 0 ) {

                      where += " AND administrative_division_1 != ''";

        }
        if (is_administrative_division_2 != null && strcmp(is_administrative_division_2, 'true') > 0 ) {

                      where += " AND administrative_division_2 != ''";

        }

        var query = select + from + where + group_by + order;


	    var query = "select avg(avg_tweet) as avg_tweet, avg(avg_frac) as avg_fraq,"
	     +" max(avg_tweet) as max_tweet, min(avg_tweet) as min_tweet, "
	     +" max(avg_frac) as max_frac, min(avg_frac) as min_frac "
	     +" from ("+query+") as temp"
        // get a connection from the pool
        console.log(query)

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});
                console.log(1);

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);
        callback(null,{"status":500});
        return;


    }

};


exports.getMedian = function(callback, req) {


    try {

        console.log(req.query);


        var select = " SELECT  sum(`count`) as `median_tweet`, sum(hs_yes_count) /( sum(hs_yes_count) + sum(hs_no_count ) ) as median_frac ";
        var from = "   FROM daily_frequency_topic ";
        var where = "";
        var group_by = " ";
        var order ="    ";
        var input = [];


        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro startdate è obbligatorio mentre enddate è opzionale.
           Il formato della data deve essere espresso in questa forma 'DD/MM/YYYY'

         */

        var startdate = req.query.startdate;
        var pastdays = req.query.pastdays;


        console.log(startdate)
        console.log(pastdays)
        if (startdate != null && parseDate(startdate) != null  && pastdays!=null && pastdays>0 ) {


            var startdate= req.query.startdate;
            console.log(startdate)
            console.log(pastdays)

            var date=parseDate(startdate);
            date.setDate(date.getDate()-pastdays);
            console.log(date)
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            where += " WHERE ((year >= ? and month >= ? and day >= ?) or  (year >= ? and month > ?)  or (year > ?)) ";


            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);

            var date=parseDate(startdate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);
            where += " AND ((year <= ? and month <= ? and day <= ?) or  (year <= ? and month < ?)  or (year < ?)) ";

        }else{

            callback(null, {"status": 409, "message": "mandatory parameters startdate (format date DD/MM/YYYY) and pastdays (integer)"});
            return;


        }

	    select += ", `year`, `month`, `day`";
        group_by = " GROUP BY `year`, `month`, `day`";


        //Inizializzazione parametro topic.
        /*
            Il parametro topic non è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma


            Se non settato viene restituito il conteggio su tutta la lingua italiana

         */

        var topic = req.query.topic;

        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){

            where += " AND topic=? ";
            //group_by += ", topic";
            input = input.concat(topic);

        }else {

            callback(null, {"status": 409, "message": "using attribute parameter topic ([all, etnichs_group, religion, roma] is mandatory"});
            return;
        }





        //Inizializzazione parametri realtive all'intervallo spaziale.
        /*
           non è obbbligatorio definire un filtro spaziale e la priorità dei parametri è la seguente:
           administrative_division_3
           administrative_division_2
           administrative_division_1
           administrative_division_0

         */


        var administrative_division_0 = req.query.administrative_division_0;
        var administrative_division_1 = req.query.administrative_division_1;
        var administrative_division_2 = req.query.administrative_division_2;



        if (administrative_division_2 != null) {

            where += "AND administrative_division_2=?";
            input = input.concat(administrative_division_2);

        }

        else if (administrative_division_1 != null) {

            where += " AND administrative_division_1=?";
            input = input.concat(administrative_division_1);

        }

        else if (administrative_division_0 != null) {

            where += " AND administrative_division_0=?";
            input = input.concat(administrative_division_0);

        }



        var is_administrative_division_0  = req.query.is_administrative_division_0;
        var is_administrative_division_1 = req.query.is_administrative_division_1;
        var is_administrative_division_2 = req.query.is_administrative_division_2;
         //Inizializzazione parametri realtivi alla presenza di dati geografici.
        if (is_administrative_division_0 != null && strcmp(is_administrative_division_0, 'true') > 0 ) {

                    where += " AND administrative_division_0 ='IT'";

        }
        if (is_administrative_division_1 != null && strcmp(is_administrative_division_1, 'true') > 0 ) {

                      where += " AND administrative_division_1 != ''";

        }
        if (is_administrative_division_2 != null && strcmp(is_administrative_division_2, 'true') > 0 ) {

                      where += " AND administrative_division_2 != ''";

        }

        var query1 = select + from + where + group_by + order;
        var query2 = "( "+query1+" )   as temp1"
        var query3 = "select *, @rowindex:=@rowindex+1 as rowindex from ("+ query2 +"), (SELECT @rowindex:=0)  AS temp2 "



	    var query =
	    "select avg(median_tweet),avg(median_frac),avg(rowindex) from ("+query3+") as temp3 "+
	    " WHERE rowindex IN (FLOOR(@rowindex / 2) , CEIL(@rowindex / 2)); "
        // get a connection from the pool

        console.log(query);
        console.log(input);

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});
                console.log(1);

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);
        callback(null,{"status":500});
        return;


    }

};




exports.getMinMax = function(callback, req) {


    try {

        console.log(req.query);


        var select = " SELECT sum(`count`) as `tweet`  ";
        var from = "   FROM daily_frequency_topic ";
        var where = "";
        var group_by = " ";
        var order ="    ";
        var input = [];

        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro startdate è obbligatorio mentre enddate è opzionale.
           Il formato della data deve essere espresso in questa forma 'DD/MM/YYYY'

         */

        var startdate = req.query.startdate;
        var pastdays = req.query.pastdays;


        console.log(startdate)
        console.log(pastdays)
        if (startdate != null && parseDate(startdate) != null  && pastdays!=null && pastdays>0 ) {


            var startdate= req.query.startdate;
            console.log(startdate)
            console.log(pastdays)

            var date=parseDate(startdate);
            date.setDate(date.getDate()-pastdays);
            console.log(date)
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            where += " WHERE ((year >= ? and month >= ? and day >= ?) or  (year >= ? and month > ?)  or (year > ?)) ";


            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);

            var date=parseDate(startdate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);
            where += " AND ((year <= ? and month <= ? and day <= ?) or  (year <= ? and month < ?)  or (year < ?)) ";

        }else{

            callback(null, {"status": 409, "message": "mandatory parameters startdate (format date DD/MM/YYYY) and pastdays (integer)"});
            return;


        }

        var frequency = req.query.frequency;


        if (['daily','weekly','monthly','annually'].indexOf(frequency) > -1){


            if(strcmp(frequency, 'daily') > 0) {

                select += ", `year`, `month`, `day`";
                group_by = " GROUP BY `year`, `month`, `day`";

            } else
            if(strcmp(frequency, 'weekly') > 0) {

                select += ", `year`, `week_year`";
                group_by = " GROUP BY `year`, `week_year`";

            } else
            if(strcmp(frequency, 'monthly') > 0) {

                select += ", `year`, `month`";
                group_by = " GROUP BY `year`, `month`";

            } else
            if(strcmp(frequency, 'annually') > 0) {

                select += ", `year`";
                group_by = " GROUP BY `year`";
            }




        }else {

            callback(null, {"status": 409, "message": "mandatory parameter frequency [daily, weekly, monthly, annually]"});
            return;
        }



        //Inizializzazione parametro topic.
        /*
            Il parametro topic non è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma


            Se non settato viene restituito il conteggio su tutta la lingua italiana

         */

        var topic = req.query.topic;

        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){

            where += " AND topic=? ";
            group_by += ", topic";
            input = input.concat(topic);

        }else {

            callback(null, {"status": 409, "message": "using attribute parameter topic ([all, etnichs_group, religion, roma] is mandatory"});
            return;
        }





        //Inizializzazione parametri realtive all'intervallo spaziale.
        /*
           non è obbbligatorio definire un filtro spaziale e la priorità dei parametri è la seguente:
           administrative_division_3
           administrative_division_2
           administrative_division_1
           administrative_division_0

         */


        var administrative_division_0 = req.query.administrative_division_0;
        var administrative_division_1 = req.query.administrative_division_1;
        var administrative_division_2 = req.query.administrative_division_2;
        //var administrative_division_3 = req.query.administrative_division_3;



        if (administrative_division_2 != null) {

            where += "AND administrative_division_2=?";
            input = input.concat(administrative_division_2);

        }

        else if (administrative_division_1 != null) {


            where += "AND administrative_division_1=?";
            input = input.concat(administrative_division_1);

        }

        else if (administrative_division_0 != null) {


            where += "AND administrative_division_0=?";
            input = input.concat(administrative_division_0);

        }



        var is_administrative_division_0 = req.query.is_administrative_division_0;
        var is_administrative_division_1 = req.query.is_administrative_division_1;
        var is_administrative_division_2 = req.query.is_administrative_division_2;
         //Inizializzazione parametri realtivi alla presenza di dati geografici.
        if (is_administrative_division_0 != null && strcmp(is_administrative_division_0, 'true') > 0 ) {

                    select += " ,administrative_division_0";
                    where += " AND administrative_division_0 ='IT'";
                    group_by += ", administrative_division_0";

        }
        if (is_administrative_division_1 != null && strcmp(is_administrative_division_1, 'true') > 0 ) {

                    select += " ,administrative_division_1";
                    where += " AND administrative_division_1 !=''";
                    group_by += ", administrative_division_1";
        }
        if (is_administrative_division_2 != null && strcmp(is_administrative_division_2, 'true') > 0 ) {

                    select += " ,administrative_division_2";
                    where += " AND administrative_division_2 !=''";
                    group_by += ", administrative_division_2";
        }

        var query = select + from + where + group_by + order;


        // get a connection from the pool

	    var query =
	    "select min(tweet) as min_tweet, max(tweet) as max_tweet from ("+query+") as temp2; "
        console.log(query)

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});
                console.log(1);

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);
        callback(null,{"status":500});
        return;


    }

};

exports.getTokenFrequency = function(callback, req) {


    try {

        console.log(req.query);

        var select = " ";
        var from = " ";
        var where = "";
        var group_by = "";
        var order ="";
        var limit = " LIMIT 0,10";
        var input = [];





        //Inizializzazione parametro type.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            hashtag, mention, word


         */

        var type = req.query.type;

        if (['hashtag', 'mention', 'word'].indexOf(type) > -1){

            from=" FROM daily_"+type+"_frequency "
            select += "SELECT `token`, sum(`count`) as `count`, sum(`count_hs_yes`) as `count_hs_yes` ";
            order += " order by `count` desc, `count_hs_yes` desc";
            group_by+= " GROUP BY `token` "

        }else {

            callback(null, {"status": 409, "message": " mandatory parameter type ([retweet, reply, quote]"});
            return;
        }


        //Inizializzazione parametro limit.

        var par_limit = req.query.limit;

        if (par_limit!= null && !isNaN(par_limit)){


            limit= " LIMIT 0,"+par_limit;

        }


        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro startdate è obbligatorio mentre enddate è opzionale.
           Il formato della data deve essere espresso in questa forma 'DD/MM/YYYY'

         */

        var startdate= req.query.startdate;
        var enddate  = req.query.enddate;

        if (startdate != null && parseDate(startdate) != null) {

            var date=parseDate(startdate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();
            //02/02/2017 query
            //01/01/2018
            where += " WHERE ((year >= ? and month >= ? and day >= ?) or  (year >= ? and month > ?)  or (year > ?)) ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);



        }else{

            callback(null, {"status": 409, "message": "mandatory parameters startdate (format date DD/MM/YYYY)"});
            return;


        }

        if (enddate != null && parseDate(enddate) != null) {

            var date=parseDate(enddate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            where += " AND ((year <= ? and month <= ? and day <= ?) or  (year <= ? and month < ?)  or (year < ?)) ";


            //where += " AND   year <= ? and month <= ? and day <= ? ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);
        }





        //Inizializzazione parametro topic.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma


            Se non settato viene restituito il conteggio su tutta la lingua italiana

         */

        var topic = req.query.topic;

        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){


            select += ", topic";
            where += " AND topic=? ";
            //group_by += ", topic";
            input = input.concat(topic);

        }else {

            callback(null, {"status": 409, "message": " mandatory parameter topic ([all, etnichs_group, religion, roma]"});
            return;
        }


        var query = select + from + where + group_by + order + limit;
        console.log(query);
        console.log(input);


        // get a connection from the pool

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});
                console.log(1);

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);
        callback(null,{"status":500});
        return;


    }

};


exports.getTokenCorrelation = function(callback, req) {


    try {

        console.log(req.query);

        var select = " ";
        var from = " ";
        var where = "";
        var group_by = "";
        var order ="";
        var limit = " LIMIT 0,10";
        var input = [];


        //Inizializzazione parametro token.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            hashtag, mention, word


         */

        var token = req.query.token;

        if (token!= null){

            from=" FROM daily_co_occurrence_word_frequency "
            select += "SELECT IF(`token_1`=?,`token_1`,`token_2`) token_1 , IF(`token_1`=?,`token_2`,`token_1`) token_2, sum(`count`) as `count`, sum(`count_hs_yes`) as `count_hs_yes` ";
            order += " ORDER BY `count` desc, `count_hs_yes` desc ";
            group_by+= " GROUP BY token_1, token_2 "

            input = input.concat(token);
            input = input.concat(token);


        }else {

            callback(null, {"status": 409, "message": " mandatory parameter token"});
            return;
        }






        //Inizializzazione parametro limit.

        var par_limit = req.query.limit;

        if (par_limit!= null && !isNaN(par_limit)){


            limit= " LIMIT 0,"+par_limit;

        }


        //Inizializzazione parametri realtivi all'intervallo temporale.
        /*
           Il parametro startdate è obbligatorio mentre enddate è opzionale.
           Il formato della data deve essere espresso in questa forma 'DD/MM/YYYY'

         */

        var startdate= req.query.startdate;
        var enddate  = req.query.enddate;

        if (startdate != null && parseDate(startdate) != null) {

            var date=parseDate(startdate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();
            //02/02/2017 query
            //01/01/2018
            where += " WHERE ((year >= ? and month >= ? and day >= ?) or  (year >= ? and month > ?)  or (year > ?)) ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);

            where += " AND (token_1 =? OR  token_2= ?) "
            input = input.concat(token);
            input = input.concat(token);

        }else{

            callback(null, {"status": 409, "message": "mandatory parameters startdate (format date DD/MM/YYYY)"});
            return;


        }

        if (enddate != null && parseDate(enddate) != null) {

            var date=parseDate(enddate);
            var year = date.getFullYear();
            var month = date.getMonth()+1;
            var day = date.getDate();

            where += " AND ((year <= ? and month <= ? and day <= ?) or  (year <= ? and month < ?)  or (year < ?)) ";


            //where += " AND   year <= ? and month <= ? and day <= ? ";

            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(day);
            input = input.concat(year);
            input = input.concat(month);
            input = input.concat(year);
        }





        //Inizializzazione parametro topic.
        /*
            Il parametro topic è obbligatorio è può assumere uno dei seguenti valori:
            all
            etnichs_group
            religion
            roma


            Se non settato viene restituito il conteggio su tutta la lingua italiana

         */

        var topic = req.query.topic;

        if (['all', 'etnichs_group', 'religion', 'roma'].indexOf(topic) > -1){


            select += ", topic";
            where += " AND topic=? ";
            //group_by += ", topic";
            input = input.concat(topic);

        }else {

            callback(null, {"status": 409, "message": " mandatory parameter topic ([all, etnichs_group, religion, roma]"});
            return;
        }


        var query = select + from + where + group_by + order + limit;
        console.log(query);
        console.log(input);


        // get a connection from the pool

        var result=null;
        pool.query(query, input,  function (err,row) {

            if (err) {
                console.log(err);
                callback(null, {"status": 500});
                console.log(1);

                return;

            }
            else {


                if (row.length>0) {
                    callback(null, {"status": 200, "data": row});
                }else{

                    callback(null, {"status": 200, "data": {}});

                }
                return;
            }
        });





    } catch (e) {
        console.log(e);
        callback(null,{"status":500});
        return;


    }

};

