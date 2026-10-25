import assert from 'node:assert/strict';
import {JsonEx} from '../js/core/JsonEx.js';

(function duplicatedArray(){
    let array = [1, 2, 3];
    let obj = {a1: array, a2: array};
    array.hoge = "fuga";
    let result = JsonEx.parse(JsonEx.stringify(obj));
    assert(result.a1 === result.a2);
    assert(obj.a1 === obj.a2);
})();

(function circularLink(){
    let a = {};
    let b = {a};
    a.b = b;
    let obj = {a1: a, a2: a};
    let result = JsonEx.parse(JsonEx.stringify(obj));
    assert(result.a1 === result.a2);
    assert(obj.a1 === obj.a2);
})();
