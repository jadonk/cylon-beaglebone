/*
 * Cylonjs Beaglebone adaptor
 * http://cylonjs.com
 *
 * Copyright (c) 2013-2014 The Hybrid Group
 * Licensed under the Apache 2.0 license.
*/

'use strict';

require('./pwm-pin');
require('./adc-pin');
require('./i2c-device');
require('./cylon-beaglebone');
var namespace = require('node-namespace');

namespace("Cylon.Adaptors", function() {
  this.Beaglebone = (function(klass) {
    subclass(Beaglebone, klass);

    var I2C_INTERFACE, PINS, PWM_PINS, ADC_PINS;

    PINS = {
      "P8_3": 38,
      "P8_4": 39,
      "P8_5": 34,
      "P8_6": 35,
      "P8_7": 66,
      "P8_8": 67,
      "P8_9": 69,
      "P8_10": 68,
      "P8_11": 45,
      "P8_12": 44,
      "P8_13": 23,
      "P8_14": 26,
      "P8_15": 47,
      "P8_16": 46,
      "P8_17": 27,
      "P8_18": 65,
      "P8_19": 22,
      "P8_20": 63,
      "P8_21": 62,
      "P8_22": 37,
      "P8_23": 36,
      "P8_24": 33,
      "P8_25": 32,
      "P8_26": 61,
      "P8_27": 86,
      "P8_28": 88,
      "P8_29": 87,
      "P8_30": 89,
      "P8_31": 10,
      "P8_32": 11,
      "P8_33": 9,
      "P8_34": 81,
      "P8_35": 8,
      "P8_36": 80,
      "P8_37": 78,
      "P8_38": 79,
      "P8_39": 76,
      "P8_40": 77,
      "P8_41": 74,
      "P8_42": 75,
      "P8_43": 72,
      "P8_44": 73,
      "P8_45": 70,
      "P8_46": 71,
      "P9_11": 30,
      "P9_12": 60,
      "P9_13": 31,
      "P9_14": 50,
      "P9_15": 48,
      "P9_16": 51,
      "P9_17": 5,
      "P9_18": 4,
      "P9_19": 13,
      "P9_20": 12,
      "P9_21": 3,
      "P9_22": 2,
      "P9_23": 49,
      "P9_24": 15,
      "P9_25": 117,
      "P9_26": 14,
      "P9_27": 115,
      "P9_28": 113,
      "P9_29": 111,
      "P9_30": 112,
      "P9_31": 110
    };

    PWM_PINS = {
      "P9_14": 'P9_14',
      "P9_21": 'P9_21',
      "P9_22": 'P9_22',
      "P9_29": 'P9_29',
      "P9_42": 'P9_42',
      "P8_13": 'P8_13',
      "P8_34": 'P8_34',
      "P8_45": 'P8_45',
      "P8_46": 'P8_46'
    };
    
    ADC_PINS = {
      "P9_39": 'AIN0',
      "P9_40": 'AIN1',
      "P9_37": 'AIN2',
      "P9_38": 'AIN3',
      "P9_33": 'AIN4',
      "P9_36": 'AIN5',
      "P9_35": 'AIN6'
    };
    
    I2C_INTERFACE = '/dev/i2c-1';

    function Beaglebone(opts) {
      Beaglebone.__super__.constructor.apply(this, arguments);
      this.board = "";
      this.pins = {};
      this.pwmPins = {};
      this.adcPins = {};
      this.i2cDevices = {};
      this.myself;
    }

    Beaglebone.prototype.commands = function() {
      return ['pins', 'digitalRead', 'digitalWrite', 'pwmWrite', 'servoWrite', 'firmwareName', 'i2cWrite', 'i2cRead', 'analogRead'];
    };

    Beaglebone.prototype.connect = function(callback) {
      Beaglebone.__super__.connect.apply(this, arguments);
      return this.proxyMethods(this.commands, this.board, this.myself);
    };

    Beaglebone.prototype.disconnect = function() {
      Logger.debug("Disconnecting all pins...");
      this._disconnectPins();
      Logger.debug("Disconnecting from board '" + this.name + "'...");
      return this.connection.emit('disconnect');
    };

    Beaglebone.prototype.firmwareName = function() {
      return 'Beaglebone';
    };

    Beaglebone.prototype.digitalRead = function(pinNum, drCallback) {
      var pin,
        _this = this;
      pin = this.pins[this._translatePin(pinNum)];
      if (pin == null) {
        pin = this._digitalPin(pinNum, 'r');
        pin.on('digitalRead', function(val) {
          _this.connection.emit('digitalRead', val);
          return drCallback(val);
        });
        pin.on('connect', function(data) {
          return pin.digitalRead(20);
        });
        pin.connect();
      }
      return true;
    };

    Beaglebone.prototype.analogRead = function(pinNum, arCallback) {
      var pin,
        _this = this;
      pin = this.adcPins[this._translateAdcPin(pinNum)];
      if (pin == null) {
        pin = this._analogPin(pinNum, 'r');
        pin.on('analogRead', function(val) {
          _this.connection.emit('analogRead', val);
          return arCallback(val);
        });
        pin.on('connect', function(data) {
          return pin.analogRead(20);
        });
        pin.connect();
      }
      return true;
    };

    Beaglebone.prototype.digitalWrite = function(pinNum, value) {
      var pin,
        _this = this;
      pin = this.pins[this._translatePin(pinNum)];
      if (pin != null) {
        pin.digitalWrite(value);
      } else {
        pin = this._digitalPin(pinNum, 'w');
        pin.on('digitalWrite', function(val) {
          return _this.connection.emit('digitalWrite', val);
        });
        pin.on('connect', function(data) {
          return pin.digitalWrite(value);
        });
        pin.connect();
      }
      return value;
    };

    Beaglebone.prototype.pwmWrite = function(pinNum, value) {
      var pin,
        _this = this;
      pin = this.pwmPins[this._translatePwmPin(pinNum)];
      if (pin != null) {
        pin.pwmWrite(value);
      } else {
        pin = this._pwmPin(pinNum);
        pin.on('pwmWrite', function(val) {
          return _this.connection.emit('pwmWrite', val);
        });
        pin.on('connect', function(data) {
          return pin.pwmWrite(value);
        });
        pin.connect();
      }
      return value;
    };

    Beaglebone.prototype.servoWrite = function(pinNum, angle) {
      var pin,
        _this = this;
      pin = this.pwmPins[this._translatePwmPin(pinNum)];
      if (pin != null) {
        pin.servoWrite(angle);
      } else {
        pin = this._pwmPin(pinNum);
        pin.on('servoWrite', function(val) {
          return _this.connection.emit('servoWrite', val);
        });
        pin.on('connect', function(data) {
          return pin.servoWrite(angle);
        });
        pin.connect();
      }
      return angle;
    };

    Beaglebone.prototype.i2cWrite = function(address, cmd, buff, callback) {
      if (callback == null) {
        callback = null;
      }
      buff = buff != null ? buff : [];
      return this._i2cDevice(address).write(cmd, buff, callback);
    };

    Beaglebone.prototype.i2cRead = function(address, cmd, length, callback) {
      if (callback == null) {
        callback = null;
      }
      return this._i2cDevice(address).read(cmd, length, callback);
    };

    Beaglebone.prototype._i2cDevice = function(address) {
      if (this.i2cDevices[address] == null) {
        this.i2cDevices[address] = new Cylon.I2C.I2CDevice({
          address: address,
          "interface": I2C_INTERFACE
        });
      }
      return this.i2cDevices[address];
    };

    Beaglebone.prototype._pwmPin = function(pinNum) {
      var gpioPinNum, size;
      gpioPinNum = this._translatePwmPin(pinNum);
      if (this.pwmPins[gpioPinNum] == null) {
        size = Object.keys(this.pwmPins).length;
        this.pwmPins[gpioPinNum] = new Cylon.IO.PwmPin({
          pin: gpioPinNum,
          loadPwmModule: size === 0
        });
      }
      return this.pwmPins[gpioPinNum];
    };

    Beaglebone.prototype._digitalPin = function(pinNum, mode) {
      var gpioPinNum;
      gpioPinNum = this._translatePin(pinNum);
      if (this.pins[gpioPinNum] == null) {
        this.pins[gpioPinNum] = new Cylon.IO.DigitalPin({
          pin: gpioPinNum,
          mode: mode
        });
      }
      return this.pins[gpioPinNum];
    };

    Beaglebone.prototype._analogPin = function(pinNum) {
      var adcPinNum;
      adcPinNum = this._translateAdcPin(pinNum);
      if (this.pins[adcPinNum] == null) {
        this.pins[adcPinNum] = new Cylon.IO.AnalogPin({
          pin: adcPinNum
        });
      }
      return this.pins[gpioPinNum];
    };

    Beaglebone.prototype._translatePin = function(pinNum) {
      return PINS[pinNum];
    };

    Beaglebone.prototype._translatePwmPin = function(pinNum) {
      return PWM_PINS[pinNum];
    };

    Beaglebone.prototype._translateAdcPin = function(pinNum) {
      return ADC_PINS[pinNum];
    };

    Beaglebone.prototype._disconnectPins = function() {
      var key, pin, _ref, _ref1, _results;
      _ref = this.pins;
      for (key in _ref) {
        pin = _ref[key];
        pin.closeSync();
      }
      _ref1 = this.pwmPins;
      _results = [];
      for (key in _ref1) {
        pin = _ref1[key];
        _results.push(pin.closeSync());
      }
      return _results;
    };

    return Beaglebone;

  })(Cylon.Adaptor);
});

