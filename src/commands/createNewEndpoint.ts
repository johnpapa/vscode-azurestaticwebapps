/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fse from 'fs-extra';
import * as path from 'path';
import { commands, Extension, extensions, workspace } from 'vscode';
import { IActionContext } from "vscode-azureextensionui";
import { AzureExtensionApiProvider } from 'vscode-azureextensionui/api';
import { ext } from '../extensionVariables';
import { localize } from '../utils/localize';
import { AzureFunctionsExtensionApi } from '../vscode-azurefunctions.api';

export async function createNewEndpoint(_context: IActionContext): Promise<void> {
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length <= 0) {
        const noWorkspaceError: string = localize('noWorkspace', 'This action cannot be completed because there is no workspace opened.  Please open a workspace.');
        throw new Error(noWorkspaceError);
    }
    const funcExtensionId: string = 'ms-azuretools.vscode-azurefunctions';
    const functionsExtension: Extension<AzureExtensionApiProvider | undefined> | undefined = extensions.getExtension(funcExtensionId);

    if (!functionsExtension) {
        // Azure Functions Extension is a dependency, but handle the case if getExtension fails somehow
        await commands.executeCommand('extension.open', funcExtensionId);
    } else {
        if (!functionsExtension.isActive) {
            await functionsExtension.activate();
        }
    }

    const endpointName: string = 'endpoint';
    const projectPath: string = path.join(workspace.workspaceFolders[0].uri.fsPath, 'api');

    const maxTries: number = 100;
    let count: number = 1;
    let newName: string = endpointName;

    while (count < maxTries) {
        newName = generateSuffixedName(endpointName, count);
        if (await isNameAvailable(projectPath, newName)) {
            break;
        }
        count += 1;
    }

    newName = await ext.ui.showInputBox({
        value: newName, prompt: localize('enterEndpointName', 'Provide a unique endpoint name'), validateInput: async (value) => {
            return await isNameAvailable(projectPath, value) ? undefined : localize('endpointNotAvailable', 'The endpoint name "{0}" is not available.', value);
        }
    });

    const functionsApi: AzureFunctionsExtensionApi | undefined = functionsExtension?.exports?.getApi<AzureFunctionsExtensionApi>('^1.0.0');
    await functionsApi?.createFunction({ folderPath: projectPath, functionName: newName, languageFilter: /JavaScript|TypeScript/, templateId: 'HttpTrigger', functionSettings: { authLevel: 'anonymous' }, suppressCreateProjectPrompt: true });

}

function generateSuffixedName(preferredName: string, i: number): string {
    const suffix: string = i.toString();

    const unsuffixedName: string = preferredName;
    return unsuffixedName + suffix;
}

async function isNameAvailable(projectPath: string, newName: string): Promise<boolean> {
    return !(await fse.pathExists(path.join(projectPath, newName)));
}
