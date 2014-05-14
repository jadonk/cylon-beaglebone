/*
 * Beaglebone ADC Pin
 * cylonjs.com
 *
 * based on pwm-pin.js
 *
 * Copyright (c) 2014 Jason Kridner - Texas Instruments, Inc.
 * Copyright (c) 2013 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/


(function() {
  'use strict';
  var EventEmitter, FS, namespace,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  FS = require('fs');

  EventEmitter = require('events').EventEmitter;

  namespace = require('node-namespace');

  namespace('Cylon.IO', function() {
    return this.AdcPin = (function(_super) {
      var CAPEMGR_DIR;

      __extends(AdcPin, _super);

      CAPEMGR_DIR = "/sys/devices";

      function AdcPin(opts) {
        this.pinNum = opts.pin;
        this.loadAdcModule = opts.loadAdcModule != null ? opts.loadAdcModule : false;
        this.ready = false;
      }

      AdcPin.prototype.connect = function() {
        var helper,
          _this = this;
        if (this.loadAdcModule) {
          helper = this._findFile(this._ocpDir(), /^helper.+/);
          if (helper == null) {
            FS.appendFileSync(this._slotsPath(), "cape-bone-iio\n");
          }
        }
        return true;
      };

      AdcPin.prototype.close = function() {
        return true;
      };

      AdcPin.prototype.closeSync = function() {
        return this._releaseCallback(false);
      };

      AdcPin.prototype.analogRead = function(interval) {
        var _this = this;
        
        every(interval, function() {
          FS.readFile(_this._ainPath(), function(err, data) {
            if (err) {
              var error = "Error occurred while reading from pin " + _this.pinNum;
              _this.emit('error', error);
            } else {
              var readData = parseInt(data.toString());
              _this.emit('analogRead', readData);
            }
          });
        });
      };

      AdcPin.prototype._capemgrDir = function() {
        var capemgr;
        if (this.capemgrDir == null) {
          capemgr = this._findFile(CAPEMGR_DIR, /^bone_capemgr\.\d+$/);
          if (capemgr != null) {
            this.capemgrDir = "" + CAPEMGR_DIR + "/" + capemgr;
          }
        }
        return this.capemgrDir;
      };

      AdcPin.prototype._slotsPath = function() {
        return "" + (this._capemgrDir()) + "/slots";
      };

      AdcPin.prototype._ocpDir = function() {
        var ocp;
        if (!this.ocpDir) {
          ocp = this._findFile(CAPEMGR_DIR, /^ocp\.\d+$/);
          if (ocp != null) {
            this.ocpDir = "" + CAPEMGR_DIR + "/" + ocp;
          }
        }
        return this.ocpDir;
      };

      AdcPin.prototype._helperDir = function() {
        var helper, regex;
        if (!this.adcDir) {
          regex = new RegExp("^helper\\.\\d+$");
          helper = this._findFile(this._ocpDir(), regex);
          if (helper != null) {
            this.helperDir = "" + (this._ocpDir()) + "/" + helper;
          }
        }
        return this.helperDir;
      };

      AdcPin.prototype._ainFile = function() {
        return "" + (this._helperDir()) + "/" + this.pinNum;
      };

      AdcPin.prototype._findFile = function(dirName, nameRegex) {
        var f, file, files, _i, _len;
        files = FS.readdirSync(dirName);
        file = null;
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          f = files[_i];
          file = f.match(nameRegex);
          if (file != null) {
            file = file[0];
            break;
          }
        }
        return file;
      };

      PwmPin.prototype._releaseCallback = function(err) {
        if (err) {
          return this.emit('error', 'Error while releasing pwm pin');
        } else {
          return this.emit('release', this.pinNum);
        }
      };

      return AdcPin;

    })(EventEmitter);
  });

}).call(this);
