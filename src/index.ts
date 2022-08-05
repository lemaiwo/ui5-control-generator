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
log.setDefaultLevel("info");

interface Args {
    split?:boolean,
    path?:string,
    namespace?:string,
    overwrite?:boolean,
    loglevel?: "debug" | "info" | "warn" | "error";
}

// configure yargs with the cli options as launcher
const version = `${pkg.version} (from ${__filename})`;
yargs.version(version);
yargs
    .option({
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
    const path = args.path;
    const split = args.split;
    const namespace = args.namespace;
    const overwrite = args.overwrite;
    const flag = overwrite?'w+':'wx+';
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

    const files = new Glob(`webapp/${path}/*.html`,{sync:true});
    for(const file of files.found){
        if(file.indexOf("index.html") > -1) return;//exclude index.html
        if(file.indexOf("/test/") > -1) return;//exclude .html files in the test folder
        log.info(`Found: ${file}`);
        const controlPath = file.replace(".html",".js");
        const controlRendererPath = file.replace(".html","Renderer.js");
        const startName = file.lastIndexOf("/") + 1;
        let controlName = file.substring(startName);
        controlName = controlName.substring(0,controlName.indexOf(".html"));
        try {
            const fileData = fs.readFileSync(file, { encoding: 'utf8' });
            const htmlJSON = html2json(fileData
                .replace(/\n/g, "")
                .replace(/[\t ]+</g, "<")
                .replace(/>[\t ]+</g, "><")
                .replace(/>[\t ]+$/g, ">")
                .replace(/[\r ]+</g, "<")
                .replace(/>[\r ]+</g, "><")
                .replace(/>[\r ]+$/g, ">"));
            const cg = new ControlGenerator();
            const content = cg.generateControl((htmlJSON), `${namespace}.${controlName}`, split);
            fs.writeFile(controlPath,content,{flag:flag},err => err?log.error(err):log.info(`${controlPath}: control created!`));
            if(split){
                const renderer = cg.generateSeperateRenderer(htmlJSON, `${namespace}.${controlName}`);
                fs.writeFile(controlRendererPath,renderer,{flag:flag},err => err?log.error(err):log.info(`${controlPath}: control renderer created!`));
            }
        } catch (error) {
            log.error(error);
        }

    }
}