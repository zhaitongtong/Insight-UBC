import {default as QueryController, QueryRequest} from "../src/controller/QueryController";
import InsightFacade from "../src/controller/InsightFacade";
import {InsightResponse} from "../src/controller/IInsightFacade";
var zipFileContents : string = null;
var facade: InsightFacade = null;
import {Datasets} from "../src/controller/DatasetController"
import chai = require('chai');
import {expect} from 'chai';
import Log from "../src/Util";
import {QueryResponce} from "../src/controller/QueryController";

describe("QueryCotroller", function () {
    this.timeout(30000);

    let fs = require('fs');
    console.log("Mytest begins")

    before(function () {
        Log.info('InsightController::before() - start');
        zipFileContents = new Buffer(fs.readFileSync('courses.zip')).toString('base64');
        try {
            fs.unlinkSync('./id.json');
        } catch (err) {
            Log.warn('InsightController::before() - id.json not removed (probably not present)');
        }
        Log.info('InsightController::before() - done');
    });

    beforeEach(function () {
        facade = new InsightFacade();
    });


    it("Simple query", function () {
        let myQ: QueryRequest = {
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
        };
        let dataset: Datasets = {};
        let controller = new QueryController(dataset);
        let isValid = controller.isValid(myQ);
        expect(isValid).to.equal(true);
    });

    it("Honeycomb: Empty columns result in invalid query 400", function () {
        let myQ: QueryRequest = {
            "WHERE":{
                "GT":{
                    "courses_avg":97
                }
            },
            "OPTIONS":{
                "COLUMNS":[],
                "ORDER":"courses_avg"
            }
        };
        let dataset: Datasets = {};
        let controller = new QueryController(dataset);
        let isValid = controller.isValid(myQ);
        expect(isValid).to.equal(false);
    });
})