import Log from "../Util";
let fs = require('fs');
let JSZip = require('jszip');
import {Datasets} from "./DatasetController"

export interface QueryRequest{
    GET?:string|string[]
    WHERE?:{}
    GROUP?:string[]
    APPLY?:Object[]
    ORDER?:string|Object[]
    AS?:string
}

export interface QueryResponce{
}

export default class QueryController{

    private datasets: Datasets = {};

    constructor(datasets: Datasets) {
        this.datasets = datasets;
    }

    public isValid(query:QueryRequest):boolean{
        let getList = []
        for (let i of query.GET){
                getList.push(query.GET)
        }
        if(getList.length==0||!query.hasOwnProperty("GET")||!query.hasOwnProperty("WHERE")||!query.hasOwnProperty("AS")||query.AS.length==0||!query.hasOwnProperty(("AS"))){
            return false;

        }
    }
}
