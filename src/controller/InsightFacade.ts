/**
 * This is the main programmatic entry point for the project.
 */
import {IInsightFacade, InsightResponse, LOGIC, MCOMPARATOR, NEGATION, SCOMPARISON, MKEY, SKEY} from "./IInsightFacade";

import Log from "../Util";


var JSZip = require('jszip');
var fs = require('fs');
import Cache from './Cache'
import CourseCtrl from './CourseCtrl';
import RoomsCtrl from './RoomsCtrl';
import {isString} from "util";
import {isNumber} from "util";
import {isArray} from "util";
import {isObject} from "util";

let cache: Cache = new Cache(); // our cache




export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    // helper that converts ZIP to base64
    convertTo64(path: string): Promise<String>{
        console.log('got here!')
        return new Promise(function (fulfill, reject){
            var promsie = fs.readFile(path, 'base64', (err: any, data: any) => {
                if (err){
                    reject(err)
                } else {
                    fulfill(data)
                }
            })
        })
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            let buff = Buffer.from(content, 'base64');

            if (id == 'rooms'){
                let roomsData = new RoomsCtrl();
                try {
                    let i_promise = roomsData.processZip(buff,cache);
                    fulfill(i_promise);
                    return;
                } catch (e) {
                    let reject_promise : InsightResponse = {code: 400, body: {error: e}};
                    reject(reject_promise);
                    return;
                }

            } else{
                let coursesData = new CourseCtrl();
                try {
                    // TODO: This should use the coursesData and a method to create this
                    let i_promise = coursesData.processZip(id, buff, cache);
                    fulfill(i_promise);
                    return;
                } catch (err) {
                    let reject_promise : InsightResponse = {code: 400, body: {error: err}};
                    reject(reject_promise);
                    return;

                }
            }
        });
    }

    selectData(query: any): string {
        let col = query['OPTIONS']['COLUMNS'][0];
        let i = col.indexOf("_");
        return col.substring(0,i);
    }

    removeDataset(id: string): Promise<InsightResponse> {

        return new Promise(function (fulfill, reject){
            if (cache.cacheContains(id)){
                // delete
                cache.deleteFromCache(id);
                fs.unlink("./test/" + id + ".json");
                let params: InsightResponse = {code: 204, body: {}};
                fulfill(params)
            } else {
                let params: InsightResponse = {code: 404, body: {}};
                reject(params)
            }
        });
    }

    performQuery(query: any): Promise <InsightResponse> {
        return new Promise(function (fulfill, reject) {

            let iFacade = new InsightFacade();

            try {
                var dataset = iFacade.selectData(query);
            } catch (e) {
                if (e == "Dataset has not been PUT"){
                    let params : InsightResponse = {code: 424, body: {missing: dataset}};
                    reject(params);
                    return;
                } else {
                    let params : InsightResponse = {code: 400, body: {error: 'Cannot have empty array of columns'}};
                    reject(params);
                    return;
                }
            }

            let hasTransformations = false;
            if ("TRANSFORMATIONS" in query)
                hasTransformations = true;

            if(!validate_query(query, hasTransformations)) {
                console.log("Not a valid query.");
                reject({code:400, body:{}});
                return;
            }

            try {
                var data = JSON.parse(cache.getFromCache(dataset));
                let where: any = query["WHERE"];
                let options: any = query["OPTIONS"];
                let transformations: any;
                let groups: any[] = [];
                let applys: any[] = [];
                let newKeys: any = [];
                let applyTokens: any = [];
                let oldKeys: any = [];
                if (hasTransformations) {
                    transformations = query["TRANSFORMATIONS"];
                    groups = transformations["GROUP"];
                    applys = transformations["APPLY"];
                    for (let apply of applys) {
                        newKeys.push(Object.keys(apply)[0]);
                        let applyObject = apply[Object.keys(apply)[0]];
                        applyTokens.push(Object.keys(applyObject)[0]);
                        oldKeys.push(applyObject[Object.keys(applyObject)[0]]);
                    }
                }

                let output: any = [];
                for (let course of data) {
                    if (filter_hellper(where, course))
                        output.push(course);
                }

                let result: any = [];
                for (let i = 0; i < output.length; i++) {
                    let course = output[i];
                    let c: any = {};  //selected columns in course
                    for (let j in course) {  // e.g., j: course_dept, course_avg
                        if (options['COLUMNS'].includes(j))
                            c[j] = course[j];
                        if (oldKeys.includes(j))
                            c[j] = course[j];
                        if (groups.includes(j))
                            c[j] = course[j];
                    }
                    result.push(c);
                }

                if (hasTransformations) {
                    // group
                    let groupSet: any = {};
                    for (let i = 0; i < result.length; i++) {
                        let course = result[i];
                        let groupString = "";
                        for (let groupKey of groups) {
                            groupString += course[groupKey];
                        }
                        if (groupString in groupSet) {
                            groupSet[groupString].push(course);
                        } else {
                            groupSet[groupString] = [];
                            groupSet[groupString].push(course);
                        }
                    }

                    // apply
                    result = [];
                    let groupSetKeys = Object.keys(groupSet);
                    for (let groupSetKey of groupSetKeys) {
                        let oneGroup = groupSet[groupSetKey];
                        let oneRow: any = {};
                        let newValues: any[] = [];
                        for (let i = 0; i < oldKeys.length; i++) {
                            if (applyTokens[i] === "AVG" || applyTokens[i] === "SUM") {
                                let countArray: any[] = [];
                                countArray.push(oneGroup[0][oldKeys[i]]);
                                newValues.push(countArray);
                            }
                            else if (applyTokens[i] === "COUNT") {
                                let countObject: any = {};
                                countObject[oneGroup[0][oldKeys[i]]] = oneGroup[0][oldKeys[i]];
                                newValues.push(countObject);
                            } else {
                                newValues.push(oneGroup[0][oldKeys[i]]);
                            }
                        }
                        for (let j = 1; j < oneGroup.length; j++) {
                            let course = oneGroup[j];
                            for (let i = 0; i < oldKeys.length; i++) {
                                if (applyTokens[i] === "MAX") {
                                    if (course[oldKeys[i]] > newValues[i]) {
                                        newValues[i] = course[oldKeys[i]];
                                    }
                                } else if (applyTokens[i] === "MIN") {
                                    if (course[oldKeys[i]] < newValues[i]) {
                                        newValues[i] = course[oldKeys[i]];
                                    }
                                } else if (applyTokens[i] === "AVG" || applyTokens[i] === "SUM") {
                                    newValues[i].push(course[oldKeys[i]]);
                                } else {
                                    if (!(course[oldKeys[i]] in newValues[i]))
                                        newValues[i][course[oldKeys[i]]] = course[oldKeys[i]];
                                }
                            }
                        }
                        for (let i = 0; i < groups.length; i++) {
                            oneRow[groups[i]] = oneGroup[0][groups[i]];
                        }
                        for (let i = 0; i < oldKeys.length; i++) {
                            let Decimal = require("decimal.js");
                            if (applyTokens[i] === "SUM") {
                                let sum = Number(newValues[i].map((val: any) => new Decimal(val)).reduce((a: any,b: any) => a.plus(b)).toNumber().toFixed(2));
                                oneRow[newKeys[i]] = sum;
                            } else if (applyTokens[i] === "AVG") {
                                let sum = Number(newValues[i].map((val: any) => new Decimal(val)).reduce((a: any,b: any) => a.plus(b)).toNumber().toFixed(2));
                                oneRow[newKeys[i]] = Number((sum / oneGroup.length).toFixed(2));
                            } else if (applyTokens[i] === "COUNT") {
                                oneRow[newKeys[i]] = Object.keys(newValues[i]).length;
                            } else
                                oneRow[newKeys[i]] = newValues[i];
                        }
                        result.push(oneRow);
                    }
                }

                if ("ORDER" in options) {
                    let order = options["ORDER"];
                    if (!isObject(order)) { // order is string
                        result.sort(function (a: any, b: any) {
                            if (a[order] < b[order])
                                return -1;
                            else if (a[order] > b[order])
                                return 1;
                            else
                                return 0;
                        });
                    } else { // order is object
                        let direction = order["dir"];
                        let orderKeys: any = order["keys"];
                        result.sort(function (a: any, b: any) {
                            for (let orderKey of orderKeys) {
                                if (a[orderKey] !== b[orderKey]) {
                                    if (direction === "UP") {
                                        if (a[orderKey] < b[orderKey])
                                            return -1;
                                        else if (a[orderKey] > b[orderKey])
                                            return 1;
                                    }
                                    else {
                                        if (a[orderKey] < b[orderKey])
                                            return 1;
                                        else if (a[orderKey] > b[orderKey])
                                            return -1;
                                    }
                                }
                            }
                            return 0;
                        });
                    }
                }

                for (let course of result) {
                    for (let key of Object.keys(course)) {
                        if (!options['COLUMNS'].includes(key)) {
                            delete course[key];
                        }
                    }
                }
                fulfill({code: 200, body: {result: result}});
            } catch (e) {
                if (e == "424 Key was not PUT"){
                    let params: InsightResponse = {code: 424, body: {"missing": [dataset]}};
                    reject(params);
                } else {
                    console.log(e);
                    let params: InsightResponse = {code: 400, body: {"error": e}}
                    reject(params);
                }
            }
        });
    }
}


// check if query has 'WHERE' and 'OPTIONS' keys.
function validate_query(query: any, hasTransformations: boolean) : boolean {
    if(!('WHERE' in query) || !('OPTIONS' in query) )
        return false;
    let filter:any = query['WHERE'];
    if (!validate_filter(filter))
        return false;
    return validate_optionAndTransformation(query, hasTransformations);
}

//Validation for filters: 3 helpers for is, compare, logic, negation only have one filter(recursive)
function validate_filter(filter: any) : boolean {
    if (Object.keys(filter).length === 0)
        return true;
    if (Object.keys(filter).length !== 1)
        return false;
    let root_op = Object.keys(filter)[0];
    if (LOGIC.includes(root_op))
        return validate_logic(filter[root_op]);
    else if (MCOMPARATOR.includes(root_op))
        return validate_mcomparison(filter[root_op]);
    else if (SCOMPARISON.includes(root_op))
        return validate_scomparison(filter[root_op]);
    else if (NEGATION.includes(root_op))
        return validate_filter(filter[root_op]);
    return false;
}

//Logiccomparison: logic:{filter, filter*}
function validate_logic(filters: any) : boolean {
    if (!isArray(filters))
        return false;
    if (filters.length < 1)
        return false;
    for (let i = 0; i < filters.length; i++) {
        if (!validate_filter(filters[i]))
            return false;
    }
    return true;
}

function validate_mcomparison(mcomparison: any) : boolean {
    let m_key = Object.keys(mcomparison)[0];
    let m_value = mcomparison[m_key];
    return MKEY.includes(m_key) && isNumber(m_value);
}

function validate_scomparison(scomparison: any) : boolean {
    let s_key = Object.keys(scomparison)[0];
    let s_value = scomparison[s_key];
    return SKEY.includes(s_key) && isString(s_value);
}

function validate_optionAndTransformation(query: any, hasTransformations: boolean) : boolean {
    let options:any = query['OPTIONS'];
    let columns = options['COLUMNS'];
    if (columns.length < 1)
        return false;
    let firstLetter = 'c';
    for (let key of columns) {
        if (MKEY.includes(key) || SKEY.includes(key))
            firstLetter = key.charAt(0);
    }
    if (!hasTransformations) {
        for (let i = 0; i < columns.length; i++){
            let key = columns[i];
            if (firstLetter !== key.charAt(0))
                return false;
            if(!(MKEY.includes(key) || SKEY.includes(key)))
                return false;
        }
        if('ORDER' in options){
            let order = options['ORDER'];
            if (isString(order)) { // order is string
                if (!columns.includes(order))
                    return false;
            } else if (isObject(order)) { // order is object
                if (Object.keys(order).length !== 2)
                    return false;
                if (!("dir" in order))
                    return false;
                if (order["dir"] !== "DOWN" && order["dir"] !== "UP")
                    return false;
                if (!("keys" in order))
                    return false;
                let orderKeys: any = order["keys"];
                if (orderKeys.length === 0)
                    return false;
                for (let i = 0; i < orderKeys.length; i++) {
                    let key = orderKeys[i];
                    if (!columns.includes(key))
                        return false;
                }
            } else
                return false;
        }
        return true;
    } else {
        let transformations = query["TRANSFORMATIONS"];
        if (!("GROUP" in transformations))
            return false;
        let groups = transformations["GROUP"];
        if (groups.length === 0)
            return false;
        for (let group of groups) {
            if (!(MKEY.includes(group) || SKEY.includes(group)))
                return false;
            if (group.charAt(0) !== firstLetter)
                return false;
        }
        if (!("APPLY" in transformations))
            return false;
        let applys = transformations["APPLY"];
        let newKeys: any = [];
        for (let apply of applys) {
            if (Object.keys(apply).length !== 1)
                return false;
            let newString: string = Object.keys(apply)[0];
            if (newString.indexOf('_') >= 0)
                return false;
            if (newKeys.includes(newString))
                return false;
            newKeys.push(newString);
            let applyObject: any = apply[newString];
            if (Object.keys(applyObject).length !== 1)
                return false;
            let applyToken: string = Object.keys(applyObject)[0];
            if (!(applyToken === "MAX" || applyToken === "MIN" || applyToken === "AVG" || applyToken === "COUNT" || applyToken === "SUM"))
                return false;
            let oldString: string = applyObject[applyToken];
            if (applyToken === "MAX" || applyToken === "MIN" || applyToken === "AVG" || applyToken === "SUM") {
                if (!MKEY.includes(oldString))
                    return false;
            } else {
                if (!(MKEY.includes(oldString) || SKEY.includes(oldString)))
                    return false;
            }
        }

        for (let i = 0; i < columns.length; i++){
            let key = columns[i];
            if (key.indexOf('_') >= 0) {
                if (!(MKEY.includes(key) || SKEY.includes(key)))
                    return false;
                if (firstLetter !== key.charAt(0))
                    return false;
                if (!groups.includes(key))
                    return false;
            } else {
                let hasThisKey = false;
                for (let apply of applys) {
                    if (key in apply)
                        hasThisKey = true;
                }
                if (!hasThisKey)
                    return false;
            }
        }
        if('ORDER' in options){
            let order = options['ORDER'];
            if (isString(order)) { // order is string
                if (!columns.includes(order))
                    return false;
            } else if (isObject(order)) { // order is object
                if (Object.keys(order).length !== 2)
                    return false;
                if (!("dir" in order))
                    return false;
                if (order["dir"] !== "DOWN" && order["dir"] !== "UP")
                    return false;
                if (!("keys" in order))
                    return false;
                let orderKeys: any = order["keys"];
                if (orderKeys.length === 0)
                    return false;
                for (let i = 0; i < orderKeys.length; i++) {
                    let key = orderKeys[i];
                    if (!columns.includes(key))
                        return false;
                }
            } else
                return false;
        }
        return true;
    }
}

function filter_hellper(where: any, course:any) : boolean {
    //get the operator in where clause
    if (Object.keys(where).length === 0)
        return true;
    let root_op = Object.keys(where)[0];   //Object.keys() method returns the key, given index reuturn a certain one

    if (LOGIC.includes(root_op))
        return logic_helper(where,course);
    else if (MCOMPARATOR.includes(root_op))
        return mcomparator_helper(where, course);
    else if (NEGATION.includes(root_op))
        return negation_helper(where[root_op], course);
    else if (SCOMPARISON.includes(root_op))
        return scomparator_helper(where[root_op], course);

    return false;
}

// helper for 'AND' | 'OR.
function logic_helper(where:any, course:any) : boolean{
    let root_op = Object.keys(where)[0];
    let filters = where[root_op];
    if (root_op == 'AND') {
        for (let i = 0; i < filters.length; i++) {
            if (!filter_hellper(filters[i], course))
                return false;
        }
        return true;
    } else {
        for (let i = 0; i < filters.length; i++) {
            if (filter_hellper(filters[i], course))
                return true;
        }
        return false;
    }
}

// helper for 'EQ' | 'GT' | 'LT'.
function mcomparator_helper(where:any, course:any) : boolean {
    let root_op = Object.keys(where)[0];
    let expression = where[root_op];
    let key = Object.keys(expression)[0];
    let value = expression[key];

    if (root_op === 'EQ') {
        return (course[key] === value);
    } else if (root_op == 'GT') {
        return (course[key] > value);
    } else {
        return (course[key] < value)
    }
}

//helper for NEGATION
function negation_helper(filter:any, course:any) : boolean {
    return !filter_hellper(filter, course);
}

// helper for 'IS'
function scomparator_helper(scomparison:any, course:any) : boolean {
    let s_key = Object.keys(scomparison)[0];
    let s_value: string = scomparison[s_key];
    let c_value: string = course[s_key];
    let hasStarFront = (s_value.charAt(0) === '*');
    if (hasStarFront)
        s_value = s_value.substr(1);
    let hasStarEnd = (s_value.charAt(s_value.length-1) === '*');
    if (hasStarEnd)
        s_value = s_value.substring(0, s_value.length-1);
    if (s_value.length == 0)
        return false;
    let start = 0;
    let valid = false;
    while (!valid && start < c_value.length) {
        let pos = c_value.indexOf(s_value, start);
        if (pos < 0)
            break;
        start = pos + 1;
        if (pos > 0 && !hasStarFront)
            continue;
        if ((pos + s_value.length) < c_value.length && !hasStarEnd)
            continue;
        valid = true;
    }
    return valid;
}