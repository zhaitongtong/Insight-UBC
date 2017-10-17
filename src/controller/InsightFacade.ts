/**
 * This is the main programmatic entry point for the project.
 */

import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";
let fs = require('fs');
let JSZip = require('jszip');

var request = require('request');
import {isUndefined} from "util";

// my import
//import DatasetController from '../controller/DatasetController';
//import {Datasets} from "./DatasetController"
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
    // private static datasetController = new DatasetController();

    //private datasetController: DatasetController;

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
        //this.datasetController = new DatasetController();
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
        return new Promise(function (fulfill, reject) {
            try {
                //let dsController = that.datasetController;
                let idExists: boolean = datasets.hasOwnProperty(id) && !isUndefined(datasets[id]);
                //console.log("idExist is "+idExists);
                that.process(id, content)
                    .then(function (result:any) {
                        if (!idExists) {
                            fulfill({code: 204, body: 'the operation was successful and the id already existed'});
                        } else {
                            fulfill({code: 201, body: 'the operation was successful and the id already existed'})
                        }
                    }).catch(function (err: Error) {
                    reject({code: 400, body: 'fail to precess the dataset in addDataset'});
                })
            } catch (err) {
                reject({code: 400, body: 'other error in addDataset'});
            }
        });
    };

    /*private inMemory(id: string): boolean {
        let fs = require('fs');
        var path = './data/'+ id +".json";
        return fs.existsSync(path); // fs.access(path) for async?
    }*/

    private process(id: string, data: any): Promise<boolean> {
        let that = this;
        let processedDataset : any = {};
        var dictionary: { [course: string]:{} } = {};
        let coursePromises:any = [];

        return new Promise(function (fulfill, reject) {
            try {
                let loadedZip = new JSZip();
                loadedZip.loadAsync(data, {base64: true})
                    .then(function (zip: JSZip) {
                    var alreadyExisted: boolean = false;
                    if(datasets && datasets.hasOwnProperty(id)) {
                        alreadyExisted = true;
                    }
                    if (id === "courses") {
                        zip.forEach(function(relativePath: string, file: JSZipObject) { // get each file in the zip
                            if (!file.dir){ // (file.dir == false) access the file in the directory
                                var promise = file.async('string').then(function (data) { // for each file in "courses"
                                    var coursedata = JSON.parse(data); // file data type: JSON object
                                    var coursename = file.name.substring(8);
                                    // Log.trace("Course Name: " + coursename);
                                    var processedCourseData: any = [];
                                    if (!(typeof (coursedata.result[0]) === 'undefined')) {  // don't save courses if "result" is undefined
                                        for (var i = 0; i < coursedata.result.length; i++) {
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
                                            processedCourseData.push(processed_course_data);
                                        }
                                        var final = {
                                            result: processedCourseData
                                        };
                                        dictionary[coursename] = final; //save coursedata to dict[coursename]
                                    }
                                });
                                coursePromises.push(promise);
                            }
                        });
                    }
                    if (id === "courses") {
                        Promise.all(coursePromises).then(function () {
                            fulfill(alreadyExisted?201:204);  // all promises are resolved
                            if (!alreadyExisted) {
                                processedDataset = dictionary;
                                let allCourses = Object.keys(processedDataset);
                                let mydataset: any = [];
                                for (let i = 0; i < allCourses.length; i++) {
                                    let eachCourse = allCourses[i]; // AANB504
                                    let courses = processedDataset[eachCourse]['result'];
                                    for (let j = 0; j < courses.length; j++) {
                                        let course = courses[j];
                                        let c: any= {};
                                        c["courses_dept"] = course["dept"];
                                        c["courses_id"] = course["id"];
                                        c["courses_avg"] = course["avg"];
                                        c["courses_instructor"] = course["instructor"];
                                        c["courses_title"] = course["title"];
                                        c["courses_pass"] = course["pass"];
                                        c["courses_fail"] = course["fail"];
                                        c["courses_audit"] = course["audit"];
                                        c["courses_uuid"] = course["uuid"];

                                        mydataset.push(c);
                                    }
                                }
                                datasets[id] = mydataset;
                                //that.save(id, processedDataset);
                            }
                        })
                    }

                }).catch(function (err:any) {
                    Log.trace('DatasetController.process method error: can not zip the file.');
                    reject(err);
                });

            } catch (err) {
                Log.trace('DatasetController.process method error.');
                reject(err);
            }
        });
    }

    private save(id: string, processedDataset: any) {
        let that = this;
        var dir = './data';

        let fs = require('fs');
        if (!fs.existsSync(dir)){ //if ./data directory doesn't already exist, create
            fs.mkdirSync(dir);
        }

        fs.writeFile("'./data/" +id+ '.json', JSON.stringify(processedDataset), function (err:any) {
            if (err) {
                Log.trace("Error writing file");
            }
            Log.trace('successfully saved to /data');
        });

        datasets[id] = that.getDatasets();
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
            //removeDataset should not reponse with code: 400
            //Delete it to avoid potential risk
            let idExists: boolean = datasets.hasOwnProperty(id) && !isUndefined(datasets[id]);
            if (idExists) {
                delete datasets[id];
                fulfill({code: 204, body: 'the operation was successful.'});
                return;
            } else {
                reject({
                    code: 404,
                    body: 'the operation was unsuccessful because the delete was  for a resource that was not previously added.'
                });
                return;
            }
        });
    }

    /*private delete(id: string) {
        let fs = require('fs');
        var path = './data/' + id + '.json';
        if (datasets[id]) {
            delete datasets[id];
            datasets[id] = null;
        }
        if (fs.statSync(path).isFile()) {
            fs.unlink(path);
        }
    }*/

    /**
     * Perform a query on UBCInsight.
     *
     * @param query  The query to be performed. This is the same as the body of the POST message.
     * @return Promise <InsightResponse>
     *
     * */
    performQuery(query: any): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            if (!isValid(query)) {
                reject(
                    {
                        code: 400,
                        body: {}
                    });
                //return;
            } else {
                //let j_query = JSON.stringify(query);
                //let j_obj = JSON.parse(j_query);
                let where = query["WHERE"];
                let options = query["OPTIONS"];
                console.log(where)
                let columns = options["COLUMNS"];
                //var order = options["ORDER"];

                let data: any = datasets["courses"];
                if (data.length === 0) {
                    reject({code: 424, body: {"error": "missing dataset"}});
                    return;
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
                //console.log("this is the result" + result2);
                fulfill({code: 200, body: result2});
            }
        });
    }
}

function isValid(query: any): boolean {
    //let ret_obj: InsightResponse = {code: 200, body: "valid"};
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
            let filters = where[top];
            for (let i = 0; i < filters.length; i++) {
                if (!check_where(filters[i]))
                    return false;
            }
            return true;
        }

        case "OR": {
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