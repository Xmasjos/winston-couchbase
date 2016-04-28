'use strict';

var util = require('util');
var uuid = require('node-uuid');
var winston = require('winston');
var couchbase = require('couchbase');

//
// ### function Couchbase (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Couchbase transport object responsible
// for persisting log messages and metadata to a couchbase bucket.
//
var Couchbase = winston.transports.Couchbase = function (options) {
  winston.Transport.call(this, options);
  
  options         = options        || {};

  this.name       = options.name   || 'couchbase';
  this.level      = options.level  || 'info';
  this.silent     = options.silent || false;
  this.host       = options.host   || 'localhost:8091';
  this.bucketName = options.bucket || 'default';
  this.prefix     = options.prefix || 'wl';
  
  this.password   = options.password;

  var cluster  = new couchbase.Cluster(this.host);
  if (this.password) {
	this.bucket = cluster.openBucket(this.bucketName, this.password);  
  } else {
	this.bucket = cluster.openBucket(this.bucketName);
  }
};

//
// Inherit from `winston.Transport`.
//
util.inherits(Couchbase, winston.Transport);

//
// Expose the name of this Transport on the prototype
//
Couchbase.prototype.name = 'couchbase';
exports.Couchbase = Couchbase;
module.exports = Couchbase;

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Couchbase.prototype.log = function (level, msg, meta, callback) {
  var self = this;
  
  if (self.silent) {
	return.callback(null, true);
  }
  
  var docId = self.prefix + '_' + uuid.v4();
  
  var doc = {
	message = msg,
	timestamp = Date.now(),
	level = level,
	meta = meta
  };
  
  self.bucket.insert(docId, doc, function (err) {
	if (err) {
	  self.emit('error', err);
	  return callback(err);
	}
	
	self.emit('logged');
	callback(null, true);
  });

  //process.nextTick(function () {
  //  if (self.silent) {
  //    return callback(null, true);
  //  }
  //
  //  var doc       = {};
  //  doc.message   = msg;
  //  doc.timestamp = Date.now();
  //  doc.level     = level;
  //  doc.meta      = meta;
  //
  //  var docId = self.prefix + '_' + uuid.v4();
  //
  //  self.bucket.insert(docId, doc, function (err) {
  //    if (err) {
  //      self.emit('error', err);
  //      return callback(err);
  //    }
  //
  //    self.emit('logged');
  //    callback(null, true);
  //  });
  //});
};
