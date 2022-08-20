import { Node } from "html2json";
import PropertyGenerator from "./PropertyGenerator";
import log from "loglevel";
import ts from "typescript";

export default abstract class ControlGenerator {
    protected json: Node;
    protected props: Array<PropertyGenerator>;
    protected firstTime = true;
    // private mappings:Array<>;
    constructor(json?: Node) {
        this.setJSON(json);
    }
    public setJSON(json: Node) {
        this.json = json;
    }
    public getJSON() {
        return this.json;
    }
    public getAllProperties() {
        return this.props;
    }
    // public setMappingTable(){
    // }

    public abstract generateControl(json: Node, name: string, skipRenderer: boolean) :string;
    public abstract generateSeperateRenderer(json: Node, name: string):string;
    protected getParamCount(param: string) {
        // var l = _.countBy(this.props,function(prop){
        // 	return prop.getName().substr(0,param.length) === param?param:"Others";
        // });
        let l = 0;
        // $.each(this.props, function (key, value) {
        for (const value of this.props) {
            if (value.key.substr(0, param.length) === param) {
                l++;
            }
        }
        return l ? l : 0;
    }
}