import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import * as NotificationConsoleUtils from "./NotificationConsoleUtils";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import {
  GalleryTab,
  SortBy,
  GalleryViewerComponent
} from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../Explorer/Explorer";
import { IChoiceGroupOption, IChoiceGroupProps } from "office-ui-fabric-react";
import { TextFieldProps } from "../Explorer/Controls/DialogReactComponent/DialogComponent";
import { handleError } from "../Common/ErrorHandlingUtils";

const defaultSelectedAbuseCategory = "Other";
const abuseCategories: IChoiceGroupOption[] = [
  {
    key: "ChildEndangermentExploitation",
    text: "Child endangerment or exploitation"
  },
  {
    key: "ContentInfringement",
    text: "Content infringement"
  },
  {
    key: "OffensiveContent",
    text: "Offensive content"
  },
  {
    key: "Terrorism",
    text: "Terrorism"
  },
  {
    key: "ThreatsCyberbullyingHarassment",
    text: "Threats, cyber bullying or harassment"
  },
  {
    key: "VirusSpywareMalware",
    text: "Virus, spyware or malware"
  },
  {
    key: "Fraud",
    text: "Fraud"
  },
  {
    key: "HateSpeech",
    text: "Hate speech"
  },
  {
    key: "ImminentHarmToPersonsOrProperty",
    text: "Imminent harm to persons or property"
  },
  {
    key: "Other",
    text: "Other"
  }
];

export enum NotebookViewerParams {
  NotebookUrl = "notebookUrl",
  GalleryItemId = "galleryItemId",
  HideInputs = "hideInputs"
}

export interface NotebookViewerProps {
  notebookUrl: string;
  galleryItemId: string;
  hideInputs: boolean;
}

export enum GalleryViewerParams {
  SelectedTab = "tab",
  SortBy = "sort",
  SearchText = "q"
}

export interface GalleryViewerProps {
  selectedTab: GalleryTab;
  sortBy: SortBy;
  searchText: string;
}

export interface DialogHost {
  showOkCancelModalDialog(
    title: string,
    msg: string,
    okLabel: string,
    onOk: () => void,
    cancelLabel: string,
    onCancel: () => void,
    choiceGroupProps?: IChoiceGroupProps,
    textFieldProps?: TextFieldProps
  ): void;
}

export function reportAbuse(
  junoClient: JunoClient,
  data: IGalleryItem,
  dialogHost: DialogHost,
  onComplete: (success: boolean) => void
): void {
  const notebookId = data.id;
  let abuseCategory = defaultSelectedAbuseCategory;
  let additionalDetails: string;

  dialogHost.showOkCancelModalDialog(
    "Report Abuse",
    undefined,
    "Report Abuse",
    async () => {
      const clearSubmitReportNotification = NotificationConsoleUtils.logConsoleProgress(
        `Submitting your report on ${data.name} violating code of conduct`
      );

      try {
        const response = await junoClient.reportAbuse(notebookId, abuseCategory, additionalDetails);
        if (!response.data) {
          throw new Error(`Received HTTP ${response.status} when submitting report for ${data.name}`);
        }

        NotificationConsoleUtils.logConsoleInfo(
          `Your report on ${data.name} has been submitted. Thank you for reporting the violation.`
        );
        onComplete(response.data);
      } catch (error) {
        handleError(
          error,
          "GalleryUtils/reportAbuse",
          `Failed to submit report on ${data.name} violating code of conduct`
        );
      }

      clearSubmitReportNotification();
    },
    "Cancel",
    undefined,
    {
      label: "How does this content violate the code of conduct?",
      options: abuseCategories,
      defaultSelectedKey: defaultSelectedAbuseCategory,
      onChange: (_event?: React.FormEvent<HTMLElement | HTMLInputElement>, option?: IChoiceGroupOption) => {
        abuseCategory = option?.key;
      }
    },
    {
      label: "You can also include additional relevant details on the offensive content",
      multiline: true,
      rows: 3,
      autoAdjustHeight: false,
      onChange: (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        additionalDetails = newValue;
      }
    }
  );
}

export function downloadItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): void {
  const name = data.name;
  container.showOkCancelModalDialog(
    "Download to My Notebooks",
    `Download ${name} from gallery as a copy to your notebooks to run and/or edit the notebook.`,
    "Download",
    async () => {
      const notificationId = NotificationConsoleUtils.logConsoleMessage(
        ConsoleDataType.InProgress,
        `Downloading ${name} to My Notebooks`
      );

      try {
        const response = await junoClient.getNotebookContent(data.id);
        if (!response.data) {
          throw new Error(`Received HTTP ${response.status} when fetching ${data.name}`);
        }

        await container.importAndOpenContent(data.name, response.data);
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Info,
          `Successfully downloaded ${name} to My Notebooks`
        );

        const increaseDownloadResponse = await junoClient.increaseNotebookDownloadCount(data.id);
        if (increaseDownloadResponse.data) {
          onComplete(increaseDownloadResponse.data);
        }
      } catch (error) {
        handleError(error, "GalleryUtils/downloadItem", `Failed to download ${data.name}`);
      }

      NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
    },
    "Cancel",
    undefined
  );
}

export async function favoriteItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): Promise<void> {
  if (container) {
    try {
      const response = await junoClient.favoriteNotebook(data.id);
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when favoriting ${data.name}`);
      }

      onComplete(response.data);
    } catch (error) {
      handleError(error, "GalleryUtils/favoriteItem", `Failed to favorite ${data.name}`);
    }
  }
}

export async function unfavoriteItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): Promise<void> {
  if (container) {
    try {
      const response = await junoClient.unfavoriteNotebook(data.id);
      if (!response.data) {
        throw new Error(`Received HTTP ${response.status} when unfavoriting ${data.name}`);
      }

      onComplete(response.data);
    } catch (error) {
      handleError(error, "GalleryUtils/unfavoriteItem", `Failed to unfavorite ${data.name}`);
    }
  }
}

export function deleteItem(
  container: Explorer,
  junoClient: JunoClient,
  data: IGalleryItem,
  onComplete: (item: IGalleryItem) => void
): void {
  if (container) {
    container.showOkCancelModalDialog(
      "Remove published notebook",
      `Would you like to remove ${data.name} from the gallery?`,
      "Remove",
      async () => {
        const name = data.name;
        const notificationId = NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.InProgress,
          `Removing ${name} from gallery`
        );

        try {
          const response = await junoClient.deleteNotebook(data.id);
          if (!response.data) {
            throw new Error(`Received HTTP ${response.status} while removing ${name}`);
          }

          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Info, `Successfully removed ${name} from gallery`);
          onComplete(response.data);
        } catch (error) {
          handleError(error, "GalleryUtils/deleteItem", `Failed to remove ${name} from gallery`);
        }

        NotificationConsoleUtils.clearInProgressMessageWithId(notificationId);
      },
      "Cancel",
      undefined
    );
  }
}

export function getGalleryViewerProps(search: string): GalleryViewerProps {
  const params = new URLSearchParams(search);
  let selectedTab: GalleryTab;
  if (params.has(GalleryViewerParams.SelectedTab)) {
    selectedTab = GalleryTab[params.get(GalleryViewerParams.SelectedTab) as keyof typeof GalleryTab];
  }

  let sortBy: SortBy;
  if (params.has(GalleryViewerParams.SortBy)) {
    sortBy = SortBy[params.get(GalleryViewerParams.SortBy) as keyof typeof SortBy];
  }

  return {
    selectedTab,
    sortBy,
    searchText: params.get(GalleryViewerParams.SearchText)
  };
}

export function getNotebookViewerProps(search: string): NotebookViewerProps {
  const params = new URLSearchParams(search);
  return {
    notebookUrl: params.get(NotebookViewerParams.NotebookUrl),
    galleryItemId: params.get(NotebookViewerParams.GalleryItemId),
    hideInputs: JSON.parse(params.get(NotebookViewerParams.HideInputs))
  };
}

export function getTabTitle(tab: GalleryTab): string {
  switch (tab) {
    case GalleryTab.OfficialSamples:
      return GalleryViewerComponent.OfficialSamplesTitle;
    case GalleryTab.PublicGallery:
      return GalleryViewerComponent.PublicGalleryTitle;
    case GalleryTab.Favorites:
      return GalleryViewerComponent.FavoritesTitle;
    case GalleryTab.Published:
      return GalleryViewerComponent.PublishedTitle;
    default:
      throw new Error(`Unknown tab ${tab}`);
  }
}

export function filterPublishedNotebooks(
  items: IGalleryItem[]
): {
  published: IGalleryItem[];
  underReview: IGalleryItem[];
  removed: IGalleryItem[];
} {
  const underReview: IGalleryItem[] = [];
  const removed: IGalleryItem[] = [];
  const published: IGalleryItem[] = [];

  items?.forEach(item => {
    if (item.policyViolations?.length > 0) {
      removed.push(item);
    } else if (item.pendingScanJobIds?.length > 0) {
      underReview.push(item);
    } else {
      published.push(item);
    }
  });

  return { published, underReview, removed };
}
