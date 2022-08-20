import { Node } from "html2json";
import PropertyGenerator from "./PropertyGenerator";
import log from "loglevel";
import ControlGenerator from "./ControlGenerator";

export default class JSControlGenerator extends ControlGenerator{
    constructor(json?: Node) {
        super(json);
    }

    public generateControl(json: Node, name: string, skipRenderer: boolean) {
        if (json) {
            this.setJSON(json);
        }
        if (!this.getJSON()) {
            log.error("No JSON available!");
            return;
        }
        // must be first --> will search for properties
        const renderer = this.generateRendererFn();

        const controlStr = [];
        controlStr.push(this.generateBeginControl(name));
        controlStr.push(this.generateMetadata());
        controlStr.push(",\n\n");
        controlStr.push(this.generateInitFn());
        controlStr.push(",\n\n");
        if (!skipRenderer) {
            controlStr.push(renderer);
            controlStr.push(",\n\n");
        }
        controlStr.push(this.generateAfterRenderingFn());
        if (this.props && this.props.length > 0) {
            controlStr.push(",\n\n");
            controlStr.push(this.generateSettersFn());
        }
        controlStr.push(this.generateEndControl());
        return controlStr.join(" ");
    }

    protected generateBeginControl(name: string) {
        if (!name || (name && name === "")) {
            name = "namespace.ControlName";
        }
        let begin = "sap.ui.define([\n";
        begin += "\t\"sap/ui/core/Control\"\n";
        begin += "], (Control) => {\n";
        begin += "\t\"use strict\";\n";
        begin += `\treturn Control.extend("${name}", {\n`;
        return begin;
    }
    public generateSeperateRenderer(json: Node, name: string) {
        if (json) {
            this.setJSON(json);
        }
        if (!this.getJSON()) {
            log.error("No JSON available!");
            return;
        }
        if (!name || (name && name === "")) {
            name = "namespace.ControlName";
        }
        this.firstTime = true;
        const controlName = name.substr(name.lastIndexOf(".") + 1);
        let renderer = "sap.ui.define([], function() {";
        renderer += "\"use strict\";";
        renderer += "var " + controlName + " = {};";
        renderer += `${controlName}.render = function(rm, control) {`;
        renderer += this.renderControl(this.getJSON());
        renderer += "};";
        renderer += `return ${controlName};`;
        renderer += "},true);";
        return renderer;
    }
    protected generateEndControl() {
        return "\t});\n});\n";
    }
    protected generateMetadata() {
        let meta = "\t\t\"metadata\":{\n\t\t\t\"properties\":{\n";
        const allprops = this.props.map(prop => "\t\t\t\t" + prop.getPropMeta()) || [];
        meta += allprops.join(",\n");
        meta += "\n\t\t\t},\n\t\t\t\"events\":{}\n\t\t}";
        return meta;
    }
    protected generateInitFn() {
        let InitFn = "\t\tinit() { ";
        InitFn += "}";
        return InitFn;
    }
    protected generateRendererFn() {
        this.firstTime = true;
        let RendererFn = "\t\trenderer(rm, control) {\n";
        RendererFn += this.renderControl(this.getJSON());
        RendererFn += "\t\t}";
        return RendererFn;
    }
    protected generateAfterRenderingFn() {
        let AfterRenderingFn = "\t\tonAfterRendering(event) { ";
        AfterRenderingFn += "}";
        return AfterRenderingFn;
    }
    protected generateSettersFn() {
        const propsSetters = this.props.filter(prop => !!prop.getSetterFn()).map(prop => `\t\t${prop.getSetterFn()}`) || [];

        return propsSetters.join(",\n");
    }
    protected renderControl(controljson: Node) {
        let control = "";
        if (controljson.child && !controljson.tag) {
            if (Array.isArray(controljson.child)) {
                for (const value of controljson.child) {
                    control += this.renderControl(value);
                }
            }
            return control;
        }
        if (controljson.text) {
            return this.addProperty();
        }
        control = `\t\t\trm.openStart("${controljson.tag}"`
        if (this.firstTime) {
            this.props = [];
            control += ", control";
            this.firstTime = false;
        }
        control += ")"

        if (controljson.attr?.style) {
            let styles = controljson.attr.style;//.split(";");
            if (Array.isArray(styles)) {
                styles = styles.join("");
            }
            styles = styles.split(";");
            for (const value of styles) {
                if (value) {
                    const style = value.split(":");
                    control += ".style(\"" + style[0] + "\", \"" + style[1] + "\")";
                }
            }
        }
        if (controljson.attr?.class) {
            const classes = controljson.attr.class;//.split(" ");
            if (Array.isArray(classes)) {
                for (const value of classes) {
                    if (value) {
                        control += ".class(\"" + value + "\")";
                    }
                }
            } else {
                control += ".class(\"" + classes + "\")";
            }
        }
        if (controljson.attr?.src) {
            control += this.addAttribute("src");
        }
        if (controljson.attr?.href) {
            control += this.addAttribute("href");
        }
        control += ".openEnd();\n";
        if (controljson.child) {
            if (Array.isArray(controljson.child)) {
                for (const value of controljson.child) {
                    control += this.renderControl(value);
                }
            }
        }
        control += `\t\t\trm.close("${controljson.tag}");\n\n`
        return control;
    }
    protected addProperty() {
        if (!this.props) {
            return;
        }
        let l = this.getParamCount("prop");
        const sTempPropName = `prop${(++l)}`;
        // if (this._aMappings) {
        //     var aFoundName = this._aMappings.filter(function (aMapping) {
        //         return aMapping._name === sTempPropName;
        //     });
        // }
        const p = new PropertyGenerator({ key: sTempPropName, name: sTempPropName, type: "string", typeIsFixed: false, generateSetter: true })
        // aFoundName && aFoundName.length > 0 && aFoundName[0].value ? aFoundName[0].value : sTempPropName, 
        // aFoundName && aFoundName.length > 0 ? aFoundName[0]._type : "string", 
        // false, 
        // aFoundName && aFoundName.length > 0 ? aFoundName[0]._generateSetter : true);
        this.props.push(p);
        return "\t\t\trm.text(control." + p.generateFnName("get") + "());\n";
    }
    protected addAttribute(attr: string) {
        if (!this.props) {
            return;
        }
        let l = this.getParamCount(attr);
        const sTempAttrName = `${attr}${(++l)}`;
        // if (this._aMappings) {
        //     var aFoundName = this._aMappings.filter(function (aMapping) {
        //         return aMapping._name === sTempAttrName;
        //     });
        // }
        const p = new PropertyGenerator({ key: sTempAttrName, name: sTempAttrName, type: "string", typeIsFixed: true, generateSetter: true })
        // var p = new Property(sTempAttrName, aFoundName && aFoundName.length > 0 && aFoundName[0].value ? aFoundName[0].value :
        //     sTempAttrName, "string", true,
        //     aFoundName && aFoundName.length > 0 ? aFoundName[0]._generateSetter : true);
        this.props.push(p);
        return ".attr(\"" + attr + "\",control." + p.generateFnName("get") + "())";
    }
}