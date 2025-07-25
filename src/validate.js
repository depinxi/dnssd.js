const filename = require('path').basename(__filename);
const debug = require('./debug')(`dnssd:${filename}`);
const ValidationError = require('./customError').create('ValidationError');

function isNumeric(value) {
  return !Number.isNaN(parseFloat(value)) && Number.isFinite(value);
}

/**
 * Exported
 */
const validate = module.exports = {};

/**
 * Validates a transport protocol, throws err on invalid input
 * @param {string} str
 */
validate.protocol = function protocol(str) {
  if (typeof str !== 'string') {
    throw new ValidationError('Protocol must be a string, got %s', typeof str);
  }

  if (str === '' || (str !== '_tcp' && str !== '_udp')) {
    throw new ValidationError("Protocol must be _tcp or _udp, got '%s'", str);
  }
};

/**
 * Validates a service name, throws err on invalid input
 * @param {string} str
 */
validate.serviceName = function serviceName(str) {
  if (typeof str !== 'string') {
    throw new ValidationError(
      'Service name must be a string, got %s', typeof str);
  }

  if (!str) {
    throw new ValidationError("Service name can't be an empty string");
  }

  if (!/^_/.test(str)) {
    throw new ValidationError("Service '%s' must start with '_'", str);
  }

  // 15 bytes not including the leading underscore
  if (Buffer.byteLength(str) > 16) {
    // throw new ValidationError("Service '%s' is > 15 bytes", str);
    debug("Service '%s' is > 15 bytes", str)
  }

  if (!/^_[A-Za-z0-9]/.test(str) || !/[A-Za-z0-9]*$/.test(str)) {
    throw new ValidationError(
      "Service '%s' must start and end with a letter or digit", str);
  }

  if (!/^_[A-Za-z0-9-]+$/.test(str)) {
    throw new ValidationError(
      "Service '%s' should be only letters, digits, and hyphens", str);
  }

  if (/--/.test(str)) {
    throw new ValidationError(
      "Service '%s' must not have consecutive hyphens", str);
  }

  if (!/[A-Za-z]/.test(str)) {
    throw new ValidationError("Service '%s' must have at least 1 letter", str);
  }
};

/**
 * Validates a dns label, throws err on invalid input
 *
 * @param {string} str - label to validate
 * @param {string} [name] - name of the label (for better error messages)
 */
validate.label = function label(str, name='label') {
  if (typeof str !== 'string') {
    throw new ValidationError(
      '%s name must be a string, got %s', name, typeof str);
  }

  if (!str) {
    throw new ValidationError("%s name can't be an empty string", name);
  }

  if (/[\x00-\x1F]|\x7F/.test(str)) {
    throw new ValidationError(
      "%s name '%s' can't contain control chars", name, str);
  }

  if (Buffer.byteLength(str) > 63) {
    throw new ValidationError(
      '%s must be <= 63 bytes. %s is %d', name, str, Buffer.byteLength(str));
  }
};

/**
 * Validates a port, throws err on invalid input
 *
 * @param {number} num
 */
validate.port = function port(num) {
  if (!Number.isInteger(num) || num <= 0 || num > 0xFFFF) {
    throw new ValidationError(
      'Port must be an integer between 0 and 65535, got %s', num);
  }
};

/**
 * Validates rdata for a TXT record, throws err on invalid input
 *
 * Example of a valid txt object:
 * {
 *   key: 'value',
 *   buf: Buffer.alloc(123)
 * }
 *
 * @param {object} obj
 */
validate.txt = function txt(obj) {
  let sizeTotal = 0;
  const keys = new Set();

  if (typeof obj !== 'object') {
    throw new ValidationError('TXT must be an object');
  }

  // validate each key value pair
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    let size = Buffer.byteLength(key);

    // keys
    if (!!~key.indexOf('=')) {
      throw new ValidationError("Key '%s' in TXT contains a '='", key);
    }

    if (!/^[ -~]*$/.test(key)) {
      throw new ValidationError("Key '%s' in TXT is not printable ascii", key);
    }

    if (keys.has(key.toLowerCase())) {
      throw new ValidationError(
        "Key '%s' in TXT occurs more than once. (case insensitive)", key);
    }

    keys.add(key.toLowerCase());

    // value type
    if (
      typeof value !== 'string' &&
      typeof value !== 'boolean' &&
      !isNumeric(value) &&
      !Buffer.isBuffer(value)
    ) {
      throw new ValidationError(
        'TXT values must be a string, buffer, number, or boolean. got %s',
        typeof value);
    }

    // size limits
    if (typeof value !== 'boolean') {
      size += (Buffer.isBuffer(value))
        ? value.length
        : Buffer.byteLength(value.toString());

      // add 1 for the '=' in 'key=value'
      // add 1 for the length byte to be written before 'key=value'
      size += 2;
    }

    sizeTotal += size;

    if (size > 255) {
      throw new ValidationError('Each key/value in TXT must be < 255 bytes');
    }

    if (sizeTotal > 1300) {
      throw new ValidationError('TXT record is > 1300 bytes.');
    }
  });
};
