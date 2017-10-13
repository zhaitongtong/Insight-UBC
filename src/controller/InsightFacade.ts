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
     * */
    addDataset(id: string, content: string): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            try{
                let dsController = InsightFacade.datasetController;
                let idExisted: boolean = dsController.inMemory(id);
                dsController.process(id, content)
                    .then(function (result) {
                        if (result && !idExisted){
                            fulfill({code: 201, body: 'the operation was successful and the id already existed'});}
                        else {
                            fulfill({code: 204, body: 'the operation was successful and the id was new'});
                        }
                    })
                    .catch(function (err:Error) {
                        reject({code: 400, error: err.message});
                    })
            }catch (err) {
                reject({code: 400, error: err.message});
            }
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
        return null
    }
}
