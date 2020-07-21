/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as moment from 'moment';
import { AzureTreeItem, TreeItemIconPath } from "vscode-azureextensionui";
import { Conclusion, Status } from '../constants';
import { convertConclusionToVerb, convertStatusToVerb } from '../utils/gitHubUtils';
import { getTimeElapsedString } from '../utils/timeUtils';
import { treeUtils } from "../utils/treeUtils";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { JobTreeItem } from './JobTreeItem';

export type GitHubStep = {
    name: string;
    status: Status;
    conclusion: Conclusion | null;
    // tslint:disable-next-line: no-reserved-keywords
    number: number;
    started_at: string;
    completed_at: string;
};

export class StepTreeItem extends AzureTreeItem implements IAzureResourceTreeItem {

    public static contextValue: string = 'azureStaticStep';
    public readonly contextValue: string = StepTreeItem.contextValue;
    public parent: JobTreeItem;
    public data: GitHubStep;

    constructor(parent: JobTreeItem, data: GitHubStep) {
        super(parent);
        this.data = data;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getActionIconPath(this.data.status, this.data.conclusion);
    }

    public get id(): string {
        return `${this.parent.id}/${this.data.name}`;
    }

    public get name(): string {
        return this.data.name;
    }

    public get label(): string {
        return this.name;
    }

    public get description(): string {
        if (this.data.conclusion !== null) {
            const elapsedTime: string = getTimeElapsedString(this.startedDate, this.completedDate);
            return `${convertConclusionToVerb(this.data.conclusion)} in ${elapsedTime}`;
        } else {
            return `${convertStatusToVerb(this.data.status)} ${this.startedDate.getTime() === 0 ? '' : moment(this.startedDate).fromNow()}`;
        }
    }

    private get startedDate(): Date {
        return new Date(this.data.started_at);
    }

    private get completedDate(): Date {
        return new Date(this.data.completed_at);
    }
}