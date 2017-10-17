import Log from "../src/Util";
import {expect} from 'chai';
import InsightFacade from "../src/controller/InsightFacade";
import {InsightResponse} from "../src/controller/IInsightFacade";
//import {QueryResponce} from "../src/controller/QueryController";
//import {QueryRequest} from "../src/controller/QueryController";

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

    before(function () {
        Log.info('InsightController::before() - start');
        zipFileContents = new Buffer(fs.readFileSync('./data/courses.zip')).toString('base64');
        /*try {
            fs.unlinkSync('./id.json');
        } catch (err) {
            Log.warn('InsightController::before() - id.json not removed (probably not present)');
        }*/
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

    it("Should be able to add a new courses dataset (201 or 204)", function () {
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204||204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Simple query", function () {

        let myQ = {
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
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            console.log(result.length); // 49
            console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });

    });

    it("Complex query", function () {

        let myQ = {
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
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            console.log(result.length); // 56
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });

    });

    it("Deepmind: Should be able to find sections in a dept with average between 70 and 80", function () {

        let myQ = {
            "WHERE":{
                "AND":[
                    {
                        "GT":{
                            "courses_avg":70
                        }
                    },
                    {
                        "LT":{
                            "courses_avg":80
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
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            console.log(result.length); // 64612?
            console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });

    });

    it("Invalid", function () {

        let myQ = {};
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail;
            let result: any = response.body;
            console.log(result.length); // 49
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            //console.log(response.code)
            expect(response.code).to.equal(400);
        });

    });

 /*   it("NOT All courses", function () {

        let myQ = {
            "WHERE":{
                "OR":[
                    {
                        "NOT":{
                            "courses_avg":65
                        }
                    },
                    {
                        "LT":{
                            "courses_avg":75
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
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            console.log(result.length); // 64612?
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });

    });*/


    it("Should be able to query a complex valid query", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE":{"OR":[{"AND":[{"GT":{"courses_avg":90}},{"IS":{"courses_dept":"adhe"}}]},{"EQ":{"courses_avg":95}}]},
            "OPTIONS":{"COLUMNS":["courses_dept","courses_id","courses_avg"],"ORDER":"courses_avg"}
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });
    /*
        it("Should not be able to query when there is no query or query is undefined.", function () {
            //this.timeout(100000);
            let query: any = {};
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail('Should not happen');
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

        it("Should not be able to query when COLUMNS is empty.", function (done) {
            //this.timeout(100000);
            let query: any = {
                "WHERE": {"AND": [{"GT": {}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"courses_dept": "cpsc"}}]},
                "OPTIONS": {"COLUMNS": [],"ORDER": "courses_avg"}
            };
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        })

        it("Should not be able to query when key is invalid.", function () {
            //this.timeout(10000);
            let query: any = {
                "WHERE":{"OR":[{"AND":[{"GT":{"courses_avg":90}},{"IS":{"courses_dept":"adhe"}}]},{"EQ":{"courses_avg":95}}]},
                "OPTIONS":{"COLUMNS":["courses_dept","courses_id","courses_avg"],"ORDER":"courses_size"}
            };
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        });

        it("Should not be able to query when order is invalid.", function (done) {
            //this.timeout(100000);
            let query: any = {
                "WHERE":{"OR":[{"AND":[{"GT":{"courses_avg":90}},{"IS":{"courses_dept":"adhe"}}]},{"EQ":{"courses_avg":95}}]},
                "OPTIONS":{"COLUMNS":["courses_dept","courses_id","courses_avg"],"ORDER": {"courses_size": "courses_avg"},}
            };
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        })

        it("Should not be able to query when the logic comparison fails.", function (done) {
            //this.timeout(100000);
            let query: any = {
                "WHERE": {"AND": [{"GT": {"courss_avg": "90"}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"courses_dept": "cpsc"}}]},
                "OPTIONS": {"COLUMNS": ["courses_dept","courses_avg","courses_uuid"],"ORDER": "courses_avg"}
            };
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(424);
            });
        })

        it("Should not be able to query when the logic comparison fails.", function (done) {
            //this.timeout(100000);
            let query: any = {
                "WHERE": {"OR":[{"NOT":{"AND": [{"GT": {"courses_avg": "90"}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"course_dept": "cpsc"}}, {
                    "AND": [{"GT": {"courses_avg": 20}}]}]}},{"IS": {"courses_uuid": "129*"}}]},
                "OPTIONS": {"COLUMNS": ["courses_dept","courses_avg","courses_uuid"],"ORDER": "courses_avg"}
            };
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(424);
            });
        })

        it("Should not be able to query when GT is empty.", function (done) {
            //this.timeout(100000);
            let query: any = {
                "WHERE": {"AND": [{"GT": {}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"courses_dept": "cpsc"}}]},
                "OPTIONS": {"COLUMNS": ["courses_dept","courses_avg","courses_uuid"],"ORDER": "courses_avg"}
            };
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(400);
            });
        })

        it("Should not be able to query when EQ is empty.", function (done) {
            //this.timeout(100000);
            let query: any = {
                "WHERE": {"AND": [{"GT": {}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"courses_dept": "cpsc"}}]},
                "OPTIONS": {"COLUMNS": ["courses_dept","courses_avg","courses_uuid"],"ORDER": "courses_avg"}
            };
            return facade.performQuery(query).then(function (response: InsightResponse) {
                expect.fail();
            }).catch(function (response: InsightResponse) {
                expect(response.code).to.equal(424);
            });
        })*/

});
