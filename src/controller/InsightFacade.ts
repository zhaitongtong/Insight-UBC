/**
 * This is the main programmatic entry point for the project.
 */

import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";

// my import
let fs = require('fs');
let JSZip = require('jszip');
import {isUndefined} from "util";
import {isNumber} from "util";
import {isString} from "util";

let dictionary: { [index: string]: string } = {};
dictionary = {
    "courses_dept": "Subject",
    "courses_id": "Course",
    "courses_avg": "Avg",
    "courses_instructor": "Professor",
    "courses_title": "Title",
    "courses_pass": "Pass",
    "courses_fail": "Fail",
    "courses_audit": "Audit",
    "courses_uuid": "id",
};

interface Datasets {
    [id: string]: {};   // an index signature
}

var datasets: Datasets = {};

export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
    }

    /**
     * Add a dataset to UBCInsight.
     *
     * @param id  The id of the dataset being added.
     * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
     *
     * */
    addDataset(id: string, content: string): Promise<InsightResponse> {
        let that = this;
        var flag = 1;
        return new Promise(function (fulfill, reject) {
            try {

                if(datasets.hasOwnProperty(id) && !isUndefined(datasets[id])){
                    flag=0; // if id doesnt exist
                }

                that.process(id, content).then(function (result: any) {
                        if (result == true) {
                            if(flag == 1){
                                fulfill({code: 204, body: {success: result}});
                            }
                        } else {
                            fulfill({code: 201, body: {success: result}});
                        }
                    }).catch(function (err: Error) {
                        reject({code: 400, body: {err: err.message}});
                })
            } catch (err) {
                reject({code: 400, body: {err: err.message}});
            }
        });
    };

    /*private inMemory(id: string): boolean {
        let fs = require('fs');
        var path = './data/'+ id +".json";
        return fs.existsSync(path); // fs.access(path) for async?
    }*/

    private process(id: string, data: any): Promise<boolean> {
        return new Promise(function (fulfill, reject) {
            var dictionary: { [course: string]:{} } = {};

            try {
                let myZip = new JSZip();
                let promises:any = [];

                myZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {
                    let processedDataset: any = {}
                    if(id==="courses"){
                        zip.forEach(function (relativePath, file: JSZipObject) {
                            if (!file.dir){
                                var promise = file.async("string").then(function (data) {
                                    let coursedata = JSON.parse(data);
                                    var processedDataset: any = [];
                                    for (var i = 0; i < coursedata.result.length; i++) {
                                        if (typeof coursedata.result[i].hasOwnProperty("Course") && datasets.hasOwnProperty(id)) {
                                            var processed_course_data = {
                                                dept: coursedata.result[i].Subject,
                                                id: coursedata.result[i].Course,
                                                avg: coursedata.result[i].Avg,
                                                instructor: coursedata.result[i].Professor,
                                                title: coursedata.result[i].Title,
                                                pass: coursedata.result[i].Pass,
                                                fail: coursedata.result[i].Fail,
                                                audit: coursedata.result[i].Audit,
                                                uuid: coursedata.result[i]["id"].toString(),
                                            };
                                             processedDataset.push(processed_course_data);
                                        }
                                    }
                                    dictionary["courses"] = {result: processedDataset};
                                    datasets[id] = processedDataset;
                                    //save(id,processedDataset);
                                }, function (error) {
                                    reject(error);
                                });
                                promises.push(promise);
                            }
                        });
                        Promise.all(promises).catch(function (err) {
                            reject(false);
                        }).then(function () {
                            if (processedDataset.data.length === 0) {
                                reject(false);
                            }
                            save(id, processedDataset);
                            fulfill(true);
                        });
                    }

                }).catch(function (err:any) {
                    Log.trace('DatasetController::process(..) - unzip ERROR: ' + err.message);
                    reject(false);
                });
            } catch (err) {
                Log.trace('DatasetController::process(..) - ERROR: ' + err);
                reject(false);
            }
        });
    }

    private getDatasets(): any {
        return datasets;
    }

    /**
     * Remove a dataset from UBCInsight.
     *
     * @param id  The id of the dataset to remove.
     *
     * */
    removeDataset(id: string): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let idExists: boolean = datasets.hasOwnProperty(id) && !isUndefined(datasets[id]);
            if (idExists) {
                that.delete(id);
                delete datasets[id];
                fulfill({code: 204, body: {success: "the operation was successful."}})
            } else {
                reject({code: 404, body: {err: 'the operation was unsuccessful because the delete was  for a resource that was not previously added.'}});
            }
        });
    }

    private delete(id: string) {
        Log.trace('DatasetController::delete( ' + id + '... )');
        try {
            var stats = fs.lstatSync('./data/' + id + ".json");
            if (!stats.isFile()) {
                throw new Error("Trying to delete dataset that does not exist")
            }
            fs.unlinkSync('./data/' + id + ".json");
            return true;
        } catch (err) {
            Log.trace('DatasetController:delete(..) - ERROR: ' + err);
            return false;
        }
    }

    /**
     * Perform a query on UBCInsight.
     *
     * @param query  The query to be performed. This is the same as the body of the POST message.
     * @return Promise <InsightResponse>
     *
     * */
    performQuery(query: any): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            if (!isValid(query)) {
                reject({code: 400, body: {"error": "not valid"}});
            } else {
                let where = query["WHERE"];
                let options = query["OPTIONS"];
                console.log(where)
                let columns = options["COLUMNS"];

                let data: any = datasets["courses"];
                if (data.length === 0) {
                    reject({code: 424, body: {"error": "missing dataset"}});
                }

                let result1: any = [];
                for (let course of data) {
                    if (courseIn(course, where))
                        result1.push(course);
                }

                let result2: any = [];
                for (let i = 0; i < result1.length; i++) {
                    let course = result1[i];
                    let c: any = {};
                    for (let j in course) {
                        if (columns.includes(j))
                            c[j] = course[j];
                    }
                    result2.push(c);
                }
                fulfill({code: 200, body: {result: result2}});
            }
        });
    }
}

function save(id: string, processedDataset: any) {
    var dir = './data';

    if (!fs.existsSync(dir)) { //if ./data directory doesn't already exist, create
        fs.mkdirSync(dir);
    }

    fs.writeFile("'./data/" + id + '.json', JSON.stringify(processedDataset), function (err: any) {
        if (err) {
            Log.trace("Error writing file");
        }else{
            Log.trace('successfully saved to /data');
        }
    });

    //datasets[id] = that.getDatasets();
}

function isValid(query: any): boolean {
    let where: any = null;
    if (!("WHERE" in query))
        return false;
    where = query["WHERE"];
    let options: any = null;
    if (!("OPTIONS" in query))
        return false;
    options = query["OPTIONS"];
    let columns: any = null;
    if (!("COLUMNS" in options))
        return false;
    columns = options["COLUMNS"];
    let order: any = null;
    if ("ORDER" in options)
        order = options["ORDER"];

    if (columns.length == 0)
        return false;

    for (let column of columns) {
        let value = dictionary[column];
        if (column.substring(0, column.indexOf("_")) != "courses" || isUndefined(value)) {
            return false;
        }
    }

    if (!check_order(order, columns)) {
        return false;
    }

    if (!check_where(where))
        return false;
    return true;
}

function check_order(order: any, columns: any): boolean {
    if (!isUndefined(order)) {
        if (typeof order == "string") {
            let valid = false;
            for (let column of columns) {
                if (order == column) {
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                return false;
            }
        }
    }
    return true;
}

function check_where(where: any): boolean {
    if (Object.keys(where).length !== 1)
        return false;
    let top = Object.keys(where)[0];
    switch (top) {
        case "AND": {
            if(where[top].length === 0){
                return false;
            }
            let filters = where[top];
            for (let i = 0; i < filters.length; i++) {
                if (!check_where(filters[i]))
                    return false;
            }
            return true;
        }

        case "OR": {
            if(where[top].length === 0){
                return false;
            }
            let filters = where[top];
            for (let i = 0; i < filters.length; i++) {
                if (!check_where(filters[i]))
                    return false;
            }
            return true;
        }
        case "LT": {
            let m = where[top];
            let mKey = Object.keys(m)[0];
            let mValue = m[mKey];
            return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit');

        }
        case "GT": {
            let m = where[top];
            let mKey = Object.keys(m)[0];
            let mValue = m[mKey];
            return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit');

        }
        case "EQ": {
            let m = where[top];
            let mKey = Object.keys(m)[0];
            let mValue = m[mKey];
            return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit');

        }

        case "IS": {
            let s = where[top];
            let sKey = Object.keys(s)[0];
            let sValue = s[sKey];
            return isString(sValue) && (sKey === 'courses_dept' || sKey === 'courses_id' || sKey === 'courses_instructor' || sKey === 'courses_title' || sKey === 'courses_uuid');

        }

        case "NOT": {
            return check_where(where[top]);
        }

        default: {
            return false
        }

    }
}

function courseIn(course: any, where: any): boolean {
    let top = Object.keys(where)[0];

    switch (top) {
        case "AND": {
            let filters = where[top];
            for (let i = 0; i < filters.length; i++) {
                if (!courseIn(course, filters[i]))
                    return false;
            }
            return true;
        }
        case "OR" : {
            let filters = where[top];
            for (let i = 0; i < filters.length; i++) {
                if (courseIn(course, filters[i]))
                    return true;
            }
            return false;
        }
        case  "EQ": {
            return course[Object.keys(where[top])[0]] === where[top][Object.keys(where[top])[0]];
        }
        case "LT": {
            return course[Object.keys(where[top])[0]] < where[top][Object.keys(where[top])[0]];
        }

        case"GT": {
            return course[Object.keys(where[top])[0]] > where[top][Object.keys(where[top])[0]];
        }
        case"IS": {
            let scomparison = where[top];
            let s_key = Object.keys(scomparison)[0];
            let s_value: string = scomparison[s_key];
            let c_value: string = course[s_key];
            let hasStarEnd = (s_value.charAt(s_value.length - 1) === '*');
            if (hasStarEnd)
                s_value = s_value.substring(0, s_value.length - 1);
            let hasStarFront = (s_value.charAt(0) === '*');
            if (hasStarFront)
                s_value = s_value.substr(1);
            if (s_value.length == 0)
                return false;
            let start = 0;
            let valid = false;
            while (!valid && start < c_value.length) {
                let pos = c_value.indexOf(s_value, start);
                if (pos < 0)
                    break;
                start = pos + 1;
                if ((pos > 0 && !hasStarFront) || ((pos + s_value.length) < c_value.length && !hasStarEnd))
                    continue;
                valid = true;
            }
            return valid;
        }
        case "NOT": {
            return !courseIn(course, where[top]);
        }
        default:
            return false;
    }
}