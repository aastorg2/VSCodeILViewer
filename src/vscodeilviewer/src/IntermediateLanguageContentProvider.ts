import * as path from 'path';
import * as vscode from 'vscode';
import * as os from 'os';

var request = require('request');

export class IntermediateLanguageContentProvider implements vscode.TextDocumentContentProvider {

        public static Scheme = 'il-viewer';

        private _response = null;
        private _previewUri;
        private _parsedPath : path.ParsedPath;
        private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

        constructor(previewUri : vscode.Uri, parsedPath : path.ParsedPath) {
            this._previewUri = previewUri;
            this._parsedPath = parsedPath;
        }

        // Implementation
        public provideTextDocumentContent(uri: vscode.Uri) : string {
            
            if (!this._response){
                this.findProjectJson((projectJson) => {
                    return this.requstIl(this._parsedPath.name, projectJson);
                })
                
                return "Generating IL, hold onto your seat belts!";
            }

            let output = this.renderPage(this._response);
            this._response = null;

            return output;
        }

        get onDidChange(): vscode.Event<vscode.Uri> {
            return this._onDidChange.event;
        }

        private findProjectJson(requestIntermediateLanguage){
            let projectPath = "/Users/josephwoodward/Dev/VsCodeIlViewerDemoProj/console/project.json";
            vscode.workspace.findFiles("**/project.json","").then((uri) => {
                uri.forEach((x) => {
                    var projectJson = x.fsPath;
                    if (projectJson == projectPath) {
                        requestIntermediateLanguage(projectJson);
                    }
                });
            });
        }

        private renderPage(body: IInstructionResult[]) : string {
            let output = "";
            body.forEach(function(value: IInstructionResult, index: number){
                output += "<div style=\"font-size: 14px\"><pre>" + value.value + "</pre></div>";
            });

            return `
            <style type="text/css">
                .outOfDateBanner {
                    display: table;
                    background-color: red;
                }

                .outOfDateBanner span {
                    display: table-cell;
                }
            </style>
            <body>
            ${output}
            </body>`;
        }

        public requstIl(filename: string, projectJsonPath : string) {

            let postData = {
                ProjectFilePath : projectJsonPath,
                Filename : filename
            }

            let options = {
                method: 'post',
                body: postData,
                json: true,
                url: 'http://localhost:5000/api/il/'
            }

            setTimeout(() => {
                request(options, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        this._response = body;
                        this._onDidChange.fire(this._previewUri);
                    }
                });
            }, 500)
        }
    }