import * as ko from "knockout";
import Q from "q";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import { Action, ActionModifiers } from "../../Shared/Telemetry/TelemetryConstants";
import { CassandraAPIDataClient } from "../Tables/TableDataClient";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { ContextualPaneBase } from "./ContextualPaneBase";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import DeleteFeedback from "../../Common/DeleteFeedback";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { deleteCollection } from "../../Common/dataAccess/deleteCollection";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";

export default class DeleteCollectionConfirmationPane extends ContextualPaneBase {
  public collectionIdConfirmationText: ko.Observable<string>;
  public collectionIdConfirmation: ko.Observable<string>;
  public containerDeleteFeedback: ko.Observable<string>;
  public recordDeleteFeedback: ko.Observable<boolean>;

  constructor(options: ViewModels.PaneOptions) {
    super(options);
    this.collectionIdConfirmationText = ko.observable<string>("Confirm by typing the collection id");
    this.collectionIdConfirmation = ko.observable<string>();
    this.containerDeleteFeedback = ko.observable<string>();
    this.recordDeleteFeedback = ko.observable<boolean>(false);
    this.title("Delete Collection");
    this.resetData();
  }

  public submit(): Promise<any> {
    if (!this._isValid()) {
      const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();
      this.formErrors("Input collection name does not match the selected collection");
      NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.Error,
        `Error while deleting collection ${selectedCollection && selectedCollection.id()}: ${this.formErrors()}`
      );
      return Promise.resolve();
    }

    this.formErrors("");
    this.isExecuting(true);
    const selectedCollection = <ViewModels.Collection>this.container.findSelectedCollection();
    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteCollection, {
      databaseAccountName: this.container.databaseAccount().name,
      defaultExperience: this.container.defaultExperience(),
      collectionId: selectedCollection.id(),
      dataExplorerArea: Constants.Areas.ContextualPane,
      paneTitle: this.title()
    });
    let promise: Promise<any>;
    if (this.container.isPreferredApiCassandra()) {
      promise = ((<CassandraAPIDataClient>this.container.tableDataClient).deleteTableOrKeyspace(
        this.container.databaseAccount().properties.cassandraEndpoint,
        this.container.databaseAccount().id,
        `DROP TABLE ${selectedCollection.databaseId}.${selectedCollection.id()};`,
        this.container
      ) as unknown) as Promise<any>;
    } else {
      promise = deleteCollection(selectedCollection.databaseId, selectedCollection.id());
    }
    return promise.then(
      () => {
        this.isExecuting(false);
        this.close();
        this.container.selectedNode(selectedCollection.database);
        this.container.tabsManager?.closeTabsByComparator(
          tab =>
            tab.node?.id() === selectedCollection.id() &&
            (tab.node as ViewModels.Collection).databaseId === selectedCollection.databaseId
        );
        this.container.refreshAllDatabases();
        this.resetData();
        TelemetryProcessor.traceSuccess(
          Action.DeleteCollection,
          {
            databaseAccountName: this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience(),
            collectionId: selectedCollection.id(),
            dataExplorerArea: Constants.Areas.ContextualPane,
            paneTitle: this.title()
          },
          startKey
        );
        if (this.shouldRecordFeedback()) {
          let deleteFeedback = new DeleteFeedback(
            this.container.databaseAccount().id,
            this.container.databaseAccount().name,
            DefaultExperienceUtility.getApiKindFromDefaultExperience(this.container.defaultExperience()),
            this.containerDeleteFeedback()
          );

          TelemetryProcessor.trace(Action.DeleteCollection, ActionModifiers.Mark, {
            message: JSON.stringify(deleteFeedback, Object.getOwnPropertyNames(deleteFeedback))
          });

          this.containerDeleteFeedback("");
        }
      },
      (error: any) => {
        this.isExecuting(false);
        const errorMessage = getErrorMessage(error);
        this.formErrors(errorMessage);
        this.formErrorsDetails(errorMessage);
        TelemetryProcessor.traceFailure(
          Action.DeleteCollection,
          {
            databaseAccountName: this.container.databaseAccount().name,
            defaultExperience: this.container.defaultExperience(),
            collectionId: selectedCollection.id(),
            dataExplorerArea: Constants.Areas.ContextualPane,
            paneTitle: this.title(),
            error: errorMessage,
            errorStack: getErrorStack(error)
          },
          startKey
        );
      }
    );
  }

  public resetData() {
    this.collectionIdConfirmation("");
    super.resetData();
  }

  public open() {
    this.recordDeleteFeedback(this.shouldRecordFeedback());
    super.open();
  }

  public shouldRecordFeedback(): boolean {
    return this.container.isLastCollection() && !this.container.isSelectedDatabaseShared();
  }

  private _isValid(): boolean {
    const selectedCollection: ViewModels.Collection = this.container.findSelectedCollection();

    if (!selectedCollection) {
      return false;
    }

    return this.collectionIdConfirmation() === selectedCollection.id();
  }
}
