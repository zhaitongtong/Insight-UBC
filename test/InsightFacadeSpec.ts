import Log from "../src/Util";
import {expect} from 'chai';
import InsightFacade from "../src/controller/InsightFacade";
import {InsightResponse} from "../src/controller/IInsightFacade";
import {QueryResponce} from "../src/controller/QueryController";
import {QueryRequest} from "../src/controller/QueryController";

describe("InsightFacade", function () {
    this.timeout(30000);

    var zipFileContents: string = null;
    var test0: any;
    var test1: any;
    var test2: any;
    var facade: InsightFacade = null;

    var zipFileContents : string = null;
    var facade: InsightFacade = null;

    let fs = require('fs');
    console.log("Mytest begins")

   /* before(function () {
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
    });*/
    var zipFileContents: string = null;
    var facade: InsightFacade = null;
    before(function () {
        Log.info('InsightController::before() - start');

        zipFileContents = new Buffer(fs.readFileSync('courses.zip')).toString('base64');
        try {
            // what you delete here is going to depend on your impl, just make sure
            // all of your temporary files and directories are deleted
            fs.unlinkSync('./data/courses.json');
        } catch (err) {
            // silently fail, but don't crash; this is fine
            Log.warn('InsightController::before() - id.json not removed (probably not present)');
        }
        Log.info('InsightController::before() - done');
    });

    beforeEach(function () {
        facade = new InsightFacade;
    });

    //Test for addDataset

    /*it("Should be able to add a new courses dataset (204)", function () {
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Should be able to update an existing dataset (201)", function () {
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Should not be able to add an invalid dataset (400)", function () {
        return facade.addDataset('courses', 'some random bytes').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    //Test for removeDataset

    it("Should able to remove a dataset (204)", function(){
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    })

    it("Should not able to remove a dataset (404)", function(){
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect.fail;
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(404);
        });
    })

    //Test for perform Q

    it("Courses: Should be able to reload a new dataset (204)", function () {
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });
*/
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
            }
        ;
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });

    });



});
