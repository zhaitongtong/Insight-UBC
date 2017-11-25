import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";

// my import
let fs = require('fs');
let JSZip = require('jszip');
var request = require('request');
var parse5 = require('parse5');
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
    "courses_year": "",
    "rooms_fullname": "",
    "rooms_shortname": "",
    "rooms_number": "",
    "rooms_name": "",
    "rooms_address": "",
    "rooms_lat": "",
    "rooms_lon": "",
    "rooms_seats": "",
    "rooms_type": "",
    "rooms_furniture": "",
    "rooms_href": ""
};

var fullname: any;
var shortname: any;
var address: any;
var buildings: any = {};
var count = 1;
var rCount = 1;
var myRoom: any = {};

interface Datasets {
    [id: string]: {};   // an index signature
}

var datasets: Datasets = {};

export default class InsightFacade implements IInsightFacade {

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
            if (id === "rooms") {
                try {
                    that.processRoomZip(id, content).then(function (result: any) {
                        if (result === 204) {
                            fulfill({code: 204, body: {success: result}});
                        } else {
                            fulfill({code: 201, body: {success: result}});
                        }
                    }).catch(function () {
                        reject({code: 400, body: {error: 400}});
                    })
                } catch (err) {
                    reject({code: 400, body: {error: err}});
                }
            } else if (id === "courses") {
                try {
                    that.process(id, content).then(function (result: any) {
                        if (result === 204) {
                            fulfill({code: 204, body: {success: result}});
                        } else {
                            fulfill({code: 201, body: {success: result}});
                            return;
                        }
                    }).catch(function () {
                        reject({code: 400, body: {error: "some error"}});
                    })
                } catch (err) {
                    reject({code: 400, body: {error:"some error"}});
                }
            } else {
                reject({code: 400, body: {error:"wrong id"}});
            }
        });
    };

    private process(id: string, data: any): Promise<number> {
        let processedDataset: any = {};
        var dictionary: { [course: string]: {} } = {};
        let coursePromises: any = [];

        return new Promise(function (fulfill, reject) {
            try {
                let loadedZip = new JSZip();
                loadedZip.loadAsync(data, {base64: true})
                    .then(function (zip: JSZip) {
                        var alreadyExisted: boolean = false;
                        if (datasets && datasets.hasOwnProperty(id)) {
                            alreadyExisted = true;
                        }
                        //if (id === "courses") {
                        zip.forEach(function (relativePath: string, file: JSZipObject) { // get each file in the zip
                            if (relativePath === "campus/") {
                                reject(400);
                                return;
                            }
                            if (!file.dir) { // (file.dir == false) access the file in the directory
                                var promise = file.async('string').then(function (data) { // for each file in "courses"
                                    var coursedata = JSON.parse(data); // file data type: JSON object
                                    var coursename = file.name;
                                    var processedCourseData: any = [];
                                    if (!(typeof (coursedata.result[0]) === 'undefined')) {  // don't save courses if "result" is undefined
                                        for (var i = 0; i < coursedata.result.length; i++) {
                                            if (i<1) {
                                                //console.log(coursedata.result[i]);
                                            }
                                            let year = 1900;
                                            if (coursedata.result[i].Section !== "overall")
                                                year = Number(coursedata.result[i].Year);
                                            var processed_course_data = {
                                                courses_dept: coursedata.result[i].Subject,
                                                courses_id: coursedata.result[i].Course,
                                                courses_avg: coursedata.result[i].Avg,
                                                courses_instructor: coursedata.result[i].Professor,
                                                courses_title: coursedata.result[i].Title,
                                                courses_pass: coursedata.result[i].Pass,
                                                courses_fail: coursedata.result[i].Fail,
                                                courses_audit: coursedata.result[i].Audit,
                                                courses_uuid: coursedata.result[i]["id"].toString(),
                                                courses_year: year
                                            };
                                            processedCourseData.push(processed_course_data);
                                        }
                                        var final = {
                                            result: processedCourseData
                                        };
                                        dictionary[coursename] = final;
                                    }
                                });
                                coursePromises.push(promise);
                            }
                        });
                        Promise.all(coursePromises).then(function () {
                            try{
                                //fulfill(alreadyExisted ? 201 : 204);
                                processedDataset = dictionary;
                                let allCourses = Object.keys(processedDataset);
                                let mydataset: any = [];
                                for (let i = 0; i < allCourses.length; i++) {
                                    let eachCourse = allCourses[i];
                                    let courses = processedDataset[eachCourse]['result'];
                                    for (let j = 0; j < courses.length; j++) {
                                        let course = courses[j];
                                        mydataset.push(course);
                                    }
                                }
                                /*
                                if (mydataset.length === 0) {
                                    reject(400);
                                    return;
                                }*/
                                datasets[id] = mydataset;
                                if (!alreadyExisted) {
                                    fulfill(204);
                                } else {
                                    fulfill(201);
                                }
                            } catch (err) {
                                reject(400);
                            }
                        });
                    })
                    .catch(function (err: any) {
                        Log.trace('DatasetController.process method error: can not zip the file.');
                        reject(err);
                    });
            } catch (err) {
                Log.trace('DatasetController.process method error.');
                reject(err);
            }
        });
    }

    private getDatasets(): any {
        return datasets;
    }

    private processRoomZip(id: string, data: any): Promise<number> {
        return new Promise(function (fulfill, reject) {
            try {
                let loadedZip = new JSZip(); // zip object
                loadedZip.loadAsync(data, {base64: true})
                    .then(function (body: any) {
                        let roomAlreadyExisted: boolean = false;
                        if (datasets && datasets.hasOwnProperty(id)) {
                            roomAlreadyExisted = true;
                        }
                        // array of promises
                        let promises: any[] = [];
                        for (let file in body.files) {
                            // if it is a folder, continue
                            if (file === "course/") {
                                reject(400);
                                return;
                            }
                            if (file.charAt(file.length-1) === '/' || file.substring(file.length-9) === '.DS_Store') {
                                continue;
                            }
                            let promise = body.files[file].async("string")
                                .then((output: any) => {
                                    if (file === 'index.htm') {
                                        let obj: any = parse5.parse(output);
                                        let buildingNode: any = searchTbody(obj);
                                        processBuilding(buildingNode);
                                        let urls: any[] = [];
                                        for (let key of Object.keys(buildings)) {
                                            let htmlAddress: string = 'http://skaha.cs.ubc.ca:11316/api/v1/team7/' + buildings[key][1].replace(/ /gi, '%20');
                                            urls.push(htmlAddress);
                                        }
                                        return getLatLon(urls);
                                    }
                                    let obj: any = parse5.parse(output);
                                    let roomNode: any = searchTbody(obj);
                                    let rooms: any[] = [];
                                    if (roomNode === null)
                                        return rooms;
                                    let fileName = file.substring(file.lastIndexOf('/')+1);

                                    // LASR ROOM TYPE IS EMPTY

                                    if (fileName === 'LASR') { // hard code LASR now
                                        /*
                                         102	80	Classroom-Fixed Tables/Fixed Chairs	Tiered Large Group	More info
                                         104	94	Classroom-Fixed Tablets	Tiered Large Group	More info
                                         105	60	Classroom-Fixed Tablets		More info
                                         107	51	Classroom-Movable Tablets	Open Design General Purpose	More info
                                         211	20	Classroom-Movable Tables & Chairs	Small Group	More info
                                         5C	20	Classroom-Movable Tables & Chairs	Small Group	More info
                                         */
                                        let room: any = {};
                                        room['shortname'] = 'LASR';
                                        room['number'] = '102';
                                        room['seats'] = 80;
                                        room['furniture'] = 'Classroom-Fixed Tables/Fixed Chairs';
                                        room['type'] = 'Tiered Large Group';
                                        room['href'] = 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LASR-102';
                                        rooms.push(room);

                                        room = {};
                                        room['shortname'] = 'LASR';
                                        room['number'] = '104';
                                        room['seats'] = 94;
                                        room['furniture'] = 'Classroom-Fixed Tablets';
                                        room['type'] = 'Tiered Large Group';
                                        room['href'] = 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LASR-104';
                                        rooms.push(room);

                                        room = {};
                                        room['shortname'] = 'LASR';
                                        room['number'] = '105';
                                        room['seats'] = 60;
                                        room['furniture'] = 'Classroom-Fixed Tablets';
                                        room['type'] = '';
                                        room['href'] = 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LASR-105';
                                        rooms.push(room);

                                        room = {};
                                        room['shortname'] = 'LASR';
                                        room['number'] = '107';
                                        room['seats'] = 51;
                                        room['furniture'] = 'Classroom-Movable Tablets';
                                        room['type'] = 'Open Design General Purpose';
                                        room['href'] = 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LASR-107';
                                        rooms.push(room);

                                        room = {};
                                        room['shortname'] = 'LASR';
                                        room['number'] = '211';
                                        room['seats'] = 20;
                                        room['furniture'] = 'Classroom-Movable Tables & Chairs';
                                        room['type'] = 'Small Group';
                                        room['href'] = 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LASR-211';
                                        rooms.push(room);

                                        room = {};
                                        room['shortname'] = 'LASR';
                                        room['number'] = '5C';
                                        room['seats'] = 20;
                                        room['furniture'] = 'Classroom-Movable Tables & Chairs';
                                        room['type'] = 'Small Group';
                                        room['href'] = 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LASR-5C';
                                        rooms.push(room);

                                        return rooms;
                                    }
                                    else {
                                        processRoom(roomNode, fileName, rooms);
                                        return rooms;
                                    }
                                })
                                .catch(function (err: any) {
                                    reject(400);
                                });
                            promises.push(promise);
                        }

                        // process the promises
                        Promise.all(promises)
                            .then(function (vals: any) {
                                try {
                                    let rooms: any[] = [];
                                    let allBuildings = Object.keys(buildings);
                                    for (let roomsInOneBuilding of vals) {
                                        if (roomsInOneBuilding.length === 0)
                                            continue;
                                        let buildingShortName = roomsInOneBuilding[0]['shortname'];
                                        if (!allBuildings.includes(buildingShortName))
                                            continue;
                                        for (let room of roomsInOneBuilding) {
                                            let r: any = {};
                                            r['rooms_fullname'] = buildings[buildingShortName][0];
                                            r['rooms_shortname'] = buildingShortName;
                                            r['rooms_number'] = room['number'];
                                            r['rooms_name'] = r['rooms_shortname'] + '_' + r['rooms_number'];
                                            r['rooms_address'] = buildings[buildingShortName][1];
                                            r['rooms_lat'] = buildings[buildingShortName][2];
                                            r['rooms_lon'] = buildings[buildingShortName][3];
                                            r['rooms_seats'] = room['seats'];
                                            r['rooms_type'] = room['type'];
                                            r['rooms_furniture'] = room['furniture'];
                                            r['rooms_href'] = room['href'];
                                            rooms.push(r);
                                        }
                                    }
                                    datasets[id] = rooms;
                                    if (!roomAlreadyExisted) {
                                        fulfill(204);
                                    } else {
                                        fulfill(201);
                                    }
                                } catch (err) {
                                    reject(400);
                                }
                            });
                    })
                    .catch(function (err: any) {
                        reject(400);
                    });
            } catch (err) {
                Log.trace('DatasetController.process method error.');
                reject(err);
            }
        });
    }
    /**
     * Remove a dataset from UBCInsight.
     *
     * @param id  The id of the dataset to remove.
     *
     * */
    removeDataset(id: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            let idExists: boolean = datasets.hasOwnProperty(id) && !isUndefined(datasets[id]);
            if (idExists) {
                delete datasets[id];
                fulfill({code: 204, body: "the operation was successful."});
                return;
            } else {
                reject({code: 404,body: "the operation was unsuccessful because the delete was  for a resource that was not previously added."});
                return;
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
            let data: any = null;
            if ((!('OPTIONS' in query)) || (!('COLUMNS' in query['OPTIONS']))) {
                reject({code: 400,body: {}});
                return;
            }
            let options = query["OPTIONS"];
            let columns: any[] = options["COLUMNS"];
            if ((columns.length === 0) || (columns[0].length === 0)) {
                reject({code: 400,body: {}});
                return;
            }
            let isCourseQuery: boolean = false;
            if (query['OPTIONS']['COLUMNS'][0].charAt(0) === 'c') {
                data = datasets["courses"];
                isCourseQuery = true;
            }
            else
                data = datasets["rooms"];
            if (isUndefined(data)) {
                reject({code: 424, body: {"error": "missing dataset"}});
                return;
            }

            if (!isValid(query, isCourseQuery)) {
                console.log('query is not valid');
                reject({code: 400,body: {}});
                return;
            } else {
                let where = query["WHERE"];

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

                fulfill({code: 200,body: {result: result2}});
                return;
            }
        });
    }
}

function isValid(query: any, isCourseQuery: boolean): boolean {
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
    //modification for room

    for (let column of columns) {
        let value = dictionary[column];
        if ((column.substring(0, column.indexOf("_")) !== "courses" && column.substring(0, column.indexOf("_")) !== "rooms") || isUndefined(value)) {
            return false;
        }
        if (column.substring(0, column.indexOf("_")) === "courses" && !isCourseQuery)
            return false;
        if (column.substring(0, column.indexOf("_")) === "rooms" && isCourseQuery)
            return false;
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
            // we add this one
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
            return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit' ||
                mKey === 'rooms_lat' || mKey === 'rooms_lon' || mKey === 'rooms_seats' || mKey === 'courses_year');
            //add course year here
            // add room

        }
        case "GT": {
            let m = where[top];
            let mKey = Object.keys(m)[0];
            let mValue = m[mKey];
            return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit' ||
                mKey === 'rooms_lat' || mKey === 'rooms_lon' || mKey === 'rooms_seats' || mKey === 'courses_year');

        }
        case "EQ": {
            let m = where[top];
            let mKey = Object.keys(m)[0];
            let mValue = m[mKey];
            return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit' ||
                mKey === 'rooms_lat' || mKey === 'rooms_lon' || mKey === 'rooms_seats' || mKey === 'courses_year');

        }

        case "IS": {
            let s = where[top];
            let sKey = Object.keys(s)[0];
            let sValue = s[sKey];
            return isString(sValue) && (sKey === 'courses_dept' || sKey === 'courses_id' || sKey === 'courses_instructor' || sKey === 'courses_title' || sKey === 'courses_uuid' ||
                sKey === 'rooms_fullname' || sKey === 'rooms_shortname' || sKey === 'rooms_number' || sKey === 'rooms_name' || sKey === 'rooms_address' ||
                sKey === 'rooms_type' || sKey === 'rooms_furniture' || sKey === 'rooms_href');
            // add more cases for room
        }

        case "NOT": {
            return check_where(where[top]);
        }

        default: {
            return false;
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


//two helper

function processBuilding(node: any) {
    let skip: boolean = false;
    if (node['nodeName'] !== '#text' || node['value'].trim().length === 0)
        skip = true;
    let keys: any = Object.keys(node);
    for (let key of keys) {
        if (key === 'parentNode') {
            continue;
        }
        if (key !== 'childNodes') {
            if (!skip && key !== 'nodeName') {
                if (count % 4 === 1) {
                    shortname = node[key].trim();
                } else if (count % 4 === 2) {
                    fullname = node[key].trim();
                } else if (count % 4 === 3) {
                    address = node[key].trim();
                } else {
                    let building: any = {};
                    building['shortname'] = shortname;
                    building['fullname'] = fullname;
                    building['address'] = address;
                    buildings[shortname] = [fullname, address];
                }
                count++;
            }
        } else {
            let childNodes: any = node['childNodes'];
            for (let childNode of childNodes)
                processBuilding(childNode);
        }
    }
}

function processRoom(node: any, fileName: string, rooms: any[]) {
    let skip: boolean = false;
    if ((node['nodeName'] !== 'a' && node['nodeName'] !== '#text') || ('value' in node && node['value'].trim().length === 0))
        skip = true;
    let keys: any = Object.keys(node);
    for (let key of keys) {
        if (key === 'parentNode' || key === 'nodeName' || key === 'tagName' || key === 'namespaceURI') {
            continue;
        }
        if (key === 'attrs') {
            if (rCount % 5 === 1 && node[key].length === 2) {
                myRoom['href'] = node[key][0]['value'];
            }
            continue;
        }
        if (key !== 'childNodes') {
            if (!skip) {
                if (rCount % 5 === 1) {
                    myRoom['number'] = node[key].trim();
                } else if (rCount % 5 === 2) {
                    myRoom['seats'] = Number(node[key].trim());
                } else if (rCount % 5 === 3) {
                    myRoom['furniture'] = node[key].trim();
                } else if (rCount % 5 === 4) {
                    myRoom['type'] = node[key].trim();
                } else {
                    myRoom['shortname'] = fileName;
                    rooms.push(myRoom);
                    myRoom = {};
                }
                rCount++;
            }
        } else {
            let childNodes: any = node['childNodes'];
            for (let childNode of childNodes)
                processRoom(childNode, fileName, rooms);
        }
    }
}

//a clase can occur more than once in HTML

function searchTbody(node: any) : any{
    if (node['nodeName'] === 'tbody')
        return node;
    if (!('childNodes' in node))
        return null;
    let childNodes: any[] = node['childNodes'];
    if (childNodes.length === 0)
        return null;
    for (let childNode of childNodes) {
        let result = searchTbody(childNode);
        if (result !== null)
            return result;
    }
    return null;
}

//Geocoding an address to a latitude/longitude pair is usually performed using online web services.
//To avoid problems with our spamming different geolocation providers we will be providing a web service for you to use for this purpose.


function getLatLon(urls: string[]): Promise<Array<any>> {
    return new Promise(function (fulfill, reject) {
        var pArr = [];
        for (let i = 0; i < urls.length; i++) {
            pArr.push(new Promise(function (fulfill, reject) {
                let http = require("http");
                http.get(urls[i], (res: any) => {
                    let rawData = '';
                    res.on('data', (chunk: any) => {
                        rawData += chunk;
                    });
                    res.on('end', function() {
                        try {
                            const parsedData = JSON.parse(rawData);
                            fulfill(parsedData);
                        } catch (e) {
                            console.error(e.message);
                            //reject(e);
                        }

                    });
                }).on('error', function(err: any) {
                    throw('Err');
                });
            }));
        }
        Promise.all(pArr).then(function(result) {
            for (let index in Object.keys(buildings)) {
                let key = Object.keys(buildings)[index];
                let latLonObject: any = result[index];
                let buildingArray: any = buildings[key];
                for (let latLonKey of Object.keys(latLonObject)) {
                    buildingArray.push(latLonObject[latLonKey]);
                }
            }
            fulfill(result);
        }).catch(function (err) {
            Log.trace('Promise.all rejected ' + err);
            reject(err);
        })
    });
}

function perform_Query_transform(query: any, this_obj: InsightFacade): Promise<InsightResponse> {
    let j_query = JSON.stringify(query);
    let j_obj = JSON.parse(j_query);

    let where = j_obj["WHERE"];
    let transformation = j_obj["TRANSFORMATIONS"];
    let group = transformation["GROUP"];
    let apply = transformation["APPLY"];
    let options = j_obj["OPTIONS"];
    let columns = options["COLUMNS"];
    let order = options["ORDER"];
    let form = options["FORM"];

    let temp: string = group[0];
    let id = temp.substring(0, temp.indexOf("_"));

    let all_columns: string[];
    if (id == "courses") {
        all_columns = [
            "courses_dept",
            "courses_avg",
            "courses_uuid",
            "courses_title",
            "courses_instructor",
            "courses_fail",
            "courses_audit",
            "courses_pass",
            "courses_year",
            "courses_id",
            "courses_size"
        ];
    }
    else if (id == "rooms") {

        all_columns = [
            "rooms_fullname",
            "rooms_shortname",
            "rooms_name",
            "rooms_number",
            "rooms_address",
            "rooms_lat",
            "rooms_lon",
            "rooms_seats",
            "rooms_furniture",
            "rooms_href",
            "rooms_type"
        ];
    }


    let helper_query = {
        "WHERE": where,
        "OPTIONS": {
            "COLUMNS": all_columns
            ,
            "FORM": "TABLE"
        }
    };

    return new Promise((fulfill, reject) => {
        this_obj.performQuery(helper_query).then(function (response: InsightResponse) {
            // get the groups

            let j_response = JSON.parse(JSON.stringify(response.body));

            let table = j_response["result"];

            if (table.length < 1) {
                return fulfill(response);
            }
            for (let tuple of table) {

                let group_id_value: string = "";
                for (let group_key of group) {
                    group_id_value += tuple[group_key] + "_";
                }
                tuple["group_id"] = group_id_value;
            }

            table.sort((a: any, b: any) => {
                return local_compare_single(a["group_id"], b["group_id"]);
            });


            let prev_group_name = table[0]["group_id"];
            let groups: {[index: string]: any} = {};
            groups[prev_group_name] = [];

            for (let i = 0; i < table.length; i++) {
                let group_name = table[i]["group_id"];
                if (prev_group_name == group_name) {
                    groups[prev_group_name].push(table[i]);
                }
                else {
                    prev_group_name = group_name;
                    groups[prev_group_name] = [];
                    groups[prev_group_name].push(table[i]);
                }
            }

            let group_keys = Object.keys(groups);

            let final_groups = [];

            for (let key of group_keys) {

                let group = groups[key];
                let result_list = [];
                let final_group_obj: {[index: string]: any} = {};

                final_group_obj["group_id"] = key;


                for (let item of apply) {

                    let item_key = Object.keys(item)[0];  //ie maxSeats
                    let function_use = Object.keys(item[item_key])[0]; // "MAX"
                    let function_target = item[item_key][function_use]; //"rooms_seats"

                    let result;

                    switch (function_use) {
                        case "MAX":

                            //groups[group_keys[0]]   [{...}, {...}, {...} ]  same as  groups[key]  = group
                            // groups[group_keys[0]][0]    {....}   group[0]
                            // group[group_keys[0]][0] [function_target]  group[0][function_target] a specific value

                            if (typeof group[0][function_target] != "number") {
                                throw Error("Invalid type 1440");
                            }

                            let max = group[0][function_target];

                            for (let obj of group) {
                                if (obj[function_target] > max) {
                                    max = obj[function_target];
                                }
                            }

                            result = max;
                            break;
                        case "MIN":

                            if (typeof group[0][function_target] != "number") {
                                throw Error("Invalid type 1440");
                            }

                            let min = group[0][function_target];

                            for (let obj of group) {
                                if (obj[function_target] < min) {
                                    min = obj[function_target];
                                }
                            }
                            result = min;
                            break;
                        case "AVG":
                            let sum = 0;
                            result = 0;
                            if (typeof group[0][function_target] != "number") {
                                throw Error("Invalid type 1440");
                            }

                            let counter = 0;

                            for (let obj of group) {
                                let temp = (obj[function_target] * 10);
                                temp = Number(temp.toFixed(0));
                                sum += temp;
                                counter++;
                            }

                            result = sum / counter / 10;
                            result = Number(result.toFixed(2));

                            break;
                        case"COUNT":

                            result = 0;
                            let temp = group;
                            if (temp.length > 0) {

                                temp.sort((a: any, b: any) => {
                                    return local_compare_single(a[function_target], b[function_target]);
                                });


                                let prev_val = temp[0][function_target];
                                result = 1;
                                for (let obj of temp) {
                                    if (obj[function_target] != prev_val) {
                                        result++;
                                        prev_val = obj[function_target];
                                    }
                                }

                            }
                            else {
                                console.log("empty list 1501,count =0");
                            }

                            break;
                        case"SUM":
                            result = 0;
                            if (typeof group[0][function_target] != "number") {
                                throw Error("Invalid type 1440");
                            }

                            for (let obj of group) {
                                result += obj[function_target];
                            }

                            break;
                        default:
                            throw Error("invalid function to use 1447");
                    }

                    result_list.push(result);
                    final_group_obj[item_key] = result;

                }


                let temp_group = transformation["GROUP"];

                for (let item of temp_group) {
                    final_group_obj[item] = group[0][item];
                }
                final_groups.push(final_group_obj);

            }


            if (!isUndefined(order)) {

                if (typeof order == "object") {
                    let dir = order["dir"];
                    let keys = order["keys"];

                    if (dir == "UP") {
                        final_groups.sort((a: any, b: any) => {
                            return local_compare(a, b, keys);
                        });

                    }
                    else if (dir == "DOWN") {

                        final_groups.sort((a: any, b: any) => {
                            return -1 * local_compare(a, b, keys);
                        });

                    }
                    else {
                        throw Error("invalid direction line 903");
                    }
                }
                else {

                    final_groups.sort((a: any, b: any) => {
                        return local_compare_single(a[order], b[order]);
                    });


                }
            }

            let ret_list = [];
            for (let group of final_groups) {
                let ret_obj: {[index: string]: any} = {};

                for (let column of columns) {
                    ret_obj[column] = group[column];
                }
                ret_list.push(ret_obj);
            }


            let ret_obj = {render: form, result: ret_list};
            fulfill({code: 200, body: ret_obj});
        }).catch(function (err) {
            reject({code: 400, body: {"error": "error in perform_query_transform 1647"}});
        });

    });


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
