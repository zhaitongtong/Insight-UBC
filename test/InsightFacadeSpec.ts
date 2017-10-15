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
    var zipFileContents1: string = null;
    var sampleQuery1: any;
    var facade: InsightFacade = null;
    before(function () {
        Log.info('InsightController::before() - start');
        // this zip might be in a different spot for you
        zipFileContents = new Buffer(fs.readFileSync('courses.zip')).toString('base64');
        sampleQuery1 = JSON.parse(fs.readFileSync('./test/results/q0.json', 'utf8'));

        try {
            // what you delete here is going to depend on your impl, just make sure
            // all of your temporary files and directories are deleted
            fs.unlinkSync('./data/courses.json');
            fs.unlinkSync('./data/rooms.json');
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

    it("test add courses.zip", function (done) {
        this.timeout(50000)

        var zip = new JSZip();
        var temp_1 = "./src/courses.zip";
        var f = fs.readFileSync(temp_1, {encoding: "base64"});

        var temp = new InsightFacade();

        temp.addDataset("courses", f)
            .then((response) => {
                console.log(response.code);
                //console.log(response.body);
                done();
            })
            .catch((err) => {
                console.log(err.code);
                console.log(err.body)
                done();
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
    function checkResults(first: Array<any>, second: Array<any>): void {
        if(first.length !== second.length) {
            expect.fail();
        }
        expect(first).to.deep.include.members(second);
    }
});
