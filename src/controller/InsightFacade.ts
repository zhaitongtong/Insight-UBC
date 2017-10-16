/**
 * This is the main programmatic entry point for the project.
 */

import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";
import {QueryRequest, default as QueryController} from "../controller/QueryController";
// my import
import DatasetController from '../controller/DatasetController';
let fs = require("fs");
let JSZip = require("jszip");

export default class InsightFacade implements IInsightFacade {
    private static datasetController = new DatasetController();

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
    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {

            let dsController = InsightFacade.datasetController;
            let response: InsightResponse;
            dsController.process(id, content)
                .then(function (result) {
                    //if the datasets already has this id, it already exists
                    //if (1) {
                    //if (typeof dsController.getDataset(id) == null || typeof dsController.getDataset(id) == {}) {
                    //    if (!alreadyExisted){
                    //response = {code: result, body: 'the operation was successful and the id was new'};
                    //} else {
                    //response = {code: result, body: 'the operation was successful and the id already existed'};
                    //}

                    // I did not write the body information here.
                    if (result){
                        if (result==201) {
                            response = {code: result,body: 'the operation was successful and the id already existed'}
                        }else if (result == 204){
                            response = {code:result,body: 'the operation was successful and the id already existed'}
                        }
                        fulfill(response);
                    }
                    else {
                        response = {code: 400, body:{"error": "my text"}}
                        reject(response)
                    }
            })
                .catch(function (err:Error) {
                response = {code: 400, body: {"error": err.message}};
                reject(response);
            })
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
            //removeDataset should not reponse with code: 400
            //Delete it to avoid potential risk
            try {
                let dsController = InsightFacade.datasetController;
                try {
                    dsController.delete(id);
                    fulfill({code: 204, body: 'the operation was successful.'});
                }
                catch (e) {
                    reject({code: 404, body:'the operation was unsuccessful because the delete was  for a resource that was not previously added.'});
                }
            } catch (err) {
                reject({code: 400, error: err.message});
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
    performQuery(query: any): Promise <InsightResponse> {
        console.log(query)
        return new Promise(function (fulfill, reject) {
            try {

                let queryController = new QueryController(InsightFacade.datasetController.getDatasets());
                //Log.any(query);
                let isValid = queryController.isValid(query);
                //console.log(isValid)
                //let id = queryController.datasetValid(query);
                let dataset = InsightFacade.datasetController.getDatasets();
                console.log(dataset)
                if (isValid) {
                    if (dataset === undefined || dataset === null) {
                        return fulfill({code:424, body :'the query failed because of a missing dataset'});
                    } else {
                        var result = queryController.query(query);
                        return fulfill({code:200, body: result}); //JSON.stringify(result) ?
                    }
                } else {
                    reject({code:400, error :'invalid query'});
                }
            } catch (err) {
                reject({code:400, error: 'error'});
            }
        });
    }
};
