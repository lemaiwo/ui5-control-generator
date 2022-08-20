import ControlGenerator from "../generators/ControlGenerator";
import JSControlGenerator from "../generators/JSControlGenerator";
import TSControlGenerator from "../generators/TSControlGenerator";

type generatorType = "TS"|"JS";
export default class GeneratorFactory {
    static getGenerator(type: generatorType): ControlGenerator {
        if (type === 'JS') {
            return new JSControlGenerator()
        } else if (type === 'TS') {
            return new TSControlGenerator()
        } else {
            throw new Error(`No generator exists for givin type ${(type as string)}`);
        }
    }
}