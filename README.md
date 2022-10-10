# ui5-control-generator
UI5 Control Generator

## Installation

```sh
npm install --save-dev ui5-control-generator
```

## Usage

To start the generator, run:

```sh
npx ui5-control-generator --ns <namespace>
```

### Commandline Options

This is the list of available commandline arguments, including the ones above:


- `--t`, `--type`: Define the type of syntax, JavaScript or TypeScript
- `--ns`, `--namespace`: Namespace of your UI5 project (including the projectname)
- `--p`, `--path`: Optional parameter to define a specific folder to search for html files, default will search in all folders
- `--s`, `--split`: Split Control logic and renderer in two files, default will split. Values can be true or false
- `--ow`, `--overwrite`: Overwrite already existing files with the same name, default will not overwrite. Possible values can be true or false.
- `--loglevel`: Set the console logging verbosity; options are: "error", "warn", "info", "debug", "trace"; default level is "info"

### Demo app

Demo app available on GitHub [https://github.com/lemaiwo/DemoCustomControlGenerator](https://github.com/lemaiwo/DemoCustomControlGenerator)
- npm script: [https://github.com/lemaiwo/DemoCustomControlGenerator/blob/3b4de25e5814d7b8ed624746208128dba2684269/package.json#L15](https://github.com/lemaiwo/DemoCustomControlGenerator/blob/3b4de25e5814d7b8ed624746208128dba2684269/package.json#L15)
- control (html + generated control): [https://github.com/lemaiwo/DemoCustomControlGenerator/tree/main/uimodule/webapp/control](https://github.com/lemaiwo/DemoCustomControlGenerator/tree/main/uimodule/webapp/control)

## Todo

- Detect UI5 namespace automatically
- Automatically use the text in html for the names of properties and attributes
- Add init function for TypeScript
- Add onAfterRendering function for TypeScript
- Fix error in onAfterRendering function for TypeScript
- Automatically resolve errors after TypeScript files are generated
