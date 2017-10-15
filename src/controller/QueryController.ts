import Log from "../Util";

let fs = require('fs');
let JSZip = require('jszip');
import {Datasets} from "./DatasetController"


/*
* {
  "WHERE":{
     "GT":{
        "courses_avg":97
     }
  },
  "OPTIONS":{
     "COLUMNS":[
        "courses_dept",
        "courses_avg"
     ],
     "ORDER":"courses_avg"
  }
}
*/

export interface QueryRequest {
    WHERE?: {}
    OPTIONS?: { COLUMNS?: Object[], ORDER?: {} }
}

export interface QueryResponce {
}

export default class QueryController {

    private datasets: Datasets = {};

    constructor(datasets: Datasets) {
        this.datasets = datasets;
    }


    public isValid(query: QueryRequest): boolean {

        console.log(query.OPTIONS.COLUMNS)

        if (query == null || query.OPTIONS == "undefined") {
            return false
        }
        //Honeycomb: Empty columns result in invalid query 400.
        if (query.OPTIONS.COLUMNS == null || typeof query.OPTIONS.COLUMNS == "undefined") {
            return false
        }

        //TO-DO Check every elements in COLUMNS
        for (let course_what of query.OPTIONS.COLUMNS) {
            console.log(course_what)
            if (course_what !== ['courses_dept'] &&
                course_what !== 'courses_avg' &&
                course_what !== 'courses_uuid' &&
                course_what !== 'courses_title' &&
                course_what !== 'courses_instructor' &&
                course_what !== 'courses_fail' &&
                course_what !== 'courses_audit' &&
                course_what !== 'courses_pass' &&
                course_what !== 'courses_year' &&
                course_what !== 'courses_id' &&
                course_what !== 'courses_size') {
                console.log(course_what.toString() == 'courses_dept')
                return false
            }
        }

        //TO-DO Order can only appear once

        return true
    }

    public wherehandle() {

    }
}
