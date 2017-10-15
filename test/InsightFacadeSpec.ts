import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import {QueryRequest} from "../src/controller/InsightFacade";

var fs = require('fs');
var JSZip = require('jszip');

describe("InsightFacade", function () {
    this.timeout(30000);
    var zipFileContents: string = null;
    var facade: InsightFacade = null;
    before(function () {
        Log.info('InsightController::before() - start');
        // this zip might be in a different spot for you
        zipFileContents = new Buffer(fs.readFileSync('courses.zip')).toString('base64');
        try {
            // what you delete here is going to depend on your impl, just make sure
            // all of your temporary files and directories are deleted
            fs.unlinkSync('./src/courses.json');
        } catch (err) {
            // silently fail, but don't crash; this is fine
            Log.warn('InsightController::before() - id.json not removed (probably not present)');
        }
        Log.info('InsightController::before() - done');
    });

    beforeEach(function () {
        facade = new InsightFacade();
    });

    //Test for addDataset

    it("Should be able to add a new courses dataset (204)", function () {
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

    it("Should able to remove a dataset (204)", function () {
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    })

    it("Should not able to remove a dataset (404)", function () {
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect.fail;
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(404);
        });
    })

    //Test for perform Q
    function checkResults(first: Array<any>, second: Array<any>): void {
        if(first.length !== second.length) {
            expect.fail();
        }
        expect(first).to.deep.include.members(second);
    }

    it ("Should be able to respond to query7 (200)", function() {
        var that = this;
        let query: QueryRequest = {
            "WHERE":{
                "OR":[
                    {
                        "AND":[
                            {
                                "GT":{
                                    "courses_avg":90
                                }
                            },
                            {
                                "IS":{
                                    "courses_dept":"adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ":{
                            "courses_avg":95
                        }
                    }
                ]
            },
            "OPTIONS":{
                "COLUMNS":[
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER":"courses_avg"
            }
        };
        var correct = {
            result:
                [ { courses_dept: 'adhe', courses_id: '329', courses_avg: 90.02 },
                    { courses_dept: 'adhe', courses_id: '412', courses_avg: 90.16 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.17 },
                    { courses_dept: 'adhe', courses_id: '412', courses_avg: 90.18 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.5 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.72 },
                    { courses_dept: 'adhe', courses_id: '329', courses_avg: 90.82 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 90.85 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.29 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.33 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.33 },
                    { courses_dept: 'adhe', courses_id: '330', courses_avg: 91.48 },
                    { courses_dept: 'adhe', courses_id: '329', courses_avg: 92.54 },
                    { courses_dept: 'adhe', courses_id: '329', courses_avg: 93.33 },
                    { courses_dept: 'rhsc', courses_id: '501', courses_avg: 95 },
                    { courses_dept: 'bmeg', courses_id: '597', courses_avg: 95 },
                    { courses_dept: 'bmeg', courses_id: '597', courses_avg: 95 },
                    { courses_dept: 'cnps', courses_id: '535', courses_avg: 95 },
                    { courses_dept: 'cnps', courses_id: '535', courses_avg: 95 },
                    { courses_dept: 'cpsc', courses_id: '589', courses_avg: 95 },
                    { courses_dept: 'cpsc', courses_id: '589', courses_avg: 95 },
                    { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'crwr', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'sowk', courses_id: '570', courses_avg: 95 },
                    { courses_dept: 'econ', courses_id: '516', courses_avg: 95 },
                    { courses_dept: 'edcp', courses_id: '473', courses_avg: 95 },
                    { courses_dept: 'edcp', courses_id: '473', courses_avg: 95 },
                    { courses_dept: 'epse', courses_id: '606', courses_avg: 95 },
                    { courses_dept: 'epse', courses_id: '682', courses_avg: 95 },
                    { courses_dept: 'epse', courses_id: '682', courses_avg: 95 },
                    { courses_dept: 'kin', courses_id: '499', courses_avg: 95 },
                    { courses_dept: 'kin', courses_id: '500', courses_avg: 95 },
                    { courses_dept: 'kin', courses_id: '500', courses_avg: 95 },
                    { courses_dept: 'math', courses_id: '532', courses_avg: 95 },
                    { courses_dept: 'math', courses_id: '532', courses_avg: 95 },
                    { courses_dept: 'mtrl', courses_id: '564', courses_avg: 95 },
                    { courses_dept: 'mtrl', courses_id: '564', courses_avg: 95 },
                    { courses_dept: 'mtrl', courses_id: '599', courses_avg: 95 },
                    { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                    { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                    { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                    { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                    { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                    { courses_dept: 'musc', courses_id: '553', courses_avg: 95 },
                    { courses_dept: 'nurs', courses_id: '424', courses_avg: 95 },
                    { courses_dept: 'nurs', courses_id: '424', courses_avg: 95 },
                    { courses_dept: 'obst', courses_id: '549', courses_avg: 95 },
                    { courses_dept: 'psyc', courses_id: '501', courses_avg: 95 },
                    { courses_dept: 'psyc', courses_id: '501', courses_avg: 95 },
                    { courses_dept: 'econ', courses_id: '516', courses_avg: 95 },
                    { courses_dept: 'adhe', courses_id: '329', courses_avg: 96.11 } ] };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.body).to.deep.equal(correct);
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            Log.trace("reponse code is " + response.code);
            expect.fail('Should not happen');
        });
    });
})