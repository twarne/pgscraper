# pgscraper

This module extracts energy production data from [SolarCity](http://www.solarcity.com)'s PowerGuide.  

## Installation

    npm install pgscraper --save

## Usage

    var pgscraper = require('pgscraper');

    var productionData = pgscraper.getEnergyProduction('12345');

    console.log(productionData)`
