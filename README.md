[![Build Status](https://travis-ci.org/dtreskunov/webplotdigitizer-wdc.svg?branch=master)](https://travis-ci.org/dtreskunov/webplotdigitizer-wdc)
[![Language](https://img.shields.io/badge/language-clojure-brightgreen.svg)]()

# WebPlotDigitizer Tableau Web Data Connector

Are you a [Tableau](https://www.tableau.com) user? Do you have some charts or plots stored in PNGs or JPEGs? You've come to the right place! This tool allows you to bring those data into Tableau so you can use Tableau's powerful analytical capabilities to gain new insights from data locked away in image files.

Based on [WebPlotDigitizer](https://github.com/ankitrohatgi/WebPlotDigitizer) by [Ankit Rohatgi](https://twitter.com/ankit_rohatgi).

* YouTube demo: https://youtu.be/qjz_oWTTmPk
* Sample workbook: https://public.tableau.com/views/WebPlotDigitizer-NOAA/WashingtonStateMeanTemperature?:embed=y&:display_count=yes&publish=yes
* Tableau community forum: https://community.tableau.com/thread/244693

## Setup For Users

Copy-and-paste the link below into Tableau Desktop's Web Data Connector dialog:

**[Connector Link](https://dtreskunov.github.io/webplotdigitizer-wdc/)**

## Setup For Developers

Refer to Tableau Web Data Connector [documentation hub](http://tableau.github.io/webdataconnector/) for WDC specifics.

To get an interactive development environment run:

    lein figwheel

and open your browser at [localhost:3449](http://localhost:3449/).
This will auto compile and send all changes to the browser without the
need to reload. After the compilation process is complete, you will
get a Browser Connected REPL. An easy way to try it is:

    (js/alert "Am I connected?")

and you should see an alert in the browser window.

To clean all compiled files:

    lein clean

To create a production build run:

    lein do clean, cljsbuild once min

And open your browser in `resources/public/index.html`. You will not
get live reloading, nor a REPL. 

## License

Copyright © 2017 Tableau

Distributed under GNU AGPL v3
