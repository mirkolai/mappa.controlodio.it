# mappa.controlodio.it

<a href="https://mappa.controlodio.it">Mappa.controlodio.it</a> is a web application aimed at detecting and visualizing Hate Speech on Twitter in Italian language. The resource was developed by the <a href="http://hatespeech.di.unito.it/">Hate Speech Monitoring Group</a> at the University of Turin within the <a href="https://controlodio.it/">Contro l'odio project</a>.<p> The map applies a combination of computational linguistics techniques for hate speech detection and data visualization tools on data drawn from Twitter. It allows users to access a huge amount of information through interactive maps, also tuning their view, e.g., visualizing the most viral tweets and interactively reducing the inherent complexity of data.  <p>The resource is composed of three modules: ![backend](backend), ![frontend](frontend),  and ![public APIs](public%20APIs).
The backend gets tweets from the Twitter’s Stream APIs and stores them in a database.
The frontend  represents the data stored in the database in the simplest, most complete and effective way possible.
The public APIs finally allow the frontend to recover the data for the visualizations. 

![architecture](image.jpg)

# References
  Capozzi, A. T., Lai, M., Basile, V., Poletto, F., Sanguinetti, M., Bosco, C., ... & Stranisci, M. (2019). Computational linguistics against hate: Hate speech detection and visualization on social media in the" Contro L’Odio" project. In 6th Italian Conference on Computational Linguistics, CLiC-it 2019 (Vol. 2481, pp. 1-6). CEUR-WS.<p>
    Capozzi, A. T., Lai, M., Basile, V., Poletto, F., Sanguinetti, M., Bosco, C., ... & Stranisci, M. (2020). “Contro L’Odio”: A Platform for Detecting, Monitoring and Visualizing Hate Speech against Immigrants in Italian Social Media. IJCoL. Italian Journal of Computational Linguistics, 6(6-1), 77-97.
