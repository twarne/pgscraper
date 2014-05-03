'use script';

var _ = require('underscore'),
    assert = require('assert'),
    fs = require('fs'),
    jsdom = require('jsdom').jsdom,
    loadModule = require('./module-loader').loadModule;

var testSplitValueUnits = function() {
    var PGScraper = loadModule('lib/PGScraper.js');
    it('Should split values and units', function() {
        var result = PGScraper.splitValueUnits('1000 kWH');
        assert.equal(_.size(result), 2, 'Expected 2 elements in result array, got ' + _.size(result));
        assert(_.has(result, 'value'), 'Expected value field');
        assert.equal(result['value'], 1000, 'Expected 1000 as value, got ' + result['value']);
        assert(_.has(result, 'units'), 'Expected units field');
        assert.equal(result['units'], 'kWH', 'Expected \'kWH\' as units, got ' + result['units']);
    });
    it('Should handle thousands separator', function() {
        var result = PGScraper.splitValueUnits('15,200,003 kWH');
        assert.equal(result['value'], 15200003, 'Expected 15200003, got ' + result['value']);
    });
    it('Should handle no units', function() {
        var result = PGScraper.splitValueUnits('1000');
        assert(_.has(result, 'units'), 'Expected units field');
        assert(!result['units'], 'Expected units field to be nil');
    });
};

var testScrapePowerGuide = function() {
    var PGScraper = loadModule('lib/PGScraper.js');
    it('Should handle a well-formed document', function(testComplete) {
        var pgDoc = fs.readFileSync('test/data/power_guide_valid.html');
        jsdom.env({
            html: pgDoc,
            done: function(err, window) {
                var result = PGScraper.scrapePowerGuide(window);
                assert(_.has(result, 'lifetimeEnergy'), 'Expected lifetimeEnergy field');
                assert(_.has(result, 'dailyEnergy'), 'Expected dailyEnergy field');
                assert(_.has(result, 'energyReadings'), 'Expected energyReadings field');
                assert.equal(_.size(result['energyReadings']), 2, 'Expected 2 energyReadings, got ' + _.size(result['energyReadings']));
                testComplete(); 
            }
        });
    });
    it('Should gracefully handle a malformed document', function(testComplete) {
        var pgDoc = fs.readFileSync('test/data/power_guide_invalid.html');
        jsdom.env({
            html: pgDoc,
            done: function(err, window) {
                var result = PGScraper.scrapePowerGuide(window);
                assert(_.has(result, 'lifetimeEnergy'), 'Expected lifetimeEnergy field');
                assert.equal(result['lifetimeEnergy']['value'], -1, 'Expected lifetimeEnergy value to be -1, got ' + result['lifetimeEnergy']['value']);
                assert(!result['lifetimeEnergy']['units'], 'Expected nil lifetimeEnergy units, got ' + result['lifetimeEnergy']['units']);
                assert(_.has(result, 'dailyEnergy'), 'Expected dailyEnergy field');
                assert(!result['dailyEnergy']['units'], 'Expected nil dailyEnergy, got ' + result['dailyEnergy']);
                assert(_.has(result, 'energyReadings'), 'Expected energyReadings field');
                assert(_.isEmpty(result['energyReadings']), 'Expected 0 energyReadings, got ' + _.size(result['energyReadings']));
                testComplete();
            }
        });
    });
    it('Should handle missing data', function(testComplete) {
        var pgDoc = fs.readFileSync('test/data/power_guide_missing_data.html');
        jsdom.env({
            html: pgDoc,
            done: function(err, window) {
                var result = PGScraper.scrapePowerGuide(window);
                assert(_.has(result, 'lifetimeEnergy'), 'Expected lifetimeEnergy field');
                assert(!result['lifetimeEnergy']['units'], 'Expected nil lifetimeEnergy units, got ' + result['lifetimeEnergy']['units']);
                assert(_.has(result, 'dailyEnergy'), 'Expected dailyEnergy field');
                assert(_.has(result, 'energyReadings'), 'Expected energyReadings field');
                assert(_.size(result['energyReadings']), 2, 'Expected 2 energyReadings, got ' + _.size(result['energyReadings']));
                testComplete();
            }
        });
    });
};

var testGetEnergyProduction = function() {
    var mockjsdom = {};
    var mockjquery = function(window) {
        return function(selector) {};
    };
    var PGScraper = loadModule('lib/PGScraper.js', {'jsdom': mockjsdom, 'jquery': mockjquery});
    PGScraper.scrapePowerGuide = function(window) {
        return {status: 'success'};
    };
    it('Should return a promise', function() {
        var id = '12345';
        mockjsdom.env = function(config) {
        };
        var promise = PGScraper.getEnergyProduction(id);
        assert(_.has(promise, 'then'), 'Expected \'then\' method on promise');
    });
    it('Should resolve the promise on success', function(testComplete) {
        var id = '12345';
        mockjsdom.env = function(config) {
            config.done(null, {});
        };
        var promise = PGScraper.getEnergyProduction(id);
        promise.then(function(res) {
            testComplete();
        }, function(err) {
            testComplete(err);
        });
    });
    it('Should reject the promise on an error loading the page', function() {
        var id = '12345';
        mockjsdom.env = function(config) {
            config.done('expected error', null);
        };
        var promise = PGScraper.getEnergyProduction(id);
        promise.then(function(res) {
            testComplete('Expected an error');
        }, function(err) {
            testComplete();
        });
    });
};

describe('pgscraper', function() {
    describe('splitValueUnits', testSplitValueUnits);
    describe('scrapePowerGuide', testScrapePowerGuide);
    describe('getEnergyProduction', testGetEnergyProduction);
});
