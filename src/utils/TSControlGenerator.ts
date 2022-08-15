import { Node } from "html2json";
import * as ts from "typescript";
import PropertyGenerator from "./PropertyGenerator";

export default class TSControlGenerator {

    private firstTime = true;
    private props: Array<PropertyGenerator>;
    public getAllProperties() {
        return this.props;
    }
    public generateControl(json: Node, name: string, skipRenderer: boolean) {
        const resultFile = ts.createSourceFile("someFileName.ts", "", ts.ScriptTarget.Latest, /*setParentNodes*/ false, ts.ScriptKind.TS);
        const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
        this.renderControl(json);
        const result = printer.printList(ts.ListFormat.MultiLine, this.generateBeginControl(name), resultFile)
        // result += printer.printNode(ts.EmitHint.Unspecified, this.generateBeginControl(name), resultFile);
        console.log(result);
        return result;
    }
    private generateBeginControl(name: string) {
        const namespace = name.substring(0, name.lastIndexOf("."));
        const controlName = name.substring(name.lastIndexOf(".") + 1);
        const controlClass = ts.factory.createClassDeclaration(
            undefined,
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
            )], [...this.generateConstructor(controlName), this.generateMetadata(),this.generateInitFn()]);
        const classNode = ts.factory.createNodeArray([
            ts.factory.createImportDeclaration(
                undefined,
                undefined,
                ts.factory.createImportClause(
                    false,
                    ts.factory.createIdentifier("Control"),
                    undefined
                ),
                ts.factory.createStringLiteral("sap/ui/core/Control"),
                undefined
            ),
            ts.factory.createImportDeclaration(
                undefined,
                undefined,
                ts.factory.createImportClause(
                    false,
                    ts.factory.createIdentifier(`${controlName}Renderer`),
                    undefined
                ),
                ts.factory.createStringLiteral(`./${controlName}Renderer`),
                undefined
            ), controlClass
        ]);
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
    private generateMetadata() {

        // let meta = "\t\t\"metadata\":{\n\t\t\t\"properties\":{\n";
        // const allprops = this.props.map(prop => "\t\t\t\t" + prop.getPropMeta()) || [];
        // meta += allprops.join(",\n");
        // meta += "\n\t\t\t},\n\t\t\t\"events\":{}\n\t\t}";
        // return meta;
        return ts.factory.createPropertyDeclaration(
            undefined,
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
    private generateConstructor(controlName: string) {
        // const controlName = name.substring(name.lastIndexOf(".") + 1);
        return [ts.factory.createConstructorDeclaration(
            undefined,
            undefined,
            [ts.factory.createParameterDeclaration(
                undefined,
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
            undefined,
            undefined,
            [
                ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("id"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                    undefined
                ),
                ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("settings"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    ts.factory.createTypeReferenceNode(
                        ts.factory.createIdentifier(`$${controlName}Settings`),
                        undefined
                    ),
                    undefined
                )
            ],
            undefined
        ),
        ts.factory.createConstructorDeclaration(
            undefined,
            undefined,
            [
                ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("id"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                    undefined
                ),
                ts.factory.createParameterDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    ts.factory.createIdentifier("settings"),
                    ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                    ts.factory.createTypeReferenceNode(
                        ts.factory.createIdentifier(`$${controlName}Settings`),
                        undefined
                    ),
                    undefined
                )
            ],
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
    private generateInitFn() {
        return ts.factory.createMethodDeclaration(
            undefined,
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            ts.factory.createIdentifier("init"),
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createBlock(
                [],
                true
            )
        );
    }
    private renderControl(controljson: Node) {
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
        if (this.firstTime) {
            this.props = [];
            control += ", control";
            this.firstTime = false;
        }
        if (controljson.child) {
            if (Array.isArray(controljson.child)) {
                for (const value of controljson.child) {
                    control += this.renderControl(value);
                }
            }
        }
    }
    private addProperty() {
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

    private getParamCount(param: string) {
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

    private addLineBreakBefore(node: ts.Node, count = 1) {
        for (let i = 0; i < count; i++) {
            ts.addSyntheticLeadingComment(
                node,
                ts.SyntaxKind.SingleLineCommentTrivia,
                ""
            );
        }
    }
}