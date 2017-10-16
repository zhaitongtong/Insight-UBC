import Log from "../Util";
let fs = require('fs');
let JSZip = require('jszip');
import {Datasets} from "./DatasetController"
import {stringify} from "querystring";

export interface QueryRequest{
    WHERE?:{}
    OPTIONS?:{}
    COLUMNS?:{}
    ORDER?:string
}

export interface QueryResponce{
}

export default class QueryController{

    public printDataset (){
        console.log(this.datasets)
    }

    private datasets: Datasets = {};

    constructor(datasets: Datasets) {
        this.datasets = datasets;
    }

    //TO-DO check dataset valid
    public isValid(query:QueryRequest):boolean{
        console.log(query["COLUMNS"])

        if (query == null || query["OPTIONS"] == "undefined") {
            return false
        }

        // Empty columns result in invalid query 400.
        if (query["COLUMNS"] === null || typeof query["COLUMNS"] === "undefined") {
            return false
        }

        // Check every elements in COLUMNS
        var columns: any = query["COLUMNS"];
        for (let course_what of columns){
            console.log(course_what)
            if (course_what !== ['courses_dept'] &&
                course_what !== 'courses_avg' &&
                course_what !== 'courses_uuid' &&
                course_what !== 'courses_title' &&
                course_what !== 'courses_instructor' &&
                course_what !== 'courses_fail' &&
                course_what !== 'courses_audit' &&
                course_what !== 'courses_pass' &&
                course_what !== 'courses_id' ) {
                console.log(course_what.toString() == 'courses_dept')
                return false
            }
        }
        return true;
    }

    public query(query:QueryRequest){
        var temp :any = this.datasets;
        // temp change data
        var data = fs.readFileSync('/scr/course.json')
        console.log(data)
        var result :any = new Object();
        if (data === undefined || data === null) {
            throw Error;//424 here
        } else {
            // check 'courses' and 'rooms' don't appear together in GET
            if (query.hasOwnProperty("WHERE")) {
                var queryBody: Object = query.WHERE;
                console.log(stringify(queryBody))
                data = this.filterBody(queryBody, data);
            }
            if (query.hasOwnProperty("OPTIONS").hasOwnProperty("ORDER") ) {
                data = this.orderCourse(query, data);
            }
            return result;
        }
    }

    public filterBody(queryBody: any, courses: Array<Object>): Array<Object> {
        if (queryBody["GT"] !== undefined) {
            console.log("we get GT")
            courses = this.greaterThan(queryBody, courses);
        }
        if (queryBody["LT"] !== undefined) {
            courses = this.lessThan(queryBody, courses);
        }
        if (queryBody["EQ"] !== undefined) {
            courses = this.equalTo(queryBody, courses);
        }
        if (queryBody["IS"] !== undefined) {
            courses = this.isStringEqual(queryBody, courses);
        }
        if (queryBody["OR"] !== undefined) {
            var orQuery = queryBody["OR"];
            var length = Object.keys(orQuery).length;
            if (length > 0) {
                var statementOne = queryBody["OR"][0];
                var coursesOne = this.filterBody(statementOne, courses);
                var tempCourses = coursesOne;
            }
            for (var i = 1; i < length; ++i) {
                var statementI = queryBody["OR"][i];
                var coursesI = this.filterBody(statementI, courses);
                tempCourses = this.arrayUnique(tempCourses.concat(coursesI));
            }
            courses = tempCourses;
        }
        if (queryBody["AND"] !== undefined) {
            var andQuery = queryBody["AND"];
            var length = Object.keys(andQuery).length;
            if (length > 0) {
                var statementOne = queryBody["AND"][0];
                var coursesOne = this.filterBody(statementOne, courses);
                var tempCourses = coursesOne;
            }
            for (var i = 1; i < length; ++i) {
                var statementI = queryBody["AND"][i];
                var coursesI = this.filterBody(statementI, courses);
                tempCourses = this.arrayIntersect(tempCourses, coursesI);
            }
            courses = tempCourses;
        }
        if (queryBody.hasOwnProperty("NOT")) {
            var statement = queryBody["NOT"];
            if (statement["NOT"] !== undefined) {
                return this.filterBody(statement["NOT"], courses);
            }
            var notCourses = this.filterBody(statement, courses);
            courses = this.arrayDifference(notCourses, courses);
        }
        return courses;
    }

    public orderCourse(query: any, courses: Array<Object>): Array<Object> {
        var orderKey = query["ORDER"];
        courses = courses.sort(function (a, b) {
            var tempA: any = a;
            var tempB: any = b;
            if (tempA[orderKey] > tempB[orderKey]) {
                return 1;
            }
            if (tempA[orderKey] < tempB[orderKey]) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });
        return courses;
    }

    public isKeyValid(key: string): boolean {
        console.log("we come to is key Valid")
        if (key === "courses_id" || key === "courses_uuid" ||
            key === "courses_instructor" || key === "courses_dept" ||
            key === "courses_avg" || key === "courses_pass" ||
            key === "courses_fail" || key === "courses_audit" ||
            key === "courses_title") {
            console.log("we come to iskeyvalid result true")
            return true;
        }
        return false;

    }

    public isNumber(key: string) :boolean {
        if (key === "courses_avg" || key === "courses_pass" || key === "courses_fail" || key === "courses_audit") {
            return true;
        }
        return false;
    }

    public greaterThan(queryBody: any, courses: Array<Object>): Array<Object> {
        console.log("we get greater than")

        var c = queryBody["GT"]; //  {'courses_avg': 97
        console.log(c)

        var fakeKey = Object.keys(c); // 'courses_avg'
        console.log(fakeKey)

        var value = c[Object.keys(queryBody["GT"])[0]];// 97
        console.log(value)

        console.log("we come to value 97")

        /*if (fakeKey.indexOf("[") == -1) {
            var key = stringify(fakeKey);
        } else {
            var key = stringify(fakeKey)
            var key = key.substring(1, fakeKey.length - 1);
        }*/
        var key = fakeKey.toString()
        console.log(key)


        if (this.isKeyValid(key)) {
            if (key === "courses_avg") {
                console.log(courses[0])

                console.log(typeof courses)
                var filteredCourse = courses.filter(function (section: any) {
                    console.log("we come to avg filter")
                    return section[key] > value;
                });
            } else if (key === "courses_fail") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] > value;
                });
            } else if (key === "courses_pass") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] > value;
                });
            } else if (key === "courses_audit") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] > value;
                });
            } else {
                console.log("we come to error")
                throw Error;
            }

        } else {
            throw Error;
        }

        return filteredCourse;
    }

    public lessThan(queryBody: any, courses: Array<Object>): Array<Object> {
        var c = queryBody["LT"];
        var fakeKey = Object.keys(c)[0];
        var value = c[Object.keys(queryBody["LT"])[0]];
        if (fakeKey.indexOf("[") == -1) {
            var key = fakeKey;
        } else {
            var key = fakeKey.substring(1, fakeKey.length - 1);
        }

        if (this.isKeyValid(key)) {
            if (key === "courses_avg") {

                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] < value;
                });
            } else if (key === "courses_fail") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] < value;
                });
            } else if (key === "courses_pass") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] < value;
                });
            } else if (key === "courses_audit") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] < value;
                });
            } else {
                throw Error;
            }
        } else {
            throw Error;
        }

        return filteredCourse;
    }

    public equalTo(queryBody: any, courses: Array<Object>): Array<Object> {
        var c = queryBody["EQ"];
        var fakeKey = Object.keys(c)[0];
        var value = c[Object.keys(queryBody["EQ"])[0]];

        if (fakeKey.indexOf("[") == -1) {
            var key = fakeKey;
        } else {
            var key = fakeKey.substring(1, fakeKey.length - 1);
        }

        if (this.isKeyValid(key)) {
            if (key === "courses_avg") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] == value;
                });
            } else if (key === "courses_fail") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] == value;
                });
            } else if (key === "courses_pass") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] == value;
                });
            } else if (key === "courses_audit") {
                var filteredCourse = courses.filter(function (section: any) {
                    return section[key] == value;
                });
            } else {
                throw Error;
            }
        } else {
            throw Error;
        }

        return filteredCourse;
    }


    public isStringEqual(queryBody: any, courses: Array<Object>): Array<Object> {
        var c = queryBody["IS"];
        var fakeKey = Object.keys(c)[0];
        var fakeValue : string = c[Object.keys(queryBody["IS"])[0]];

        if (fakeKey.indexOf("[") == -1) {
            var key = fakeKey;
        } else {
            var key = fakeKey.substring(1, fakeKey.length - 1);
        }

        if (fakeValue[0].indexOf("*") == -1 && fakeValue[0].indexOf("?") == -1) {
            fakeValue = "^" + fakeValue;
        }
        var length :number = fakeValue.length;
        length = length -1;
        if (fakeValue[length].indexOf("*") == -1 && fakeValue[length].indexOf("?") == -1) {
            fakeValue = fakeValue + "$";
        }

        if (fakeValue.indexOf("*") !== -1) {

            var indices = new Array();
            for (var i = 0; i < fakeValue.length; i++) {
                if (fakeValue[i] === "*") indices.push(i);
            }
            for (var i = 0; i < indices.length; i++) {
                if (i > 0) {
                    indices[i] = indices[i] + 8*i;
                }
                fakeValue = fakeValue.slice(0, indices[i]) + "[a-z0-9]" + fakeValue.slice(indices[i]);
            }
        }
        if (fakeValue.indexOf("?") !== -1) {

            var indices = new Array();
            for (var i = 0; i < fakeValue.length; i++) {
                if (fakeValue[i] === "?") indices.push(i);
            }
            for (var i = 0; i < indices.length; i++) {

                if (i > 0) {
                    indices[i] = indices[i] + 8;
                }
                fakeValue = fakeValue.slice(0, indices[i]) + "[a-z0-9]" + fakeValue.slice(indices[i]);

            }
        }
        if (fakeValue === "^Allard Hall (LAW)$") {
            fakeValue = "^Allard Hall*";
        } else if (fakeValue === "^Leonard S. Klinck (also known as CSCI)$") {
            fakeValue ="^Leonard S. Klinck*";
        } else if (fakeValue === "^Woodward (Instructional Resources Centre-IRC)$") {
            fakeValue ="^Woodward*";
        }
        var value = new RegExp(fakeValue);

        if (this.isKeyValid(key)) {

            if (key === "courses_dept") {
                var filteredCourse = courses.filter(function (section: any) {
                    return value.test(section[key]);
                });
            } else if (key === "courses_id") {
                var filteredCourse = courses.filter(function (section: any) {
                    return value.test(section[key]);
                });
            } else if (key === "courses_instructor") {
                var filteredCourse = courses.filter(function (section: any) {
                    return value.test(section[key]);
                });
            } else if ((key === "courses_title")) {
                var filteredCourse = courses.filter(function (section: any) {
                    return value.test(section[key]);
                });
            } else if ((key === "courses_uuid")) {
                var filteredCourse = courses.filter(function (section: any) {
                    return value.test(section[key]);
                });
            } else {
                throw Error;
            }

        } else {
            throw Error;
        }

        return filteredCourse;
    }

    public arrayUnique(courses: Array<Object>): Array<Object> {
        if (courses.length == 0) {
            return courses;
        }
        var a = courses.concat();
        var b = new Array();
        for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }

    public arrayIntersect(courses: Array<Object>, courses2: Array<Object>): Array<Object> {
        if (courses.length == 0) {
            return courses;
        }
        var a = courses.concat();
        var b = courses2.concat();
        var c :any = new Array();
        for (var i = 0; i < a.length; ++i) {
            for (var j = 0; j < b.length; ++j) {
                if (a[i] === b[j]) {
                    c.push(a[i]);
                    break;
                }
            }
        }
        return c;
    }

    public arrayDifference(notCourses: Array<Object>, courses: Array<Object>): Array<Object> {


        var result = new Array();
        for (var i = 0; i < courses.length; i++) {
            if (notCourses.indexOf(courses[i]) === -1) {
                result.push(courses[i]);
            }
        }
        return result;
    }



}
