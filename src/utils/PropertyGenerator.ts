export type propertiesInput = {key:string,name:string,type:string,typeIsFixed:boolean,generateSetter:boolean};
export default class PropertyGenerator {
    private _key:string;
    private _name:string;
    private _type:string;
    private _typeIsFixed:boolean;
    private _generateSetter:boolean;
    constructor(properties:propertiesInput) {
        this.key = properties.key;
        this.name = properties.name;
        this.type = properties.type;
        this.typeIsFixed = properties.typeIsFixed;
        this.generateSetter = properties.generateSetter;
    }
    
    public get key() : string {
        return this._key;
    }
    public set key(value : string) {
        this._key = value;
    }
    public get name() : string {
        return this._name;
    }
    public set name(value : string) {
        this._name = value;
    }
    public get type() : string {
        return this._type;
    }
    public set type(value : string) {
        this._type = value;
    }
    public get typeIsFixed() : boolean {
        return this._typeIsFixed;
    }
    public set typeIsFixed(value : boolean) {
        this._typeIsFixed = value;
    }
    public get generateSetter() : boolean {
        return this._generateSetter;
    }
    public set generateSetter(value : boolean) {
        this._generateSetter = value;
    }
    public getPropMeta(){
        return `"${this.name}":"${this.type}"`;
    }
    public getSetterFn(){
        let fnSetter = `${this.generateFnName("set")}: function(value) { `;
        fnSetter += `this.setProperty("${this.name}", value, true); `;
        fnSetter += "return this;}";
        return this.generateSetter?fnSetter:'';
    }
    public generateFnName(fn:string){
        return `${fn}${this.name[0].toUpperCase()}${this.name.substring(1)}`;
    }
}