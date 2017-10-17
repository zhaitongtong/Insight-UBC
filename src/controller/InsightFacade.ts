/**
 * This is the main programmatic entry point for the project.
 */

import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";

var fs = require('fs');
var request = require('request');
import {isUndefined} from "util";

// my import
import DatasetController from '../controller/DatasetController';
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

export default class InsightFacade implements IInsightFacade {
    // private static datasetController = new DatasetController();

    private datasetController: DatasetController;

    constructor() {
        Log.trace('InsightFacadeImpl::init()');
        this.datasetController = new DatasetController();
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
                let dsController = that.datasetController;
                let idExists: boolean = dsController.inMemory(id);
                dsController.process(id, content)
                    .then(function (result) {
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
            try {
                let dsController = that.datasetController;
                try {
                    dsController.delete(id);
                    fulfill({code: 204, body: 'the operation was successful.'});
                }
                catch (e) {
                    reject({
                        code: 404,
                        body: 'the operation was unsuccessful because the delete was  for a resource that was not previously added.'
                    });
                }
            } catch (err) {
                reject({code: 400, error: err.message});
            }
        });
    }

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
                reject({code: 400, body: {"error": "invalid query"}});
                return;
            }

            var j_query = JSON.stringify(query);
            var j_obj = JSON.parse(j_query);
            var where = j_obj["WHERE"];
            var options = j_obj["OPTIONS"];
            console.log(where)
            var columns = options["COLUMNS"];
            //var order = options["ORDER"];

            let data = that.datasetController.getDatasets();
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
        });
    }
}

function isValid(query: any): boolean {
    let ret_obj: InsightResponse = {code: 200, body: "valid"};
    try {
        //var j_query = JSON.stringify(query);
        //var j_obj = JSON.parse(j_query);
        var where = query["WHERE"];
        var options = query["OPTIONS"];
        var columns = options["COLUMNS"];
        if ("ORDER" in options)
            var order = options["ORDER"];
    } catch (err) {
        ret_obj = {code: 400, body: "invalid query"};
        return false;
    }

    if (columns.length == 0)
        return false;

    for (let column of columns) {
        var value = dictionary[column];
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
            return !courseIn(course, where);
        }
        default:
            return false;
    }
}