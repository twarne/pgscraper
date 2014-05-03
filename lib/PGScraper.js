'use strict';

var _ = require('underscore'),
    jquery = require('jquery'),
    jsdom = require('jsdom'),
    nconf = require('nconf'),
    Promise = require('promise'),
    request = require('request');

nconf.defaults({
    powerguide_url: 'https://mysolarcity.com/PowerGuid.aspx',
    id_param_name: 'ID'
});

var splitValueUnits = function(energyStr) {
    var result = null;
    if(energyStr.match(/[0-9,\.]+\s*[\w]*/)) {
        var splits = energyStr.split(/\s/);
        result = {
            value: Number(splits[0].replace(/,/g,'')),
            units: splits[1]
        };
    } else {
        result = {
            value: -1,
            units: null
        };
    }
    return result;
};

var scrapePowerGuide = function(window) {
    var $ = jquery(window);

    var errors = [];
    var lifetimeEnergy = null;
    try {
        lifetimeEnergy = splitValueUnits($('div.lifetime-energy').find('span').text());
    } catch(error) {
        errors.push(error);
        console.log('Failed to read lifetime energy');
        lifetimeEnergy = splitValueUnits('-1');
    }

    var dailyEnergy = null;
    try {
        dailyEnergy = splitValueUnits($('table.chart-energy').find('td.label').find('span').text());
    } catch(error) {
        errors.push(error);
        console.log('Failed to read daily energy');
        dailyEnergy = splitValueUnits('-1');
    }

    var energyReadings = [];
    try {
        energyReadings = _.map($('div.chart-img').find('area'), function(areaEl) {
            var energyReadingSplit = $(areaEl).attr('title').split(/\s{2}\s*/);
            return {time: energyReadingSplit[0], energy: splitValueUnits(energyReadingSplit[1])};
        });
    } catch(error) {
        errors.push(error);
        console.log('Failed to read energy readings');
    }

    var result = {
        lifetimeEnergy: lifetimeEnergy,
        dailyEnergy: dailyEnergy,
        energyReadings: energyReadings
    };
    if(!_.isEmpty(errors)) {
        result.errors = errors;
    }

    return result;
};

var getEnergyProduction = function(id) {
    console.log('Retrieving energy usage for id=' + id);
    var promise = new Promise(function(resolve, reject) {
        var requestURL = nconf.get('powerguide_url') + '?' + nconf.get('id_param_name') + '=' + id;
        jsdom.env({
            url: requestURL,
            done: function(err, window) { 
                if(!err) {
                    var result = scrapePowerGuide(window);
                    resolve(result);
                } else {
                    console.log('Failed to parse energy production page: ' + err);
                    reject(err);
                }
            }
        });
    });

    return promise;
};

module.exports.getEnergyProduction = getEnergyProduction;
