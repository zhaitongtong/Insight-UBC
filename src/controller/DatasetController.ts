import Log from "../Util";
import JSZip = require('jszip');
import fs = require('fs');

/**
 * In memory representation of all datasets.
 */
export interface Datasets {
    [id: string]: {};
}

export default class DatasetController {

    private datasets: Datasets = {};


    constructor() {
        Log.trace('DatasetController::init()');
    }

    public getDatasets(): Datasets {
        // if datasets is empty, load all dataset files in ./data from disk
        try {
            if (fs.statSync('./data').isDirectory()) {
                var data: any = fs.readFileSync('./data/courses.json', 'utf8');
                this.datasets["courses"] = JSON.parse(data); //testing getting info from ./data
            }
        }catch (e){
            Log.trace(e);
        }
        return this.datasets;
    }

    /*
     * Save the dataset to disk.
     *
     * @param id  The id of the dataset being added.
     * @param content  The base64 content of the dataset. This content should be in the form of a serialized zip file.
     *
     * The promise<boolean>} should fulfill if this is done successfully; reject if the dataset was invalid
     */
    public process(id: string, data: any): Promise<boolean> {
        let that = this;

        let processedDataset = {};
        var dict: { [course: string]: {} } = { }; //dictionary

        var cPromises: any=[];
        var rPromises: any=[];

        var processPromise = new Promise(function (fulfill, reject) {
            try {
                let loadZip = new JSZip();
                loadZip.loadAsync(data, {base64: true}).then(function (zip: any) { //??? JZip JZipObject

                    if (id == "courses") {

                        zip.forEach(function(relativePath: string, jzip: any) { // get each file in the zip

                            if (!jzip.dir){ // this is not a directory, so zip it to access the file inside

                                var jzip2 = jzip.loadAsync("String").then(function (data:any) { // for each course file、

                                    var coursedata = JSON.parse(data); // let the file data to be a JSON object "coursedata"
                                    var coursename = jzip.name.substring(8); // start after "courses/"
                                    var processedCourseData: any = [];

                                    if (!(typeof (coursedata.result[0]) == 'undefined')) {
                                        for (var i = 0; i < coursedata.result.length; i++) {  //rename subject, professor and course

                                            var year:any = 1900;
                                            if(!(coursedata.result[i].Section=="overall")) {
                                                year = coursedata.result[i].Year;
                                            }

                                            var processedcoursedata = {
                                                dept: coursedata.result[i].Subject,
                                                id: coursedata.result[i].Course,
                                                avg: coursedata.result[i].Avg,
                                                instructor: coursedata.result[i].Professor,
                                                title: coursedata.result[i].Title,
                                                pass: coursedata.result[i].Pass,
                                                fail: coursedata.result[i].Fail,
                                                audit: coursedata.result[i].Audit,
                                                uuid: coursedata.result[i]["id"].toString(),
                                                year: year,
                                            };

                                            processedCourseData.push(processedcoursedata);
                                        }var final = {
                                            result: processedCourseData
                                        };
                                        dict[coursename] = final;  //save coursedata to dict[coursename]
                                    }
                                });

                                cPromises.push(jzip2);
                            }
                        });
                    }
                    if (id == "courses") {
                        Promise.all(cPromises).then(function () {
                            fulfill(true);
                            processedDataset = dict;
                            that.save(id, processedDataset);
                        })
                    }
                }).catch(function (err) {
                    Log.trace('DatasetController.process method error: can not zip the file.');
                    reject(err);
                });
            } catch (err) {
                Log.trace('DatasetController.process method error.');
                reject(err);
            }
        });
        return processPromise;
    }

    /**
     * Writes the processed dataset to disk as 'id.json'. The function should overwrite
     * any existing dataset with the same name.
     *
     * @param id
     * @param processedDataset
     */
    private save(id: string, processedDataset: any) {
        var fs = require('fs');
        var dir = './data';

        if (!fs.existsSync(dir)){       //if ./data directory doesn't already exist, create
            fs.mkdirSync(dir);
        }

        fs.writeFile("./data/" +id+ '.json', JSON.stringify(processedDataset), function (err:any) {
            if (err) {
                Log.trace("Error writing file");
            }
            Log.trace('Saved to /data');
        });

        this.datasets[id]=this.getDatasets();
    }

    public delete(id: string) {
        var path = './data/' + id + '.json';
        if (this.datasets[id]) {
            delete this.datasets[id];
            this.datasets[id] = null;
        }
        if (fs.statSync(path).isFile()) {
            fs.unlink(path);
        }
    }

    public inMemory(id: string): boolean {
        var path = './data/'+ id +".json";
        return fs.existsSync(path); // fs.access(path) for async?
    }

}