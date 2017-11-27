import restify = require('restify');
import fs = require('fs');
import InsightFacade from "../controller/InsightFacade";
import {InsightResponse} from "../controller/IInsightFacade";

export default class RouteHandler {
    
    private static facade=new InsightFacade();

    public static getHomepage(req: restify.Request, res: restify.Response, next: restify.Next) {
        fs.readFile('./src/rest/views/index.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static  putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            var id: string = req.params.id;

            // stream bytes from request into buffer and convert to base64
            // adapted from: https://github.com/restify/node-restify/issues/880#issuecomment-133485821
            let buffer: any = [];
            req.on('data', function onRequestData(chunk: any) {
                buffer.push(chunk);
            });

            req.once('end', function () {
                let concated = Buffer.concat(buffer);
                req.body = concated.toString('base64');
                RouteHandler.facade.addDataset(id, req.body).then(function (result: InsightResponse) {
                    res.json(result.code,result.body);
                }).catch(function (err: InsightResponse) {
                    res.json(err.code,err.body );
                });
            });

        } catch (err) {
            res.send(400, {err: err.message});
        }
        return next();
    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            let query: any = req.params;
            RouteHandler.facade.performQuery(query).then(function(response:InsightResponse){
                res.json(response.code,response.body);
            }).catch(function (err: InsightResponse) {
                res.json(err.code,err.body);
            });
        } catch (err) {
            //res.send(400);
        }
        return next();
    }

    public static  deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        try {
            var id: string = req.params.id;

            // stream bytes from request into buffer and convert to base64
            // adapted from: https://github.com/restify/node-restify/issues/880#issuecomment-133485821
            let buffer: any = [];
            req.on('data', function onRequestData(chunk: any) {
                buffer.push(chunk);
            });

            req.once('end', function () {
                let concated = Buffer.concat(buffer);
                req.body = concated.toString('base64');
                try {
                    RouteHandler.facade.removeDataset(id).then(function(res2:InsightResponse){
                        res.json(res2.code,res2.body);
                    }).catch(function (err: InsightResponse) {
                        res.json(err.code,err.body );
                    });
                }catch(err) {
                    res.json(404, {err: err.message});
                }
            });

        } catch (err) {
            res.send(400, {err: err.message});
        }
        return next();
    }
}
