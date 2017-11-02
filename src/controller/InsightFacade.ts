/**
 * This is the main programmatic entry point for the project.
 */

import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";

// my import
let fs = require('fs');
let JSZip = require('jszip');
import {error, isBoolean, isUndefined} from "util";
import {isNumber} from "util";
import {isString} from "util";
import parse5 = require('parse5');

/*
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
};*/

interface Datasets {
    [id: string]: {};
}

//var datasets: Datasets = {};

export default class InsightFacade implements IInsightFacade {

    private datasets: Datasets = {};

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
    public addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            try {
                if (id === "courses") {
                    this.process(id, content).then(function () {
                        if (this.getDataset(id) == null || this.getDataset(id) == {}) {
                            fulfill({code: 204, body: {}});
                        } else {
                            fulfill({code: 201, body: {}});
                        }
                    }).catch(function (err:Error) {
                        //reject({code: 400, body: {error: "error in process"}});
                        reject({code: 400, error: 'error in process courses.zip'});
                    })
                }
                if (id === "rooms"){
                    this.processForRooms(id, content).then(function () {
                        if (this.getDataset(id) == null || this.getDataset(id) == {}) {
                            //fulfill({code: 204, body: 'the operation was successful and the id already existed'});
                            fulfill({code: 204, body: {}});
                        } else {
                            //fulfill({code: 201, body: 'the operation was successful and the id already existed'})
                            fulfill({code: 201, body: {}});
                        }
                    }).catch(function (err:Error) {
                        reject({code: 400, body: {error: "error in process"}});
                        //reject({code: 400, error: 'error in process rooms.zip'});
                    })
                }
            } catch (err) {
                //reject({code: 400, body: {error:"error in addDataset"}});
                reject({code: 400, error: 'error in addDataset'});
            }
        });
    };

    /**
     * Remove a dataset from UBCInsight.
     *
     * @param id  The id of the dataset to remove.
     *
     * */
    public removeDataset(id: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            try {
                this.deleteIt(id).then(function (result:any) {
                    fulfill({code: 204, body: {}});
                }).catch(function (err: Error) {
                    reject({code: 404, error: 'dataset not found'});
                });
            } catch (err) {
                reject({code: 404, error: 'dataset not found'});
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
    public performQuery(query: any): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            try{
                if(this.isValid(query)){
                    if(this.getDataset(this.datasetValid(query))=== undefined || this.getDataset(this.datasetValid(query)) === null){
                        //return fulfill({code:424, body :{}});
                        reject({code: 424, error: 'missing id'});
                    }else{
                        let where = query["WHERE"];
                        let options = query["OPTIONS"];
                        let columns = options["COLUMNS"];

                        let data: any
                        if(this.datasetValid(query)=== "courses"){
                            data = this.datasets["courses"];
                        }else if(this.datasetValid(query)=== "rooms"){
                            data = this.datasets["rooms"];
                        }

                        let result1: any = [];
                        for (let subData of data) {
                            if (this.courseIn(subData, where))
                                result1.push(subData);
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
                    }
                }else{
                    reject({code:400, error :'invalid query'});
                }
            }catch (err) {
                reject({code:400, error: 'error in performQuery'});
            }
        });
    }

    /*
    Helper methods.
     */

    private process(id: string, data: any): Promise<boolean> {
        return new Promise(function (fulfill, reject) {
            try {
                let myZip = new JSZip();
                myZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {

                    var processedDataset = new Array();
                    var allMyPromises  = new Array();
                    var coursename:any;

                    zip.forEach(function(relativePath: string, file: JSZipObject) {
                        if (!file.dir) {
                            if (file.name.indexOf("course") == -1) {
                                throw Error;
                            }
                            var p = file.async("string");
                            allMyPromises.push(p);
                            coursename = file.name.substring(8);
                        }
                    });

                    Promise.all(allMyPromises).then( function(filesString) {
                        filesString.forEach(function(data : any) {

                            var obj = JSON.parse(data);
                            obj.result.forEach(function(res :any) {
                                var course :any = new Object();
                                course['courses_dept'] = res['Subject'];
                                course['courses_id'] = res['Course'];
                                course['courses_avg'] = res['Avg'];
                                course['courses_instructor'] = res['Professor'];
                                course['courses_title'] = res['Title'];
                                course['courses_pass'] = res['Pass'];
                                course['courses_fail'] = res['Fail'];
                                course['courses_audit'] = res['Audit'];
                                course['courses_uuid'] = res['id'].toString();
                                if (res['Section'] === "overall") {
                                    course['courses_year'] = 1900;
                                } else {
                                    course['courses_year'] = Number(res['Year']);
                                }
                                processedDataset.push(course);
                            })
                        });
                        this.save(id, processedDataset);
                        fulfill(true);
                    }).catch(function(reason:any) {
                        reject(reason);
                    });
                }).catch(function (err:any) {
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    private processForRooms(id: string, data: any): Promise<boolean> {
        return new Promise(function (fulfill, reject) {
            try {
                let myZip = new JSZip();
                myZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {
                    var processedDataset :any = new Array();
                    var allMyPromises  = new Array();
                    var allMyPromises2  = new Array();
                    zip.forEach(function(relativePath: string, file: JSZipObject) {
                        if (file.name.indexOf("index.htm") !== -1) {
                            var p = file.async("string");
                            allMyPromises.push(p);
                            return;
                        }

                        if (!file.dir && file.name.indexOf("DS_Store")== -1 ) {
                            if (file.name.indexOf("rooms") == -1) {
                                throw Error;
                            }
                            var p = file.async("string");
                            allMyPromises.push(p);
                        }
                    });

                    Promise.all(allMyPromises).then( function(filesString) {
                        var index :string = filesString[76];
                        var usefulIndex :string = index.substring(index.indexOf('<div class="view-content">'), index.indexOf('</table>')+20);
                        let adapter: any = parse5.treeAdapters.default;
                        let indexDocument: any = parse5.parse(usefulIndex);
                        var tempIndex :any = adapter.getFirstChild(indexDocument);
                        var tempIndex2 :any = adapter.getChildNodes(tempIndex);
                        var tempIndex3 :any = tempIndex2[1];
                        var tempIndex4 :any = adapter.getFirstChild(tempIndex3);
                        var tempIndex5 :any = adapter.getChildNodes(tempIndex4);
                        var tempIndex6 :any = tempIndex5[1];
                        var tempIndex7 :any = adapter.getChildNodes(tempIndex6);
                        var tempIndex8 :any = tempIndex7[3];
                        var tempIndex9 :any = adapter.getChildNodes(tempIndex8);
                        var validBuildings :any = new Array();
                        for(var i=0; i<tempIndex9.length; ++i) {
                            if ((i%2)!==0) {
                                var temp :any = tempIndex9[i];
                                var temp2 :any = adapter.getChildNodes(temp);
                                var temp3 :any = temp2[5];
                                var temp4 :any = adapter.getChildNodes(temp3);
                                var temp5 :any = temp4[1];
                                var temp6 :any = adapter.getFirstChild(temp5);
                                var name :any = temp6["value"];
                                validBuildings.push(name);
                            }
                        }

                        var tempRoom :any ;
                        var tempRoom2 :any;
                        var tempRoom3 :any ;
                        var number :any;
                        var seats :any ;
                        var furniture :any ;
                        var type :any;

                        filesString.forEach(function(data : any) {
                            if (data !== filesString[76]) {
                                var usefulData: string = data.substring(data.indexOf('<div id="buildings-wrapper">'), data.indexOf('<div id="building-image">'));
                                let document: any = parse5.parse(usefulData);
                                var childNodes: any = adapter.getFirstChild(document);
                                var tempName: any = adapter.getChildNodes(childNodes);
                                tempName = tempName[1];
                                tempName = adapter.getFirstChild(tempName);
                                tempName = adapter.getChildNodes(tempName);
                                tempName = tempName[1];
                                var tempName2: any = adapter.getChildNodes(tempName);
                                tempName = tempName2[1];
                                tempName = adapter.getFirstChild(tempName);
                                tempName = adapter.getFirstChild(tempName);
                                var fullName: any = tempName["value"];
                                var lat :any;
                                var lon :any;

                                for (var i = 0; i < validBuildings.length; ++i) {
                                    if (fullName.indexOf(validBuildings[i]) !== -1) {
                                        var p = new Promise(function (fulfill :any, reject :any) {
                                            tempName = tempName2[3];
                                            tempName = adapter.getFirstChild(tempName);
                                            tempName = adapter.getFirstChild(tempName);
                                            var address: any = tempName["value"];
                                            var tempAddress :any = address;

                                            if (data.indexOf('buildingID=') !== -1) {
                                                var shortName: any = data.substring(data.indexOf('buildingID=') + 11, data.indexOf('"', data.indexOf('buildingID=') + 11));
                                            } else {
                                                var shortName: any = data.substring(data.indexOf('http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/') + 69, data.indexOf('-', data.indexOf('http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/') + 69));
                                            }
                                            var urlAddress :any = encodeURI(tempAddress);
                                            var restify = require('restify');
                                            var client = restify.createJsonClient({
                                                url: 'http://skaha.cs.ubc.ca:11316/api/v1/team7/'+urlAddress,
                                                version: '*'
                                            });

                                            client.get('', function(err :any, req :any, res :any, obj :any) {
                                                if (obj["lat"] !== undefined) {
                                                    lat = obj["lat"];
                                                    lon = obj["lon"];
                                                    fulfill(true);
                                                } else {
                                                    fulfill(false);
                                                }
                                            });
                                        }).then(function (value) {
                                            if (data.indexOf('<td class="views-field views-field-field-room-number" >') !== -1) {

                                                tempName = tempName2[3];
                                                tempName = adapter.getFirstChild(tempName);
                                                tempName = adapter.getFirstChild(tempName);
                                                var address: any = tempName["value"];
                                                if (data.indexOf('buildingID=') !== -1) {
                                                    var shortName: any = data.substring(data.indexOf('buildingID=') + 11, data.indexOf('"', data.indexOf('buildingID=') + 11));
                                                } else {
                                                    var shortName: any = data.substring(data.indexOf('http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/') + 69, data.indexOf('-', data.indexOf('http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/') + 69));
                                                }
                                                var roomsData: string = data.substring(data.lastIndexOf('<div class="view-content">'), data.indexOf('</table>') + 20);
                                                let roomDocument: any = parse5.parse(roomsData);
                                                //make a room for each object that has a child node
                                                tempRoom = adapter.getFirstChild(roomDocument);
                                                tempRoom = adapter.getChildNodes(tempRoom);
                                                tempRoom = tempRoom[1];
                                                tempRoom = adapter.getFirstChild(tempRoom);
                                                tempRoom = adapter.getChildNodes(tempRoom);
                                                tempRoom = tempRoom[1];
                                                tempRoom = adapter.getChildNodes(tempRoom);
                                                tempRoom = tempRoom[3];
                                                tempRoom = adapter.getChildNodes(tempRoom);
                                                for (var i = 0; i < tempRoom.length; ++i) {
                                                    if ((i % 2) !== 0) {
                                                        tempRoom2 = tempRoom[i];
                                                        tempRoom3 = adapter.getChildNodes(tempRoom2);
                                                        tempRoom2 = tempRoom3[1];
                                                        tempRoom2 = adapter.getChildNodes(tempRoom2);
                                                        tempRoom2 = tempRoom2[1];
                                                        tempRoom2 = adapter.getFirstChild(tempRoom2);
                                                        number = tempRoom2["value"];
                                                        tempRoom2 = tempRoom3[3];
                                                        tempRoom2 = adapter.getFirstChild(tempRoom2);
                                                        seats = tempRoom2["value"];
                                                        seats = seats.substring(2);
                                                        seats = seats.trim();
                                                        tempRoom2 = tempRoom3[5];
                                                        tempRoom2 = adapter.getFirstChild(tempRoom2);
                                                        furniture = tempRoom2["value"];
                                                        furniture = furniture.substring(2);
                                                        furniture = furniture.trim();
                                                        tempRoom2 = tempRoom3[7];
                                                        tempRoom2 = adapter.getFirstChild(tempRoom2);
                                                        type = tempRoom2["value"];
                                                        type = type.substring(2);
                                                        type = type.trim();

                                                        var room: any = new Object();
                                                        room['rooms_fullname'] = fullName;
                                                        room['rooms_shortname'] = shortName;
                                                        room['rooms_number'] = number;
                                                        room['rooms_name'] = room['rooms_shortname'] + "_" + room['rooms_number'];
                                                        room['rooms_address'] = address;
                                                        room['rooms_lat'] = lat;
                                                        room['rooms_lon'] = lon;
                                                        room['rooms_seats'] = Number(seats);
                                                        room['rooms_type'] = type;
                                                        room['rooms_furniture'] = furniture;
                                                        room['rooms_href'] = "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/"+shortName+ "-" + number;
                                                        processedDataset.push(room);
                                                    }
                                                }
                                            }
                                        });
                                        allMyPromises2.push(p);
                                        break;
                                    }
                                }
                            }
                        });
                        Promise.all(allMyPromises2).then( function(room) {
                            this.save(id, processedDataset);
                            fulfill(true);
                        });
                    }).catch(function(reason:any) {
                        reject(reason);
                    });
                }).catch(function (err:any) {
                    reject(err);
                });
            } catch (err) {
                reject(err);
            }
        });

    }

    private getDataset(id: string): any {
        /*
        var inDisk : boolean = fs.existsSync('./data/' + id +'.json');
        if (!inDisk) {
            return null;
        }
        if (this.datasets[id] === undefined || this.datasets[id] === {}) {
            var data = fs.readFileSync("./data/"+id+".json", "utf8");
            this.datasets[id] = JSON.parse(data);
        }*/

        return this.datasets[id];
    }

    private getDatasets(): any {
        /*
        var courses :any = this.datasets["courses"];
        if (courses === undefined) {
            if (fs.existsSync("./data/courses.json")) {
                this.datasets["courses"] = JSON.parse(fs.readFileSync("./data/courses.json", "utf8"));
            }
        }
        var rooms :any = this.datasets["rooms"];
        if (rooms === undefined) {
            if (fs.existsSync("./data/rooms.json")) {
                this.datasets["rooms"] = JSON.parse(fs.readFileSync("./data/rooms.json", "utf8"));
            }
        }*/
        return this.datasets;
    }

    private deleteIt(id: string) {
        return new Promise(function (fulfill, reject) {
            try {
                var fs = require("fs");
                var inDisk : boolean = fs.existsSync('./data/' + id +'.json');

                if (Object.keys(this.datasets).length !== 0) {
                    this.datasets = {};
                }

                if (inDisk) {
                    fs.unlinkSync('./data/' + id +'.json');
                } else {
                    throw Error;
                }
            } catch (err) {
                reject(err);
            }
        });
    }

    private save(id: string, processedDataset: any) {
        var dir = './data';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        fs.writeFile("'./data/" +id+ '.json', JSON.stringify(processedDataset), function (err:any) {
            if (err) {
                Log.trace("Error writing file");
            }
            Log.trace('successfully saved to /data');
        });
        this.datasets[id] = this.getDatasets();
    }

    private datasetValid(query: any): string {
        var ids :any = new Array();
        var where: any = query["WHERE"];
        var top = Object.keys(where)[0];
        for (var i = 0; i < where[top].length; i++) {
            if (where[top][i].indexOf("_") !== -1) {
                var id = where[top][i].substring(0, where[top][i].indexOf("_"));
                ids.push(id);
            }
        }
        return ids[0];
    }

    private isValid(query: any): boolean {
        if (typeof query !== 'undefined' && query !== null && Object.keys(query).length > 0) {

            if (!("WHERE" in query))
                return false;
            let where = query["WHERE"];

            if (!("OPTIONS" in query))
                return false;
            let options = query["OPTIONS"];

            if (!("COLUMNS" in options))
                return false;
            let columns = options["COLUMNS"];
            if (columns.length == 0)
                return false;

            let order: any = null;
            if ("ORDER" in options)
                order = options["ORDER"];

            // only courses_xx keys or only rooms_xx keys, never a combination
            var top = Object.keys(where)[0];    // AND, OR...
            for (var i = 0; i < where[top].length; i++) {   // array of AND
                if (where[top][i].indexOf("_")) {   // one element in the array of AND: "rooms_name": "DMP_*"
                    if ((where[top][i].substring(0, 5) === "rooms")) {
                        for (var j = 0; j < where[top].length; j++) {   // check other elements in the array of AND
                            if (where[top][i].indexOf("_")) {
                                if ((where[top][j].substring(0, 7) === "courses")) {
                                    //throw Error;
                                    return false;
                                }
                            }
                        }
                    }else if ((where[top][i].substring(0, 7) === "courses")){
                        for (var j = 0; j < where[top].length; j++) {
                            if (where[top][i].indexOf("_")) {
                                if ((where[top][j].substring(0, 5) === "rooms")) {
                                    //throw Error;
                                    return false;
                                }
                            }
                        }
                    }
                }
            }


            for (let column of columns) {
                //let value = dictionary[column];
                if (column.substring(0, column.indexOf("_")) != "courses" || column.substring(0, column.indexOf("_")) != "rooms" || isUndefined(column)) {   //isUndefined(value)
                    return false;
                }
            }

            if (!this.check_order(order, columns)) {
                return false;
            }

            if (!this.check_where(where))
                return false;

            return true;

        }else{

            return false;

        }
    }

    private check_order(order: any, columns: any): boolean {
        if (!isUndefined(order)) {
            if (typeof order == "string") {
                let valid = false;
                for (let column of columns) {
                    if (order === column) {
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

    private check_where(where: any): boolean {
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
                    if (!this.check_where(filters[i]))
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
                    if (!this.check_where(filters[i]))
                        return false;
                }
                return true;
            }
            case "LT": {
                let m = where[top];
                let mKey = Object.keys(m)[0];
                let mValue = m[mKey];
                return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit' || mKey === 'courses_year' || mKey === 'rooms_lat' || mKey === 'rooms_lon' || mKey === 'rooms_seats');

            }
            case "GT": {
                let m = where[top];
                let mKey = Object.keys(m)[0];
                let mValue = m[mKey];
                return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit' || mKey === 'courses_year' || mKey === 'rooms_lat' || mKey === 'rooms_lon' || mKey === 'rooms_seats');

            }
            case "EQ": {
                let m = where[top];
                let mKey = Object.keys(m)[0];
                let mValue = m[mKey];
                return isNumber(mValue) && (mKey === 'courses_avg' || mKey === 'courses_pass' || mKey === 'courses_fail' || mKey === 'courses_audit' || mKey === 'courses_year' || mKey === 'rooms_lat' || mKey === 'rooms_lon' || mKey === 'rooms_seats');

            }
            case "IS": {
                let s = where[top];
                let sKey = Object.keys(s)[0];
                let sValue = s[sKey];
                return isString(sValue) && (sKey === 'courses_dept' || sKey === 'courses_id' || sKey === 'courses_instructor' || sKey === 'courses_title' || sKey === 'courses_uuid' || sKey === 'rooms_fullname' || sKey === 'rooms_shortname' || sKey === 'rooms_number' || sKey === 'rooms_name' || sKey === 'rooms_address' || sKey === 'rooms_type'|| sKey === 'rooms_furniture' || sKey === 'rooms_href');
            }
            case "NOT": {
                return this.check_where(where[top]);
            }
            default: {
                return false
            }
        }
    }

    private courseIn(subData: any, where: any): boolean {
        let top = Object.keys(where)[0];

        switch (top) {
            case "AND": {
                let filters = where[top];
                for (let i = 0; i < filters.length; i++) {
                    if (!this.courseIn(subData, filters[i]))
                        return false;
                }
                return true;
            }
            case "OR" : {
                let filters = where[top];
                for (let i = 0; i < filters.length; i++) {
                    if (this.courseIn(subData, filters[i]))
                        return true;
                }
                return false;
            }
            case  "EQ": {
                return subData[Object.keys(where[top])[0]] === where[top][Object.keys(where[top])[0]];
            }
            case "LT": {
                return subData[Object.keys(where[top])[0]] < where[top][Object.keys(where[top])[0]];
            }

            case"GT": {
                return subData[Object.keys(where[top])[0]] > where[top][Object.keys(where[top])[0]];
            }
            case"IS": {
                let scomparison = where[top];
                let s_key = Object.keys(scomparison)[0];
                let s_value: string = scomparison[s_key];
                let c_value: string = subData[s_key];
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
                return !this.courseIn(subData, where[top]);
            }
            default:
                return false;
        }
    }
}