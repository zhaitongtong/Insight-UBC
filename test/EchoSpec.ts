/**
 * Created by rtholmes on 2016-10-31.
 */

import chai = require('chai');
import chaiHttp = require('chai-http');
import Response = ChaiHttp.Response;
import restify = require('restify');

import Server from "../src/rest/Server";
import {expect} from 'chai';
import Log from "../src/Util";
import {InsightResponse} from "../src/controller/IInsightFacade";

let fs = require('fs');
let URL = "http://127.0.0.1:4321";

describe("EchoSpec", function () {


    function sanityCheck(response: InsightResponse) {
        expect(response).to.have.property('code');
        expect(response).to.have.property('body');
        expect(response.code).to.be.a('number');
    }

    before(function () {
        Log.test('Before: ' + (<any>this).test.parent.title);
    });

    beforeEach(function () {
        Log.test('BeforeTest: ' + (<any>this).currentTest.title);
    });

    after(function () {
        Log.test('After: ' + (<any>this).test.parent.title);
    });

    afterEach(function () {
        Log.test('AfterTest: ' + (<any>this).currentTest.title);
    });

    it("Test Server", function () {

        // Init
        chai.use(chaiHttp);
        let server = new Server(4321);
        //let URL = "http://127.0.0.1:4321";

        // Test
        expect(server).to.not.equal(undefined);
        try {
            Server.echo((<restify.Request>{}), null, null);
            expect.fail()
        } catch (err) {
            expect(err.message).to.equal("Cannot read property 'json' of null");
        }

        return server.start().then(function (success: boolean) {
            return chai.request(URL)
                .get("/")
        }).catch(function (err) {
            expect.fail()
        }).then(function (res: Response) {
            expect(res.status).to.be.equal(200);
            return chai.request(URL)
                .get("/echo/Hello")
        }).catch(function (err) {
            expect.fail()
        }).then(function (res: Response) {
            expect(res.status).to.be.equal(200);
            return server.start()
        }).then(function (success: boolean) {
            expect.fail();
        }).catch(function (err) {
            expect(err.code).to.equal('EADDRINUSE');
            return server.stop();
        }).catch(function (err) {
            expect.fail();
        });
    });

    it("Should be able to echo", function () {
        let out = Server.performEcho('echo');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: 'echo...echo'});
    });

    it("Should be able to echo silence", function () {
        let out = Server.performEcho('');
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(200);
        expect(out.body).to.deep.equal({message: '...'});
    });

    it("Should be able to handle a missing echo message sensibly", function () {
        let out = Server.performEcho(undefined);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("Should be able to handle a null echo message sensibly", function () {
        let out = Server.performEcho(null);
        Log.test(JSON.stringify(out));
        sanityCheck(out);
        expect(out.code).to.equal(400);
        expect(out.body).to.have.property('error');
        expect(out.body).to.deep.equal({error: 'Message not provided'});
    });

    it("PUT should fail", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .put('/dataset/rooms')
            .attach("body", fs.readFileSync("./data/roomsfake.zip"), "./data/roomsfake.zip")
            .then(function (responce: Response) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err).to.have.status(400);
            });
    });

    it("POST should fail", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .post('/query')
            .send({
                "WHERE": {
                    "IS": {
                        "rooms_name": "DMP_*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_name"
                    ]
                }
            })
            .then(function (responce: Response) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err).to.have.status(400);
            });
    });

    it("PUT description for rooms", function () {
        return chai.request('http://localhost:4321')
            .put('/dataset/rooms')
            .attach("body", fs.readFileSync("./data/rooms.zip"), "rooms.zip")
            .then(function (responce: Response) {
                expect(responce).to.have.status(204);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("PUT description for courses", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .put('/dataset/courses')
            .attach("body", fs.readFileSync( ".data/courses.zip"), "courses.zip")
            .then(function (responce: Response) {
                expect(responce).to.have.status(204);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("POST description for rooms", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .post('/query')
            .send({
                "WHERE": {
                    "IS": {
                        "rooms_name": "DMP_*"
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_name"
                    ],
                    "ORDER": "rooms_name"
                }
            })
            .then(function (responce: Response) {
                expect(responce).to.have.status(200);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("POST description for courses", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .post('/query')
            .send({
                "WHERE": {
                    "GT": {
                        "courses_avg": 97
                    }
                },
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER": "courses_avg"
                }
            })
            .then(function (responce: Response) {
                expect(responce).to.have.status(200);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("POST description for rooms should fail", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .post('/query')
            .send({
                "WHERE":"",
                "OPTIONS": {
                    "COLUMNS": [
                        "rooms_name"
                    ],
                    "ORDER": "rooms_name"
                }
            })
            .then(function (responce: Response) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err).to.have.status(400);
            });
    });

    it("POST description for courses should fail", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .post('/query')
            .send({
                "WHERE": "",
                "OPTIONS": {
                    "COLUMNS": [
                        "courses_dept",
                        "courses_avg"
                    ],
                    "ORDER": "courses_avg"
                }
            })
            .then(function (responce: Response) {
                expect.fail();
            })
            .catch(function (err: any) {
                expect(err).to.have.status(400);
            });
    });

    it("DELETE description for rooms", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .del('/dataset/rooms')
            .then(function (responce: Response) {
                expect(responce).to.have.status(204);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });

    it("DELETE description for courses", function () {
        //return chai.request('http://localhost:4321')
        return chai.request(URL)
            .del('/dataset/courses')
            .then(function (responce: Response) {
                expect(responce).to.have.status(204);
            })
            .catch(function (err: any) {
                expect.fail();
            });
    });
});
