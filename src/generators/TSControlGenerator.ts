import { Node } from "html2json";
import * as ts from "typescript";
import PropertyGenerator from "./PropertyGenerator";
import log from "loglevel";
import { extend } from "jquery";
import ControlGenerator from "./ControlGenerator";

type argsList = Array<{ name: string; type: ts.TypeNode; questionToken: boolean; }>;
type importList = Array<{ name: string; type: string; }>;
export default class TSControlGenerator extends ControlGenerator{
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
        if (!name || (name && name === "")) {
            name = "namespace.ControlName";
        }
        const resultFile = ts.createSourceFile("control.ts", "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        this.renderControl(json);
        let result = printer.printList(ts.ListFormat.MultiLine, this.generateControlClass(name, skipRenderer), resultFile)
        result = result.replace(/\s*\/\/\n/g, "\n");
        return result;
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
        const namespace = name.substring(0, name.lastIndexOf("."));
        const controlName = name.substring(name.lastIndexOf(".") + 1);

        this.firstTime = true;

        const resultFile = ts.createSourceFile("controlRenderer.ts", "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

        const importList = [
            { name: "RenderManager", type: "sap/ui/core/RenderManager" },
            { name: controlName, type: `./${controlName}` },
        ];

        const control = this.generateRendererFn(controlName,true);
        const importDeclarations = this.getImports(importList);
        const end = ts.factory.createExportAssignment(
            undefined,
            undefined,
            // undefined,
            ts.factory.createIdentifier(`${controlName}Renderer`)
          )
        const classNode = ts.factory.createNodeArray([...importDeclarations, control,end]);
        ts.addSyntheticLeadingComment(
            control,
            ts.SyntaxKind.MultiLineCommentTrivia,
            "*\n * " + controlName + " renderer " +
            "\n * @namespace " + namespace + "\n "
        );
        this.addLineBreakBefore(control);
        let result = printer.printList(ts.ListFormat.MultiLine, classNode, resultFile)
        result = result.replace(/\s*\/\/\n/g, "\n");
        return result;
    }
    private generateControlClass(name: string, skipRenderer: boolean) {
        const namespace = name.substring(0, name.lastIndexOf("."));
        const controlName = name.substring(name.lastIndexOf(".") + 1);
        const controlClassContent = [
            ...this.generateConstructor(controlName),
            this.generateMetadata()//,
            // this.generateInitFn(),
            // this.generateAfterRenderingFn()
        ];
        if (!skipRenderer) {
            controlClassContent.push(this.generateRendererFn(controlName,skipRenderer));
        } else {
            controlClassContent.push(ts.factory.createPropertyDeclaration(
                // undefined,
                [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
                ts.factory.createIdentifier("renderer"),
                undefined,
                undefined,
                ts.factory.createIdentifier(`${controlName}Renderer`)
            ));
        }
        const controlClass = ts.factory.createClassDeclaration(
            // undefined,
            [
                ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
                ts.factory.createModifier(ts.SyntaxKind.DefaultKeyword)
            ],
            ts.factory.createIdentifier(controlName),
            undefined,
            [ts.factory.createHeritageClause(
                ts.SyntaxKind.ExtendsKeyword,
                [ts.factory.createExpressionWithTypeArguments(
                    ts.factory.createIdentifier("Control"),
                    undefined
                )]
            )], controlClassContent);

        const importList = [
            { name: "Control", type: "sap/ui/core/Control" },
            { name: "Event", type: "sap/ui/base/Event" },
        ];
        if (skipRenderer) {
            importList.push({ name: `${controlName}Renderer`, type: `./${controlName}Renderer` });
        } else {
            importList.push({ name: "RenderManager", type: "sap/ui/core/RenderManager" });
        }


        const importDeclarations = this.getImports(importList);
        const classNode = ts.factory.createNodeArray([...importDeclarations, controlClass]);
        ts.addSyntheticLeadingComment(
            controlClass,
            ts.SyntaxKind.MultiLineCommentTrivia,
            "*\n * @extends Control\n " +
            "*\n * @constructor" +
            "\n * @public" +
            "\n * @namespace " + namespace + "\n "
        );
        this.addLineBreakBefore(controlClass);

        return classNode;
    }
    protected getImports(args: importList) {
        return args.map(arg => ts.factory.createImportDeclaration(
            // undefined,
            undefined,
            ts.factory.createImportClause(
                false,
                ts.factory.createIdentifier(arg.name),
                undefined
            ),
            ts.factory.createStringLiteral(arg.type),
            undefined
        )) || [];
    }
    protected generateMetadata() {
        return ts.factory.createPropertyDeclaration(
            // undefined,
            [
                ts.factory.createModifier(ts.SyntaxKind.StaticKeyword),
                ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)
            ],
            ts.factory.createIdentifier("metadata"),
            undefined,
            undefined,
            ts.factory.createObjectLiteralExpression(
                [
                    // ts.factory.createPropertyAssignment(
                    //     ts.factory.createIdentifier("library"),
                    //     ts.factory.createStringLiteral("com.myorg.myUI5Library")
                    // ),
                    ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("properties"),
                        ts.factory.createObjectLiteralExpression(this.props.map(prop =>
                        (ts.factory.createPropertyAssignment(
                            ts.factory.createIdentifier(prop.name),
                            ts.factory.createStringLiteral(prop.type)
                        ))),
                            true
                        )
                    ),
                    ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("events"),
                        ts.factory.createObjectLiteralExpression(
                            [],
                            false
                        )
                    )
                ],
                true
            )
        )
    }
    protected generateConstructor(controlName: string) {
        // const controlName = name.substring(name.lastIndexOf(".") + 1);
        return [ts.factory.createConstructorDeclaration(
            // undefined,
            undefined,
            [ts.factory.createParameterDeclaration(
                // undefined,
                undefined,
                undefined,
                ts.factory.createIdentifier("id"),
                ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                ts.factory.createUnionTypeNode([
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                    ts.factory.createTypeReferenceNode(
                        ts.factory.createIdentifier(`$${controlName}Settings`),
                        undefined
                    )
                ]),
                undefined
            )],
            undefined
        ),
        ts.factory.createConstructorDeclaration(
            // undefined,
            undefined,
            this.getConstructorArguments(controlName),
            undefined
        ),
        ts.factory.createConstructorDeclaration(
            // undefined,
            undefined,
            this.getConstructorArguments(controlName),
            ts.factory.createBlock(
                [ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                    ts.factory.createSuper(),
                    undefined,
                    [
                        ts.factory.createIdentifier("id"),
                        ts.factory.createIdentifier("settings")
                    ]
                ))],
                false
            )
        )];
    }
    protected generateInitFn() {
        return this.generateFn("init");
    }
    protected generateAfterRenderingFn() {
        return this.generateFn("onAfterRendering", [{
            name: "event", type: ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier("Event"),
                undefined
            ), questionToken: false
        }]);
    }
    protected getConstructorArguments(controlName: string) {
        return this.getFnArg([{
            name: "id",
            type: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            questionToken: true
        },
        {
            name: "settings",
            type: ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier(`$${controlName}Settings`),
                undefined
            ), questionToken: true
        }]);
    }
    protected getFnArg(args: argsList) {
        return args.map(arg => ts.factory.createParameterDeclaration(
            // undefined,
            undefined,
            undefined,
            ts.factory.createIdentifier(arg.name),
            arg.questionToken ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
            arg.type,
            undefined
        )) || [];
    }
    protected generateFn(functionName: string, args: argsList = []) {
        return ts.factory.createMethodDeclaration(
            // undefined,
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            ts.factory.createIdentifier(functionName),
            undefined,
            undefined,
            this.getFnArg(args),
            undefined,
            ts.factory.createBlock(
                [],
                true
            )
        );
    }
    protected generateRendererFn(name: string,standAloneRenderer:boolean) {//STOPPED HERE ==> Continue testing + improving => next step renderer
        this.firstTime = true;
        return ts.factory.createPropertyDeclaration(
            // undefined,
            [ts.factory.createModifier(standAloneRenderer?ts.SyntaxKind.ConstKeyword:ts.SyntaxKind.StaticKeyword)],
            ts.factory.createIdentifier(standAloneRenderer?`${name}Renderer`:"renderer"),
            undefined,
            undefined,
            ts.factory.createObjectLiteralExpression(
                [
                    ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("apiVersion"),
                        ts.factory.createNumericLiteral("2")
                    ),
                    ts.factory.createPropertyAssignment(
                        ts.factory.createIdentifier("render"),
                        ts.factory.createFunctionExpression(
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            this.getFnArg([{
                                name: "rm",
                                type: ts.factory.createTypeReferenceNode(
                                    ts.factory.createIdentifier("RenderManager"),
                                    undefined
                                ),
                                questionToken: false
                            },
                            {
                                name: "control",
                                type: ts.factory.createTypeReferenceNode(
                                    ts.factory.createIdentifier(name),
                                    undefined
                                ),
                                questionToken: false
                            }]),
                            undefined,
                            ts.factory.createBlock(
                                this.renderControl(this.getJSON()),
                                true
                            )
                        )
                    )
                ],
                true
            )
        )

    }
    protected renderControl(controljson: Node) {
        let control: Array<ts.ExpressionStatement> = [];
        let statement: ts.ExpressionStatement | ts.CallExpression;
        if (controljson.child && !controljson.tag) {
            if (Array.isArray(controljson.child)) {
                for (const value of controljson.child) {
                    control = [...control, ...this.renderControl(value)];
                }
            }
            return control;
        }
        if (controljson.text) {
            return [this.addProperty()];
        }
        const literals: Array<ts.Expression> = [ts.factory.createStringLiteral(controljson.tag)];
        if (this.firstTime) {
            literals.push(ts.factory.createIdentifier("control"));
            this.props = [];
            this.firstTime = false;
        }
        statement = ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("rm"),
                ts.factory.createIdentifier("openStart")
            ),
            undefined,
            literals
        );
        if (controljson.attr?.style) {
            let styles = controljson.attr.style;//.split(";");
            if (Array.isArray(styles)) {
                styles = styles.join("");
            }
            styles = styles.split(";");
            for (const value of styles) {
                if (value) {
                    const style = value.split(":");
                    statement = ts.factory.createCallExpression(
                        ts.factory.createPropertyAccessExpression(
                            statement,
                            ts.factory.createIdentifier("style")
                        ),
                        undefined,
                        [
                            ts.factory.createStringLiteral(style[0]),
                            ts.factory.createStringLiteral(style[1])
                        ]
                    );
                }
            }
        }
        if (controljson.attr?.class) {
            const classes = controljson.attr.class;//.split(" ");
            if (Array.isArray(classes)) {
                for (const value of classes) {
                    if (value) {
                        statement = ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                statement,
                                ts.factory.createIdentifier("class")
                            ),
                            undefined,
                            [
                                ts.factory.createStringLiteral(value)
                            ]
                        );
                    }
                }
            } else {
                statement = ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                        statement,
                        ts.factory.createIdentifier("class")
                    ),
                    undefined,
                    [
                        ts.factory.createStringLiteral(classes)
                    ]
                );
            }
        }
        if (controljson.attr?.src) {
            statement = this.addAttribute(statement, "src");
        }
        if (controljson.attr?.href) {
            statement = this.addAttribute(statement, "href");
        }
        control.push(ts.factory.createExpressionStatement(ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                statement,
                ts.factory.createIdentifier("openEnd")
            ),
            undefined,
            []
        )));
        if (controljson.child) {
            if (Array.isArray(controljson.child)) {
                for (const value of controljson.child) {
                    control = [...control, ...this.renderControl(value)];
                }
            }
        }
        control.push(ts.factory.createExpressionStatement(ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("rm"),
                ts.factory.createIdentifier("close")
            ),
            undefined,
            [ts.factory.createStringLiteral(controljson.tag)]
        )));
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
        return ts.factory.createExpressionStatement(ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("rm"),
                ts.factory.createIdentifier("text")
            ),
            undefined,
            [ts.factory.createIdentifier(`control.${p.generateFnName("get")}()`)]
        ))
    }

    protected addAttribute(control: ts.Expression, attr: string) {
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

        return ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
                control,
                ts.factory.createIdentifier("attr")
            ),
            undefined,
            [
                ts.factory.createStringLiteral(attr),
                ts.factory.createIdentifier(`control.${p.generateFnName("get")}()`)
            ]
        );
    }
    protected addLineBreakBefore(node: ts.Node, count = 1) {
        for (let i = 0; i < count; i++) {
            ts.addSyntheticLeadingComment(
                node,
                ts.SyntaxKind.SingleLineCommentTrivia,
                ""
            );
        }
    }
}