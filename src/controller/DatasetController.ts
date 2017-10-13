import Log from "../Util";
let fs = require('fs');
let JSZip = require('jszip');

/**
 * In memory representation of all datasets.
 */
export interface Datasets {
    [id: string]: {};   // an index signature
}

export default class DatasetController {
    private datasets: Datasets = {};

    constructor() {
        Log.trace('DatasetController::init()');
    }

    public getDataset(id:string):any{
        let exist : boolean = fs.existsSync('./data/' + id + '.json')
        if (!exist){
            return null
        }
        return id
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
     * The promise<boolean> should fulfill if this is done successfully; reject if the dataset was invalid
     */
    public process(id: string, data: any): Promise<number> {
        Log.trace('DatasetController::process( ' + id + '... )');

        let that = this;

        let processedDataset : any = [];
        var dictionary: { [course: string]:{} } = {};
        let coursePromises:any = [];

        return new Promise(function (fulfill, reject) {
            try {
                let loadedZip = new JSZip();
                loadedZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {

                    var alreadyExisted: boolean = false;



                    //if the datasets already has this id, it already exists

                    if(that.datasets && that.datasets.hasOwnProperty(id)) {

                        alreadyExisted = true;}

                    if (id === "courses") {
                        zip.forEach(function(relativePath: string, file: JSZipObject) { // get each file in the zip
                            if (!file.dir){ // (file.dir == false) access the file in the directory
                                var promise = file.async('string').then(function (data) { // for each file in "courses"
                                    var coursedata = JSON.parse(data); // file data type: JSON object
                                    var coursename = file.name.substring(8); //substring 8 to get rid of "courses/"
                                    Log.trace("Course Name: " + coursename);
                                    var processedCourseData: any = [];
                                    if (!(typeof (coursedata.result[0]) === 'undefined')) {  // don't save courses if "result" is undefined
                                        for (var i = 0; i < coursedata.result.length; i++) {  // rename subject, professor and course
                                            var processed_course_data = {
                                                dept: coursedata.result[i].Subject,
                                                id: coursedata.result[i].Course,
                                                avg: coursedata.result[i].Avg,
                                                instructor: coursedata.result[i].Professor,
                                                title: coursedata.result[i].Title,
                                                pass: coursedata.result[i].Pass,
                                                fail: coursedata.result[i].Fail,
                                                audit: coursedata.result[i].Audit,
                                                uuid: coursedata.result[i]["id"].toString(),
                                            };
                                            processedCourseData.push(processed_course_data);
                                        }
                                        var final = {
                                            result: processedCourseData
                                        };
                                        dictionary[coursename] = final; //save coursedata to dict[coursename]
                                    }
                                });
                                coursePromises.push(promise);
                            }
                        });
                    }
                    let fullresult = 0
                        if (alreadyExisted)
                            fullresult = 201
                        else
                            fullresult = 204

                    if (id === "courses") {
                    Promise.all(coursePromises).then(function () {
                            fulfill(fullresult);  // all promises are resolved
                            processedDataset = dictionary;
                            that.save(id, processedDataset);
                        })
                    }

                }).catch(function (err:any) {
                    Log.trace('DatasetController.process method error: can not zip the file.');
                    reject(err);
                });

            } catch (err) {
                Log.trace('DatasetController.process method error.');
                reject(err);
            }
        });
    }

    /**
     * Save the processed dataset to disk.
     * If there exist same id, replace the old dataset with the new one.
     *
     * @param id  The id of the dataset being saved.
     * @param processedDataset
     */
    private save(id: string, processedDataset: any) {
        var dir = './data';

        let fs = require('fs');
        if (!fs.existsSync(dir)){ //if ./data directory doesn't already exist, create
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
        let fs = require('fs');
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
        let fs = require('fs');
        var path = './data/'+ id +".json";
        return fs.existsSync(path); // fs.access(path) for async?
    }
}