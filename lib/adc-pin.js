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
      var mapAdcPin = {
        P9_39: 'AIN0',
        P9_40: 'AIN1',
        P9_37: 'AIN2',
        P9_38: 'AIN3',
        P9_33: 'AIN4',
        P9_36: 'AIN5',
        P9_35: 'AIN6'
      }
      var CAPEMGR_DIR;

      __extends(PwmPin, _super);

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

      PwmPin.prototype.pwmWrite = function(value, servo) {
        var _this = this;
        if (servo == null || servo == void(0)) {
          servo = false;
        }
        this.value = value;
        this.pwmVal = (servo != false) ? this._servoVal(value) : this._pwmVal(value);
        FS.appendFile(this._dutyPath(), "" + this.pwmVal + "\n", function(err) {
          if (err) {
            return _this.emit('error', "Error occurred while writing value " + _this.pbVal + " to pin " + _this.pinNum);
          } else {
            if (servo) {
              return _this.emit('servoWrite', value);
            } else {
              return _this.emit('pwmWrite', value);
            }
          }
        });
        return true;
      };

      PwmPin.prototype.servoWrite = function(angle) {
        if (this.freq === SERVO_FREQ) {
          return this.pwmWrite(angle, true);
        } else {
          return this._setServoFreq(angle);
        }
      };

      PwmPin.prototype._setServoFreq = function(angle) {
        var servoPeriod,
          _this = this;
        servoPeriod = this._calcPeriod(SERVO_FREQ);
        FS.appendFile(this._periodPath(), servoPeriod, function(err) {
          if (err) {
            return _this.emit('error', err);
          } else {
            _this.freq = SERVO_FREQ;
            _this.period = servoPeriod;
            return _this.pwmWrite(angle, true);
          }
        });
        return true;
      };

      PwmPin.prototype._capemgrDir = function() {
        var capemgr;
        if (this.capemgrDir == null) {
          capemgr = this._findFile(CAPEMGR_DIR, /^bone_capemgr\.\d+$/);
          if (capemgr != null) {
            this.capemgrDir = "" + CAPEMGR_DIR + "/" + capemgr;
          }
        }
        return this.capemgrDir;
      };

      PwmPin.prototype._slotsPath = function() {
        return "" + (this._capemgrDir()) + "/slots";
      };

      PwmPin.prototype._ocpDir = function() {
        var ocp;
        if (!this.ocpDir) {
          ocp = this._findFile(CAPEMGR_DIR, /^ocp\.\d+$/);
          if (ocp != null) {
            this.ocpDir = "" + CAPEMGR_DIR + "/" + ocp;
          }
        }
        return this.ocpDir;
      };

      PwmPin.prototype._pwmDir = function() {
        var pwm, regex;
        if (!this.pwmDir) {
          regex = new RegExp("^pwm_test_" + this.pinNum + "\\.\\d+$");
          pwm = this._findFile(this._ocpDir(), regex);
          if (pwm != null) {
            this.pwmDir = "" + (this._ocpDir()) + "/" + pwm;
          }
        }
        return this.pwmDir;
      };

      PwmPin.prototype._findFile = function(dirName, nameRegex) {
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

      PwmPin.prototype._runPath = function() {
        return "" + (this._pwmDir()) + "/run";
      };

      PwmPin.prototype._periodPath = function() {
        return "" + (this._pwmDir()) + "/period";
      };

      PwmPin.prototype._dutyPath = function() {
        return "" + (this._pwmDir()) + "/duty";
      };

      PwmPin.prototype._polarityPath = function() {
        return "" + (this._pwmDir()) + "/polarity";
      };

      PwmPin.prototype._releaseCallback = function(err) {
        if (err) {
          return this.emit('error', 'Error while releasing pwm pin');
        } else {
          return this.emit('release', this.pinNum);
        }
      };

      PwmPin.prototype._pwmVal = function(value) {
        var calc;
        calc = Math.round((this.period - ((this.period / 255.0) * value)) * 100) / 100;
        calc = calc > this.period ? this.period : calc;
        calc = calc < 0 ? 0 : calc;
        return calc | 0;
      };

      PwmPin.prototype._servoVal = function(angle) {
        var calc, maxDutyCycle;
        maxDutyCycle = this.period * 0.10;
        calc = Math.round(((maxDutyCycle / 180) * angle) + 500000);
        calc = calc > 2500000 ? 2500000 : calc;
        calc = calc < 500000 ? 500000 : calc;
        calc = this.period - calc;
        return calc | 0;
      };

      PwmPin.prototype._calcPeriod = function(freq) {
        return Math.round(1.0e9 / freq);
      };

      return PwmPin;

    })(EventEmitter);
  });

}).call(this);
