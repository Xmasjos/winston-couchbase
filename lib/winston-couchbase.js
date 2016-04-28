'use strict';

var util      = require('util');
var uuid      = require('node-uuid');
var winston   = require('winston');
var couchbase = require('couchbase');

var Couchbase = winston.transports.Couchbase = function (options) {
  winston.Transport.call(this, options);
  options = (options || {});

  this.name     = 'couchbase';
  this.level    = (options.level || 'info');
  this.silent   = (options.silent || false);
  this.host     = (options.host || 'localhost:8091');
  this.bucket   = (options.bucket || 'default');
  this.password = options.password;
  this.prefix   = (options.prefix || 'wl');

  var cluster  = new couchbase.Cluster(this.host);
  if (this.password) {
	this.$bucket = cluster.openBucket(this.bucket, this.password);  
  } else {
	this.$bucket = cluster.openBucket(this.bucket);
  }
};

util.inherits(Couchbase, winston.Transport);
exports.Couchbase = Couchbase;
module.exports = Couchbase;

/**
 *
 */
Couchbase.prototype.log = function (level, msg, meta, callback) {
  var self = this;

  process.nextTick(function () {
    if (self.silent) {
      return callback(null, true);
    }

    var doc       = {};
    doc.message   = msg;
    doc.timestamp = Date.now();
    doc.level     = level;
    doc.meta      = meta;

    var docId = self.prefix + '_' + uuid.v4();

    self.$bucket.insert(docId, doc, function (err) {
      if (err) {
        self.emit('error', err);
        return callback(err);
      }

      self.emit('logged');
      callback(null, true);
    });
  });
};
