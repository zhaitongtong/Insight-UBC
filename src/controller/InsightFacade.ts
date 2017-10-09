/**
 * This is the main programmatic entry point for the project.
 */

import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import Log from "../Util";

// my import
import DatasetController from '../controller/DatasetController';

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
     * The promise should return an InsightResponse for both fulfill and reject.
     */
    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            let dsController = InsightFacade.datasetController;
            let response: InsightResponse;
            dsController.process(id, content).then(function (result) {
                if (result) {
                    response ={code: 204, body: 'the operation was successful and the id was new'};
                } else {
                    response ={code: 201, body: 'the operation was successful and the id already existed'};
                }
                fulfill(response);
            }).catch(function (err:Error) {
                response = {code: 400, body: err.message};
                reject(response);
            })
        });
    }

    removeDataset(id: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            try {
                let dsController = InsightFacade.datasetController;

                try {
                    dsController.delete(id);
                    fulfill({code: 204, body: 'the operation was successful.'});
                }
                catch (e) {
                    reject({code: 404, body:'the operation was unsuccessful because the delete was  for a resource that was not previously added.'});
                }
            }
            catch (err) {
                reject({code: 400, error: err.message});
            }
        });
    }

    performQuery(query: any): Promise <InsightResponse> {
        return null;
    }
}
