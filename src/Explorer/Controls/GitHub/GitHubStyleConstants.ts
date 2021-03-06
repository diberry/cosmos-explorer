import {
  IStyleFunctionOrObject,
  ICheckboxStyleProps,
  ICheckboxStyles,
  IDropdownStyles,
  IDropdownStyleProps
} from "office-ui-fabric-react";

export const ButtonsFooterStyle: React.CSSProperties = {
  padding: 14,
  height: "auto"
};

export const ContentFooterStyle: React.CSSProperties = {
  padding: "10px 24px 10px 24px",
  height: "auto"
};

export const ChildrenMargin = 10;
export const FontSize = 12;

export const ReposListCheckboxStyles: IStyleFunctionOrObject<ICheckboxStyleProps, ICheckboxStyles> = {
  label: {
    margin: 0,
    padding: "2 0 2 0"
  },
  text: {
    fontSize: FontSize
  }
};

export const BranchesDropdownCheckboxStyles: IStyleFunctionOrObject<ICheckboxStyleProps, ICheckboxStyles> = {
  label: {
    margin: 0,
    padding: 0,
    fontSize: FontSize
  },
  root: {
    padding: 0
  },
  text: {
    fontSize: FontSize
  }
};

export const BranchesDropdownStyles: IStyleFunctionOrObject<IDropdownStyleProps, IDropdownStyles> = {
  title: {
    fontSize: FontSize
  }
};

export const BranchesDropdownOptionContainerStyle: React.CSSProperties = {
  padding: 8
};

export const ReposListRepoColumnMinWidth = 192;
export const ReposListBranchesColumnWidth = 116;
export const BranchesDropdownWidth = 200;
