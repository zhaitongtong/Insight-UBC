import Log from "../Util";
let fs = require('fs');
let JSZip = require('jszip');
import {Datasets} from "./DatasetController"

export interface QueryRequest{
    GET?:string|string[]
    WHERE?:{}
    GORUP?:string[]
    APPLY?:Object[]
    ORDER:string|Object[]
    AS:string
}

export interface QueryResponce{
}

export default class QueryController{

    private datasets: Datasets = {};

    constructor(datasets: Datasets) {
        this.datasets = datasets;
    }

    public isValid(myQuery:QueryRequest):boolean{
        if(!myQuery.hasOwnProperty("GET")||!myQuery.hasOwnProperty("WHERE")||(!myQuery.hasOwnProperty("AS"))){
            return false;
        }
    }
}
