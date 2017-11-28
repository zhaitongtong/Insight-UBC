import Log from "../src/Util";
import {expect} from 'chai';
import InsightFacade from "../src/controller/InsightFacade";
import {InsightResponse} from "../src/controller/IInsightFacade";

describe("InsightFacade", function () {
    this.timeout(8000);

    var zipFileContents: string = null;
    var zipRoomContents: string = null;
    var zipRoomfakeContents: string = null;
    var facade: InsightFacade = null;

    let fs = require('fs');
    console.log("Mytest begins")

    before(function () {
        Log.info('InsightController::before() - start');
        zipFileContents = new Buffer(fs.readFileSync('./data/courses.zip')).toString('base64');
        zipRoomContents = new Buffer(fs.readFileSync('./data/rooms.zip')).toString('base64');
        zipRoomfakeContents = new Buffer(fs.readFileSync('./data/roomsfake.zip')).toString('base64');
        /*try {
            fs.unlinkSync('./id.json');
        } catch (err) {
            Log.warn('InsightController::before() - id.json not removed (probably not present)');
        }*/
        Log.info('InsightController::before() - done');
    });

    /*beforeEach(function () {
        facade = new InsightFacade();
    });*/

    //Test for addDataset
    facade = new InsightFacade();

    it("Should be able to add a new courses dataset (204)", function () {
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to add a new rooms dataset (204)", function () {
        return facade.addDataset('rooms', zipRoomContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should not be able to add an dataset with wrong id (400)", function () {
        return facade.addDataset('ubc', zipFileContents).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to add a courses dataset when id is rooms (NOT PASS 400)", function () {
        return facade.addDataset('rooms', zipFileContents).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
            //console.log(response)
        });
    });

    it("Should not be able to add a rooms dataset when id is courses (400)", function () {
        return facade.addDataset('courses', zipRoomContents).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
            //console.log(response)
        });
    });

    it("Should not be able to add an room zip without html (NOT PASS 400)", function () {
        return facade.addDataset('rooms', zipRoomfakeContents).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
            //console.log(response)
        });
    });

    it("Should be able to update an existing courses dataset (201)", function () {
        facade.addDataset('courses', zipFileContents);
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
            //log.trace(response)
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to update an existing rooms dataset (201)", function () {
        facade.addDataset('rooms', zipRoomContents)
        return facade.addDataset('rooms', zipRoomContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail();
            //console.log(response)
        });
    });

    it("Should not be able to add an invalid dataset (400)", function () {
        return facade.addDataset('courses', 'some random bytes').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
            //console.log(response)
        });
    });

    it("Should be able to remove a courses dataset (204)", function () {
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
            //console.log(response.code)
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to remove a rooms dataset (204)", function () {
        return facade.removeDataset('rooms').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
            //console.log(response.code)
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should not be able to remove a courses dataset (404)", function () {
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(404);
        });
    });

    it("Should not be able to remove a rooms dataset (404)", function () {
        return facade.removeDataset('rooms').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(404);
        });
    });

    it("Should not be able to remove a dataset with wrong id (404)", function () {
        return facade.removeDataset('ubc').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(404);
        });
    });

    it("Should not be able to add an invalid rooms dataset (400)", function () {
        return facade.addDataset('rooms', 'some random bytes').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
            //console.log(response)
        });
    });

    it("Should be able to add a new courses dataset again (204)", function () {
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to add a new rooms dataset again (204)", function () {
        //facade.addDataset('rooms', zipRoomContents);
        return facade.addDataset('rooms', zipRoomContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should not be able to perform a invalid query", function () {
        let myQ = {
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
                "ORDER": ["courses_avg",
                    "courses_dept"]
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });

    });

    it("Should not be able to perform a key that does not exist", function () {
        let myQ = {
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
                "ORDER": {
                    "dir": "UP",
                    "keys": ["maxSeats"]
                }
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to perform a dir that does not exist", function () {
        let myQ = {
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
                "ORDER": {
                    "dir": "MID",
                    "keys": ["maxSeats"]
                }
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it("Should not be able to perform a dir that is empty", function () {
        let myQ = {
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
                "ORDER": {
                    "dir": "",
                    "keys": ["maxSeats"]
                }
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should be able to perform simple query 1", function () {
        let myQ = {
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
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 2", function () {
        let myQ = {
            "WHERE": {
                "EQ": {
                    "courses_year": 2015
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_year"
                ],
                "ORDER": "courses_avg"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 3", function () {
        let myQ = {
            "WHERE": {
                "GT": {
                    "courses_year": 2015
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_year"
                ],
                "ORDER": "courses_avg"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 4", function () {
        let myQ = {
            "WHERE": {
                "LT": {
                    "courses_year": 2015
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg",
                    "courses_year"
                ],
                "ORDER": "courses_avg"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 5", function () {
        let myQ = {
            "WHERE": {
                "OR": [
                    {
                        "AND": [
                            {
                                "GT": {
                                    "courses_avg": 90
                                }
                            },
                            {
                                "IS": {
                                    "courses_dept": "adhe"
                                }
                            }
                        ]
                    },
                    {
                        "EQ": {
                            "courses_avg": 95
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result.length); // 56
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 6", function () {
        let myQ = {
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courses_avg": 70
                        }
                    },
                    {
                        "LT": {
                            "courses_avg": 80
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result.length); // 64612?
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 7", function () {
        let myQ = {
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courses_pass": 50
                        }
                    },
                    {
                        "LT": {
                            "courses_fail": 10
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_fail"
                ],
                "ORDER": "courses_fail"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result.length); // 64612?
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 8", function () {
        let myQ = {
            "WHERE": {
                "OR": [
                    {
                        "LT": {
                            "courses_pass": 50
                        }
                    },
                    {
                        "LT": {
                            "courses_fail": 10
                        }
                    },
                    {
                        "LT": {
                            "courses_audit": 10
                        }
                    },
                    {
                        "LT": {
                            "courses_year": 2010
                        }
                    },
                    {
                        "LT": {
                            "rooms_seats": 10
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_fail"
                ],
                "ORDER": "courses_fail"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result.length); // 64612?
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });

    });

    it("Should be able to perform simple query 9", function () {
        let myQ = {
            "WHERE": {
                "OR": [
                    {
                        "NOT": {
                            "EQ": {
                                "courses_avg": 65
                            }
                        }
                    },
                    {
                        "LT": {
                            "courses_avg": 75
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_id",
                    "courses_avg"
                ],
                "ORDER": "courses_avg"
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result.length); // 64612?
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to perform course average", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {"OR": [{"AND": [{"GT": {"courses_avg": 90}}, {"IS": {"courses_dept": "adhe"}}]}, {"EQ": {"courses_avg": 95}}]},
            "OPTIONS": {"COLUMNS": ["courses_dept", "courses_id", "courses_avg"], "ORDER": "courses_avg"}
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to perform a course average down", function () {
        let myQ = {
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
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["courses_avg"]
                }
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to perform a course average up", function () {
        let myQ = {
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
                "ORDER": {
                    "dir": "UP",
                    "keys": ["courses_avg"]
                }
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            let result: any = response.body;
            //console.log(result);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it("Should not be able to query when COLUMNS is empty.", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courss_avg": "95"
                        }
                    },
                    {
                        "EQ": {
                            "courss_avg": "85"
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": {
                "COLUMNS": ""
            }
        };
        facade = new InsightFacade();
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when there is no WHERE", function () {
        //this.timeout(100000);
        let query: any ={
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg"
            }
        };
        facade = new InsightFacade();
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when COLUMNS is not in OPTIONS", function () {
        let myQ = {
            "WHERE": {
                "GT": {
                    "courses_avg": 97
                }
            },
            "OPTIONS": {
                "ORDER": "courses_avg"
            },
            "COLUMNS": [
                "courses_dept",
                "courses_avg"
            ]
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });

    });

    it("Should not be able to query when OPTIONS is empty.", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [
                    {
                        "GT": {
                            "courss_avg": "95"
                        }
                    },
                    {
                        "EQ": {
                            "courss_avg": "85"
                        }
                    },
                    {
                        "IS": {
                            "courses_dept": "cpsc"
                        }
                    }
                ]
            },
            "OPTIONS": ""
        };
        facade = new InsightFacade();
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it("Should not be able to query when WHERE is empty.", function () {
        //this.timeout(100000);
        let query: any ={
            "WHERE": "",
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg"
            }
        };
        facade = new InsightFacade();
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when ORDER is empty", function () {
        let myQ = {
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
                "ORDER": ""
            }
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when s_key is number", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "GT": {
                    "courses_dept": 1
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "courses_dept",
                    "courses_avg"
                ],
                "ORDER": "courses_avg"
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when key is invalid", function () {
        //this.timeout(10000);
        let query: any = {
            "WHERE": {"OR": [{"AND": [{"GT": {"courses_avg": 90}}, {"IS": {"courses_dept": "adhe"}}]}, {"EQ": {"courses_avg": 95}}]},
            "OPTIONS": {"COLUMNS": ["courses_dept", "courses_id", "courses_avg"], "ORDER": "courses_size"}
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when the logic comparison fails 1", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {"AND": [{"GT": {"courss_avg": "90"}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"courses_dept": "cpsc"}}]},
            "OPTIONS": {"COLUMNS": ["courses_dept", "courses_avg", "courses_uuid"], "ORDER": "courses_avg"}
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when the logic comparison fails 2", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "OR": [{
                    "NOT": {
                        "AND": [{"GT": {"courses_avg": "90"}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"course_dept": "cpsc"}}, {
                            "AND": [{"GT": {"courses_avg": 20}}]
                        }]
                    }
                }, {"IS": {"courses_uuid": "129*"}}]
            },
            "OPTIONS": {"COLUMNS": ["courses_dept", "courses_avg", "courses_uuid"], "ORDER": "courses_avg"}
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when GT is empty", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {"AND": [{"GT": {}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"courses_dept": "cpsc"}}]},
            "OPTIONS": {"COLUMNS": ["courses_dept", "courses_avg", "courses_uuid"], "ORDER": "courses_avg"}
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when EQ is empty", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {"AND": [{"GT": {}}, {"EQ": {"courss_avg": "85"}}, {"IS": {"courses_dept": "cpsc"}}]},
            "OPTIONS": {"COLUMNS": ["courses_dept", "courses_avg", "courses_uuid"], "ORDER": "courses_avg"}
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should be able to perform room query 1", function () {
        //this.timeout(100000);
        let query: any = {
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
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to perform room query 2", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "IS": {
                    "rooms_address": "*Agrono*"
                }
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_address", "rooms_name"
                ]
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to perform room query 3", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                }
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to perform room query 4", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "LT": {
                        "rooms_seats": 300
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                }
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }]
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it("Should be able to perform room query 5", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_furniture"
                ],
                "ORDER": "rooms_furniture"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_furniture"],
                "APPLY": []
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to perform room query 6", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {},
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_href"
                ],
                "ORDER": "rooms_href"
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_href"],
                "APPLY": []
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });


    it("Should be able to perform room query 7", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 100
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats",
                    "minSeats",
                    "avgSeats",
                    "sumSeats",
                    "countSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                }
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }, {
                    "minSeats": {
                        "MIN": "rooms_seats"
                    }
                }, {
                    "avgSeats": {
                        "AVG": "rooms_seats"
                    }
                }, {
                    "sumSeats": {
                        "SUM": "rooms_seats"
                    }
                }, {
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                }]
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should not be able to query when GROUP is empty", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 100
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats",
                    "minSeats",
                    "avgSeats",
                    "sumSeats",
                    "countSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                }
            },
            "TRANSFORMATIONS": {
                "GROUP": "",
                "APPLY": [{
                    "maxSeats": {
                        "MAX": "rooms_seats"
                    }
                }, {
                    "minSeats": {
                        "MIN": "rooms_seats"
                    }
                }, {
                    "avgSeats": {
                        "AVG": "rooms_seats"
                    }
                }, {
                    "sumSeats": {
                        "SUM": "rooms_seats"
                    }
                }, {
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                }]
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when APPLY is empty", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 100
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats",
                    "minSeats",
                    "avgSeats",
                    "sumSeats",
                    "countSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                }
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": ""
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should not be able to query when APPKY token is invalid", function () {
        //this.timeout(100000);
        let query: any = {
            "WHERE": {
                "AND": [{
                    "IS": {
                        "rooms_furniture": "*Tables*"
                    }
                }, {
                    "GT": {
                        "rooms_seats": 100
                    }
                }]
            },
            "OPTIONS": {
                "COLUMNS": [
                    "rooms_shortname",
                    "maxSeats",
                    "minSeats",
                    "avgSeats",
                    "sumSeats",
                    "countSeats"
                ],
                "ORDER": {
                    "dir": "DOWN",
                    "keys": ["maxSeats"]
                }
            },
            "TRANSFORMATIONS": {
                "GROUP": ["rooms_shortname"],
                "APPLY": [{
                    "maxSeats": {
                        "MORE": "rooms_seats"
                    }
                }, {
                    "minSeats": {
                        "MIN": "rooms_seats"
                    }
                }, {
                    "avgSeats": {
                        "AVG": "rooms_seats"
                    }
                }, {
                    "sumSeats": {
                        "SUM": "rooms_seats"
                    }
                }, {
                    "countSeats": {
                        "COUNT": "rooms_seats"
                    }
                }]
            }
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
            //console.log(response.body);
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should be able to remove a rooms dataset in the end (204)", function () {
        return facade.removeDataset('rooms').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
            //console.log(response.code)
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should be able to remove a courses dataset in the end (404)", function () {
        return facade.removeDataset('courses').then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
            //console.log(response.code)
        }).catch(function (response: InsightResponse) {
            expect.fail();
        });
    });

    it("Should not be able to perform courses query after removing data", function () {
        let myQ = {
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
        };
        return facade.performQuery(myQ).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        });
    });

    it("Should not be able to perform rooms query after removing data", function () {
        //this.timeout(100000);
        let query: any = {
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
        };
        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        });
    });
});
