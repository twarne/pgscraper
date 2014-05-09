# pgscraper

This module extracts energy production data from [SolarCity](http://www.solarcity.com)'s PowerGuide.  For homeowners
with solar installations, PowerGuide data details total energy produced by the system, total daily energy production,
and hourly energy production.  This data is easily shareable and the website provides a nice visualization.  However,
there has been no simple way to extract this data for use in other ways.  This module provides an easy wasy to extract
the production data for a given solar installation.

## Installation

The simplest installation is via npm:

    npm install pgscraper --save

## Usage

Usage data is gathered by passing the PowerGuide ID to getEnergyProduction:

    var pgscraper = require('pgscraper');

    var productionData = pgscraper.getEnergyProduction('12345');

    console.log(productionData);

## Acknowledgements

Neither this module nor its author are affiliated with SolarCity.
