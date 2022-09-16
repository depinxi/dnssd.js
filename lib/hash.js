"use strict";function _typeof(obj){"@babel/helpers - typeof";return _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(obj){return typeof obj;}:function(obj){return obj&&"function"==typeof Symbol&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;},_typeof(obj);}/**
 * Deterministic JSON.stringify for resource record stuff
 *
 * Object keys are sorted so strings are always the same independent of
 * what order properties were added in. Strings are lowercased because
 * record names, TXT keys, SRV target names, etc. need to be compared
 * case-insensitively.
 *
 * @param  {*} val
 * @return {string}
 */function stringify(val){if(typeof val==='string')return JSON.stringify(val.toLowerCase());if(Array.isArray(val))return"[".concat(val.map(stringify),"]");if(_typeof(val)==='object'&&"".concat(val)==='[object Object]'){var str=Object.keys(val).sort().map(function(key){return stringify(key)+':'+stringify(val[key]);}).join(',');return"{".concat(str,"}");}return JSON.stringify(val);}/**
 * djb2 string hashing function
 *
 * @param  {string} str
 * @return {string} - 32b unsigned hex
 */function djb2(str){var hash=5381;var i=str.length;// hash stays signed 32b with XOR operator
while(i){hash=hash*33^str.charCodeAt(--i);}// coerce to unsigned to get strings without -'s
return(hash>>>0).toString(16);}/**
 * Takes any number of parameters and makes a string hash of them.
 * @return {...*} arguments
 */module.exports=function hash(){for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}return djb2(stringify(args));};