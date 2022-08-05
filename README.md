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


- `--ns`, `--namespace`: namespace of your UI5 project
- `--p`, `--path`: Optional parameter to define a specific folder to search for html files, default will search in all folders
- `--s`, `--split`: Split Control logic and renderer in two files, default will split. Values can be true or false
- `--ow`, `--overwrite`: Overwrite already existing files with the same name, default will not overwrite. Possible values can be true or false.
- `--loglevel`: Set the console logging verbosity; options are: "error", "warn", "info", "debug", "trace"; default level is "info"

## Todo

- Detect UI5 namespace automatically
- Automatically use the text in html for the names of properties and attributes
- TypeScript version