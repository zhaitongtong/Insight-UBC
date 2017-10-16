import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";
import DatasetController from '../controller/DatasetController';
import Dataset from '../controller/DatasetController';

// my import
var fs = require('fs');
var request = require('request');
import {isUndefined} from "util";

let dictionary: {[index: string]: string} = {};
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

class Dataset_obj {
    id: string;
    constructor() {
        this.id = null;
    }
    getValue(target: string): any {
        return null;
    }
    setValue(target: string, value: string) {
    }
}

class Course_obj extends Dataset_obj {

    Subject: string;
    Course: string;
    Avg: number;
    Professor: string;
    Title: string;
    Pass: number;
    Fail: number;
    Audit: number;
    id: string;

    constructor() {
        super();
        this.Subject = null;
        this.Course = null;
        this.Avg = null;
        this.Professor = null;
        this.Title = null;
        this.Pass = null;
        this.Fail = null;
        this.Audit = null;
        this.id = null;
    };

    getValue(target: string): any {

        switch (target) {
            case "Subject": {
                return this.Subject;
            }
            case "Course": {
                return this.Course;
            }
            case "Avg": {
                return this.Avg;
            }
            case "Professor": {
                return this.Professor;
            }
            case "Title": {
                return this.Title;
            }
            case "Pass": {
                return this.Pass;
            }
            case "Fail": {
                return this.Fail;
            }
            case "Audit": {
                return this.Audit;
            }
            case "id": {
                return this.id;
            }
            default :
                throw new Error(target);
        }
    }

    setValue(target: string, value: string) {
        switch (target) {
            case "Subject": {
                this.Subject = value.toString();
                break;
            }
            case "Course": {
                this.Course = value.toString();
                break;
            }
            case "Avg": {
                this.Avg = Number(value);
                break;
            }
            case "Professor": {
                this.Professor = value;
                break;
            }
            case "Title": {
                this.Title = value.toString();
                break;
            }
            case "Pass": {
                this.Pass = Number(value);
                break;
            }
            case "Fail": {
                this.Fail = Number(value);
                break;
            }
            case "Audit": {
                this.Audit = Number(value);
                break;
            }
            case "id": {
                this.id = value.toString();
                break;
            }
            default :
                throw new Error(target);
        }
    }
}

export interface QueryRequest {
}

export default class InsightFacade implements IInsightFacade {
    courses_dataset: string;

    private static datasetController = new DatasetController();

    constructor() {
        var path: string = "src/courses.zip";
        if (fs.existsSync(path)) {
            this.courses_dataset = fs.readFileSync(path, 'utf-8');
        } else {
            this.courses_dataset = null;
        }
        Log.trace('InsightFacadeImpl::init()');
    }

    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            let dsController = InsightFacade.datasetController;
            let response: InsightResponse;
            dsController.process(id, content)
                .then(function (result:any) {
                    if (result) {
                        if (result == 201) {
                            response = {code: result, body: 'the operation was successful and the id already existed'}
                        } else if (result == 204) {
                            response = {code: result, body: 'the operation was successful and the id already existed'}
                        }
                        fulfill(response);
                    }
                    else {
                        response = {code: 400, body: {"error": "my text"}}
                        reject(response)
                    }
                })
                .catch(function (err: Error) {
                    response = {code: 400, body: {"error": err.message}};
                    reject(response);
                })
        });
    }
    removeDataset(id: string): Promise<InsightResponse> {

        return new Promise(function (fulfill, reject) {
            try {
                let dsController = InsightFacade.datasetController;
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

    performQuery(query: QueryRequest): Promise <InsightResponse> {
        return new Promise((fulfill, reject) => {
            if (validate(query).code == 400) {
                return reject({code: 400, body: {"error": "invalid json or query " + validate(query).body}});
            }

            var j_query = JSON.stringify(query);
            var j_obj = JSON.parse(j_query);

            var options = j_obj["OPTIONS"];
            var columns = options["COLUMNS"];
            var order = options["ORDER"];
            //console.log("columns is " + columns);

            if (columns.length != 0) {
                var id: string = columns[0].substring(0,columns[0].indexOf("_"));
                var path = './src/' + id + ".json";
                // console.log("path is " + path);
                var exist = fs.existsSync(path); // fs.access(path) for async?
                Log.trace("path is "+ exist);
            } else {
                return reject({code: 400, body: {"error": " empty column "}});
            }

            if (exist) {
                let data: string;
                var table: Dataset_obj[];
                if (id === "courses") {
                    data = this.courses_dataset;
                    table = build_table(data);
                }
                var missing_col: string[] = [];

                var body = null;
                try {
                    body = filter(table, query, missing_col);
                } catch (err) {
                    return reject({code: 400, body: err.message});
                }
                if (missing_col.length > 0) {
                    var missing_ids: string[] = [];
                    for (let missing_item of missing_col) {
                        try {
                            var vals = missing_item.toString();
                            var missing_id = vals.substring(0, vals.indexOf("_"));  // Could trigger error
                            if (!fs.existsSync("src/" + missing_id + ".json")) {
                                missing_ids.push(missing_id);
                            }
                        }
                        catch (err) {
                            return reject({code: 400, body: err.message});
                        }
                    }
                    if (missing_ids.length > 0) {
                        return reject({code: 424, body: {"missing": missing_ids}});
                    }
                    return reject({code: 400, body: {"missing": missing_col}});
                }
                /*
                var result: QueryResponse = JSON.parse(JSON.stringify({result: body}));
                return fulfill({code: 200, body: result});*/
                let ret_obj = {result: body};
                return fulfill({code: 200, body: ret_obj});
            } else {
                let ret_obj = {code: 424, body: {"missing": [id]}};
                return reject(ret_obj);
            }
        })
    }
}

function build_table(data: string): Array<Course_obj> {
    var courses = JSON.parse(data)["courses"];
    var course_list: Course_obj[] = [];
    var interest_info = ["Subject", "Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id"];

    for (let course of courses) {
        var course_info = course[Object.keys(course)[0]];
        var results = course_info["result"];

        for (let item of results) {
            var each_course: Course_obj = new Course_obj();
            for (let s of interest_info) {
                var value = item[s];
                if (s == "id" || s == "Course") {
                    each_course.setValue(s, value.toString());
                } else {
                    each_course.setValue(s, value);
                }
            }
            course_list.push(each_course);
        }
    }
    return course_list;
}

function filter(table: Array<Dataset_obj>, query: QueryRequest, missing_col: string []): any {

    var j_query = JSON.stringify(query);
    var j_obj = JSON.parse(j_query);

    var options = j_obj["OPTIONS"];
    var where = j_obj["WHERE"];

    let where_keys = Object.keys(where);

    var query: QueryRequest = where;
    var ret_table = [];

    if (where_keys.length === 0) {
        ret_table = table;
    }else {
        try {
            var values = filter_helper(table, query, missing_col);
            ret_table = values[1];
        } catch (err) {
            throw err;
        }
    }

    var columns = options["COLUMNS"];
    var order = options["ORDER"];

    if (!isUndefined(order) && typeof order == 'string') {
        ret_table.sort((a: Dataset_obj, b: Dataset_obj) => {
            return local_compare_single(a.getValue(dictionary[order]), b.getValue(dictionary[order]));
        });
    }

    var ret_array: any = [];

    for (let item of ret_table) {

        let ret_obj: {[index: string]: any} = {};
        for (let column of columns) {
            try {
                if (!isUndefined(dictionary[column]))
                    ret_obj[column] = item.getValue(dictionary[column]);
            } catch (err) {
                ret_obj = {code:400, body:"undefined error"};
            }
        }
        ret_array.push(ret_obj);
    }
    return ret_array;
}

function filter_helper(table: Array<Dataset_obj>, query: QueryRequest, missing_col: string[]):Array<any>{

    var j_query = JSON.stringify(query);
    var j_obj = JSON.parse(j_query);
    var keys = Object.keys(j_obj);
    var key = keys[0];
    var ret_obj: InsightResponse = {code: 200,body:"invalid"};
    var ret_array: Dataset_obj[] = [];

    if (key == "IS") {
        var inner_query = j_obj[key]
        var inner_keys = Object.keys(inner_query);

        if (Object.keys(inner_query).length == 0) {
            ret_obj = {code:400, body:"Should have at least 1 parameter in IS"};
        }
        if (inner_keys.length > 1) {
            ret_obj = {code:400, body:"Should have at most 1 parameter in IS"};
        }

        check_missing(inner_keys, missing_col);

        if (missing_col.length == 0) {
            var target = dictionary[inner_keys[0]];
            for (let item of table) {
                try {
                    var input = inner_query[inner_keys[0]];
                    if (typeof input == "string" && typeof item.getValue(target) == "string") {
                        var index_of_partial_first: number = input.indexOf("*");
                        if (index_of_partial_first == 0 && input.length > 1) {
                            var index_of_partial_second: number = input.indexOf("*", input.length - 1);
                            if (index_of_partial_second != -1) { // *aaa*
                                var sub_input = input.substring(1, input.length - 1);
                                if (item.getValue(target).includes(sub_input)) {
                                    ret_array.push(item);
                                }
                            } else { // *aa
                                if (item.getValue(target).endsWith(input.substring(1))) {
                                    ret_array.push(item);
                                }
                            }
                        } else if (index_of_partial_first == input.length - 1 && input.length > 1) { // aaa*
                            if (item.getValue(target).startsWith(input.substring(0, input.length - 1))) {
                                ret_array.push(item);
                            }
                        } else {
                            if (input == item.getValue(target)) {
                                ret_array.push(item);
                            }
                        }
                    }
                    else {
                        ret_obj = {code:400, body:"type error IS"};
                    }
                } catch (err) {
                    ret_obj = {code:400, body:" error at line 472"};
                }
            }
        }
    }
    else if (key == "GT") {
        var inner_query = j_obj[key];
        var inner_keys = Object.keys(inner_query);

        if (Object.keys(inner_query).length == 0) {
            ret_obj = {code:400, body:"Should have at least 1 parameter in GT"};
        }

        if (inner_keys.length > 1) {
            ret_obj = {code:400, body:"Should have at most 1 parameter in GT"};
        }

        check_missing(inner_keys, missing_col);

        if (missing_col.length == 0) {
            var target = dictionary[inner_keys[0]];
            for (let item of table) {

                try {
                    if (typeof inner_query[inner_keys[0]] == "number" && typeof item.getValue(target) == "number") {
                        if (item.getValue(target) > inner_query[inner_keys[0]]) {
                            ret_array.push(item);
                        }
                    }
                    else {
                        ret_obj = {code:400, body:"type error GT"};
                    }
                } catch (err) {
                    ret_obj = {code:400, body:"error at line 508"};
                }
            }
        }
    }
    else if (key == "LT") {

        var inner_query = j_obj[key];
        var inner_keys = Object.keys(inner_query);

        if (inner_keys.length > 1) {
            ret_obj = {code:400, body:"Should have at most 1 parameter in LT"};
        }

        if (Object.keys(inner_query).length == 0) {
            ret_obj = {code:400, body:"Should have at most 1 parameter in LT"};
        }
        check_missing(inner_keys, missing_col);
        if (missing_col.length == 0) {
            var target = dictionary[inner_keys[0]];
            for (let item of table) {

                try {
                    if (typeof inner_query[inner_keys[0]] == "number" && typeof item.getValue(target) == "number") {
                        if (item.getValue(target) < inner_query[inner_keys[0]]) {
                            ret_array.push(item);
                        }
                    }
                    else {
                        ret_obj = {code:400, body:"type error LT"};
                    }
                } catch (err) {
                    ret_obj = {code:400, body:"error at line 544"};
                }
            }
        }
    }
    else if (key == "EQ") {
        var inner_query = j_obj[key];
        var inner_keys = Object.keys(inner_query);
        if (inner_keys.length > 1) {
            ret_obj = {code:400, body:"Should have at most 1 parameter in EQ"};
        }

        if (Object.keys(inner_query).length == 0) {
            ret_obj = {code:400, body:"Should have at least 1 parameter in LT"};
        }
        check_missing(inner_keys, missing_col);

        if (missing_col.length == 0) {
            var target = dictionary[inner_keys[0]];
            for (let item of table) {

                try {
                    if (typeof inner_query[inner_keys[0]] == "number" && typeof item.getValue(target) == "number") {
                        if (item.getValue(target) == inner_query[inner_keys[0]]) {
                            ret_array.push(item);
                        }
                    }
                    else {
                        ret_obj = {code:400, body: "type error EQ"};
                    }
                } catch (err) {
                    ret_obj = {code:400, body: "error at line 579"};
                }
            }
        }
    }
    else if (key == "AND") {
        var and_list = j_obj[key];
        var final_array: Dataset_obj[] = [];

        if (and_list.length == 0) {
            ret_obj = {code:400, body: "empty AND"};
        }

        for (let item of and_list) {
            var a = JSON.stringify(item);
            var query: QueryRequest = item;
            var temp = filter_helper(table, query, missing_col);
            final_array = final_array.concat(temp);
        }
        final_array.sort(compare);
        for (var i = 0; i < final_array.length; i++) {
            var in_intersection = false;

            var index = i + and_list.length - 1;
            if (index < final_array.length) {

                if (final_array[i].id == final_array[index].id) {
                    in_intersection = true;
                }
            }
            else {
                in_intersection = false;
            }

            if (in_intersection) {
                ret_array.push(final_array[i]);
            }
        }

    }
    else if (key == "OR") {
        var or_list = j_obj[key];
        var final_array: Dataset_obj[] = [];

        if (or_list.length == 0) {
            ret_obj = {code:400, body: "empty OR"};
        }

        for (let item of or_list) {
            var a = JSON.stringify(item);
            var query: QueryRequest = item;
            var temp = filter_helper(table, query, missing_col);
            final_array = final_array.concat(temp);
        }
        final_array.sort(compare);

        if (!isUndefined(final_array[0]))
            ret_array.push(final_array[0]);
        for (var i = 1; i < final_array.length; i++) {
            if (final_array[i].id != ret_array[ret_array.length - 1].id) {
                ret_array.push(final_array[i]);
            }
        }
    }
    else if (key == "NOT") {
        var inner_query = j_obj[key];
        var inner_keys = Object.keys(inner_query);
        if (inner_keys.length > 1) {
            ret_obj = {code:400, body: " Should have at most 1 parameter when key is NOT "};
        }
        if (Object.keys(inner_query) == []) {
            ret_obj = {code:400, body: "empty NOT"};
        }
        var query: QueryRequest = inner_query;

        var values = filter_helper(table, query, missing_col);
        var before_negate = values[1];
        var final_array: Array<Dataset_obj>;
        final_array = before_negate.concat(table).sort(compare);

        var element_1 = final_array[0];
        for (var i = 1; i < final_array.length; i++) {
            var element_2 = final_array[i];
            if (element_2.id != element_1.id) {
                ret_array.push(element_1);
                element_1 = final_array[i];
            } else if ((i + 1) < final_array.length) {
                element_1 = final_array[i + 1];
                i++;
            }
        }
        if (final_array[final_array.length - 2].id != final_array[final_array.length - 1].id) {
            ret_array.push(final_array[final_array.length - 1]);
        }
    }else{
        ret_obj = {code:400, body: "invalid query missing filter"};
    }
    return [ret_obj,ret_array];
}

function compare(a: Dataset_obj, b: Dataset_obj): number {
    return Number(a.id) - Number(b.id);
}

function check_missing(keys: any, missing_col: string []) {

    for (var i = 0; i < keys.length; i++) {
        var val = dictionary[keys[i]];
        if (isUndefined(val)) {
            var vals: string = keys[i].toString();
            missing_col.push(keys[i]);
        }
    }
}

function local_compare(a: any, b: any, keys: any[]): number {
    for (let i = 0; i < keys.length; i++) {
        if (a[keys[i]] < b[keys[i]]) {
            return -1;
        }
        else if (a[keys[i]] > b[keys[i]]) {
            return 1;
        }
    }
    return 0;
}

function local_compare_single(a: any, b: any): number {
    if (a < b) {
        return -1;
    }
    else if (a > b) {
        return 1;
    }
    else {
        return 0;
    }
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

function validate(query: QueryRequest): InsightResponse {

    let ret_obj: InsightResponse = {code: 200, body: "valid"};
    try {
        var j_query = JSON.stringify(query);
        var j_obj = JSON.parse(j_query);

        var options = j_obj["OPTIONS"];
        var columns = options["COLUMNS"];
        var order = options["ORDER"];
    } catch (err) {
        ret_obj = {code: 400, body: "invalid query"};
        return ret_obj;
    }

    if (columns.length != 0) {
        var id: string = columns[0].substring(0, columns[0].indexOf("_"));
        if (!fs.existsSync("src/" + id + ".json")) {
            return ret_obj = {code: 424, body: "dataset not exist"};
        }
    } else {
        return ret_obj = {code: 400, body: "empty column"};
    }

    for (let column of columns) {
        var value = dictionary[column];
        if (column.substring(0, column.indexOf("_")) != id || isUndefined(value)) {
            return ret_obj = {code: 400, body: "invalid column item"};
        }
    }

    if (!check_order(order, columns)) {
        return ret_obj = {code: 400, body: "invalid order"};
    }

    return ret_obj;
}