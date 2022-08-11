#!/usr/bin/env node
import fs from "fs";
import path from "path";
import ts from "typescript";
import yargs, { boolean } from "yargs";
// @ts-ignore as the "rootDir" in tsconfig.json is set to "src", this file is outside the source tree. But that's fine and we don't want to make "." the root because this would include more files and cause build result path problems (files going to "dist/src").
import pkg from "../package.json";
import log from "loglevel";
import { Glob } from "glob";
// import {html2json} from "html2json";
import ControlGenerator from "./utils/ControlGenerator";
import { html2json } from "html2json";
import TSControlGenerator from "./utils/TSControlGenerator";
log.setDefaultLevel("info");

interface Args {
    split?:boolean;
    path?:string;
    namespace?:string;
    overwrite?:boolean;
    loglevel?: "debug" | "info" | "warn" | "error";
    type?: "TS" | "JS";
}

// configure yargs with the cli options as launcher
const version = `${pkg.version} (from ${__filename})`;
yargs.version(version);
yargs
    .option({
        type:{
            alias:"t",
            choices: ["TS", "JS"]
        },
        namespace:{
            alias:"ns",
            type:"string",
            default:"com.org"
        },
        path:{
            alias:"p",
            type:"string",
            default:"**"
        },
        split:{
            alias:"s",
            type:"boolean",
            default:true
        },
        overwrite:{
            alias:"ow",
            type:"boolean",
            default:false
        },
        loglevel: {
            choices: ["error", "warn", "info", "debug", "trace"],
            description: "Set the console logging verbosity",
        },
    })
    .default("loglevel", "info");

const appArgs = yargs.argv as Args;
main(appArgs);

// main entry point
function main(args: Args) {
    const level = args.loglevel;
    const type = args.type || "TS";
    const path = args.path;
    const split = args.split;
    const namespace = args.namespace;
    const overwrite = args.overwrite;
    const flag = overwrite?'w+':'wx+';
    overwrite && log.info("Warning: existing files will be overwritten!")
    if (
        level === "error" ||
        level === "warn" ||
        level === "info" ||
        level === "debug" ||
        level === "trace"
    ) {
        log.setDefaultLevel(level);
        log.info(`Log level set to: ${level}`);
    }

    let files = new Glob(`./**/webapp/${path}/*.html`,{sync:true});
    if(files.found.length === 0){
        //in case of a library
        files = new Glob(`./**/src/${path}/*.html`,{sync:true});
    }
    for(const file of files.found){
        if(file.indexOf("index.html") > -1) return;//exclude index.html
        if(file.indexOf("/test/") > -1) return;//exclude .html files in the test folder
        log.info(`Found html file for control generation: ${file}`);
        const startName = file.lastIndexOf("/") + 1;
        let controlName = file.substring(startName);

        const webappIdx = path.indexOf("/webapp/");
        const srcIdx = path.indexOf("/src/");
        const subPathIdx = (webappIdx > -1)?(webappIdx+8):(srcIdx > -1)?(srcIdx+5):0;
        const subNamespace = path.substring(subPathIdx,file.lastIndexOf("/")).split("/").join(".");
        controlName = controlName.substring(0,controlName.indexOf(".html"));
        try {
            log.info(`${controlName}: Reading html for control from ${file}`);
            const fileData = fs.readFileSync(file, { encoding: 'utf8' });
            log.info(`${controlName}: Converting html to json`);
            const htmlJSON = html2json(fileData
                .replace(/\n/g, "")
                .replace(/[\t ]+</g, "<")
                .replace(/>[\t ]+</g, "><")
                .replace(/>[\t ]+$/g, ">")
                .replace(/[\r ]+</g, "<")
                .replace(/>[\r ]+</g, "><")
                .replace(/>[\r ]+$/g, ">"));

            if(type === "JS"){
                const cg = new ControlGenerator();
                log.info(`${controlName}: Generating control`);
                const content = cg.generateControl((htmlJSON), `${namespace}.${subNamespace}.${controlName}`, split);
        
                const controlPath = file.replace(".html",".js");
                log.info(`${controlName}: Write control ${split?'without':'with'} Renderer to ${controlPath}`);
                fs.writeFile(controlPath,content,{flag:flag},err => err?log.error(err):log.info(`${controlName}: Control created in file ${controlPath}!`));
                if(split){
                    const controlRendererPath = file.replace(".html","Renderer.js");
                    log.info(`${controlName}: Generating control Renderer`);
                    const renderer = cg.generateSeperateRenderer(htmlJSON, `${namespace}.${subNamespace}.${controlName}`);
                    log.info(`${controlName}: Write control Renderer to ${controlPath}`);
                    fs.writeFile(controlRendererPath,renderer,{flag:flag},err => err?log.error(err):log.info(`${controlName}: Control Renderer created in file ${controlPath}!`));
                }

            }else if(type === "TS"){
                const tscg = new TSControlGenerator();
                tscg.generateControl(htmlJSON, `${namespace}.${subNamespace}.${controlName}`, split);
            }
        } catch (error) {
            log.error(error);
        }

    }
}